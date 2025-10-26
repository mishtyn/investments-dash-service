from datetime import datetime, date
from typing import Optional
from enum import Enum

from sqlalchemy import String, Float, func, Date, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class InvestmentType(str, Enum):
    """Investment types enum."""
    STOCKS = "stocks"
    CRYPTO = "crypto"
    SHARES = "shares"
    GOLD = "gold"
    REAL_ESTATE = "real_estate"
    BONDS = "bonds"
    OTHER = "other"


class Investment(Base):    
    __tablename__ = "investments"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(nullable=True, index=True)  # For Telegram user
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    investment_type: Mapped[InvestmentType] = mapped_column(
        SQLEnum(InvestmentType, native_enum=False, length=50),
        nullable=False,
        index=True
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    purchase_price: Mapped[float] = mapped_column(Float, nullable=False)
    current_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    purchase_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        onupdate=func.now(),
        nullable=True
    )
    
    def __repr__(self) -> str:
        return f"<Investment {self.symbol}: {self.name} ({self.investment_type})>"

