"""
Integration tests for Net Worth API endpoints
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestNetWorthAPI:
    """Integration tests for /api/v1/net-worth endpoints."""
    
    def test_get_net_worth_empty(self, client: TestClient):
        """Test GET /net-worth with no data."""
        response = client.get("/api/v1/net-worth/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_assets"] == 0.0
        assert data["total_liabilities"] == 0.0
        assert data["net_worth"] == 0.0
        assert len(data["asset_breakdown"]) == 0
        assert len(data["liability_breakdown"]) == 0
    
    def test_get_net_worth_with_assets(self, client: TestClient, create_asset):
        """Test GET /net-worth with only assets."""
        create_asset(category="cash_accounts", value=10000.00)
        create_asset(category="retirement", value=50000.00)
        create_asset(category="investment", value=25000.00)
        
        response = client.get("/api/v1/net-worth/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_assets"] == 85000.00
        assert data["total_liabilities"] == 0.0
        assert data["net_worth"] == 85000.00
        assert len(data["asset_breakdown"]) == 3
    
    def test_get_net_worth_with_liabilities(self, client: TestClient, create_liability):
        """Test GET /net-worth with only liabilities."""
        create_liability(category="credit_card", balance=5000.00)
        create_liability(category="mortgage", balance=250000.00)
        
        response = client.get("/api/v1/net-worth/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_assets"] == 0.0
        assert data["total_liabilities"] == 255000.00
        assert data["net_worth"] == -255000.00
        assert len(data["liability_breakdown"]) == 2
    
    def test_get_net_worth_complete_picture(
        self, 
        client: TestClient, 
        create_asset,
        create_liability
    ):
        """Test GET /net-worth with both assets and liabilities."""
        # Assets
        create_asset(category="cash_accounts", value=15000.00)
        create_asset(category="retirement", value=100000.00)
        create_asset(category="investment", value=50000.00)
        create_asset(category="real_estate_primary", value=400000.00)
        
        # Liabilities
        create_liability(category="mortgage", balance=300000.00)
        create_liability(category="credit_card", balance=8000.00)
        create_liability(category="auto_loan", balance=20000.00)
        
        response = client.get("/api/v1/net-worth/")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify totals
        assert data["total_assets"] == 565000.00
        assert data["total_liabilities"] == 328000.00
        assert data["net_worth"] == 237000.00
        
        # Verify by-category dictionaries
        assert data["assets_by_category"]["cash_accounts"] == 15000.00
        assert data["assets_by_category"]["retirement"] == 100000.00
        assert data["liabilities_by_category"]["mortgage"] == 300000.00
        
        # Verify breakdowns have required fields
        for breakdown_item in data["asset_breakdown"]:
            assert "category" in breakdown_item
            assert "label" in breakdown_item
            assert "value" in breakdown_item
            assert "percentage" in breakdown_item
            assert "color" in breakdown_item
        
        for breakdown_item in data["liability_breakdown"]:
            assert "category" in breakdown_item
            assert "label" in breakdown_item
            assert "value" in breakdown_item
            assert "percentage" in breakdown_item
            assert "color" in breakdown_item
    
    def test_net_worth_breakdown_percentages(
        self, 
        client: TestClient, 
        create_asset
    ):
        """Test that breakdown percentages add up to 100."""
        create_asset(category="cash_accounts", value=10000.00)
        create_asset(category="retirement", value=40000.00)
        create_asset(category="investment", value=50000.00)
        
        response = client.get("/api/v1/net-worth/")
        
        assert response.status_code == 200
        data = response.json()
        
        total_percentage = sum(item["percentage"] for item in data["asset_breakdown"])
        assert abs(total_percentage - 100.0) < 0.1  # Allow for rounding
    
    def test_net_worth_breakdown_sorted_by_value(
        self, 
        client: TestClient, 
        create_asset
    ):
        """Test that breakdown is sorted by value (descending)."""
        create_asset(category="cash_accounts", value=10000.00)
        create_asset(category="retirement", value=50000.00)
        create_asset(category="investment", value=25000.00)
        
        response = client.get("/api/v1/net-worth/")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be sorted: retirement (50k), investment (25k), cash (10k)
        assert data["asset_breakdown"][0]["category"] == "retirement"
        assert data["asset_breakdown"][1]["category"] == "investment"
        assert data["asset_breakdown"][2]["category"] == "cash_accounts"
    
    def test_net_worth_real_time_updates(
        self, 
        client: TestClient, 
        create_asset
    ):
        """Test that net worth updates when assets change."""
        # Initial state
        asset = create_asset(category="cash_accounts", value=10000.00)
        
        response1 = client.get("/api/v1/net-worth/")
        assert response1.json()["net_worth"] == 10000.00
        
        # Update asset value
        client.put(f"/api/v1/assets/{asset.id}", json={"value": 20000.00})
        
        response2 = client.get("/api/v1/net-worth/")
        assert response2.json()["net_worth"] == 20000.00
        
        # Delete asset
        client.delete(f"/api/v1/assets/{asset.id}")
        
        response3 = client.get("/api/v1/net-worth/")
        assert response3.json()["net_worth"] == 0.0
    
    def test_net_worth_has_timestamp(self, client: TestClient):
        """Test that net worth response includes timestamp."""
        response = client.get("/api/v1/net-worth/")
        
        assert response.status_code == 200
        data = response.json()
        assert "last_updated" in data
        # Verify it's a valid ISO timestamp
        assert "T" in data["last_updated"]

