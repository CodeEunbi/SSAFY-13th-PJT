"""FastAPI 메인 애플리케이션"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.config import get_settings
from api.routes import router, _services

# 로거 설정
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    
    # 서비스 초기화
    _services.initialize()
    
    yield
    logger.info("AI 통합 서버 종료")


# FastAPI 앱 생성
app = FastAPI(
    title="AI 통합 면접 평가 시스템",
    description="""
    핵심 기능: 면접 음성 파일을 업로드하면 STT → 전처리 → 평가 → 정량화된 면접 리포트까지 한번에 생성

    ## 주요 특징
    - Whisper STT: 면접 음성을 정확한 텍스트로 변환
    - AI 전처리: 음성인식 오류 자동 정정 (문맥/어순 유지, 단어만 수정)
    - GPT 평가: 전문가 수준의 면접 평가 및 정량적 점수화
    - 통합 플로우: 한 번의 API 호출로 전체 과정 처리

    ## 평가 시스템
    - 5개 영역 정량 점수화 (총 100점): 논리력(20점), 완성도(20점), 표현력(20점), 창의성(20점), 적합성(20점)
    - STAR 기법 분석, 개선점 제시, 추가 예상 질문 제공

    ## 사용법
    1. 통합 처리: `/stt/process-interview` - 면접 음성 파일 → 완성된 평가 리포트
    2. 개별 처리: STT만, 리포트 생성만 따로 사용 가능
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# 설정 로드 #.env 읽어오기 
settings = get_settings()

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# api/routes.py 內 router 객체 등록 
app.include_router(router)


# 루트 엔드포인트
@app.get("/")
async def root():
    """서비스 소개 및 상태"""
    return {
        "service": "AI 통합 면접 평가 시스템",
        "version": "1.0.0",
        "description": "면접 음성 파일 → STT → 전처리 → 평가 → 정량화된 면접 리포트를 한번에 생성하는 통합 서비스",
        "features": [
            "Whisper STT (면접 음성 → 텍스트)",
            "AI 전처리 (음성인식 오류 자동 정정)",
            "GPT 면접 평가 (정량적 점수화 + 등급제)",
            "STAR 기법 분석 및 개선점 제시",
            "통합 플로우 (한번에 처리)",
        ],
        "evaluation_system": {
            "scoring": "5개 영역 총 100점 (논리력 20점, 완성도 20점, 표현력 20점, 창의성 20점, 적합성 20점)",
        },
        "main_endpoint": "/stt/process-interview",
        "docs": "/docs",
        "health": "/health"
    }


# 서버 실행 (개발용)
if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"서버 시작 설정: Host={settings.host}, Port={settings.port}, Environment={settings.environment}")
    logger.info(f"Docs: http://{settings.host}:{settings.port}/docs")
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True if settings.environment == "development" else False
    )