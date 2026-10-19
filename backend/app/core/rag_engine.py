"""
MODULE BỘ CHUYỂN ĐỔI TRUY XUẤT SỬ LIỆU (RAG ADAPTER)
================================================================================
- Code này là gì: Lớp cầu nối (Adapter) giữa các tầng API FastAPI (`app/api/*`) và
  lõi suy luận ngôn ngữ tự nhiên độc lập (`backend/main_model.py`).
- Tại sao lại có nó: Giữ cho các file API Router ngắn gọn, không phụ thuộc trực tiếp
  vào chi tiết nạp file `.joblib` hay cấu trúc nội bộ của `DongANLPModel`.
- Áp dụng kỹ thuật gì: Adapter Design Pattern + Singleton Delegation.
- Liên kết với file nào:
  + Gọi xuống: `backend/main_model.py` (`MainNLPEngine`).
  + Được gọi bởi: `app/api/chat.py` (`ask_natural`), `app/api/quiz.py` và `app/api/story.py` (`search_relevant_chunks`).
"""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# Đảm bảo import được các module lõi ở thư mục gốc backend/
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from main_model import MainNLPEngine


class RAGEngine:
    """
    Adapter kết nối tầng FastAPI Router với `MainNLPEngine`.
    """
    def __init__(self):
        self.model = MainNLPEngine.get_model()

    def ask_natural(
        self,
        query: str,
        character_id: Optional[str] = None,
        session_id: str = "default"
    ) -> Dict[str, Any]:
        """Thực thi toàn bộ pipeline hỏi-đáp tự nhiên (NLU -> Hybrid Retrieval -> NLG)."""
        return MainNLPEngine.ask(query=query, character_id=character_id, session_id=session_id)

    def search_relevant_chunks(
        self, query: str, character_id: Optional[str] = None, top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Truy xuất cụm sử liệu chuẩn (`fact_chunk`) phục vụ sinh Quiz và Cốt truyện."""
        best_uid, conf, meta = self.model.predict_unit(query)
        if best_uid == "OOD_RANDOM_AND_OFFTOPIC" or best_uid not in self.model.unit_lookup:
            return []
        unit_rec = dict(self.model.unit_lookup[best_uid])
        unit_rec["confidence"] = conf
        unit_rec["detected_q_type"] = meta.get("q_type", "OVERVIEW")
        return [unit_rec]


rag_engine = RAGEngine()

