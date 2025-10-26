from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TelegramAuthData(BaseModel):
    """Telegram authentication data from Telegram Login Widget."""
    id: int = Field(..., description="Telegram user ID")
    first_name: str = Field(..., description="User's first name")
    last_name: Optional[str] = Field(None, description="User's last name")
    username: Optional[str] = Field(None, description="User's username")
    photo_url: Optional[str] = Field(None, description="User's profile photo URL")
    auth_date: int = Field(..., description="Unix timestamp of authentication")
    hash: str = Field(..., description="Data hash for verification")


class UserResponse(BaseModel):
    """User response schema."""
    id: int
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Authentication response with token."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

