"""
MODULE SINH ĐỀ TRẮC NGHIỆM & CỐT TRUYỆN NHẬP VAI (AI CONTENT GENERATOR)
================================================================================
- Code này là gì: Client giao tiếp với Google Gemini REST API (qua `httpx` bất đồng bộ)
  kèm bộ dữ liệu dự phòng chuẩn quốc gia (Local Grounded Fallback) để phục vụ 2 tác vụ:
  1. Sinh câu hỏi trắc nghiệm khách quan 4 lựa chọn cho Giáo viên (`generate_quiz`).
  2. Sinh lời dẫn truyện nhập vai hào hùng cho Bản đồ Nhiệm vụ (`generate_story`).
- Tại sao lại có nó: Tách biệt hoàn toàn luồng Sinh nội dung sáng tạo (Quiz/Story) khỏi
  luồng Hỏi-Đáp gia sư (`hybrid_router.py`), đồng thời đảm bảo ứng dụng luôn hoạt động
  100% ngay cả khi mất mạng hoặc hết hạn ngạch API.
- Áp dụng kỹ thuật gì:
  + Retrieval-Augmented Generation (RAG Prompting): Đính kèm `fact_chunk` lấy từ
    `rag_engine` vào prompt để chống bịa đặt lịch sử (Zero Hallucination).
  + Graceful Fallback Pattern: Tự động trả về bộ câu hỏi/cốt truyện chuẩn SGK Lịch sử 7
    nếu LLM trả về JSON lỗi hoặc không có `GEMINI_API_KEY`.
- Liên kết với file nào: Nhận căn cứ sử liệu từ `app/core/rag_engine.py` và được gọi
  trực tiếp bởi `app/api/quiz.py` cùng `app/api/story.py`.
"""

import json
import httpx
from typing import List, Dict, Any, Optional
from app.config import settings
from app.models.schemas import GeneratedQuestion


