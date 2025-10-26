from datetime import datetime
from typing import Optional

from sqlalchemy import String, BigInteger, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    """User model for Telegram authentication."""
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False, index=True)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    first_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(),
        nullable=False
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    def __repr__(self) -> str:
        return f"<User {self.telegram_id}: {self.username or self.first_name}>"

