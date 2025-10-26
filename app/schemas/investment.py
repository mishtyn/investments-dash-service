from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class InvestmentBase(BaseModel):
    """Base investment schema."""
    name: str = Field(..., min_length=1, max_length=255)
    symbol: str = Field(..., min_length=1, max_length=50)
    amount: float = Field(..., gt=0)
    purchase_price: float = Field(..., gt=0)
    current_price: Optional[float] = Field(None, gt=0)


class InvestmentCreate(InvestmentBase):
    """Schema for creating investment."""
    pass


class InvestmentUpdate(BaseModel):
    """Schema for updating investment."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    symbol: Optional[str] = Field(None, min_length=1, max_length=50)
    amount: Optional[float] = Field(None, gt=0)
    purchase_price: Optional[float] = Field(None, gt=0)
    current_price: Optional[float] = Field(None, gt=0)


class InvestmentResponse(InvestmentBase):
    """Schema for investment response."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

