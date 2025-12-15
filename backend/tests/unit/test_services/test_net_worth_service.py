"""
Unit tests for NetWorthService
"""

import pytest
from sqlalchemy.orm import Session

from app.services.net_worth_service import NetWorthService


@pytest.fixture
def net_worth_service():
    """Create net worth service instance."""
    return NetWorthService()


@pytest.mark.unit
class TestNetWorthService:
    """Test suite for NetWorthService."""
    
    def test_calculate_empty(self, test_db: Session, net_worth_service: NetWorthService):
        """Test calculation with no assets or liabilities."""
        summary = net_worth_service.calculate(test_db)
        
        assert summary.total_assets == 0.0
        assert summary.total_liabilities == 0.0
        assert summary.net_worth == 0.0
        assert len(summary.asset_breakdown) == 0
        assert len(summary.liability_breakdown) == 0
    
    def test_calculate_assets_only(
        self, 
        test_db: Session, 
        net_worth_service: NetWorthService, 
        create_asset
    ):
        """Test calculation with only assets."""
        create_asset(name="Checking", category="cash_accounts", value=5000.00)
        create_asset(name="Savings", category="cash_accounts", value=10000.00)
        create_asset(name="401k", category="retirement", value=50000.00)
        
        summary = net_worth_service.calculate(test_db)
        
        assert summary.total_assets == 65000.00
        assert summary.total_liabilities == 0.0
        assert summary.net_worth == 65000.00
        assert len(summary.asset_breakdown) == 2  # 2 categories
        assert summary.assets_by_category["cash_accounts"] == 15000.00
        assert summary.assets_by_category["retirement"] == 50000.00
    
    def test_calculate_liabilities_only(
        self, 
        test_db: Session, 
        net_worth_service: NetWorthService, 
        create_liability
    ):
        """Test calculation with only liabilities."""
        create_liability(name="Credit Card", category="credit_card", balance=5000.00)
        create_liability(name="Auto Loan", category="auto_loan", balance=15000.00)
        create_liability(name="Mortgage", category="mortgage", balance=200000.00)
        
        summary = net_worth_service.calculate(test_db)
        
        assert summary.total_assets == 0.0
        assert summary.total_liabilities == 220000.00
        assert summary.net_worth == -220000.00
        assert len(summary.liability_breakdown) == 3
    
    def test_calculate_full_picture(
        self, 
        test_db: Session, 
        net_worth_service: NetWorthService, 
        create_asset,
        create_liability
    ):
        """Test calculation with both assets and liabilities."""
        # Assets
        create_asset(category="cash_accounts", value=10000.00)
        create_asset(category="retirement", value=100000.00)
        create_asset(category="investment", value=50000.00)
        
        # Liabilities
        create_liability(category="credit_card", balance=5000.00)
        create_liability(category="mortgage", balance=250000.00)
        
        summary = net_worth_service.calculate(test_db)
        
        assert summary.total_assets == 160000.00
        assert summary.total_liabilities == 255000.00
        assert summary.net_worth == -95000.00  # 160k - 255k
    
    def test_asset_breakdown(
        self, 
        test_db: Session, 
        net_worth_service: NetWorthService, 
        create_asset
    ):
        """Test asset breakdown calculations."""
        create_asset(category="cash_accounts", value=10000.00)
        create_asset(category="retirement", value=40000.00)
        create_asset(category="investment", value=50000.00)
        
        summary = net_worth_service.calculate(test_db)
        
        assert len(summary.asset_breakdown) == 3
        
        # Should be sorted by value (descending)
        assert summary.asset_breakdown[0].category == "investment"
        assert summary.asset_breakdown[0].value == 50000.00
        assert summary.asset_breakdown[0].percentage == 50.0  # 50k/100k
        
        assert summary.asset_breakdown[1].category == "retirement"
        assert summary.asset_breakdown[1].percentage == 40.0
        
        assert summary.asset_breakdown[2].category == "cash_accounts"
        assert summary.asset_breakdown[2].percentage == 10.0
    
    def test_liability_breakdown(
        self, 
        test_db: Session, 
        net_worth_service: NetWorthService, 
        create_liability
    ):
        """Test liability breakdown calculations."""
        create_liability(category="credit_card", balance=2000.00)
        create_liability(category="auto_loan", balance=18000.00)
        create_liability(category="mortgage", balance=180000.00)
        
        summary = net_worth_service.calculate(test_db)
        
        assert len(summary.liability_breakdown) == 3
        
        # Should be sorted by value (descending)
        assert summary.liability_breakdown[0].category == "mortgage"
        assert summary.liability_breakdown[0].value == 180000.00
        assert summary.liability_breakdown[0].percentage == 90.0  # 180k/200k
        
        assert summary.liability_breakdown[1].category == "auto_loan"
        assert summary.liability_breakdown[1].percentage == 9.0
        
        assert summary.liability_breakdown[2].category == "credit_card"
        assert summary.liability_breakdown[2].percentage == 1.0
    
    def test_breakdown_has_labels(
        self, 
        test_db: Session, 
        net_worth_service: NetWorthService, 
        create_asset,
        create_liability
    ):
        """Test that breakdowns include user-friendly labels."""
        create_asset(category="cash_accounts", value=10000.00)
        create_liability(category="credit_card", balance=5000.00)
        
        summary = net_worth_service.calculate(test_db)
        
        # Labels should be present (might be same as category if not in CATEGORY_INFO)
        assert summary.asset_breakdown[0].label is not None
        assert len(summary.asset_breakdown[0].label) > 0
        
        assert summary.liability_breakdown[0].label is not None
        assert len(summary.liability_breakdown[0].label) > 0
    
    def test_breakdown_has_colors(
        self, 
        test_db: Session, 
        net_worth_service: NetWorthService, 
        create_asset,
        create_liability
    ):
        """Test that breakdowns include colors for charts."""
        create_asset(category="cash_accounts", value=10000.00)
        create_liability(category="credit_card", balance=5000.00)
        
        summary = net_worth_service.calculate(test_db)
        
        assert summary.asset_breakdown[0].color is not None
        assert summary.asset_breakdown[0].color.startswith("#")
        
        assert summary.liability_breakdown[0].color is not None
        assert summary.liability_breakdown[0].color.startswith("#")
    
    def test_breakdown_excludes_zero_values(
        self, 
        test_db: Session, 
        net_worth_service: NetWorthService, 
        create_asset
    ):
        """Test that categories with zero values are excluded from breakdown."""
        create_asset(category="cash_accounts", value=10000.00)
        create_asset(category="retirement", value=0.00)  # Should be excluded
        
        summary = net_worth_service.calculate(test_db)
        
        # Should only have 1 category in breakdown
        assert len(summary.asset_breakdown) == 1
        assert summary.asset_breakdown[0].category == "cash_accounts"

