"""
Integration tests for Liability API endpoints
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestLiabilitiesAPI:
    """Integration tests for /api/v1/liabilities endpoints."""
    
    def test_create_liability(self, client: TestClient):
        """Test POST /liabilities - create new liability."""
        liability_data = {
            "name": "Credit Card",
            "category": "credit_card",
            "amount": 5000.00,
            "interest_rate": 0.18,
            "user_id": "test-user",
        }
        
        response = client.post("/api/v1/liabilities/", json=liability_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == liability_data["name"]
        assert data["category"] == liability_data["category"]
        assert data["balance"] == liability_data["amount"]
        assert data["interest_rate"] == liability_data["interest_rate"]
        assert "id" in data
    
    def test_create_liability_without_interest_rate(self, client: TestClient):
        """Test creating liability without interest rate."""
        liability_data = {
            "name": "Personal Loan",
            "category": "other",
            "amount": 10000.00,
            "user_id": "test-user",
        }
        
        response = client.post("/api/v1/liabilities/", json=liability_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["interest_rate"] is None or data["interest_rate"] == 0.0
    
    def test_list_liabilities_empty(self, client: TestClient):
        """Test GET /liabilities with no liabilities."""
        response = client.get("/api/v1/liabilities/")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_list_liabilities(self, client: TestClient, create_liability):
        """Test GET /liabilities with multiple liabilities."""
        create_liability(name="Liability 1", balance=1000.00)
        create_liability(name="Liability 2", balance=2000.00)
        create_liability(name="Liability 3", balance=3000.00)
        
        response = client.get("/api/v1/liabilities/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all("id" in liability for liability in data)
    
    def test_get_liability(self, client: TestClient, create_liability):
        """Test GET /liabilities/{id} - get single liability."""
        liability = create_liability(name="Test Liability", balance=5000.00)
        
        response = client.get(f"/api/v1/liabilities/{liability.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == liability.id
        assert data["name"] == "Test Liability"
        assert data["balance"] == 5000.00
    
    def test_get_liability_not_found(self, client: TestClient):
        """Test GET /liabilities/{id} with non-existent ID."""
        response = client.get("/api/v1/liabilities/non-existent-id")
        
        assert response.status_code == 404
    
    def test_update_liability(self, client: TestClient, create_liability):
        """Test PUT /liabilities/{id} - update liability."""
        liability = create_liability(name="Old Name", balance=5000.00, interest_rate=0.15)
        
        update_data = {
            "name": "New Name",
            "balance": 4000.00,
            "interest_rate": 0.12,
        }
        
        response = client.put(f"/api/v1/liabilities/{liability.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["balance"] == 4000.00
        assert data["interest_rate"] == 0.12
    
    def test_update_liability_partial(self, client: TestClient, create_liability):
        """Test partial update of liability."""
        liability = create_liability(name="Original", balance=5000.00)
        
        update_data = {"balance": 4000.00}  # Only update balance
        
        response = client.put(f"/api/v1/liabilities/{liability.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Original"  # Unchanged
        assert data["balance"] == 4000.00  # Changed
    
    def test_update_liability_not_found(self, client: TestClient):
        """Test updating non-existent liability."""
        response = client.put(
            "/api/v1/liabilities/non-existent-id",
            json={"name": "Test"}
        )
        
        assert response.status_code == 404
    
    def test_delete_liability(self, client: TestClient, create_liability):
        """Test DELETE /liabilities/{id}."""
        liability = create_liability(name="To Delete")
        liability_id = liability.id
        
        response = client.delete(f"/api/v1/liabilities/{liability_id}")
        
        assert response.status_code == 204
        
        # Verify liability is deleted
        get_response = client.get(f"/api/v1/liabilities/{liability_id}")
        assert get_response.status_code == 404
    
    def test_delete_liability_not_found(self, client: TestClient):
        """Test deleting non-existent liability."""
        response = client.delete("/api/v1/liabilities/non-existent-id")
        
        assert response.status_code == 404
    
    def test_get_liabilities_by_category(self, client: TestClient, create_liability):
        """Test GET /liabilities/category/{category}."""
        create_liability(name="Card 1", category="credit_card", balance=2000.00)
        create_liability(name="Card 2", category="credit_card", balance=3000.00)
        create_liability(name="Mortgage", category="mortgage", balance=200000.00)
        
        response = client.get("/api/v1/liabilities/category/credit_card")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(liability["category"] == "credit_card" for liability in data)
    
    def test_get_liabilities_by_category_empty(self, client: TestClient):
        """Test getting liabilities for category with no liabilities."""
        response = client.get("/api/v1/liabilities/category/student_loan")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_create_update_delete_workflow(self, client: TestClient):
        """Test complete CRUD workflow."""
        # Create
        create_response = client.post("/api/v1/liabilities/", json={
            "name": "Test Liability",
            "category": "credit_card",
            "amount": 5000.00,
            "interest_rate": 0.18,
            "user_id": "test-user",
        })
        assert create_response.status_code == 201
        liability_id = create_response.json()["id"]
        
        # Read
        get_response = client.get(f"/api/v1/liabilities/{liability_id}")
        assert get_response.status_code == 200
        assert get_response.json()["balance"] == 5000.00
        
        # Update
        update_response = client.put(
            f"/api/v1/liabilities/{liability_id}",
            json={"balance": 4000.00}
        )
        assert update_response.status_code == 200
        assert update_response.json()["balance"] == 4000.00
        
        # Delete
        delete_response = client.delete(f"/api/v1/liabilities/{liability_id}")
        assert delete_response.status_code == 204
        
        # Verify deleted
        final_get = client.get(f"/api/v1/liabilities/{liability_id}")
        assert final_get.status_code == 404

