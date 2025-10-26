from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

from app.models.investment import InvestmentType


class InvestmentBase(BaseModel):
    """Base investment schema."""
    name: str = Field(..., min_length=1, max_length=255, description="Investment name")
    symbol: str = Field(..., min_length=1, max_length=50, description="Investment symbol/ticker")
    investment_type: InvestmentType = Field(..., description="Type of investment")
    amount: float = Field(..., gt=0, description="Amount/quantity purchased")
    purchase_price: float = Field(..., gt=0, description="Purchase price per unit")
    purchase_date: date = Field(..., description="Date of purchase")
    description: Optional[str] = Field(None, max_length=1000, description="Optional description")
    current_price: Optional[float] = Field(None, gt=0, description="Current price per unit")


class InvestmentCreate(InvestmentBase):
    """Schema for creating investment."""
    user_id: Optional[int] = Field(None, description="Telegram user ID")


class InvestmentUpdate(BaseModel):
    """Schema for updating investment."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    symbol: Optional[str] = Field(None, min_length=1, max_length=50)
    investment_type: Optional[InvestmentType] = None
    amount: Optional[float] = Field(None, gt=0)
    purchase_price: Optional[float] = Field(None, gt=0)
    purchase_date: Optional[date] = None
    description: Optional[str] = Field(None, max_length=1000)
    current_price: Optional[float] = Field(None, gt=0)


class InvestmentResponse(InvestmentBase):
    """Schema for investment response."""
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Computed fields
    @property
    def total_value(self) -> float:
        """Calculate total current value."""
        price = self.current_price if self.current_price else self.purchase_price
        return price * self.amount
    
    @property
    def profit_loss(self) -> float:
        """Calculate profit/loss."""
        if not self.current_price:
            return 0.0
        return (self.current_price - self.purchase_price) * self.amount
    
    @property
    def profit_loss_percentage(self) -> float:
        """Calculate profit/loss percentage."""
        if not self.current_price:
            return 0.0
        return ((self.current_price - self.purchase_price) / self.purchase_price) * 100
    
    class Config:
        from_attributes = True

