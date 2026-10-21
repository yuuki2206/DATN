"""
ROUTER API KHẢO THÍ, SINH ĐỀ, PHÂN TÍCH HỒ SƠ BKT & CHẤM TỰ LUẬN (`/api/quiz/*`)
================================================================================
- Code này là gì: Cung cấp 5 endpoint cho Phân hệ Giáo viên & Đánh giá năng lực Học sinh:
  1. `POST /api/quiz/generate`: Sinh bộ câu hỏi trắc nghiệm chuẩn GDPT 2018 từ sử liệu RAG.
  2. `POST /api/quiz/submit-answer`: Cập nhật xác suất nắm vững kiến thức $P(L_t)$ theo định lý Bayes.
  3. `GET /api/quiz/recommendations/{student_id}`: Gợi ý các chủ điểm yếu ($P(L) < 0.60$) kèm tài liệu SGK.
  4. `GET /api/quiz/study-plan/{student_id}`: Phân tích toàn diện hồ sơ tài khoản học sinh
     (theo 3 cuộc kháng chiến & 3 mức độ nhận thức Bloom) và xuất Phương án + Tài liệu học tập.
  5. `POST /api/quiz/evaluate-answer`: AI chấm câu trả lời tự luận ngắn của học sinh theo thang 10,
     chỉ ra ý đúng / ý thiếu và tự động cập nhật điểm năng lực BKT.
- Liên kết với file nào:
  + Nhận request từ: `frontend/src/views/TeacherView.tsx` & `StudentView.tsx`
  + Gọi xuống: `app/core/rag_engine.py`, `app/core/gemini_client.py`, và `backend/bkt_engine.py`.
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import (
    QuizGenerateRequest,
    QuizGenerateResponse,
    StudentAnswerSubmission,
    BKTUpdateResponse,
    PersonalizedRecommendationResponse,
    PersonalizedRecommendationItem,
    StudentProfileAnalysisResponse,
    ShortAnswerEvaluationRequest,
    ShortAnswerEvaluationResponse
)
from app.core.rag_engine import rag_engine
from app.core.gemini_client import gemini_client

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from bkt_engine import bkt_engine

router = APIRouter(prefix="/quiz", tags=["Giảng Viên & Khảo Thí - Sinh Đề, Hồ Sơ BKT & Chấm Tự Luận AI"])


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(req: QuizGenerateRequest):
    """
    Giáo viên yêu cầu sinh bộ câu hỏi trắc nghiệm tự động chuẩn kiến thức SGK 7.
    """
    try:
        relevant_records = rag_engine.search_relevant_chunks(
            query=req.topic,
            top_k=5
        )

        questions = await gemini_client.generate_quiz(
            topic=req.topic,
            num_questions=req.num_questions,
            cognitive_level=req.cognitive_level or "Tất cả mức độ",
            grounding_records=relevant_records
        )

        return QuizGenerateResponse(
            topic=req.topic,
            total_generated=len(questions),
            questions=questions,
            generation_notes=(
                f"Đã sinh {len(questions)} câu hỏi dựa trên {len(relevant_records)} căn cứ sử liệu chính thức "
                "từ SGK Lịch sử 7 và Đại Việt Sử Ký Toàn Thư."
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi sinh đề trắc nghiệm AI: {str(e)}")


@router.post("/submit-answer", response_model=BKTUpdateResponse)
async def submit_student_answer(sub: StudentAnswerSubmission):
    """
    Cập nhật tiến trình học sinh theo Bayesian Knowledge Tracing (BKT) sau mỗi câu hỏi.
    Tính toán lại xác suất nắm vững kiến thức P(L) theo công thức Bayes.
    """
    try:
        result = bkt_engine.update_student_response(
            student_id=sub.student_id,
            unit_id=sub.unit_id,
            is_correct=sub.is_correct
        )
        return BKTUpdateResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật BKT: {str(e)}")


@router.get("/recommendations/{student_id}", response_model=PersonalizedRecommendationResponse)
async def get_personalized_recommendations(student_id: str, top_k: int = Query(3, ge=1, le=10)):
    """
    Gợi ý cá nhân hóa các cụm tri thức yếu (P(L) < 0.60) cần ôn tập trọng tâm,
    đính kèm trích dẫn mục SGK và phương pháp học tương ứng.
    """
    try:
        recs = bkt_engine.recommend_personalized_review(student_id=student_id, top_k=top_k)
        rec_items = [PersonalizedRecommendationItem(**item) for item in recs]
        return PersonalizedRecommendationResponse(
            student_id=student_id,
            total_recommendations=len(rec_items),
            recommendations=rec_items
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn gợi ý cá nhân hóa: {str(e)}")


@router.get("/study-plan/{student_id}", response_model=StudentProfileAnalysisResponse)
async def get_student_study_plan(student_id: str, top_k: int = Query(5, ge=1, le=10)):
    """
    Đánh giá toàn diện dữ liệu tài khoản học sinh (theo 3 cuộc kháng chiến & 3 mức độ nhận thức Bloom),
    đưa ra nhận xét chẩn đoán AI và đề xuất Phương án + Tài liệu học tập SGK hiệu quả.
    """
    try:
        report = bkt_engine.analyze_student_profile(student_id=student_id, top_k=top_k)
        return StudentProfileAnalysisResponse(**report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích hồ sơ học tập học sinh: {str(e)}")


@router.post("/evaluate-answer", response_model=ShortAnswerEvaluationResponse)
async def evaluate_student_short_answer(req: ShortAnswerEvaluationRequest):
    """
    AI chấm điểm câu trả lời tự luận ngắn của học sinh theo thang 10:
    - Đối sánh khái niệm lịch sử cốt lõi với tư liệu chuẩn SGK.
    - Chỉ rõ ý học sinh đã nhớ đúng và ý còn thiếu.
    - Tự động cập nhật xác suất nắm vững kiến thức P(L) vào hồ sơ BKT.
    """
    try:
        evaluation = bkt_engine.evaluate_short_answer(
            student_id=req.student_id,
            unit_id=req.unit_id,
            student_answer=req.student_answer
        )
        return ShortAnswerEvaluationResponse(**evaluation)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi chấm câu trả lời tự luận AI: {str(e)}")


@router.get("/adaptive-exam/{student_id}")
async def get_adaptive_custom_exam(student_id: str, num_questions: int = Query(5, ge=3, le=10)):
    """
    Sinh Đề Ôn Tập Cá Nhân Hóa (Adaptive Custom Exam) kết hợp Trắc nghiệm & Tự luận ngắn
    nhắm đúng vào các lỗ hổng kiến thức BKT và cảnh báo suy giảm trí nhớ Ebbinghaus của học sinh.
    """
    try:
        return bkt_engine.generate_adaptive_exam(student_id=student_id, num_questions=num_questions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi sinh đề ôn tập cá nhân hóa: {str(e)}")
