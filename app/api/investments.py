from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.investment import Investment
from app.schemas.investment import InvestmentCreate, InvestmentUpdate, InvestmentResponse

router = APIRouter()


@router.get("/", response_model=List[InvestmentResponse])
def get_investments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all investments."""
    investments = db.query(Investment).offset(skip).limit(limit).all()
    return investments


@router.get("/{investment_id}", response_model=InvestmentResponse)
def get_investment(
    investment_id: int,
    db: Session = Depends(get_db)
):
    """Get investment by ID."""
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investment with id {investment_id} not found"
        )
    return investment


@router.post("/", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
def create_investment(
    investment: InvestmentCreate,
    db: Session = Depends(get_db)
):
    """Create new investment."""
    # Check if symbol already exists
    existing = db.query(Investment).filter(Investment.symbol == investment.symbol).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Investment with symbol {investment.symbol} already exists"
        )
    
    db_investment = Investment(**investment.model_dump())
    db.add(db_investment)
    db.commit()
    db.refresh(db_investment)
    return db_investment


@router.put("/{investment_id}", response_model=InvestmentResponse)
def update_investment(
    investment_id: int,
    investment_update: InvestmentUpdate,
    db: Session = Depends(get_db)
):
    """Update investment."""
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investment with id {investment_id} not found"
        )
    
    # Update only provided fields
    update_data = investment_update.model_dump(exclude_unset=True)
    
    # Check if symbol is being changed and if new symbol already exists
    if "symbol" in update_data and update_data["symbol"] != investment.symbol:
        existing = db.query(Investment).filter(Investment.symbol == update_data["symbol"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Investment with symbol {update_data['symbol']} already exists"
            )
    
    for field, value in update_data.items():
        setattr(investment, field, value)
    
    db.commit()
    db.refresh(investment)
    return investment


@router.delete("/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment(
    investment_id: int,
    db: Session = Depends(get_db)
):
    """Delete investment."""
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investment with id {investment_id} not found"
        )
    
    db.delete(investment)
    db.commit()
    return None

