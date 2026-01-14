"""
Spending API Routes

Handles spending analytics and cash flow endpoints.
"""

from datetime import date, datetime, timedelta
from typing import Optional
from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract

from app.database import get_db
from app.auth import get_current_user
from app.models.transaction import Transaction
from app.schemas.spending import (
    SpendingSummaryResponse,
    CategorySpending,
    CashFlowSummaryResponse,
    IncomeSource,
    MonthlyCashFlow,
    CategoryDetailResponse,
    MonthlyAmount,
    SubCategorySpending,
)

router = APIRouter()

# Category display names and icons
CATEGORY_INFO = {
    'INCOME': {'display': 'Income', 'icon': '💰'},
    'TRANSFER_IN': {'display': 'Transfers In', 'icon': '↩️'},
    'TRANSFER_OUT': {'display': 'Transfers Out', 'icon': '↪️'},
    'LOAN_PAYMENTS': {'display': 'Loan Payments', 'icon': '🏦'},
    'BANK_FEES': {'display': 'Bank Fees', 'icon': '🏛️'},
    'ENTERTAINMENT': {'display': 'Entertainment', 'icon': '🎬'},
    'FOOD_AND_DRINK': {'display': 'Food & Dining', 'icon': '🍔'},
    'GENERAL_MERCHANDISE': {'display': 'Shopping', 'icon': '🛒'},
    'GENERAL_SERVICES': {'display': 'Services', 'icon': '🔧'},
    'GOVERNMENT_AND_NON_PROFIT': {'display': 'Government', 'icon': '🏛️'},
    'HOME_IMPROVEMENT': {'display': 'Home Improvement', 'icon': '🏠'},
    'MEDICAL': {'display': 'Healthcare', 'icon': '🏥'},
    'PERSONAL_CARE': {'display': 'Personal Care', 'icon': '💅'},
    'RENT_AND_UTILITIES': {'display': 'Housing & Utilities', 'icon': '🏠'},
    'TRANSPORTATION': {'display': 'Transportation', 'icon': '🚗'},
    'TRAVEL': {'display': 'Travel', 'icon': '✈️'},
    'OTHER': {'display': 'Other', 'icon': '📋'},
}


def get_category_info(category: str) -> dict:
    """Get display name and icon for a category."""
    if category in CATEGORY_INFO:
        return CATEGORY_INFO[category]
    # Clean up category name for display
    display = category.replace('_', ' ').title() if category else 'Uncategorized'
    return {'display': display, 'icon': '💳'}


