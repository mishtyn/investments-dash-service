from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = Field(
        default="postgresql://postgres:postgres@db:5432/investments_dash",
        alias="DATABASE_URL"
    )
    
    # Application
    app_name: str = Field(default="Investments Dashboard API", alias="APP_NAME")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    debug: bool = Field(default=True, alias="DEBUG")
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    
    # Authentication
    secret_key: str = Field(
        default="your-secret-key-change-this-in-production",
        alias="SECRET_KEY"
    )
    telegram_bot_token: str = Field(default="", alias="TELEGRAM_BOT_TOKEN")
    frontend_url: str = Field(default="http://127.0.0.1:3000", alias="FRONTEND_URL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"


settings = Settings()

