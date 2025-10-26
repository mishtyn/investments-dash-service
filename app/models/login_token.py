"""Login token model for short magic links."""
from datetime import datetime
from typing import Optional
import secrets

from sqlalchemy import String, Integer, ForeignKey, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class LoginToken(Base):
    """Short login tokens for magic links."""
    __tablename__ = "login_tokens"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    token: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    telegram_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(),
        nullable=False
    )
    used_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    @staticmethod
    def generate_token() -> str:
        """Generate a short, URL-safe token."""
        return secrets.token_urlsafe(12)  # ~16 characters
    
    def __repr__(self) -> str:
        return f"<LoginToken {self.token} for user {self.user_id}>"