@router.get("/summary", response_model=SpendingSummaryResponse)
def get_spending_summary(
    start_date: Optional[date] = Query(None, description="Start date (defaults to start of current month)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Get spending summary for a time period with category breakdown.
    Defaults to current month if no dates provided.
    """
    # Default to current month
    today = date.today()
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today
    
    # Query transactions for the period
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date <= end_date,
        Transaction.is_hidden == False,
        Transaction.pending == False,
    ).all()
    
    # Separate income and expenses
    # Plaid: positive = expense, negative = income
    total_spending = 0.0
    total_income = 0.0
    category_totals = defaultdict(lambda: {'amount': 0.0, 'count': 0})
    
    for txn in transactions:
        if txn.amount > 0:
            # Expense
            total_spending += txn.amount
            category = txn.user_category or txn.category_primary or 'OTHER'
            category_totals[category]['amount'] += txn.amount
            category_totals[category]['count'] += 1
        else:
            # Income
            total_income += abs(txn.amount)
    
    # Build category breakdown (sorted by amount, descending)
    categories = []
    for cat, data in sorted(category_totals.items(), key=lambda x: x[1]['amount'], reverse=True):
        info = get_category_info(cat)
        percentage = (data['amount'] / total_spending * 100) if total_spending > 0 else 0
        categories.append(CategorySpending(
            category=cat,
            display_name=info['display'],
            amount=round(data['amount'], 2),
            percentage=round(percentage, 1),
            transaction_count=data['count'],
            icon=info['icon'],
        ))
    
    # Calculate previous period for comparison
    period_days = (end_date - start_date).days + 1
    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - timedelta(days=period_days - 1)
    
    prev_transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= prev_start,
        Transaction.date <= prev_end,
        Transaction.is_hidden == False,
        Transaction.pending == False,
        Transaction.amount > 0,  # Only expenses
    ).all()
    
    prev_spending = sum(txn.amount for txn in prev_transactions)
    
    spending_change = None
    if prev_spending > 0:
        spending_change = ((total_spending - prev_spending) / prev_spending) * 100
    
    return SpendingSummaryResponse(
        start_date=start_date,
        end_date=end_date,
        total_spending=round(total_spending, 2),
        total_income=round(total_income, 2),
        net_cash_flow=round(total_income - total_spending, 2),
        previous_period_spending=round(prev_spending, 2) if prev_spending > 0 else None,
        spending_change_percent=round(spending_change, 1) if spending_change is not None else None,
        categories=categories,
        transaction_count=len(transactions),
        category_count=len(categories),
    )


@router.get("/by-category/{category}", response_model=CategoryDetailResponse)
def get_category_detail(
    category: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Get detailed spending for a specific category with trends.
    """
    today = date.today()
    start_date = today.replace(day=1)
    
    # Current month transactions for this category
    current_txns = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date <= today,
        Transaction.is_hidden == False,
        Transaction.pending == False,
        Transaction.amount > 0,
        (Transaction.user_category == category) | (Transaction.category_primary == category)
    ).all()
    
    current_amount = sum(txn.amount for txn in current_txns)
    
    # Get 6 months of history
    six_months_ago = (today - timedelta(days=180)).replace(day=1)
    
    historical_txns = db.query(
        func.to_char(Transaction.date, 'YYYY-MM').label('month'),
        func.sum(Transaction.amount).label('total'),
        func.count(Transaction.id).label('count')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.date >= six_months_ago,
        Transaction.is_hidden == False,
        Transaction.pending == False,
        Transaction.amount > 0,
        (Transaction.user_category == category) | (Transaction.category_primary == category)
    ).group_by(
        func.to_char(Transaction.date, 'YYYY-MM')
    ).order_by(
        func.to_char(Transaction.date, 'YYYY-MM')
    ).all()
    
    monthly_trend = [
        MonthlyAmount(
            month=row.month,
            amount=round(row.total, 2),
            transaction_count=row.count
        )
        for row in historical_txns
    ]
    
    # Sub-category breakdown (using category_detailed)
    sub_cat_totals = defaultdict(lambda: {'amount': 0.0, 'count': 0})
    for txn in current_txns:
        sub = txn.category_detailed or 'Other'
        sub_cat_totals[sub]['amount'] += txn.amount
        sub_cat_totals[sub]['count'] += 1
    
    sub_categories = []
    for sub, data in sorted(sub_cat_totals.items(), key=lambda x: x[1]['amount'], reverse=True):
        percentage = (data['amount'] / current_amount * 100) if current_amount > 0 else 0
        sub_categories.append(SubCategorySpending(
            category=sub,
            display_name=sub.replace('_', ' ').title(),
            amount=round(data['amount'], 2),
            percentage=round(percentage, 1),
            transaction_count=data['count'],
        ))
    
    info = get_category_info(category)
    
    return CategoryDetailResponse(
        category=category,
        display_name=info['display'],
        current_amount=round(current_amount, 2),
        current_transaction_count=len(current_txns),
        monthly_trend=monthly_trend,
        sub_categories=sub_categories,
    )


@router.get("/cashflow", response_model=CashFlowSummaryResponse)
def get_cashflow_summary(
    months: int = Query(6, description="Number of months of history"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Get cash flow summary with income vs expenses breakdown.
    """
    today = date.today()
    start_date = today.replace(day=1)
    end_date = today
    
    # Calculate start of history period
    history_start = (today - timedelta(days=30 * months)).replace(day=1)
    
    # Current month transactions
    current_txns = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date <= end_date,
        Transaction.is_hidden == False,
        Transaction.pending == False,
    ).all()
    
    total_income = sum(abs(txn.amount) for txn in current_txns if txn.amount < 0)
    total_expenses = sum(txn.amount for txn in current_txns if txn.amount > 0)
    net_cash_flow = total_income - total_expenses
    savings_rate = (net_cash_flow / total_income * 100) if total_income > 0 else 0
    
    # Top income sources
    income_by_source = defaultdict(lambda: {'amount': 0.0, 'count': 0})
    for txn in current_txns:
        if txn.amount < 0:  # Income
            source = txn.merchant_name or txn.name
            income_by_source[source]['amount'] += abs(txn.amount)
            income_by_source[source]['count'] += 1
    
    income_sources = [
        IncomeSource(
            name=source,
            amount=round(data['amount'], 2),
            transaction_count=data['count']
        )
        for source, data in sorted(income_by_source.items(), key=lambda x: x[1]['amount'], reverse=True)[:5]
    ]
    
    # Monthly history
    monthly_data = db.query(
        func.to_char(Transaction.date, 'YYYY-MM').label('month'),
        func.sum(func.case((Transaction.amount < 0, func.abs(Transaction.amount)), else_=0)).label('income'),
        func.sum(func.case((Transaction.amount > 0, Transaction.amount), else_=0)).label('expenses'),
    ).filter(
        Transaction.user_id == user_id,
        Transaction.date >= history_start,
        Transaction.is_hidden == False,
        Transaction.pending == False,
    ).group_by(
        func.to_char(Transaction.date, 'YYYY-MM')
    ).order_by(
        func.to_char(Transaction.date, 'YYYY-MM')
    ).all()
    
    monthly_history = []
    for row in monthly_data:
        income = row.income or 0
        expenses = row.expenses or 0
        net = income - expenses
        rate = (net / income * 100) if income > 0 else 0
        monthly_history.append(MonthlyCashFlow(
            month=row.month,
            income=round(income, 2),
            expenses=round(expenses, 2),
            net=round(net, 2),
            savings_rate=round(rate, 1),
        ))
    
    return CashFlowSummaryResponse(
        start_date=start_date,
        end_date=end_date,
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        net_cash_flow=round(net_cash_flow, 2),
        savings_rate=round(savings_rate, 1),
        income_sources=income_sources,
        monthly_history=monthly_history,
    )
