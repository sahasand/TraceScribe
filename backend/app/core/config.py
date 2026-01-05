"""Application configuration using Pydantic settings."""

import os
import platform
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


# Determine storage path based on platform (outside class to avoid Pydantic issues)
if platform.system() == "Windows":
    _default_storage = os.path.join(
        os.getenv("LOCALAPPDATA", "."),
        "TraceScribe",
        "uploads"
    )
else:
    _default_storage = "./uploads"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "TraceScribe"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://localhost:5432/tracescribe"

    # API Keys
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # Local Storage
    storage_path: str = _default_storage

    # Clerk Authentication
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
