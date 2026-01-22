"""면접 처리 플로우 서비스 - 4단계 통합 처리"""
import logging
from fastapi import UploadFile, HTTPException

from core.models import ReportRequest, ReportData
from core.service_manager import ServiceManager

# 로거 설정
logger = logging.getLogger(__name__)


class InterviewProcessor:
    #면접 음성 파일 처리 플로우 관리 서비스
    
    def __init__(self, service_manager: ServiceManager):
        #면접 처리 서비스 초기화
        self.service_manager = service_manager
    
    async def process_interview(
        self,
        audio: UploadFile,
        userId: int,
        meetingAt: str,
        job: str,
        mode: str,
        title: str,
        situation: str,
        requirements: str,
        question: str
    ) -> ReportData:
        """
        면접 음성 파일 → 4단계 처리 → 완성된 평가 리포트
        
        전체 플로우:
        1. STT: 면접 음성 파일을 텍스트로 변환 (Whisper)
        2. 전처리: 음성인식 오류 자동 정정 (OpenAI GPT) 
        3. 리포트 생성: 정량적 면접 평가 리포트 생성 (OpenAI GPT)
        4. DB 저장: MySQL에 구조화된 데이터 저장
        
        Args:
            audio: 면접 음성 파일
            userId: 지원자 사용자 ID
            meetingAt: 면접 시간
            job: 지원 직무
            mode: 면접 유형
            title: 회의방 제목
            situation: 문제 배경
            requirements: 문제 조건
            question: 문제 질문
            
        Returns:
            ReportData: 생성된 면접 평가 리포트
        """
        # 서비스 상태 확인
        self._validate_services()
        
        try:
            logger.info(f"면접 평가 처리 시작 - UserId: {userId}, 직무: {job}, 모드: {mode}")
            
            # 1단계: STT (음성 → 텍스트)
            raw_text = await self._step1_stt(audio)
            
            # 2단계: 텍스트 전처리 (음성인식 오류 정정)
            processedText = await self._step2_preprocess(raw_text, job, mode)
            
            # 3단계: 리포트 생성 (전처리된 텍스트 → 면접 평가)
            report_result = await self._step3_generate_report(
                processedText, userId, meetingAt, job, mode, title, situation, requirements, question
            )
            
            # 4단계: DB 저장
            await self._step4_save_to_db(report_result)
            
            logger.info(f"면접 평가 처리 완료 - 제목: {report_result.title}")
            return report_result
            
        except Exception as e:
            error_msg = f"면접 평가 처리 중 오류 발생: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
    
    def _validate_services(self):
        #필요한 서비스들이 초기화되었는지 확인
        if not self.service_manager.stt_service:
            raise HTTPException(status_code=503, detail="STT 서비스가 초기화되지 않았습니다")
        
        if not self.service_manager.text_preprocessor:
            raise HTTPException(status_code=503, detail="텍스트 전처리 서비스가 초기화되지 않았습니다")
            
        if not self.service_manager.report_generator:
            raise HTTPException(status_code=503, detail="리포트 생성 서비스가 초기화되지 않았습니다")
            
        if not self.service_manager.database_service:
            raise HTTPException(status_code=503, detail="데이터베이스 서비스가 초기화되지 않았습니다")
    
    async def _step1_stt(self, audio: UploadFile) -> str:
        #1단계: STT (음성 → 텍스트)
        logger.info("음성을 텍스트로 변환 중...")
        stt_result = await self.service_manager.stt_service.transcribe_audio(audio)
        raw_text = stt_result.text
        logger.info(f"STT 변환 완료 - 텍스트 길이: {len(raw_text)}자")
        return raw_text
    
    async def _step2_preprocess(self, raw_text: str, job: str, mode: str) -> str:
        #2단계: 텍스트 전처리 (음성인식 오류 정정)
        logger.info("텍스트 전처리 중...")
        processedText = await self.service_manager.text_preprocessor.preprocess_text(
            rawText=raw_text,
            context=f"{job} {mode} 면접답변"
        )
        logger.info(f"전처리 완료 - 원본: {len(raw_text)}자 → 처리후: {len(processedText)}자")
        logger.debug("전처리 결과 비교 시작")
        logger.debug(f"[원본 STT] {raw_text[:500]}...")
        logger.debug(f"[전처리후] {processedText[:500]}...")
        logger.debug("전처리 결과 비교 완료")
        return processedText
    
    async def _step3_generate_report(
        self, 
        processedText: str, 
        userId: int, 
        meetingAt: str, 
        job: str, 
        mode: str, 
        title: str,
        situation: str, 
        requirements: str, 
        question: str
    ) -> ReportData:
        #3단계: 리포트 생성 (전처리된 텍스트 → 면접 평가)
        logger.info("면접 평가 리포트 생성 중...")
        report_request = ReportRequest(
            text=processedText,  # 전처리된 텍스트 사용
            userId=userId,
            meetingAt=meetingAt,
            job=job,
            mode=mode,
            title=title,
            situation=situation,
            requirements=requirements,
            question=question,
            language="ko"
        )
        
        report_result = await self.service_manager.report_generator.generate_report(report_request)
        logger.info(f"리포트 생성 완료 - 총점: {report_result.scores['total']}점")
        return report_result
    
    async def _step4_save_to_db(self, report_result: ReportData):
        #4단계: DB 저장
        logger.info("DB에 리포트 저장 중...")
        saved = await self.service_manager.database_service.save_report(report_result)
        
        if not saved:
            raise HTTPException(status_code=500, detail="리포트 DB 저장에 실패했습니다")
        
        logger.info("DB 저장 완료")