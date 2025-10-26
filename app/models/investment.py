from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Investment(Base):    
    __tablename__ = "investments"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    purchase_price: Mapped[float] = mapped_column(Float, nullable=False)
    current_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        insert_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        onupdate=func.now(),
        nullable=True
    )
    
    def __repr__(self) -> str:
        return f"<Investment {self.symbol}: {self.name}>"

