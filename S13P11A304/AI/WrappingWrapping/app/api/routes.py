"""API 라우터 - API 엔드포인트 정의"""
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends
from typing import Optional

from core.models import STTResponse, STTStatus, ReportRequest, ReportData
from core.service_manager import ServiceManager
from services.interview_processor import InterviewProcessor

# 로거 설정
logger = logging.getLogger(__name__)

# 라우터 생성
router = APIRouter()

# 서비스 컨테이너 클래스
class ServiceContainer:
    def __init__(self):
        self.service_manager: Optional[ServiceManager] = None
        self.interview_processor: Optional[InterviewProcessor] = None
        self._initialized = False
    
    def initialize(self):
        """서비스 초기화"""
        if self._initialized:
            return
            
        try:
            logger.info("서비스 초기화 시작")
            
            # 서비스 매니저 초기화
            self.service_manager = ServiceManager()
            self.service_manager.initialize_all_services()
            
            # 면접 처리기 초기화
            self.interview_processor = InterviewProcessor(self.service_manager)
            
            self._initialized = True
            logger.info("면접 처리 시스템 초기화 완료")
            
        except Exception as e:
            logger.error(f"서비스 초기화 실패: {e}")
            raise

# 글로벌 서비스 컨테이너
_services = ServiceContainer()

def get_services() -> ServiceContainer:
    """의존성 주입을 위한 서비스 컨테이너 반환"""
    if not _services._initialized:
        _services.initialize()
    return _services

def get_service_manager(services: ServiceContainer = Depends(get_services)) -> ServiceManager:
    """서비스 매니저 의존성 주입"""
    if not services.service_manager:
        raise HTTPException(status_code=503, detail="서비스 매니저가 초기화되지 않았습니다")
    return services.service_manager

def get_interview_processor(services: ServiceContainer = Depends(get_services)) -> InterviewProcessor:
    """면접 처리기 의존성 주입"""
    if not services.interview_processor:
        raise HTTPException(status_code=503, detail="면접 처리 시스템이 초기화되지 않았습니다")
    return services.interview_processor


# ===== STT 관련 API =====
@router.get("/stt/test", response_model=STTStatus)
async def stt_status_check(service_manager: ServiceManager = Depends(get_service_manager)):
    """STT 서비스 상태 확인"""
    try:
        if not service_manager.stt_service:
            raise HTTPException(status_code=503, detail="STT 서비스가 초기화되지 않았습니다")
        
        return service_manager.stt_service.get_status()
    except Exception as e:
        logger.error(f"STT 상태 확인 실패: {e}")
        raise HTTPException(status_code=500, detail=f"STT 상태 확인 중 오류가 발생했습니다: {str(e)}")


@router.post("/stt/transcribe", response_model=STTResponse)
async def transcribe_audio_only(
    audio: UploadFile = File(..., description="변환할 음성 파일"),
    service_manager: ServiceManager = Depends(get_service_manager)
):
    """음성 파일을 텍스트로 변환 (STT 단독 기능)"""
    if not service_manager.stt_service:
        raise HTTPException(status_code=503, detail="STT 서비스가 초기화되지 않았습니다")
    
    try:
        logger.info(f"음성 파일 변환 시작: {audio.filename}")
        result = await service_manager.stt_service.transcribe_audio(audio)
        logger.info("음성 파일 변환 완료")
        return result
    except Exception as e:
        logger.error(f"음성 파일 변환 실패: {e}")
        raise HTTPException(status_code=500, detail=f"음성 변환 중 오류가 발생했습니다: {str(e)}")


