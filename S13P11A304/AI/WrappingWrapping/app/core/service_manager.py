"""서비스 매니저 - 모든 서비스 초기화 및 관리"""
import logging
from typing import Optional, List

from services.stt_service import STTService
from services.text_preprocessor import TextPreprocessor
from services.report_generator import ReportGenerator
from services.database_service import DatabaseService

# 로거 설정
logger = logging.getLogger(__name__)


class ServiceManager:
    """서비스 초기화 및 관리 클래스"""
    
    def __init__(self):
        self.stt_service: Optional[STTService] = None
        self.text_preprocessor: Optional[TextPreprocessor] = None
        self.report_generator: Optional[ReportGenerator] = None
        self.database_service: Optional[DatabaseService] = None
        self._initialization_errors: List[str] = []
    
    def initialize_all_services(self) -> bool:
        """모든 서비스 초기화"""
        logger.info("서비스 초기화 시작")
        
        self._initialization_errors.clear()
        
        self._initialize_stt_service()
        self._initialize_text_preprocessor()
        self._initialize_report_generator()
        self._initialize_database_service()
        
        if self._initialization_errors:
            logger.warning(f"일부 서비스 초기화 실패: {len(self._initialization_errors)}개")
            for error in self._initialization_errors:
                logger.warning(f"  - {error}")
        else:
            logger.info("모든 서비스 초기화 완료")
            
        return len(self._initialization_errors) == 0
    
    def _initialize_stt_service(self) -> None:
        """STT 서비스 초기화"""
        try:
            logger.info("STT 서비스 로딩...")
            self.stt_service = STTService()
            logger.info("STT 서비스 초기화 완료")
        except Exception as e:
            error_msg = f"STT 서비스 초기화 실패: {e}"
            logger.error(error_msg)
            self._initialization_errors.append("STT 서비스")
            self.stt_service = None
    
    def _initialize_text_preprocessor(self) -> None:
        """텍스트 전처리 서비스 초기화"""
        try:
            logger.info("텍스트 전처리 서비스 로딩...")
            self.text_preprocessor = TextPreprocessor()
            logger.info("텍스트 전처리 서비스 초기화 완료")
        except Exception as e:
            error_msg = f"텍스트 전처리 서비스 초기화 실패: {e}"
            logger.error(error_msg)
            self._initialization_errors.append("텍스트 전처리 서비스")
            self.text_preprocessor = None
    
    def _initialize_report_generator(self) -> None:
        """리포트 생성 서비스 초기화"""
        try:
            logger.info("리포트 생성 서비스 로딩...")
            self.report_generator = ReportGenerator()
            logger.info("리포트 생성 서비스 초기화 완료")
        except Exception as e:
            error_msg = f"리포트 생성 서비스 초기화 실패: {e}"
            logger.error(error_msg)
            self._initialization_errors.append("리포트 생성 서비스")
            self.report_generator = None
    
    def _initialize_database_service(self) -> None:
        """데이터베이스 서비스 초기화"""
        try:
            logger.info("데이터베이스 서비스 로딩...")
            self.database_service = DatabaseService()
            logger.info("데이터베이스 서비스 초기화 완료")
        except Exception as e:
            error_msg = f"데이터베이스 서비스 초기화 실패: {e}"
            logger.error(error_msg)
            self._initialization_errors.append("데이터베이스 서비스")
            self.database_service = None
    
    def get_health_status(self) -> dict:
        """전체 서비스 상태 확인"""
        stt_status = self.stt_service.get_status() if self.stt_service else {
            "status": "error", 
            "message": "STT 서비스 미초기화"
        }
        preprocessor_status = {
            "status": "ok" if self.text_preprocessor else "error",
            "message": "텍스트 전처리 서비스 미초기화" if not self.text_preprocessor else None
        }
        generator_status = {
            "status": "ok" if self.report_generator else "error",
            "message": "리포트 생성 서비스 미초기화" if not self.report_generator else None
        }
        database_status = {
            "status": "ok" if self.database_service else "error",
            "message": "데이터베이스 서비스 미초기화" if not self.database_service else None
        }
        
        # 전체 상태 판단
        all_services = [stt_status, preprocessor_status, generator_status, database_status]
        all_healthy = all(service["status"] == "ok" for service in all_services)
        
        return {
            "status": "healthy" if all_healthy else "degraded",
            "services": {
                "stt": stt_status,
                "preprocessor": preprocessor_status,
                "generator": generator_status,
                "database": database_status
            },
            "initialization_errors": self._initialization_errors if self._initialization_errors else None
        }