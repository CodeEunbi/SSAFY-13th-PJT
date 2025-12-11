from pydantic_settings import BaseSettings
from typing import Literal
from pydantic import field_validator


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Yaldi AI Service"
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Spring Boot Backend
    SPRING_BACKEND_URL: str = "http://localhost:8080"
    SPRING_API_KEY: str = ""

    # Test Databases
    TEST_POSTGRES_URL: str = "postgresql://test:test@test-postgres:5432/test_validation"
    TEST_MYSQL_URL: str = "mysql://test:test@test-mysql:3306/test_validation"

    # Neo4j (Graph RAG)
    NEO4J_URI: str = "bolt://neo4j:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "yaldi308"

    # LLM APIs (SSAFY GMS)
    GMS_API_KEY: str = "S13P32A308-0ff6c7be-14f8-4eef-8daa-0d580e22b417"  # SSAFY GMS KEY
    GMS_BASE_URL: str = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"  # GMS 엔드포인트
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_TEMPERATURE: float = 0.7

    DEFAULT_LLM_PROVIDER: Literal["openai", "anthropic", "google"] = "openai"

    # ERD AI Settings
    ERD_MAX_TOKENS: int = 2000
    ERD_TEMPERATURE: float = 0.3

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    CORS_ALLOW_CREDENTIALS: bool = True

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # JSON 형식 또는 쉼표 구분 문자열 지원
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(',')]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
