"""
MODULE CẤU HÌNH HỆ THỐNG TRUNG TÂM (CENTRAL CONFIGURATION)
================================================================================
- Code này là gì: Quản lý tập trung toàn bộ biến môi trường (.env), thông tin dự án,
  cấu hình cổng kết nối Gemini LLM và chính sách bảo mật CORS.
- Tại sao lại có nó: Tránh hardcode API Key hoặc tên model rải rác trong nhiều file,
  đồng thời tự động chuẩn hóa tên model (`gemini-flash-latest`) để tránh lỗi 404
  khi triển khai thực tế trên Render/Vercel.
- Áp dụng kỹ thuật gì: Singleton Settings Pattern + Environment Variable Injection (`python-dotenv`).
- Liên kết với file nào: Được import bởi `app/main.py`, `hybrid_router.py`, và `app/core/gemini_client.py`.
"""

import os
from dotenv import load_dotenv

# Nạp biến môi trường từ file .env (nếu chạy ở môi trường Local)
load_dotenv()


class Settings:
    PROJECT_NAME: str = "Hào Khí Đông A AI Engine - Lịch Sử 7"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"

    # Cấu hình Google Gemini API (Dùng cho Grounded Polish, Sinh Quiz & Sinh Cốt Truyện)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    _raw_gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
    GEMINI_MODEL: str = (
        "gemini-flash-latest"
        if _raw_gemini_model in ("", "gemini-3.5-flash-lite", "gemini-1.5-flash")
        else _raw_gemini_model
    )

    # Cấu hình CORS cho phép Frontend (Localhost & Vercel) giao tiếp với Backend
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]


settings = Settings()