# ===== 리포트 관련 API =====
@router.post("/stt/report/generate", response_model=ReportData)
async def generate_report_only(
    request: ReportRequest,
    service_manager: ServiceManager = Depends(get_service_manager)
):
    """텍스트를 리포트로 변환 (리포트 단독 기능)"""
    if not service_manager.report_generator:
        raise HTTPException(status_code=503, detail="리포트 생성 서비스가 초기화되지 않았습니다")
    
    if not service_manager.database_service:
        raise HTTPException(status_code=503, detail="데이터베이스 서비스가 초기화되지 않았습니다")
    
    try:
        logger.info(f"리포트 생성 시작 - 사용자 ID: {request.userId}")
        
        # 리포트 생성
        result = await service_manager.report_generator.generate_report(request)
        
        # DB 저장 (필수)
        logger.info("DB에 리포트 저장 중...")
        saved = await service_manager.database_service.save_report(result)
        
        if not saved:
            logger.error("리포트 DB 저장 실패")
            raise HTTPException(status_code=500, detail="리포트 DB 저장에 실패했습니다")
        
        logger.info("리포트 생성 및 DB 저장 완료")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"리포트 생성 실패: {e}")
        raise HTTPException(status_code=500, detail=f"리포트 생성 중 오류가 발생했습니다: {str(e)}")


# ===== 통합 API (핵심 기능) =====
@router.post("/stt/process-interview", response_model=ReportData)
async def process_interview_audio(
    audio: UploadFile = File(..., description="면접 음성 파일"),
    userId: int = Form(..., description="지원자 사용자 ID"),
    meetingAt: str = Form(..., description="회의시간"),
    job: str = Form(..., description="지원 직무"),
    mode: str = Form(..., description="면접 유형"),
    title: str = Form(..., description="회의방 제목"),
    situation: str = Form(..., description="문제 배경"),
    requirements: str = Form(..., description="문제 조건"),
    question: str = Form(..., description="문제 질문"),
    interview_processor: InterviewProcessor = Depends(get_interview_processor)
):
    """
    핵심 통합 기능: 면접 음성 파일 → 4단계 처리 → 완성된 평가 리포트
    
    전체 플로우:
    1. STT: 면접 음성 파일을 텍스트로 변환 (Whisper)
    2. 전처리: 음성인식 오류 자동 정정 (OpenAI GPT) 
    3. 리포트 생성: 정량적 면접 평가 리포트 생성 (OpenAI GPT)
    4. DB 저장: MySQL에 구조화된 데이터 저장
    
    Args:
        audio: 면접 음성 파일 (webm파일)
        userId: 지원자 사용자 ID
        meetingAt: 면접 시간 (2025-08-24 14:30:00 형식)
        job: 지원 직무 (개발, 금융, 경영 등)
        mode: 면접 유형 (PT, 기술면접, 인성면접 등)
        title: 회의방 제목
        situation: 문제 배경
        requirements: 문제 조건  
        question: 문제 질문
        
    Returns:
        ReportData: 생성된 면접 평가 리포트 (점수, 상세 평가, STAR 분석 포함)
    """
    try:
        logger.info(f"면접 처리 시작 - 사용자 ID: {userId}, 파일: {audio.filename}")
        
        # 면접 처리기에 위임
        result = await interview_processor.process_interview(
            audio=audio,
            userId=userId,
            meetingAt=meetingAt,
            job=job,
            mode=mode,
            title=title,
            situation=situation,
            requirements=requirements,
            question=question
        )
        
        logger.info(f"면접 처리 완료 - 사용자 ID: {userId}")
        return result
        
    except Exception as e:
        logger.error(f"면접 처리 실패 - 사용자 ID: {userId}, 오류: {e}")
        raise HTTPException(status_code=500, detail=f"면접 처리 중 오류가 발생했습니다: {str(e)}")


# ===== 상태 확인 API =====
@router.get("/health")
async def health_check(service_manager: ServiceManager = Depends(get_service_manager)):
    """전체 서비스 상태 확인"""
    try:
        logger.info("헬스 체크 요청")
        health_status = service_manager.get_health_status()
        
        # 모든 서비스가 정상인지 확인
        all_services_ok = all(
            service.get("status") == "ok" 
            for service in health_status.get("services", {}).values()
        )
        
        if not all_services_ok:
            logger.warning("일부 서비스가 비정상 상태입니다")
        
        return health_status
        
    except Exception as e:
        logger.error(f"헬스 체크 실패: {e}")
        return {
            "status": "error", 
            "message": f"헬스 체크 중 오류가 발생했습니다: {str(e)}",
            "services": {}
        }