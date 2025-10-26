from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

from app.models.investment import InvestmentType


class InvestmentBase(BaseModel):
    """Base investment schema."""
    name: str = Field(..., min_length=1, max_length=255, description="Investment name")
    symbol: str = Field(..., min_length=1, max_length=50, description="Investment symbol/ticker")
    investment_type: InvestmentType = Field(..., description="Type of investment")
    amount: float = Field(..., description="Amount/quantity (positive for buy, negative for sell)")
    purchase_price: float = Field(..., gt=0, description="Purchase/sale price per unit")
    purchase_date: date = Field(..., description="Date of transaction")
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
    amount: Optional[float] = None
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


class InvestmentSell(BaseModel):
    """Schema for selling investment."""
    user_id: Optional[int] = Field(None, description="Telegram user ID")
    symbol: str = Field(..., min_length=1, max_length=50, description="Investment symbol to sell")
    amount: float = Field(..., gt=0, description="Amount to sell (will be stored as negative)")
    sale_price: float = Field(..., gt=0, description="Sale price per unit")
    sale_date: date = Field(..., description="Date of sale")
    description: Optional[str] = Field(None, max_length=1000, description="Optional sale description")


class AvailablePosition(BaseModel):
    """Schema for available position that can be sold."""
    symbol: str
    name: str
    investment_type: InvestmentType
    available_amount: float = Field(..., description="Net available amount (buys - sells)")
    average_purchase_price: float = Field(..., description="Weighted average purchase price")
    current_price: Optional[float]
    total_invested: float = Field(..., description="Total amount invested in remaining position")
    total_current_value: float = Field(..., description="Current value of position")
    unrealized_profit_loss: float = Field(..., description="Unrealized profit/loss")

