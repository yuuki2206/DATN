"""
ROUTER API ĐÀM THOẠI GIA SƯ SỬ HỌC ĐÔNG A & THỐNG KÊ TỰ HỌC (`/api/chat/*`)
================================================================================
- Code này là gì:
  1. `POST /api/chat/dong-a`: Endpoint nhận câu hỏi lịch sử của học sinh từ Frontend,
     đồng bộ tương tác vào Hồ sơ học sinh (`bkt_engine`), và trả về câu trả lời sư phạm
     kèm trích dẫn sử liệu (`grounding_sources`), thẻ tài liệu học tập (`recommended_material`),
     huy hiệu và điểm EXP.
  2. `GET /api/chat/analytics`: Endpoint trả về thống kê các chủ đề học sinh hỏi nhiều nhất
     và danh sách các câu hỏi độ tin cậy thấp / ngoài phạm vi (Active Learning Log) để biết
     cần bổ sung dữ liệu gì tiếp theo.
- Liên kết với file nào:
  + Nhận request từ: `frontend/src/views/StudentView.tsx`
  + Gọi xuống: `app/core/rag_engine.py`, `backend/hybrid_router.py`, và `backend/bkt_engine.py`.
"""

import sys
from pathlib import Path
from typing import List
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    ChatRequest,
    ChatResponse,
    GroundingSource,
    StudyMaterialCard
)
from app.core.rag_engine import rag_engine


class TeachKnowledgeRequest(BaseModel):
    unit_id: str = Field(..., description="Mã định danh chủ điểm mới (VD: CUSTOM_TRAN_KHANH_DU_THAN_OAI)")
    topic: str = Field(..., description="Tên chủ đề kiến thức mới")
    question_examples: List[str] = Field(..., description="Danh sách các mẫu câu hỏi tương ứng")
    answer: str = Field(..., description="Nội dung câu trả lời chuẩn")
    fact_chunk: str = Field("", description="Đoạn tư liệu tóm tắt cốt lõi")
    entity: str = Field("Nhà Trần", description="Nhân vật / Thực thể lịch sử")
    event: str = Field("Ba lần kháng chiến chống quân Mông - Nguyên (1258 - 1288)", description="Sự kiện lịch sử")

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from hybrid_router import hybrid_router
from bkt_engine import bkt_engine

router = APIRouter(prefix="/chat", tags=["Trợ Lý AI Sử Học Đông A"])


@router.post("/dong-a", response_model=ChatResponse)
async def chat_with_tutor(req: ChatRequest):
    """
    Học sinh đàm thoại với Trợ lý AI Lịch sử Đông A sử dụng:
    1. Modular NLP Pipeline (NLU + ML Classifier + Semantic Re-ranker + Conversational NLG)
    2. Session Memory Coreference Rewriter
    3. Hybrid Router với Circuit Breaker và Cache
    4. Đồng bộ 2 chiều với Hồ sơ học tập BKT & tự động đính kèm Thẻ tài liệu SGK
    """
    try:
        session_key = req.session_id or req.character_id or "default_user_session"
        student_id = req.student_id or "student_nguyen_van_long"

        # 1. Suy luận cục bộ (Local High-Speed NLP)
        local_res = rag_engine.ask_natural(
            query=req.query,
            character_id=req.character_id,
            session_id=session_key
        )

        # 2. Đồng bộ tương tác hỏi-đáp vào Hồ sơ học sinh (BKT) & lấy Thẻ tài liệu SGK
        material_dict = bkt_engine.record_chat_interaction(
            student_id=student_id,
            unit_id=local_res.get("unit_id", "UNKNOWN"),
            query=req.query,
            confidence=local_res.get("confidence", 0.0),
            is_not_found=local_res.get("is_not_found", False)
        )
        study_card = StudyMaterialCard(**material_dict) if material_dict else None

        # 3. Điều phối Hybrid Router (Cache -> Grounded LLM Polish -> Local Fallback)
        routed_res = await hybrid_router.route_and_respond(
            query=req.query,
            local_result=local_res,
            character_id=req.character_id
        )

        grounding_sources = [
            GroundingSource(**src) for src in routed_res.get("grounding_sources", [])
        ]

        return ChatResponse(
            answer=routed_res["answer"],
            character_name=routed_res.get("character_name", "Trợ Lý AI Lịch Sử Đông A"),
            grounding_sources=grounding_sources,
            badge_unlocked=routed_res.get("badge_unlocked"),
            exp_reward=routed_res.get("exp_reward", 0),
            recommended_material=study_card
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý AI Chat: {str(e)}")


@router.get("/analytics")
async def get_chat_learning_analytics():
    """
    Thống kê dữ liệu tương tác hỏi đáp AI (Active Learning Log):
    - Các chủ đề lịch sử được học sinh hỏi nhiều nhất.
    - Danh sách câu hỏi chưa có dữ liệu / độ tin cậy thấp để bổ sung vào tập huấn luyện.
    """
    try:
        return bkt_engine.get_learning_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi truy vấn thống kê AI: {str(e)}")


@router.post("/teach")
async def teach_new_knowledge_to_ai(req: TeachKnowledgeRequest):
    """
    Dạy thêm tri thức mới cho AI ngay lúc chạy (Hot-Reload Dynamic Knowledge Base):
    Không cần huấn luyện lại toàn bộ model `.joblib`, AI ghi nhớ bền vững vào `custom_knowledge.json`
    và trả lời được ngay lập tức ở lượt hỏi kế tiếp.
    """
    try:
        rag_engine._ensure_loaded()
        record = rag_engine.nlp_model.teach_new_knowledge(
            unit_id=req.unit_id,
            topic=req.topic,
            question_examples=req.question_examples,
            answer=req.answer,
            fact_chunk=req.fact_chunk,
            entity=req.entity,
            event=req.event
        )
        return {
            "status": "success",
            "message": f"Đã nạp thành công tri thức mới '{record['unit_id']}' vào bộ nhớ AI!",
            "record": record
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi nạp tri thức động cho AI: {str(e)}")
