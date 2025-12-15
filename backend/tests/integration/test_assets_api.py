"""
Integration tests for Asset API endpoints
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestAssetsAPI:
    """Integration tests for /api/v1/assets endpoints."""
    
    def test_create_asset(self, client: TestClient):
        """Test POST /assets - create new asset."""
        asset_data = {
            "name": "Checking Account",
            "category": "cash_accounts",
            "amount": 5000.00,
            "user_id": "test-user",
        }
        
        response = client.post("/api/v1/assets/", json=asset_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == asset_data["name"]
        assert data["category"] == asset_data["category"]
        assert data["value"] == asset_data["amount"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_asset_validation_error(self, client: TestClient):
        """Test creating asset with invalid data."""
        invalid_data = {
            "name": "Test",
            # Missing required fields
        }
        
        response = client.post("/api/v1/assets/", json=invalid_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_list_assets_empty(self, client: TestClient):
        """Test GET /assets with no assets."""
        response = client.get("/api/v1/assets/")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_list_assets(self, client: TestClient, create_asset):
        """Test GET /assets with multiple assets."""
        create_asset(name="Asset 1", value=1000.00)
        create_asset(name="Asset 2", value=2000.00)
        create_asset(name="Asset 3", value=3000.00)
        
        response = client.get("/api/v1/assets/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all("id" in asset for asset in data)
        assert all("name" in asset for asset in data)
    
    def test_list_assets_pagination(self, client: TestClient, create_asset):
        """Test GET /assets with pagination."""
        for i in range(10):
            create_asset(name=f"Asset {i}", value=1000.00)
        
        response = client.get("/api/v1/assets/?skip=0&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
    
    def test_get_asset(self, client: TestClient, create_asset):
        """Test GET /assets/{id} - get single asset."""
        asset = create_asset(name="Test Asset", value=10000.00)
        
        response = client.get(f"/api/v1/assets/{asset.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == asset.id
        assert data["name"] == "Test Asset"
        assert data["value"] == 10000.00
    
    def test_get_asset_not_found(self, client: TestClient):
        """Test GET /assets/{id} with non-existent ID."""
        response = client.get("/api/v1/assets/non-existent-id")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_update_asset(self, client: TestClient, create_asset):
        """Test PUT /assets/{id} - update asset."""
        asset = create_asset(name="Old Name", value=5000.00)
        
        update_data = {
            "name": "New Name",
            "value": 7500.00,
        }
        
        response = client.put(f"/api/v1/assets/{asset.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["value"] == 7500.00
        assert data["id"] == asset.id
    
    def test_update_asset_partial(self, client: TestClient, create_asset):
        """Test partial update of asset."""
        asset = create_asset(name="Original", category="cash_accounts", value=1000.00)
        
        update_data = {"value": 2000.00}  # Only update value
        
        response = client.put(f"/api/v1/assets/{asset.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Original"  # Unchanged
        assert data["category"] == "cash_accounts"  # Unchanged
        assert data["value"] == 2000.00  # Changed
    
    def test_update_asset_not_found(self, client: TestClient):
        """Test updating non-existent asset."""
        response = client.put(
            "/api/v1/assets/non-existent-id",
            json={"name": "Test"}
        )
        
        assert response.status_code == 404
    
    def test_delete_asset(self, client: TestClient, create_asset):
        """Test DELETE /assets/{id}."""
        asset = create_asset(name="To Delete")
        asset_id = asset.id
        
        response = client.delete(f"/api/v1/assets/{asset_id}")
        
        assert response.status_code == 204
        
        # Verify asset is deleted
        get_response = client.get(f"/api/v1/assets/{asset_id}")
        assert get_response.status_code == 404
    
    def test_delete_asset_not_found(self, client: TestClient):
        """Test deleting non-existent asset."""
        response = client.delete("/api/v1/assets/non-existent-id")
        
        assert response.status_code == 404
    
    def test_get_assets_by_category(self, client: TestClient, create_asset):
        """Test GET /assets/category/{category}."""
        create_asset(name="Checking", category="cash_accounts", value=5000.00)
        create_asset(name="Savings", category="cash_accounts", value=10000.00)
        create_asset(name="401k", category="retirement", value=50000.00)
        
        response = client.get("/api/v1/assets/category/cash_accounts")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(asset["category"] == "cash_accounts" for asset in data)
    
    def test_get_assets_by_category_empty(self, client: TestClient):
        """Test getting assets for category with no assets."""
        response = client.get("/api/v1/assets/category/retirement")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_update_delete_workflow(self, client: TestClient):
        """Test complete CRUD workflow."""
        # Create
        create_response = client.post("/api/v1/assets/", json={
            "name": "Test Asset",
            "category": "cash_accounts",
            "amount": 1000.00,
            "user_id": "test-user",
        })
        assert create_response.status_code == 201
        asset_id = create_response.json()["id"]
        
        # Read
        get_response = client.get(f"/api/v1/assets/{asset_id}")
        assert get_response.status_code == 200
        assert get_response.json()["value"] == 1000.00
        
        # Update
        update_response = client.put(
            f"/api/v1/assets/{asset_id}",
            json={"value": 2000.00}
        )
        assert update_response.status_code == 200
        assert update_response.json()["value"] == 2000.00
        
        # Delete
        delete_response = client.delete(f"/api/v1/assets/{asset_id}")
        assert delete_response.status_code == 204
        
        # Verify deleted
        final_get = client.get(f"/api/v1/assets/{asset_id}")
        assert final_get.status_code == 404

