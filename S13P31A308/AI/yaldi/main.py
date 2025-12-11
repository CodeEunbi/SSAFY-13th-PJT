from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from api.v1 import erd_import_validate, search_embedding, version_embedding, mockdata, verification, erd_generation, consultation, graph_indexing
import logging
import sys

# Logging 설정
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(erd_import_validate.router, prefix="/api/v1")
app.include_router(erd_generation.router, prefix="/api/v1")  # 🔥 Multi-Agent ERD Generation
app.include_router(search_embedding.router, prefix="/api/v1")
app.include_router(version_embedding.router, prefix="/api/v1")
app.include_router(mockdata.router, prefix="/api/v1")
app.include_router(verification.router, prefix="/api/v1")
app.include_router(consultation.router, prefix="/api/v1")  # 🔥 Multi-Agent Consultation Chatbot
app.include_router(graph_indexing.router, prefix="/api/v1")  # Graph RAG Indexing


@app.get("/")
async def root():
    """Health check 엔드포인트"""
    return {
        "service": settings.APP_NAME,
        "status": "healthy",
        "environment": settings.APP_ENV
    }


@app.get("/health")
async def health():
    """상세 Health check"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0"
    }


@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 실행"""
    logger.info(f"{settings.APP_NAME} starting up...")
    logger.info(f"Environment: {settings.APP_ENV}")
    logger.info(f"Debug mode: {settings.DEBUG}")


@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 실행"""
    logger.info(f"{settings.APP_NAME} shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