class GeminiClient:
    """
    Bộ sinh đề trắc nghiệm & cốt truyện lịch sử dựa trên căn cứ sử liệu (Grounded LLM + Fallback).
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    async def _call_gemini_api(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        """
        Gọi trực tiếp Gemini REST API qua httpx bất đồng bộ (nhẹ, không cần cài SDK nặng).
        """
        if not self.api_key:
            return None

        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        body: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        if system_instruction:
            body["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, json=body)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    print(f"[WARN] Gemini API returned status {res.status_code}")
        except Exception as e:
            print(f"[WARN] Gemini API call failed: {e}")

        return None

    # ==========================================================================
    # 1. SINH BỘ CÂU HỎI TRẮC NGHIỆM CHO GIÁO VIÊN (TEACHER AI STUDIO)
    # ==========================================================================
    async def generate_quiz(
        self, topic: str, num_questions: int, cognitive_level: str, grounding_records: List[Dict[str, Any]]
    ) -> List[GeneratedQuestion]:
        context_facts = "\n".join([
            f"- {r.get('grounding_source', {}).get('fact_chunk', '')}"
            for r in grounding_records if r.get("grounding_source")
        ])

        system_instruction = (
            "Bạn là chuyên gia khảo thí Lịch sử 7. Hãy tạo các câu hỏi trắc nghiệm khách quan chuẩn GDPT 2018. "
            "Mỗi câu có đúng 4 phương án A, B, C, D, chỉ 1 đáp án đúng và có giải thích chi tiết."
        )

        prompt = (
            f"Dựa vào các tư liệu lịch sử sau đây:\n{context_facts}\n\n"
            f"Hãy tạo đúng {num_questions} câu hỏi trắc nghiệm về chủ đề: '{topic}', mức độ '{cognitive_level}'.\n"
            "Đầu ra BẮT BUỘC là định dạng JSON mảng các object với cấu trúc:\n"
            "[\n"
            "  {\n"
            "    \"question\": \"Nội dung câu hỏi?\",\n"
            "    \"options\": [\"Đáp án A\", \"Đáp án B\", \"Đáp án C\", \"Đáp án D\"],\n"
            "    \"correct_index\": 0,\n"
            "    \"cognitive_level\": \"Nhận biết\",\n"
            "    \"explanation\": \"Giải thích vì sao đúng dựa trên sử liệu...\",\n"
            "    \"curriculum_reference\": \"SGK Lịch sử 7 Bài 13\"\n"
            "  }\n"
            "]\n"
            "Chỉ trả về JSON thuần túy, không thêm markdown ```json."
        )

        api_response = await self._call_gemini_api(prompt, system_instruction=system_instruction)

        if api_response:
            try:
                clean_text = api_response.strip()
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                if clean_text.startswith("```"):
                    clean_text = clean_text[3:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]

                raw_list = json.loads(clean_text.strip())
                questions = []
                for i, q in enumerate(raw_list):
                    questions.append(
                        GeneratedQuestion(
                            id=f"gen-q-{i+1}",
                            question=q["question"],
                            options=q["options"],
                            correct_index=q["correct_index"],
                            cognitive_level=q.get("cognitive_level", cognitive_level),
                            explanation=q.get("explanation", ""),
                            curriculum_reference=q.get("curriculum_reference", "SGK Lịch sử 7")
                        )
                    )
                return questions
            except Exception as e:
                print(f"[WARN] Error parsing Quiz JSON from LLM: {e}")

        # Local Grounded Fallback (Dữ liệu chuẩn SGK Lịch sử 7 GDPT 2018)
        sample_questions = [
            GeneratedQuestion(
                id="q-fallback-1",
                question="Tại Hội nghị Diên Hồng năm 1285, trước câu hỏi 'Nên hòa hay nên đánh?' của Thượng hoàng, các bô lão đã đồng thanh đáp lời thế nào?",
                options=["ĐÁNH!", "HÒA!", "Tùy ý bệ hạ định đoạt", "Bảo toàn lực lượng"],
                correct_index=0,
                cognitive_level="Nhận biết",
                explanation="Đầu năm 1285, Thượng hoàng Trần Thánh Tông mở tiệc Diên Hồng đón các bô lão. Muôn miệng một lời, các bô lão cùng thét lớn 'ĐÁNH!', biểu thị ý chí quật cường của toàn dân tộc.",
                curriculum_reference="SGK Lịch sử 7 (KNTT) - Bài 13, Mục 2b"
            ),
            GeneratedQuestion(
                id="q-fallback-2",
                question="Kế sách quân sự độc đáo nào được quân dân Thăng Long thi hành triệt để khi quân Mông Cổ tiến công kinh thành năm 1258?",
                options=[
                    "Xây dựng thành quách cố thủ kiên cố",
                    "'Vườn không nhà trống' - triệt thoái người và lương thảo",
                    "Cầu viện các nước lân bang",
                    "Dốc toàn lực nghênh chiến trực diện tại cửa sông"
                ],
                correct_index=1,
                cognitive_level="Thông hiểu",
                explanation="Kế sách 'Vườn không nhà trống' khiến quân Mông Cổ chiếm được Thăng Long nhưng không tìm ra lương thảo, nhanh chóng rơi vào cảnh đói khát và suy sụp sĩ khí.",
                curriculum_reference="SGK Lịch sử 7 - Bài 13, Mục 2a"
            ),
            GeneratedQuestion(
                id="q-fallback-3",
                question="Trong cuộc kháng chiến lần thứ ba (1288), tướng lĩnh nào đã mưu trí chỉ huy trận phục kích tiêu diệt đoàn thuyền lương 17 vạn thạch của Trương Văn Hổ tại Vân Đồn?",
                options=["Trần Hưng Đạo", "Trần Khánh Dư", "Trần Quang Khải", "Trần Nhật Duật"],
                correct_index=1,
                cognitive_level="Nhận biết",
                explanation="Nhân Huệ Vương Trần Khánh Dư phán đoán thuyền lương giặc đi sau sẽ mất cảnh giác, liền phục kích tại Vân Đồn đánh chìm toàn bộ thuyền lương, cắt đứt hoàn toàn hậu cần quân Nguyên.",
                curriculum_reference="SGK Lịch sử 7 (KNTT) - Bài 13, Mục 2c"
            ),
            GeneratedQuestion(
                id="q-fallback-4",
                question="Trận quyết chiến chiến lược trên sông Bạch Đằng (4/1288) đã lợi dụng triệt để yếu tố tự nhiên nào để tiêu diệt hơn 400 chiến thuyền giặc?",
                options=[
                    "Mưa bão lớn làm đắm thuyền địch",
                    "Địa hình đồi núi dốc đứng hai bên bờ",
                    "Quy luật thủy triều lên xuống kết hợp bãi cọc gỗ lim ngầm",
                    "Lửa cháy thuận chiều gió thổi"
                ],
                correct_index=2,
                cognitive_level="Vận dụng",
                explanation="Hưng Đạo Vương cho đẵn gỗ lim vót nhọn cắm ngầm lòng sông Bạch Đằng, nhử giặc vào lúc triều dâng rồi chặn đánh quyết liệt khi triều rút mạnh, khiến thuyền giặc vướng cọc nhọn vỡ nát.",
                curriculum_reference="Đại Việt Sử Ký Toàn Thư & SGK Lịch sử 7"
            )
        ]
        return sample_questions[:num_questions]

    # ==========================================================================
    # 2. SINH LỜI DẪN TRUYỆN NHẬP VAI CHO BẢN ĐỒ NHIỆM VỤ (QUEST NARRATIVE)
    # ==========================================================================
    async def generate_story(
        self, campaign_name: str, stage_title: str, key_event: str, grounding_records: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        fact = grounding_records[0].get("grounding_source", {}).get("fact_chunk", "") if grounding_records else ""

        prompt = (
            f"Hãy viết một đoạn văn dẫn truyện nhập vai lịch sử cho ải '{stage_title}' thuộc chiến dịch '{campaign_name}'.\n"
            f"Dựa trên sự kiện có thật: {key_event}.\n"
            f"Tư liệu lịch sử tham khảo: {fact}.\n"
            "Yêu cầu:\n"
            "- Giọng điệu hào hùng, lôi cuốn, tạo cảm giác phiêu lưu cho học sinh lớp 7.\n"
            "- Độ dài khoảng 3 - 5 câu văn giàu hình ảnh."
        )

        api_response = await self._call_gemini_api(prompt)

        if api_response:
            return {
                "story_narrative": api_response,
                "historical_fact": fact,
                "challenge_question": f"Hãy vận dụng hiểu biết lịch sử để hoàn thành thử thách tại ải {stage_title}!"
            }

        return {
            "story_narrative": (
                f"Đoàn quân Đại Việt tiến đến khu vực {stage_title}. Tiếng trống đồng âm vang trong sương sớm, "
                f"ngọn cờ thêu sáu chữ vàng phất phới bay theo chiều gió. Trước mặt các em là những thử thách lịch sử "
                f"hào hùng đòi hỏi lòng quả cảm và tinh thần mưu trí kế thừa từ các bậc tiền nhân!"
            ),
            "historical_fact": fact or "Ba lần kháng chiến chống Mông - Nguyên (1258 - 1288)",
            "challenge_question": f"Vận dụng kiến thức để giải mã bí mật chiến thuật tại ải {stage_title}!"
        }


gemini_client = GeminiClient()

