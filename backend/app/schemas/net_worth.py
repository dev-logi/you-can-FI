"""
Net Worth Schemas

Pydantic models for net worth calculations and breakdowns.
"""

from datetime import datetime
from typing import Dict, List
from pydantic import BaseModel


class CategoryBreakdown(BaseModel):
    """Breakdown of value by category."""
    category: str
    label: str
    value: float
    percentage: float
    color: str


class NetWorthSummary(BaseModel):
    """Complete net worth summary."""
    total_assets: float
    total_liabilities: float
    net_worth: float
    assets_by_category: Dict[str, float]
    liabilities_by_category: Dict[str, float]
    asset_breakdown: List[CategoryBreakdown]
    liability_breakdown: List[CategoryBreakdown]
    last_updated: datetime

