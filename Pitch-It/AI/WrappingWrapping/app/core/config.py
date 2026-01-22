"""애플리케이션 설정 관리"""
import os
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """환경 설정"""
    
    # OpenAI API 설정
    openai_api_key: str = Field(..., description="OpenAI API 키")
    openai_model: str = Field(default="gpt-4o", description="사용할 GPT 모델")
    openai_base_url: str = Field(default="https://gms.ssafy.io/gmsapi/api.openai.com/v1", description="OpenAI API Base URL")
    openai_timeout: int = Field(default=30, description="OpenAI API 타임아웃(초)")
    openai_max_tokens: int = Field(default=2000, description="최대 토큰 수")
    openai_temperature: float = Field(default=0.0, description="응답 창의성")
    
    # 서버 설정
    host: str = Field(default="0.0.0.0", description="서버 호스트")
    port: int = Field(default=8000, description="서버 포트")
    environment: str = Field(default="development", description="실행 환경")
    
    # CORS 설정
    allowed_origins: List[str] = Field(
        default=["http://localhost:8080", "http://localhost:3000"],
        description="허용할 Origin 목록"
    )
    
    # Whisper 설정
    whisper_model: str = Field(default="base", description="Whisper 모델 크기")
    
    # MySQL 데이터베이스 설정
    db_host: str = Field(..., description="MySQL 호스트")
    db_port: int = Field(..., description="MySQL 포트") 
    db_user: str = Field(..., description="MySQL 사용자명")
    db_password: str = Field(..., description="MySQL 비밀번호")
    db_name: str = Field(..., description="데이터베이스명")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()