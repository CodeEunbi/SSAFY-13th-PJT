"""STT(Speech-to-Text) 서비스 - Whisper 기반"""
import logging
import whisper
import torch
import os
import tempfile
import glob
import time
from typing import Optional
from fastapi import UploadFile

from core.models import STTResponse, STTStatus

# 로거 설정
logger = logging.getLogger(__name__)


class STTService:
    """Whisper 기반 STT 서비스 클래스"""
    
    def __init__(self):
        """STT 서비스 초기화"""
        self.model: Optional[whisper.Whisper] = None
        self.device: Optional[str] = None
        self._initialize_ffmpeg()
        self._load_whisper_model()
    
    def _initialize_ffmpeg(self):
        """
        FFmpeg 설정 (환경별 분기)
        - Windows: zip 바이너리 사용
        - Linux/EC2: 시스템 패키지 사용 (sudo apt install ffmpeg)
        """
        try:
            # Linux/Unix 환경 (EC2 포함)
            if os.name != 'nt':
                logger.info("Linux 환경 감지: 시스템 FFmpeg 사용 예정")
                logger.info("EC2 배포 시: sudo apt update && sudo apt install ffmpeg")
                return
            
            # Windows 환경: 로컬 바이너리 찾기 -> 현재 로컬환경에선 이렇게 했음
            logger.info("Windows 환경: 로컬 FFmpeg 바이너리 검색 중...")
            ai_folder = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            
            possible_paths = [
                os.path.join(ai_folder, "ffmpeg-*", "ffmpeg-*", "bin"),  # 중복 구조
                os.path.join(ai_folder, "ffmpeg-*", "bin"),              # 일반 구조
            ]
            
            ffmpeg_exe = None
            exec_path = None
            
            for pattern in possible_paths:
                pattern_paths = glob.glob(pattern)
                for path in pattern_paths:
                    test_exe = os.path.join(path, "ffmpeg.exe")
                    if os.path.exists(test_exe):
                        exec_path = path
                        ffmpeg_exe = test_exe
                        break
                if ffmpeg_exe:
                    break
            
            if ffmpeg_exe and exec_path:
                os.environ["PATH"] = exec_path + ";" + os.environ["PATH"]
                logger.info(f"Windows FFmpeg 설정 완료: {exec_path}")
            else:
                logger.warning("Windows FFmpeg 바이너리를 찾을 수 없습니다")
                logger.warning("ffmpeg-7.1.1 폴더가 AI 디렉토리에 있는지 확인하세요")
                
        except Exception as e:
            logger.error(f"FFmpeg 설정 중 오류: {e}")
            if os.name != 'nt':
                logger.info("Linux 환경에서는 시스템 FFmpeg가 자동으로 사용됩니다")
    
    def _load_whisper_model(self):
        """
        Whisper 모델 로드
        """
        try:
            # 모델 크기 설정 (기존 로직)
            model_size = os.getenv("WHISPER_MODEL", "base")
            
            # CPU GPU 선택 (기존 로직 
            if torch.cuda.is_available():
                self.device = "cuda"
                logger.info(f"GPU: {torch.cuda.get_device_name()}")
            else:
                self.device = "cpu"
                logger.info("CPU 사용")
            
            # 모델 로드 (기존 로직 그대로)
            self.model = whisper.load_model(model_size, device=self.device)
            logger.info("Whisper 모델 로드 완료")
            
        except Exception as e:
            logger.error(f"모델 로드 실패: {e}")
            self.model, self.device = None, None
    
    def get_status(self) -> STTStatus:
        """STT 서비스 상태 반환"""
        return STTStatus(
            status="ok" if self.model is not None else "error",
            device=self.device or "unknown",
            model_loaded=self.model is not None
        )
    
    async def transcribe_audio(self, audio: UploadFile) -> STTResponse:
        """
        음성 파일을 텍스트로 변환
        
        Args:
            audio (UploadFile): 업로드된 음성 파일
            
        Returns:
            STTResponse: 변환 결과
            
        Raises:
            Exception: STT 처리 실패 시
        """
        if self.model is None:
            raise Exception("STT 모델이 로드되지 않았습니다")
        
        start_time = time.time()
        temp_path = None
        
        try:
            # 확장자 처리
            file_extension = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
            
            # 임시 파일 생성 
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as tmp:
                content = await audio.read()
                tmp.write(content)
                temp_path = tmp.name
            
            # STT 처리 
            stt_result = self.model.transcribe(
                temp_path,
                language="ko",
                fp16=False,
                verbose=False,
                temperature=0.0,
                no_speech_threshold=0.6,
                logprob_threshold=-1.0
            )
            
            text = stt_result["text"]
            processing_time = time.time() - start_time
            
            logger.info(f"변환 완료: {text[:50]}...")
            
            return STTResponse(
                text=text,
                processing_time=round(processing_time, 2)
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"변환 실패: {e}")
            raise Exception(f"음성 변환 실패: {str(e)}")
            
        finally:
            # 임시 파일 정리
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)