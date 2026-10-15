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
    CORS_ORIGINS: list[str] | str = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: object) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i) for i in v]
        return []

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

    # LLM Settings ("deepseek", "gemini", "openai", "mock")
    LLM_PROVIDER: str = "deepseek"
    LLM_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    LLM_MODEL: str = "deepseek-chat"
    LLM_TIMEOUT_SECONDS: float = 35.0
    LLM_MAX_RETRIES: int = 2

    @property
    def effective_api_key(self) -> str:
        return (self.DEEPSEEK_API_KEY or self.LLM_API_KEY or self.GEMINI_API_KEY or "").strip()

    @property
    def effective_provider(self) -> str:
        key = self.effective_api_key
        prov = self.LLM_PROVIDER.lower().strip()
        if self.DEEPSEEK_API_KEY or prov == "deepseek":
            return "deepseek"
        if key and prov == "mock":
            if key.startswith("sk-"):
                return "deepseek"
            return "gemini"
        return prov

    @property
    def effective_model(self) -> str:
        if self.effective_provider == "deepseek":
            if not self.LLM_MODEL or self.LLM_MODEL == "gemini-1.5-flash":
                return "deepseek-chat"
        return self.LLM_MODEL or "deepseek-chat"


settings = Settings()

# Ensure internal storage directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORT_DIR.mkdir(parents=True, exist_ok=True)
