"""
Unit tests for LiabilityRepository
"""

import pytest
from sqlalchemy.orm import Session

from app.repositories.liability_repository import LiabilityRepository
from app.models.liability import Liability


@pytest.fixture
def liability_repo():
    """Create liability repository instance."""
    return LiabilityRepository()


@pytest.mark.unit
class TestLiabilityRepository:
    """Test suite for LiabilityRepository."""
    
    def test_create_liability(self, test_db: Session, liability_repo: LiabilityRepository, sample_liability_data):
        """Test creating a new liability."""
        liability = liability_repo.create(test_db, sample_liability_data)
        
        assert liability.id is not None
        assert liability.name == sample_liability_data["name"]
        assert liability.category == sample_liability_data["category"]
        assert liability.balance == sample_liability_data["balance"]
    
    def test_get_liability(self, test_db: Session, liability_repo: LiabilityRepository, create_liability):
        """Test retrieving a liability by ID."""
        liability = create_liability(name="Credit Card", balance=5000.00)
        
        retrieved = liability_repo.get(test_db, liability.id)
        
        assert retrieved is not None
        assert retrieved.id == liability.id
        assert retrieved.name == "Credit Card"
        assert retrieved.balance == 5000.00
    
    def test_get_all_liabilities(self, test_db: Session, liability_repo: LiabilityRepository, create_liability):
        """Test retrieving all liabilities."""
        create_liability(name="Liability 1", balance=1000.00)
        create_liability(name="Liability 2", balance=2000.00)
        create_liability(name="Liability 3", balance=3000.00)
        
        liabilities = liability_repo.get_all(test_db)
        
        assert len(liabilities) == 3
        assert sum(l.balance for l in liabilities) == 6000.00
    
    def test_get_by_category(self, test_db: Session, liability_repo: LiabilityRepository, create_liability):
        """Test retrieving liabilities by category."""
        create_liability(name="Card 1", category="credit_card", balance=2000.00)
        create_liability(name="Card 2", category="credit_card", balance=3000.00)
        create_liability(name="Mortgage", category="mortgage", balance=200000.00)
        
        credit_cards = liability_repo.get_by_category(test_db, "credit_card")
        
        assert len(credit_cards) == 2
        assert all(l.category == "credit_card" for l in credit_cards)
        assert sum(l.balance for l in credit_cards) == 5000.00
    
    def test_update_liability(self, test_db: Session, liability_repo: LiabilityRepository, create_liability):
        """Test updating a liability."""
        liability = create_liability(name="Old Name", balance=1000.00)
        
        updated = liability_repo.update(test_db, liability.id, {
            "name": "New Name",
            "balance": 2000.00
        })
        
        assert updated is not None
        assert updated.name == "New Name"
        assert updated.balance == 2000.00
    
    def test_delete_liability(self, test_db: Session, liability_repo: LiabilityRepository, create_liability):
        """Test deleting a liability."""
        liability = create_liability(name="To Delete")
        liability_id = liability.id
        
        result = liability_repo.delete(test_db, liability_id)
        
        assert result is True
        assert liability_repo.get(test_db, liability_id) is None
    
    def test_get_total_balance(self, test_db: Session, liability_repo: LiabilityRepository, create_liability):
        """Test calculating total liability balance."""
        create_liability(balance=1000.00)
        create_liability(balance=2000.00)
        create_liability(balance=3000.00)
        
        total = liability_repo.get_total_balance(test_db)
        
        assert total == 6000.00
    
    def test_get_total_balance_empty(self, test_db: Session, liability_repo: LiabilityRepository):
        """Test total balance with no liabilities."""
        total = liability_repo.get_total_balance(test_db)
        
        assert total == 0.0
    
    def test_get_balance_by_category(self, test_db: Session, liability_repo: LiabilityRepository, create_liability):
        """Test getting total balance grouped by category."""
        create_liability(category="credit_card", balance=5000.00)
        create_liability(category="credit_card", balance=3000.00)
        create_liability(category="mortgage", balance=200000.00)
        create_liability(category="auto_loan", balance=15000.00)
        
        by_category = liability_repo.get_balance_by_category(test_db)
        
        assert by_category["credit_card"] == 8000.00
        assert by_category["mortgage"] == 200000.00
        assert by_category["auto_loan"] == 15000.00
    
    def test_get_weighted_interest_rate(self, test_db: Session, liability_repo: LiabilityRepository, create_liability):
        """Test calculating weighted average interest rate."""
        # Card 1: $5000 at 18% = $900
        create_liability(balance=5000.00, interest_rate=0.18)
        # Card 2: $10000 at 15% = $1500
        create_liability(balance=10000.00, interest_rate=0.15)
        # Total: $15000, weighted sum: $2400, avg: 16%
        
        weighted_rate = liability_repo.get_weighted_interest_rate(test_db)
        
        assert abs(weighted_rate - 0.16) < 0.001  # Allow for floating point precision
    
    def test_get_weighted_interest_rate_no_liabilities(self, test_db: Session, liability_repo: LiabilityRepository):
        """Test weighted rate with no liabilities."""
        rate = liability_repo.get_weighted_interest_rate(test_db)
        
        assert rate == 0.0
    
    def test_get_weighted_interest_rate_with_none(self, test_db: Session, liability_repo: LiabilityRepository, create_liability):
        """Test weighted rate with some None interest rates."""
        create_liability(balance=5000.00, interest_rate=0.10)
        create_liability(balance=5000.00, interest_rate=None)
        
        # Should only count the first one: 5000 * 0.10 / 10000 = 0.05
        rate = liability_repo.get_weighted_interest_rate(test_db)
        
        assert abs(rate - 0.05) < 0.001
    
    def test_get_count(self, test_db: Session, liability_repo: LiabilityRepository, create_liability):
        """Test counting liabilities."""
        create_liability()
        create_liability()
        create_liability()
        
        count = liability_repo.get_count(test_db)
        
        assert count == 3
    
    def test_get_count_empty(self, test_db: Session, liability_repo: LiabilityRepository):
        """Test count with no liabilities."""
        count = liability_repo.get_count(test_db)
        
        assert count == 0

