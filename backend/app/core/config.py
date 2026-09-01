"""
Application configuration loaded from environment variables.
Uses Pydantic Settings for type-safe config management.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ---------- Database ----------
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/todo_db",
        description="Async PostgreSQL connection string (postgresql+asyncpg://...)"
    )
    DATABASE_URL_SYNC: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/todo_db",
        description="Sync PostgreSQL connection string for Alembic migrations"
    )

    # ---------- Authentication ----------
    SECRET_KEY: str = Field(
        default="super-secret-key-at-least-32-characters-long-for-security",
        min_length=32,
        description="Secret key for JWT token signing"
    )
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=480)

    # ---------- Password Policy ----------
    DEFAULT_PASSWORD_EXPIRY_DAYS: int = Field(default=30)
    MIN_PASSWORD_LENGTH: int = Field(default=8)

    # ---------- CORS ----------
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000",
        description="Comma-separated list of allowed origins"
    )

    # ---------- Application ----------
    APP_NAME: str = Field(default="AI-Powered Todo & Workflow Management")
    APP_VERSION: str = Field(default="1.0.0")
    DEBUG: bool = Field(default=False)

    # ---------- Seed Data ----------
    SEED_ADMIN_PASSWORD: str = Field(default="Admin@12345")

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — loaded once per process."""
    return Settings()
