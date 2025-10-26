from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case

from app.database import get_db
from app.models.investment import Investment, InvestmentType
from app.schemas.investment import (
    InvestmentCreate, 
    InvestmentUpdate, 
    InvestmentResponse,
    InvestmentSell,
    AvailablePosition
)

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
    """Get portfolio overview with summary statistics.
    
    Calculates portfolio value using net positions (buys - sells).
    Shows current holdings and their performance.
    """
    # Use optimized SQL query with grouping by symbol
    query = (
        db.query(
            Investment.symbol,
            Investment.investment_type,
            func.sum(Investment.amount).label("net_amount"),
            func.sum(
                case(
                    (Investment.amount > 0, Investment.amount * Investment.purchase_price),
                    else_=0
                )
            ).label("total_bought_value"),
            func.max(Investment.current_price).label("current_price"),
        )
        .group_by(Investment.symbol, Investment.investment_type)
    )

    if user_id:
        query = query.filter(Investment.user_id == user_id)
    if investment_type:
        query = query.filter(Investment.investment_type == investment_type)
    
    positions = query.all()
    
    # Calculate totals
    total_invested = 0
    total_current_value = 0
    active_positions = 0
    by_type = {}
    
    for pos in positions:
        net_amount = pos.net_amount
        
        # Only count positions that still exist (net_amount > 0)
        if net_amount > 0:
            # Calculate proportional invested amount for remaining position
            avg_purchase_price = pos.total_bought_value / net_amount if net_amount > 0 else 0
            position_invested = avg_purchase_price * net_amount
            
            current_price = pos.current_price or avg_purchase_price
            position_current_value = current_price * net_amount
            
            total_invested += position_invested
            total_current_value += position_current_value
            active_positions += 1
            
            # Group by type
            type_key = pos.investment_type.value
            if type_key not in by_type:
                by_type[type_key] = {
                    "count": 0,
                    "invested": 0,
                    "current_value": 0,
                    "profit_loss": 0
                }
            
            by_type[type_key]["count"] += 1
            by_type[type_key]["invested"] += position_invested
            by_type[type_key]["current_value"] += position_current_value
            by_type[type_key]["profit_loss"] += position_current_value - position_invested
    
    total_profit_loss = total_current_value - total_invested
    profit_loss_percentage = (total_profit_loss / total_invested * 100) if total_invested > 0 else 0
    
    return {
        "total_investments": active_positions,
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
    """Get cumulative earnings analysis with time-based aggregation.
    
    Shows portfolio value over time considering buys (positive amount) and sells (negative amount).
    Each point represents the total value of all net positions up to that period.
    """
    # Build base query with filters
    query = db.query(Investment)
    
    if user_id:
        query = query.filter(Investment.user_id == user_id)
    if investment_type:
        query = query.filter(Investment.investment_type == investment_type)
    
    # Get all investments sorted by purchase date
    investments = query.order_by(Investment.purchase_date).all()
    
    if not investments:
        return []
    
    # Helper function to get period key
    def get_period_key(purchase_date, aggregate_by):
        if aggregate_by == "day":
            return purchase_date.isoformat()
        elif aggregate_by == "week":
            year, week, _ = purchase_date.isocalendar()
            return f"{year}-W{week:02d}"
        elif aggregate_by == "month":
            return purchase_date.strftime("%Y-%m")
        else:  # year
            return str(purchase_date.year)
    
    # Group investments by their purchase period
    investments_by_period = {}
    for inv in investments:
        key = get_period_key(inv.purchase_date, aggregate_by)
        if key not in investments_by_period:
            investments_by_period[key] = []
        investments_by_period[key].append(inv)
    
    # Sort period keys
    sorted_periods = sorted(investments_by_period.keys())
    
    # Apply date range filter to display periods if specified
    if start_date:
        start_key = get_period_key(start_date, aggregate_by)
        sorted_periods = [p for p in sorted_periods if p >= start_key]
    if end_date:
        end_key = get_period_key(end_date, aggregate_by)
        sorted_periods = [p for p in sorted_periods if p <= end_key]
    
    # Track positions by symbol: {symbol: {net_amount, total_bought_value, current_price}}
    positions = {}
    
    # Process all transactions before start_date
    if start_date and sorted_periods:
        for period_key in sorted(investments_by_period.keys()):
            if period_key < sorted_periods[0]:
                for inv in investments_by_period[period_key]:
                    if inv.symbol not in positions:
                        positions[inv.symbol] = {
                            "net_amount": 0,
                            "total_bought_value": 0,
                            "current_price": inv.current_price
                        }
                    
                    positions[inv.symbol]["net_amount"] += inv.amount
                    if inv.amount > 0:  # Only count buys for cost basis
                        positions[inv.symbol]["total_bought_value"] += inv.amount * inv.purchase_price
                    
                    if inv.current_price:
                        positions[inv.symbol]["current_price"] = inv.current_price
    
    # Build cumulative data for each period
    result = []
    
    for period_key in sorted_periods:
        # Process transactions in this period
        if period_key in investments_by_period:
            for inv in investments_by_period[period_key]:
                if inv.symbol not in positions:
                    positions[inv.symbol] = {
                        "net_amount": 0,
                        "total_bought_value": 0,
                        "current_price": inv.current_price
                    }
                
                positions[inv.symbol]["net_amount"] += inv.amount
                if inv.amount > 0:  # Only count buys for cost basis
                    positions[inv.symbol]["total_bought_value"] += inv.amount * inv.purchase_price
                
                if inv.current_price:
                    positions[inv.symbol]["current_price"] = inv.current_price
        
        # Calculate cumulative totals based on current net positions
        cumulative_invested = 0
        cumulative_current_value = 0
        cumulative_count = 0
        
        for symbol, pos in positions.items():
            net_amount = pos["net_amount"]
            
            if net_amount > 0:  # Only count active positions
                # Calculate proportional cost basis for remaining position
                avg_purchase_price = pos["total_bought_value"] / net_amount if net_amount > 0 else 0
                position_invested = avg_purchase_price * net_amount
                
                current_price = pos["current_price"] or avg_purchase_price
                position_current_value = current_price * net_amount
                
                cumulative_invested += position_invested
                cumulative_current_value += position_current_value
                cumulative_count += 1
        
        profit_loss = cumulative_current_value - cumulative_invested
        
        result.append({
            "date": period_key,
            "invested": round(cumulative_invested, 2),
            "current_value": round(cumulative_current_value, 2),
            "profit_loss": round(profit_loss, 2),
            "count": cumulative_count
        })
    
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


@router.get("/analytics/available-positions", response_model=List[AvailablePosition])
def get_available_positions(
    user_id: Optional[int] = None,
    investment_type: Optional[InvestmentType] = None,
    db: Session = Depends(get_db)
):
    """Get available positions that can be sold.
    
    Calculates net position by summing all amounts (positive buys + negative sells).
    Only returns positions where net amount > 0.
    Uses optimized SQL query with grouping.
    """
    # Build query with GROUP BY for optimal performance
    query = db.query(
        Investment.symbol,
        Investment.name,
        Investment.investment_type,
        func.sum(Investment.amount).label('net_amount'),
        func.sum(Investment.amount * Investment.purchase_price).label('total_invested'),
        func.max(Investment.current_price).label('current_price')
    ).group_by(
        Investment.symbol,
        Investment.name, 
        Investment.investment_type
    ).having(func.sum(Investment.amount) > 0)
    
    if user_id:
        query = query.filter(Investment.user_id == user_id)
    if investment_type:
        query = query.filter(Investment.investment_type == investment_type)
    
    positions = query.all()
    
    result = []
    for pos in positions:
        net_amount = pos.net_amount
        total_invested = pos.total_invested
        average_purchase_price = total_invested / net_amount if net_amount > 0 else 0
        current_price = pos.current_price or average_purchase_price
        total_current_value = current_price * net_amount
        unrealized_profit_loss = total_current_value - total_invested
        
        result.append(AvailablePosition(
            symbol=pos.symbol,
            name=pos.name,
            investment_type=pos.investment_type,
            available_amount=round(net_amount, 6),
            average_purchase_price=round(average_purchase_price, 2),
            current_price=current_price,
            total_invested=round(total_invested, 2),
            total_current_value=round(total_current_value, 2),
            unrealized_profit_loss=round(unrealized_profit_loss, 2)
        ))
    
    return result


@router.post("/sell", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
def sell_investment(
    sell_data: InvestmentSell,
    db: Session = Depends(get_db)
):
    """Sell investment with validation.
    
    Validates that sufficient amount is available before creating sell transaction.
    Stores sale as negative amount in the same Investment table.
    """
    # Calculate available amount using optimized SQL query
    query = db.query(func.sum(Investment.amount)).filter(
        Investment.symbol == sell_data.symbol
    )
    
    if sell_data.user_id:
        query = query.filter(Investment.user_id == sell_data.user_id)
    
    available_amount = query.scalar() or 0
    
    if available_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No investment found with symbol {sell_data.symbol}"
        )
    
    if available_amount < sell_data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient amount to sell. Available: {available_amount}, Requested: {sell_data.amount}"
        )
    
    # Get name and investment_type from existing records
    reference_inv = db.query(Investment).filter(
        Investment.symbol == sell_data.symbol
    ).first()
    
    if not reference_inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investment with symbol {sell_data.symbol} not found"
        )
    
    # Create sell transaction with NEGATIVE amount
    db_investment = Investment(
        user_id=sell_data.user_id,
        name=reference_inv.name,
        symbol=sell_data.symbol,
        investment_type=reference_inv.investment_type,
        amount=-abs(sell_data.amount),  # Store as negative
        purchase_price=sell_data.sale_price,
        purchase_date=sell_data.sale_date,
        description=sell_data.description,
        current_price=None  # No current price for sell transactions
    )
    
    db.add(db_investment)
    db.commit()
    db.refresh(db_investment)
    
    return db_investment

