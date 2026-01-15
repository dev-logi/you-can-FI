"""
Spending Schemas

Pydantic models for spending and cash flow analytics.
"""

from datetime import date
from typing import Optional, List
from pydantic import BaseModel


class CategorySpending(BaseModel):
    """Spending for a single category."""
    category: str
    display_name: str
    amount: float
    percentage: float
    transaction_count: int
    icon: str = "💳"


class SpendingSummaryResponse(BaseModel):
    """Summary of spending for a time period."""
    start_date: date
    end_date: date
    
    total_spending: float
    total_income: float
    net_cash_flow: float
    
    # Comparison to previous period
    previous_period_spending: Optional[float] = None
    spending_change_percent: Optional[float] = None
    
    # Category breakdown
    categories: List[CategorySpending]
    
    # Counts
    transaction_count: int
    category_count: int


class CategoryDetailResponse(BaseModel):
    """Detailed spending for a specific category."""
    category: str
    display_name: str
    
    # Current period
    current_amount: float
    current_transaction_count: int
    
    # Trend (past 6 months)
    monthly_trend: List["MonthlyAmount"]
    
    # Sub-categories (if available)
    sub_categories: List["SubCategorySpending"]


class MonthlyAmount(BaseModel):
    """Amount for a specific month."""
    month: str  # "2026-01"
    amount: float
    transaction_count: int


class SubCategorySpending(BaseModel):
    """Spending for a sub-category."""
    category: str
    display_name: str
    amount: float
    percentage: float
    transaction_count: int


class CashFlowSummaryResponse(BaseModel):
    """Cash flow summary for a time period."""
    start_date: date
    end_date: date
    
    # Summary
    total_income: float
    total_expenses: float
    net_cash_flow: float
    savings_rate: float  # percentage of income saved
    
    # Top income sources
    income_sources: List["IncomeSource"]
    
    # Monthly history
    monthly_history: List["MonthlyCashFlow"]


class IncomeSource(BaseModel):
    """An income source."""
    name: str
    amount: float
    transaction_count: int


class MonthlyCashFlow(BaseModel):
    """Cash flow for a single month."""
    month: str  # "2026-01"
    income: float
    expenses: float
    net: float
    savings_rate: float


class RecurringTransaction(BaseModel):
    """A detected recurring transaction (subscription/bill)."""
    merchant_name: str
    category: Optional[str] = None
    display_name: Optional[str] = None
    average_amount: float
    frequency: str  # "monthly", "weekly", "yearly", etc.
    last_date: date
    next_expected_date: Optional[date] = None
    transaction_count: int
    is_subscription: bool = False  # True if appears to be a subscription


class RecurringTransactionsResponse(BaseModel):
    """Response for recurring transactions."""
    recurring: List[RecurringTransaction]
    estimated_monthly_total: float
    count: int


# Update forward references
CategoryDetailResponse.model_rebuild()
CashFlowSummaryResponse.model_rebuild()
