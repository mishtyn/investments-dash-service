from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.database import get_db
from app.models.investment import Investment, InvestmentType
from app.schemas.investment import InvestmentCreate, InvestmentUpdate, InvestmentResponse

router = APIRouter()


@router.get("/", response_model=List[InvestmentResponse])
def get_investments(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    investment_type: Optional[InvestmentType] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get all investments with optional filtering."""
    query = db.query(Investment)
    
    if user_id:
        query = query.filter(Investment.user_id == user_id)
    if investment_type:
        query = query.filter(Investment.investment_type == investment_type)
    if start_date:
        query = query.filter(Investment.purchase_date >= start_date)
    if end_date:
        query = query.filter(Investment.purchase_date <= end_date)
    
    investments = query.order_by(Investment.purchase_date.desc()).offset(skip).limit(limit).all()
    return investments


@router.get("/analytics/overview")
def get_portfolio_overview(
    user_id: Optional[int] = None,
    investment_type: Optional[InvestmentType] = None,
    db: Session = Depends(get_db)
):
    """Get portfolio overview with summary statistics."""
    query = db.query(Investment)
    
    if user_id:
        query = query.filter(Investment.user_id == user_id)
    if investment_type:
        query = query.filter(Investment.investment_type == investment_type)
    
    investments = query.all()
    
    total_invested = sum(inv.purchase_price * inv.amount for inv in investments)
    total_current_value = sum(
        (inv.current_price or inv.purchase_price) * inv.amount 
        for inv in investments
    )
    total_profit_loss = total_current_value - total_invested
    profit_loss_percentage = (total_profit_loss / total_invested * 100) if total_invested > 0 else 0
    
    # Group by investment type
    by_type = {}
    for inv in investments:
        type_key = inv.investment_type.value
        if type_key not in by_type:
            by_type[type_key] = {
                "count": 0,
                "invested": 0,
                "current_value": 0,
                "profit_loss": 0
            }
        
        invested = inv.purchase_price * inv.amount
        current = (inv.current_price or inv.purchase_price) * inv.amount
        
        by_type[type_key]["count"] += 1
        by_type[type_key]["invested"] += invested
        by_type[type_key]["current_value"] += current
        by_type[type_key]["profit_loss"] += current - invested
    
    return {
        "total_investments": len(investments),
        "total_invested": round(total_invested, 2),
        "total_current_value": round(total_current_value, 2),
        "total_profit_loss": round(total_profit_loss, 2),
        "profit_loss_percentage": round(profit_loss_percentage, 2),
        "by_type": by_type
    }


@router.get("/analytics/earnings")
def get_earnings_analysis(
    user_id: Optional[int] = None,
    investment_type: Optional[InvestmentType] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    aggregate_by: str = Query("month", regex="^(day|week|month|year)$"),
    db: Session = Depends(get_db)
):
    """Get earnings analysis with time-based aggregation."""
    query = db.query(Investment)
    
    if user_id:
        query = query.filter(Investment.user_id == user_id)
    if investment_type:
        query = query.filter(Investment.investment_type == investment_type)
    if start_date:
        query = query.filter(Investment.purchase_date >= start_date)
    if end_date:
        query = query.filter(Investment.purchase_date <= end_date)
    
    investments = query.order_by(Investment.purchase_date).all()
    
    # Aggregate by time period
    aggregated = {}
    
    for inv in investments:
        if aggregate_by == "day":
            key = inv.purchase_date.isoformat()
        elif aggregate_by == "week":
            # Get year and week number
            year, week, _ = inv.purchase_date.isocalendar()
            key = f"{year}-W{week:02d}"
        elif aggregate_by == "month":
            key = inv.purchase_date.strftime("%Y-%m")
        else:  # year
            key = str(inv.purchase_date.year)
        
        if key not in aggregated:
            aggregated[key] = {
                "date": key,
                "invested": 0,
                "current_value": 0,
                "profit_loss": 0,
                "count": 0
            }
        
        invested = inv.purchase_price * inv.amount
        current = (inv.current_price or inv.purchase_price) * inv.amount
        
        aggregated[key]["invested"] += invested
        aggregated[key]["current_value"] += current
        aggregated[key]["profit_loss"] += current - invested
        aggregated[key]["count"] += 1
    
    # Convert to list and sort
    result = sorted(aggregated.values(), key=lambda x: x["date"])
    
    # Round values
    for item in result:
        item["invested"] = round(item["invested"], 2)
        item["current_value"] = round(item["current_value"], 2)
        item["profit_loss"] = round(item["profit_loss"], 2)
    
    return result


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

