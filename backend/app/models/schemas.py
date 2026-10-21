"""
MODULE ĐỊNH NGHĨA HỢP ĐỒNG DỮ LIỆU API (PYDANTIC SCHEMAS)
================================================================================
- Code này là gì: Định nghĩa toàn bộ cấu trúc dữ liệu đầu vào (Request) và đầu ra (Response)
  cho tất cả REST API của hệ thống (Chat AI, Sinh đề Quiz, Cốt truyện Quest, BKT,
  Phân tích Hồ sơ tài khoản học sinh, Chấm tự luận ngắn và Nhật ký tự học AI).
- Tại sao lại có nó: Đảm bảo kiểm tra kiểu dữ liệu tự động (Type Validation), chống lỗi
  sai định dạng JSON từ Frontend gửi lên hoặc từ AI trả về, đồng thời tự động sinh tài liệu
  OpenAPI/Swagger tại `/docs`.
- Áp dụng kỹ thuật gì: Data Transfer Object (DTO) Pattern với Pydantic v2 (`BaseModel`, `Field`).
- Liên kết với file nào: Được sử dụng bởi `app/api/chat.py`, `app/api/quiz.py`, `app/api/story.py`,
  và `app/core/gemini_client.py`.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# ==============================================================================
# 1. SCHEMAS FOR STUDY MATERIALS & CHAT (STUDENT AI TUTOR - "SỬ HỌC ĐÔNG A")
# ==============================================================================

class StudyMaterialCard(BaseModel):
    unit_id: str = Field(..., description="Mã cụm tri thức")
    topic: str = Field(..., description="Chủ đề lịch sử")
    category: str = Field(..., description="Nhóm chuyên đề")
    cognitive_level: str = Field(..., description="Mức độ nhận thức (NHAN_BIET, THONG_HIEU, VAN_DUNG)")
    sgk_reference: str = Field(..., description="Trích dẫn bài/mục/trang SGK Lịch sử 7 cần đọc")
    core_fact_summary: str = Field(..., description="Tóm tắt sử liệu cốt lõi")
    key_takeaways: List[str] = Field(default_factory=list, description="Các từ khóa trọng tâm cần nhớ khi thi")
    study_method: str = Field(..., description="Phương pháp học tập hiệu quả được AI đề xuất")
    practice_question: str = Field(..., description="Câu hỏi gợi ý tự luyện tập")
    current_mastery: Optional[float] = Field(None, description="Mức độ nắm vững P(L) hiện tại của học sinh")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class GroundingSource(BaseModel):
    doc_name: str = Field(description="Tên tài liệu gốc, ví dụ: SGK Lịch sử 7 KNTT hoặc Đại Việt Sử Ký Toàn Thư")
    page_number: Optional[int] = Field(None, description="Trang tài liệu")
    curriculum_match: Optional[str] = Field(None, description="Mục bài học tương ứng trong chương trình GDPT 2018")
    fact_chunk: str = Field(description="Đoạn tư liệu sử liệu được trích xuất làm căn cứ trả lời")


class ChatRequest(BaseModel):
    query: str = Field(..., description="Câu hỏi của học sinh về Lịch sử thời Trần")
    student_id: Optional[str] = Field(
        "student_nguyen_van_long",
        description="ID tài khoản học sinh để đồng bộ tiến trình học tập BKT và gợi ý tài liệu"
    )
    session_id: Optional[str] = Field(None, description="Mã phiên hội thoại của học sinh")
    character_id: Optional[str] = Field(
        None,
        description="ID nhân vật lịch sử nhập vai nếu có (TRAN_QUOC_TUAN, TRAN_THAI_TONG, TRAN_QUOC_TOAN...)"
    )
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Lịch sử hội thoại")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="Câu trả lời của Trợ lý AI")
    character_name: str = Field("Trợ Lý AI Lịch Sử Đông A", description="Tên nhân vật phản hồi")
    grounding_sources: List[GroundingSource] = Field(default_factory=list, description="Căn cứ sử liệu")
    badge_unlocked: Optional[str] = Field(None, description="Huy hiệu lịch sử mở khóa nếu có")
    exp_reward: int = Field(20, description="Điểm kinh nghiệm thưởng cho câu hỏi hay")
    recommended_material: Optional[StudyMaterialCard] = Field(
        None,
        description="Thẻ tài liệu học tập SGK & phương pháp ôn tập tương ứng với câu hỏi vừa hỏi"
    )


# ==============================================================================
# 2. SCHEMAS FOR QUIZ GENERATION (TEACHER AI STUDIO)
# ==============================================================================

class GeneratedQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_index: int
    cognitive_level: Literal["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"]
    explanation: str
    curriculum_reference: str


class QuizGenerateRequest(BaseModel):
    topic: str = Field("Ba lần kháng chiến chống quân Mông - Nguyên (1258 - 1288)", description="Chủ đề trắc nghiệm")
    num_questions: int = Field(4, ge=1, le=20, description="Số lượng câu hỏi cần sinh")
    cognitive_level: Optional[str] = Field("Tất cả mức độ", description="Mức độ nhận thức GDPT 2018")
    source_preference: Optional[str] = Field("SGK Lịch sử 7 Kết nối tri thức", description="Nguồn sách ưu tiên")


class QuizGenerateResponse(BaseModel):
    topic: str
    total_generated: int
    questions: List[GeneratedQuestion]
    generation_notes: str


# ==============================================================================
# 3. SCHEMAS FOR STORY GENERATION (QUEST CAMPAIGN NARRATIVE)
# ==============================================================================

class StoryGenerateRequest(BaseModel):
    campaign_name: str = Field("Ba lần kháng chiến chống quân Mông - Nguyên", description="Tên chiến dịch")
    stage_title: str = Field("Trận địa cọc ngầm sông Bạch Đằng", description="Tên ải thử thách")
    key_event: Optional[str] = Field("Trần Hưng Đạo bố trí cọc ngầm đón thủy triều rút năm 1288", description="Sự kiện chính")


class StoryGenerateResponse(BaseModel):
    stage_title: str
    story_narrative: str
    historical_fact: str
    challenge_question: str
    suggested_xp: int = 100
    suggested_gp: int = 50


# ==============================================================================
# 4. SCHEMAS FOR BAYESIAN KNOWLEDGE TRACING, PROFILE ANALYTICS & ESSAY GRADING
# ==============================================================================

class StudentAnswerSubmission(BaseModel):
    student_id: str = Field(..., description="ID học sinh")
    unit_id: str = Field(..., description="ID cụm tri thức câu hỏi (từ Q-matrix)")
    is_correct: bool = Field(..., description="Học sinh trả lời đúng hay sai")
    cognitive_level: Optional[str] = Field("THONG_HIEU", description="Mức độ nhận thức của câu hỏi")


class BKTUpdateResponse(BaseModel):
    student_id: str
    unit_id: str
    topic: str
    is_correct: bool
    old_p_l: float
    new_p_l: float
    p_l_delta: float
    mastery_status: str
    attempts: int


class PersonalizedRecommendationItem(BaseModel):
    unit_id: str
    topic: str
    category: str
    current_mastery: float
    difficulty: float
    cognitive_level: str
    reason: str
    sgk_reference: Optional[str] = Field(None, description="Mục/Trang SGK Lịch sử 7 cần đọc")
    study_method: Optional[str] = Field(None, description="Phương pháp học tập hiệu quả")
    key_takeaways: Optional[List[str]] = Field(default_factory=list, description="Từ khóa cốt lõi cần nhớ")


class PersonalizedRecommendationResponse(BaseModel):
    student_id: str
    total_recommendations: int
    recommendations: List[PersonalizedRecommendationItem]


class CampaignMasteryItem(BaseModel):
    pillar_id: str
    label: str
    avg_mastery: float
    status: str
    unit_count: int


class CognitiveMasteryItem(BaseModel):
    cognitive_level: str
    label: str
    avg_mastery: float
    recommended_strategy: str


class StudentProfileAnalysisResponse(BaseModel):
    student_id: str
    overall_mastery: float
    mastery_rank: str
    total_quiz_attempts: int
    total_chat_questions: int
    campaign_breakdown: List[CampaignMasteryItem]
    cognitive_breakdown: List[CognitiveMasteryItem]
    strengths: List[str]
    weaknesses: List[str]
    ai_diagnosis: str
    recommended_study_materials: List[StudyMaterialCard]


class ShortAnswerEvaluationRequest(BaseModel):
    student_id: str = Field("student_nguyen_van_long", description="ID tài khoản học sinh")
    unit_id: str = Field(..., description="ID cụm tri thức cần chấm (VD: KC3_BACH_DANG_HOW, TQT_WHY_ORANGE)")
    student_answer: str = Field(..., description="Câu trả lời tự luận ngắn do học sinh tự nhập")


class ShortAnswerEvaluationResponse(BaseModel):
    student_id: str
    unit_id: str
    topic: str
    score_10: float
    is_passed: bool
    matched_concepts: List[str]
    missing_concepts: List[str]
    ai_feedback: str
    standard_reference_answer: str
    bkt_update: BKTUpdateResponse
    study_material: StudyMaterialCard
