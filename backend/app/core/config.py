from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "AI Smart Tutor — Data Exploration and Visualization Laboratory"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production-min-32-chars-long"
    SESSION_EXPIRE_MINUTES: int = 1440  # 24 hours
    COOKIE_SECURE: bool = False  # Set to True in production with HTTPS
    COOKIE_SAMESITE: str = "lax"
    SESSION_COOKIE_NAME: str = "smart_tutor_session"

    # Database: Supports PostgreSQL or local SQLite for testing/development
    DATABASE_URL: str = "sqlite:///./storage/ai_smart_tutor.db"

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Storage paths (outside public web directory)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    ARTIFACT_DIR: Path = STORAGE_DIR / "artifacts"
    REPORT_DIR: Path = STORAGE_DIR / "reports"

    # Dataset limits
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    MAX_ROWS: int = 50000
    MAX_COLS: int = 100

    # Rate limiting
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20
    RATE_LIMIT_AI_PER_MINUTE: int = 30
    RATE_LIMIT_UPLOAD_PER_MINUTE: int = 15

    # LLM Settings
    LLM_PROVIDER: str = "mock"  # "mock", "gemini", "openai", "ollama"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"
    LLM_TIMEOUT_SECONDS: float = 25.0
    LLM_MAX_RETRIES: int = 2


settings = Settings()

# Ensure internal storage directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORT_DIR.mkdir(parents=True, exist_ok=True)
