"""
Unit tests for AssetRepository
"""

import pytest
from sqlalchemy.orm import Session

from app.repositories.asset_repository import AssetRepository
from app.models.asset import Asset


@pytest.fixture
def asset_repo():
    """Create asset repository instance."""
    return AssetRepository()


@pytest.mark.unit
class TestAssetRepository:
    """Test suite for AssetRepository."""
    
    def test_create_asset(self, test_db: Session, asset_repo: AssetRepository, sample_asset_data):
        """Test creating a new asset."""
        asset = asset_repo.create(test_db, sample_asset_data)
        
        assert asset.id is not None
        assert asset.name == sample_asset_data["name"]
        assert asset.category == sample_asset_data["category"]
        assert asset.value == sample_asset_data["value"]
    
    def test_get_asset(self, test_db: Session, asset_repo: AssetRepository, create_asset):
        """Test retrieving an asset by ID."""
        asset = create_asset(name="Savings Account", value=10000.00)
        
        retrieved = asset_repo.get(test_db, asset.id)
        
        assert retrieved is not None
        assert retrieved.id == asset.id
        assert retrieved.name == "Savings Account"
        assert retrieved.value == 10000.00
    
    def test_get_all_assets(self, test_db: Session, asset_repo: AssetRepository, create_asset):
        """Test retrieving all assets."""
        create_asset(name="Asset 1", value=1000.00)
        create_asset(name="Asset 2", value=2000.00)
        create_asset(name="Asset 3", value=3000.00)
        
        assets = asset_repo.get_all(test_db)
        
        assert len(assets) == 3
        assert sum(a.value for a in assets) == 6000.00
    
    def test_get_by_category(self, test_db: Session, asset_repo: AssetRepository, create_asset):
        """Test retrieving assets by category."""
        create_asset(name="Checking", category="cash_accounts", value=5000.00)
        create_asset(name="Savings", category="cash_accounts", value=10000.00)
        create_asset(name="401k", category="retirement", value=50000.00)
        
        cash_assets = asset_repo.get_by_category(test_db, "cash_accounts")
        
        assert len(cash_assets) == 2
        assert all(a.category == "cash_accounts" for a in cash_assets)
        assert sum(a.value for a in cash_assets) == 15000.00
    
    def test_update_asset(self, test_db: Session, asset_repo: AssetRepository, create_asset):
        """Test updating an asset."""
        asset = create_asset(name="Old Name", value=1000.00)
        
        updated = asset_repo.update(test_db, asset.id, {
            "name": "New Name",
            "value": 2000.00
        })
        
        assert updated is not None
        assert updated.name == "New Name"
        assert updated.value == 2000.00
    
    def test_delete_asset(self, test_db: Session, asset_repo: AssetRepository, create_asset):
        """Test deleting an asset."""
        asset = create_asset(name="To Delete")
        asset_id = asset.id
        
        result = asset_repo.delete(test_db, asset_id)
        
        assert result is True
        assert asset_repo.get(test_db, asset_id) is None
    
    def test_get_total_value(self, test_db: Session, asset_repo: AssetRepository, create_asset):
        """Test calculating total asset value."""
        create_asset(value=1000.00)
        create_asset(value=2000.00)
        create_asset(value=3000.00)
        
        total = asset_repo.get_total_value(test_db)
        
        assert total == 6000.00
    
    def test_get_total_value_empty(self, test_db: Session, asset_repo: AssetRepository):
        """Test total value with no assets."""
        total = asset_repo.get_total_value(test_db)
        
        assert total == 0.0
    
    def test_get_value_by_category(self, test_db: Session, asset_repo: AssetRepository, create_asset):
        """Test getting total value grouped by category."""
        create_asset(category="cash_accounts", value=5000.00)
        create_asset(category="cash_accounts", value=3000.00)
        create_asset(category="retirement", value=50000.00)
        create_asset(category="investment", value=10000.00)
        
        by_category = asset_repo.get_value_by_category(test_db)
        
        assert by_category["cash_accounts"] == 8000.00
        assert by_category["retirement"] == 50000.00
        assert by_category["investment"] == 10000.00
    
    def test_get_count(self, test_db: Session, asset_repo: AssetRepository, create_asset):
        """Test counting assets."""
        create_asset()
        create_asset()
        create_asset()
        
        count = asset_repo.get_count(test_db)
        
        assert count == 3
    
    def test_get_count_empty(self, test_db: Session, asset_repo: AssetRepository):
        """Test count with no assets."""
        count = asset_repo.get_count(test_db)
        
        assert count == 0

