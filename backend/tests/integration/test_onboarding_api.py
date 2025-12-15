"""
Integration tests for Onboarding API endpoints
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
class TestOnboardingAPI:
    """Integration tests for /api/v1/onboarding endpoints."""
    
    def test_get_or_create_onboarding_new(self, client: TestClient):
        """Test GET /onboarding creates new state."""
        response = client.get("/api/v1/onboarding/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "default"
        assert data["current_step_id"] == "welcome"
        assert data["is_complete"] is False
        assert len(data["tasks"]) == 0
        assert len(data["answers"]) == 0
    
    def test_get_or_create_onboarding_existing(
        self, 
        client: TestClient,
        create_onboarding_state
    ):
        """Test GET /onboarding returns existing state."""
        create_onboarding_state(id="default", current_step_id="household")
        
        response = client.get("/api/v1/onboarding/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["current_step_id"] == "household"
    
    def test_get_onboarding_status(self, client: TestClient):
        """Test GET /onboarding/status."""
        client.get("/api/v1/onboarding/")  # Create state
        
        response = client.get("/api/v1/onboarding/status")
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_complete"] is False
    
    def test_get_onboarding_progress_initial(self, client: TestClient):
        """Test GET /onboarding/progress at start."""
        client.get("/api/v1/onboarding/")
        
        response = client.get("/api/v1/onboarding/progress")
        
        assert response.status_code == 200
        data = response.json()
        assert data["current_step"] == 1
        assert data["total_steps"] > 0
        assert data["percentage"] == 0.0
    
    def test_set_household_type(self, client: TestClient):
        """Test POST /onboarding/household."""
        client.get("/api/v1/onboarding/")
        
        response = client.post("/api/v1/onboarding/household", json={
            "household_type": "single"
        })
        
        assert response.status_code == 200
        
        # Verify it was saved
        state_response = client.get("/api/v1/onboarding/")
        assert state_response.json()["household_type"] == "single"
    
    def test_answer_question_simple(self, client: TestClient):
        """Test POST /onboarding/answer with simple answer."""
        client.get("/api/v1/onboarding/")
        
        response = client.post("/api/v1/onboarding/answer", json={
            "question_id": "welcome",
            "answer": "yes"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "next_question_id" in data
        assert "tasks_generated" in data
        assert data["next_question_id"] == "household"
    
    def test_answer_question_generates_tasks(self, client: TestClient):
        """Test answering question that generates tasks."""
        client.get("/api/v1/onboarding/")
        
        response = client.post("/api/v1/onboarding/answer", json={
            "question_id": "cash_accounts",
            "answer": "yes"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["tasks_generated"]) > 0
        
        task = data["tasks_generated"][0]
        assert "id" in task
        assert "type" in task
        assert "category" in task
        assert task["type"] == "asset"
    
    def test_answer_question_multiple_selection(self, client: TestClient):
        """Test answering question with multiple selections."""
        client.get("/api/v1/onboarding/")
        
        response = client.post("/api/v1/onboarding/answer", json={
            "question_id": "retirement",
            "answer": ["401k", "ira"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["tasks_generated"]) == 2
    
    def test_complete_task_asset(self, client: TestClient):
        """Test POST /onboarding/task/complete for asset."""
        client.get("/api/v1/onboarding/")
        
        # Generate a task
        answer_response = client.post("/api/v1/onboarding/answer", json={
            "question_id": "cash_accounts",
            "answer": "yes"
        })
        task_id = answer_response.json()["tasks_generated"][0]["id"]
        
        # Complete the task
        response = client.post("/api/v1/onboarding/task/complete", json={
            "task_id": task_id,
            "name": "Chase Checking",
            "value": 5000.00
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "entity_id" in data
        
        # Verify asset was created
        asset_response = client.get(f"/api/v1/assets/{data['entity_id']}")
        assert asset_response.status_code == 200
    
    def test_complete_task_liability(self, client: TestClient):
        """Test POST /onboarding/task/complete for liability."""
        client.get("/api/v1/onboarding/")
        
        # Generate a task
        answer_response = client.post("/api/v1/onboarding/answer", json={
            "question_id": "credit_cards",
            "answer": "yes"
        })
        task_id = answer_response.json()["tasks_generated"][0]["id"]
        
        # Complete the task
        response = client.post("/api/v1/onboarding/task/complete", json={
            "task_id": task_id,
            "name": "Visa Card",
            "value": 3000.00,
            "interest_rate": 0.18
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "entity_id" in data
        
        # Verify liability was created
        liability_response = client.get(f"/api/v1/liabilities/{data['entity_id']}")
        assert liability_response.status_code == 200
        assert liability_response.json()["interest_rate"] == 0.18
    
    def test_skip_task(self, client: TestClient):
        """Test POST /onboarding/task/skip."""
        client.get("/api/v1/onboarding/")
        
        # Generate a task
        answer_response = client.post("/api/v1/onboarding/answer", json={
            "question_id": "cash_accounts",
            "answer": "yes"
        })
        task_id = answer_response.json()["tasks_generated"][0]["id"]
        
        # Skip the task
        response = client.post("/api/v1/onboarding/task/skip", json={
            "task_id": task_id
        })
        
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        
        # Verify task is marked complete but no entity
        state = client.get("/api/v1/onboarding/")
        tasks = state.json()["tasks"]
        skipped_task = next(t for t in tasks if t["id"] == task_id)
        assert skipped_task["is_completed"] is True
        assert skipped_task["entity_id"] is None
    
    def test_complete_task_invalid_id(self, client: TestClient):
        """Test completing task with invalid ID."""
        client.get("/api/v1/onboarding/")
        
        response = client.post("/api/v1/onboarding/task/complete", json={
            "task_id": "invalid-id",
            "name": "Test",
            "value": 1000.00
        })
        
        assert response.status_code == 404
    
    def test_complete_onboarding(self, client: TestClient):
        """Test POST /onboarding/complete."""
        client.get("/api/v1/onboarding/")
        
        response = client.post("/api/v1/onboarding/complete")
        
        assert response.status_code == 200
        
        # Verify onboarding is complete
        status_response = client.get("/api/v1/onboarding/status")
        assert status_response.json()["is_complete"] is True
    
    def test_go_to_step(self, client: TestClient):
        """Test POST /onboarding/go-to-step."""
        client.get("/api/v1/onboarding/")
        
        response = client.post("/api/v1/onboarding/go-to-step?step_id=investments")
        
        assert response.status_code == 200
        
        # Verify step was updated
        state = client.get("/api/v1/onboarding/")
        assert state.json()["current_step_id"] == "investments"
    
    def test_reset_onboarding(self, client: TestClient, create_asset):
        """Test DELETE /onboarding/reset."""
        # Set up some data
        client.get("/api/v1/onboarding/")
        client.post("/api/v1/onboarding/answer", json={
            "question_id": "welcome",
            "answer": "yes"
        })
        create_asset()
        
        # Reset
        response = client.delete("/api/v1/onboarding/reset")
        
        assert response.status_code == 200
        
        # Verify all data is cleared
        assets = client.get("/api/v1/assets/")
        assert len(assets.json()) == 0
    
    def test_end_to_end_onboarding_flow(self, client: TestClient):
        """Test complete onboarding workflow."""
        # 1. Start onboarding
        state = client.get("/api/v1/onboarding/")
        assert state.status_code == 200
        
        # 2. Set household type
        client.post("/api/v1/onboarding/household", json={"household_type": "single"})
        
        # 3. Answer a few questions
        client.post("/api/v1/onboarding/answer", json={
            "question_id": "welcome",
            "answer": "yes"
        })
        
        cash_response = client.post("/api/v1/onboarding/answer", json={
            "question_id": "cash_accounts",
            "answer": "yes"
        })
        task_id = cash_response.json()["tasks_generated"][0]["id"]
        
        # 4. Complete a task
        complete_response = client.post("/api/v1/onboarding/task/complete", json={
            "task_id": task_id,
            "name": "Savings Account",
            "value": 10000.00
        })
        assert complete_response.status_code == 200
        
        # 5. Check progress
        progress = client.get("/api/v1/onboarding/progress")
        assert progress.json()["percentage"] > 0
        
        # 6. Complete onboarding
        client.post("/api/v1/onboarding/complete")
        
        # 7. Verify final state
        status = client.get("/api/v1/onboarding/status")
        assert status.json()["is_complete"] is True
        
        # 8. Verify net worth reflects created assets
        net_worth = client.get("/api/v1/net-worth/")
        assert net_worth.json()["total_assets"] == 10000.00

