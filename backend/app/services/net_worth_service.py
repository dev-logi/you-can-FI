"""
Net Worth Service

Business logic for net worth calculations.
"""

from datetime import datetime
from typing import List
from sqlalchemy.orm import Session

from app.repositories.asset_repository import asset_repository
from app.repositories.liability_repository import liability_repository
from app.schemas.net_worth import NetWorthSummary, CategoryBreakdown
from app.schemas.asset import ASSET_CATEGORY_INFO, AssetCategory
from app.schemas.liability import LIABILITY_CATEGORY_INFO, LiabilityCategory


class NetWorthService:
    """Service for net worth calculations."""
    
    def calculate(self, db: Session) -> NetWorthSummary:
        """Calculate complete net worth summary."""
        total_assets = asset_repository.get_total_value(db)
        total_liabilities = liability_repository.get_total_balance(db)
        net_worth = total_assets - total_liabilities
        
        assets_by_category = asset_repository.get_value_by_category(db)
        liabilities_by_category = liability_repository.get_balance_by_category(db)
        
        asset_breakdown = self._get_asset_breakdown(assets_by_category, total_assets)
        liability_breakdown = self._get_liability_breakdown(liabilities_by_category, total_liabilities)
        
        return NetWorthSummary(
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            net_worth=net_worth,
            assets_by_category=assets_by_category,
            liabilities_by_category=liabilities_by_category,
            asset_breakdown=asset_breakdown,
            liability_breakdown=liability_breakdown,
            last_updated=datetime.utcnow(),
        )
    
    def _get_asset_breakdown(
        self, 
        by_category: dict, 
        total: float
    ) -> List[CategoryBreakdown]:
        """Get asset breakdown for charts."""
        breakdown = []
        
        for category, value in by_category.items():
            if value > 0:
                try:
                    cat_enum = AssetCategory(category)
                    info = ASSET_CATEGORY_INFO.get(cat_enum, {})
                except ValueError:
                    info = {"label": category, "color": "#a0a0a0"}
                
                percentage = (value / total * 100) if total > 0 else 0
                
                breakdown.append(CategoryBreakdown(
                    category=category,
                    label=info.get("label", category),
                    value=value,
                    percentage=round(percentage, 1),
                    color=info.get("color", "#a0a0a0"),
                ))
        
        # Sort by value descending
        breakdown.sort(key=lambda x: x.value, reverse=True)
        return breakdown
    
    def _get_liability_breakdown(
        self, 
        by_category: dict, 
        total: float
    ) -> List[CategoryBreakdown]:
        """Get liability breakdown for charts."""
        breakdown = []
        
        for category, value in by_category.items():
            if value > 0:
                try:
                    cat_enum = LiabilityCategory(category)
                    info = LIABILITY_CATEGORY_INFO.get(cat_enum, {})
                except ValueError:
                    info = {"label": category, "color": "#c7b8b8"}
                
                percentage = (value / total * 100) if total > 0 else 0
                
                breakdown.append(CategoryBreakdown(
                    category=category,
                    label=info.get("label", category),
                    value=value,
                    percentage=round(percentage, 1),
                    color=info.get("color", "#c7b8b8"),
                ))
        
        # Sort by value descending
        breakdown.sort(key=lambda x: x.value, reverse=True)
        return breakdown


# Singleton instance
net_worth_service = NetWorthService()

