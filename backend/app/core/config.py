from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path

# Resolve project root (3 levels up from this file: core → app → backend → project root)
_BASE_DIR = Path(__file__).resolve().parents[3]
_BACKEND_ENV = _BASE_DIR / "backend" / ".env"
_ROOT_ENV = _BASE_DIR / ".env"

# Use backend/.env if it exists, otherwise fall back to root .env
_ENV_FILE = str(_BACKEND_ENV) if _BACKEND_ENV.exists() else str(_ROOT_ENV)


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://app_user:change_me@localhost:5433/petclinic"
    JWT_SECRET: str = "dev_secret_key"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = _ENV_FILE
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
