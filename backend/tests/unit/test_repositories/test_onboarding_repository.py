"""
Unit tests for OnboardingRepository
"""

import pytest
import json
from sqlalchemy.orm import Session

from app.repositories.onboarding_repository import (
    OnboardingRepository,
    DEFAULT_ONBOARDING_ID,
    INITIAL_STEP_ID,
)
from app.models.onboarding import OnboardingState


@pytest.fixture
def onboarding_repo():
    """Create onboarding repository instance."""
    return OnboardingRepository()


@pytest.mark.unit
class TestOnboardingRepository:
    """Test suite for OnboardingRepository."""
    
    def test_get_or_create_new(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test creating a new onboarding state."""
        state = onboarding_repo.get_or_create(test_db)
        
        assert state is not None
        assert state.id == DEFAULT_ONBOARDING_ID
        assert state.current_step_id == INITIAL_STEP_ID
        assert state.is_complete is False
        assert json.loads(state.answers_json) == {}
        assert json.loads(state.tasks_json) == []
    
    def test_get_or_create_existing(self, test_db: Session, onboarding_repo: OnboardingRepository, create_onboarding_state):
        """Test retrieving existing onboarding state."""
        existing = create_onboarding_state(
            id=DEFAULT_ONBOARDING_ID,
            current_step_id="context"
        )
        
        state = onboarding_repo.get_or_create(test_db)
        
        assert state.id == existing.id
        assert state.current_step_id == "context"
    
    def test_get_default(self, test_db: Session, onboarding_repo: OnboardingRepository, create_onboarding_state):
        """Test getting default onboarding state."""
        create_onboarding_state(id=DEFAULT_ONBOARDING_ID)
        
        state = onboarding_repo.get_default(test_db)
        
        assert state is not None
        assert state.id == DEFAULT_ONBOARDING_ID
    
    def test_update_current_step(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test updating current step."""
        onboarding_repo.get_or_create(test_db)
        
        updated = onboarding_repo.update_current_step(test_db, "discovery")
        
        assert updated is not None
        assert updated.current_step_id == "discovery"
    
    def test_set_household_type(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test setting household type."""
        onboarding_repo.get_or_create(test_db)
        
        updated = onboarding_repo.set_household_type(test_db, "single")
        
        assert updated is not None
        assert updated.household_type == "single"
    
    def test_save_answer(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test saving an answer."""
        onboarding_repo.get_or_create(test_db)
        
        updated = onboarding_repo.save_answer(test_db, "has_checking", True)
        
        assert updated is not None
        answers = json.loads(updated.answers_json)
        assert answers["has_checking"] is True
    
    def test_save_multiple_answers(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test saving multiple answers."""
        onboarding_repo.get_or_create(test_db)
        
        onboarding_repo.save_answer(test_db, "has_checking", True)
        onboarding_repo.save_answer(test_db, "has_savings", True)
        updated = onboarding_repo.save_answer(test_db, "has_401k", False)
        
        answers = json.loads(updated.answers_json)
        assert answers["has_checking"] is True
        assert answers["has_savings"] is True
        assert answers["has_401k"] is False
    
    def test_add_tasks(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test adding data entry tasks."""
        onboarding_repo.get_or_create(test_db)
        
        tasks_to_add = [
            {"type": "asset", "category": "cash_accounts", "default_name": "Checking Account"},
            {"type": "asset", "category": "retirement", "default_name": "401k"},
        ]
        
        new_tasks = onboarding_repo.add_tasks(test_db, tasks_to_add)
        
        assert len(new_tasks) == 2
        assert all(task.id is not None for task in new_tasks)
        assert new_tasks[0].type == "asset"
        assert new_tasks[0].category == "cash_accounts"
        assert new_tasks[1].category == "retirement"
    
    def test_get_tasks(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test retrieving all tasks."""
        onboarding_repo.get_or_create(test_db)
        
        tasks_to_add = [
            {"type": "asset", "category": "cash_accounts"},
            {"type": "liability", "category": "credit_card"},
        ]
        onboarding_repo.add_tasks(test_db, tasks_to_add)
        
        tasks = onboarding_repo.get_tasks(test_db)
        
        assert len(tasks) == 2
        assert tasks[0].type == "asset"
        assert tasks[1].type == "liability"
    
    def test_complete_task(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test completing a task with entity link."""
        onboarding_repo.get_or_create(test_db)
        
        new_tasks = onboarding_repo.add_tasks(test_db, [
            {"type": "asset", "category": "cash_accounts"},
        ])
        task_id = new_tasks[0].id
        entity_id = "asset-123"
        
        updated = onboarding_repo.complete_task(test_db, task_id, entity_id)
        
        assert updated is not None
        tasks = json.loads(updated.tasks_json)
        completed_task = next(t for t in tasks if t["id"] == task_id)
        assert completed_task["is_completed"] is True
        assert completed_task["entity_id"] == entity_id
        
        completed_ids = json.loads(updated.completed_task_ids_json)
        assert task_id in completed_ids
    
    def test_skip_task(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test skipping a task."""
        onboarding_repo.get_or_create(test_db)
        
        new_tasks = onboarding_repo.add_tasks(test_db, [
            {"type": "asset", "category": "cash_accounts"},
        ])
        task_id = new_tasks[0].id
        
        updated = onboarding_repo.skip_task(test_db, task_id)
        
        assert updated is not None
        tasks = json.loads(updated.tasks_json)
        skipped_task = next(t for t in tasks if t["id"] == task_id)
        assert skipped_task["is_completed"] is True
        assert skipped_task["entity_id"] is None
    
    def test_mark_complete(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test marking onboarding as complete."""
        onboarding_repo.get_or_create(test_db)
        
        updated = onboarding_repo.mark_complete(test_db)
        
        assert updated is not None
        assert updated.is_complete is True
    
    def test_is_complete(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test checking if onboarding is complete."""
        onboarding_repo.get_or_create(test_db)
        
        assert onboarding_repo.is_complete(test_db) is False
        
        onboarding_repo.mark_complete(test_db)
        
        assert onboarding_repo.is_complete(test_db) is True
    
    def test_reset(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test resetting onboarding state."""
        onboarding_repo.get_or_create(test_db)
        onboarding_repo.save_answer(test_db, "test", "value")
        
        result = onboarding_repo.reset(test_db)
        
        assert result is True
        assert onboarding_repo.get_default(test_db) is None
    
    def test_get_answers(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test retrieving all answers."""
        onboarding_repo.get_or_create(test_db)
        onboarding_repo.save_answer(test_db, "question1", "answer1")
        onboarding_repo.save_answer(test_db, "question2", "answer2")
        
        answers = onboarding_repo.get_answers(test_db)
        
        assert answers["question1"] == "answer1"
        assert answers["question2"] == "answer2"
    
    def test_get_answers_no_state(self, test_db: Session, onboarding_repo: OnboardingRepository):
        """Test getting answers when no state exists."""
        answers = onboarding_repo.get_answers(test_db)
        
        assert answers == {}

