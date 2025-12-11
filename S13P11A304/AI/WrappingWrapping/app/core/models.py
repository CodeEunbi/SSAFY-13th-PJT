"""데이터 모델 정의"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Union
from datetime import datetime


# ===== STT 관련 모델 =====
class STTResponse(BaseModel):
    """STT 응답 모델"""
    text: str = Field(..., description="변환된 텍스트")
    processing_time: float = Field(..., description="처리 시간(초)")
    
    
class STTStatus(BaseModel):
    """STT 서비스 상태 모델"""
    status: str = Field(..., description="서비스 상태")
    device: str = Field(..., description="사용 중인 디바이스")
    model_loaded: bool = Field(..., description="모델 로드 여부")


# 리포트 request 정의
class ReportRequest(BaseModel):
    """리포트 생성 요청 모델"""
    text: str = Field(..., min_length=10, max_length=50000, description="지원자 답변 텍스트")
    userId: int = Field(..., description="지원자 사용자 ID")
    meetingAt: str = Field(..., description="회의시간")
    job: str = Field(..., description="지원 직무")
    mode: str = Field(..., description="면접 유형")
    title: str = Field(..., description="회의방 제목")
    situation: str = Field(..., description="문제 배경")
    requirements: str = Field(..., description="문제 조건")
    question: str = Field(...,description="문제 질문") 
    language: str = Field(default="ko", description="언어")
    

class ReportData(BaseModel):
    """생성된 면접 평가 리포트 데이터"""
    userId: int = Field(..., description="지원자 사용자 ID")
    meetingAt: str = Field(..., description="회의시간")
    job: str = Field(..., description="지원 직무")
    mode: str = Field(..., description="면접 유형")
    situation: str = Field(..., description="문제 배경")
    requirements: str = Field(..., description="문제 조건")
    question: str = Field(...,description="문제 질문") 
    title: str = Field(..., description="면접(회의) 방 제목")
    summary: str = Field(..., description="면접 평가 요약")
    key_points: List[str] = Field(..., description="주요 평가 포인트")
    star_method: List[str] = Field(..., description="STAR 기법 분석")
    additional_questions: List[str] = Field(..., description="추가 예상 질문")
    pros_and_cons: Dict[str, str] = Field(..., description="장점과 단점 분석")
    scores: Dict[str, int] = Field(..., description="점수 객체 {total: 총점, 논리력: 점수, 완성도: 점수, 표현력: 점수, 창의성: 점수, 적합성: 점수}")
    

# 에러모델
class ErrorResponse(BaseModel):
    """에러 응답 모델"""
    error: str = Field(..., description="에러 메시지")
    detail: Optional[str] = Field(default=None, description="상세 정보")
    timestamp: datetime = Field(default_factory=datetime.now, description="발생 시간")