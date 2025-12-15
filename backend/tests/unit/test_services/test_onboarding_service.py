"""
Unit tests for OnboardingService
"""

import pytest
from sqlalchemy.orm import Session

from app.services.onboarding_service import OnboardingService, QUESTION_ORDER


@pytest.fixture
def onboarding_service():
    """Create onboarding service instance."""
    return OnboardingService()


@pytest.mark.unit
class TestOnboardingService:
    """Test suite for OnboardingService."""
    
    def test_get_or_create_state_new(self, test_db: Session, onboarding_service: OnboardingService):
        """Test creating new onboarding state."""
        response = onboarding_service.get_or_create_state(test_db)
        
        assert response is not None
        assert response.current_step_id == "welcome"
        assert response.is_complete is False
        assert len(response.tasks) == 0
        assert len(response.answers) == 0
    
    def test_get_or_create_state_existing(
        self, 
        test_db: Session, 
        onboarding_service: OnboardingService,
        create_onboarding_state
    ):
        """Test retrieving existing onboarding state."""
        create_onboarding_state(id="default", current_step_id="household")
        
        response = onboarding_service.get_or_create_state(test_db)
        
        assert response.current_step_id == "household"
    
    def test_set_household_type(self, test_db: Session, onboarding_service: OnboardingService):
        """Test setting household type."""
        onboarding_service.get_or_create_state(test_db)
        onboarding_service.set_household_type(test_db, "single")
        
        state = onboarding_service.get_state(test_db)
        
        assert state.household_type == "single"
    
    def test_answer_question_simple(self, test_db: Session, onboarding_service: OnboardingService):
        """Test answering a simple yes/no question."""
        onboarding_service.get_or_create_state(test_db)
        
        next_q, tasks = onboarding_service.answer_question(test_db, "welcome", "yes")
        
        assert next_q == "household"  # Next in QUESTION_ORDER
        assert len(tasks) == 0  # Welcome doesn't generate tasks
    
    def test_answer_question_generates_tasks(
        self, 
        test_db: Session, 
        onboarding_service: OnboardingService
    ):
        """Test answering a question that generates tasks."""
        onboarding_service.get_or_create_state(test_db)
        
        next_q, tasks = onboarding_service.answer_question(test_db, "cash_accounts", "yes")
        
        assert len(tasks) > 0
        assert tasks[0].type == "asset"
        assert tasks[0].category == "cash"
    
    def test_answer_question_multiple_choices(
        self, 
        test_db: Session, 
        onboarding_service: OnboardingService
    ):
        """Test answering a question with multiple selections."""
        onboarding_service.get_or_create_state(test_db)
        
        next_q, tasks = onboarding_service.answer_question(
            test_db, 
            "retirement", 
            ["401k", "ira", "roth"]
        )
        
        assert len(tasks) == 3
        assert all(task.type == "asset" for task in tasks)
        assert {task.category for task in tasks} == {
            "retirement_401k", 
            "retirement_ira", 
            "retirement_roth"
        }
    
    def test_complete_task_asset(
        self, 
        test_db: Session, 
        onboarding_service: OnboardingService
    ):
        """Test completing an asset task."""
        onboarding_service.get_or_create_state(test_db)
        next_q, tasks = onboarding_service.answer_question(test_db, "cash_accounts", "yes")
        
        task_id = tasks[0].id
        entity_id = onboarding_service.complete_task(
            test_db, 
            task_id, 
            "Chase Checking", 
            5000.00
        )
        
        assert entity_id is not None
        
        # Verify task is marked complete
        state = onboarding_service.get_state(test_db)
        completed_task = next(t for t in state.tasks if t.id == task_id)
        assert completed_task.is_completed is True
        assert completed_task.entity_id == entity_id
    
    def test_complete_task_liability(
        self, 
        test_db: Session, 
        onboarding_service: OnboardingService
    ):
        """Test completing a liability task."""
        onboarding_service.get_or_create_state(test_db)
        next_q, tasks = onboarding_service.answer_question(test_db, "credit_cards", "yes")
        
        task_id = tasks[0].id
        entity_id = onboarding_service.complete_task(
            test_db, 
            task_id, 
            "Visa Card", 
            3000.00,
            interest_rate=0.18
        )
        
        assert entity_id is not None
        
        # Verify task is marked complete
        state = onboarding_service.get_state(test_db)
        completed_task = next(t for t in state.tasks if t.id == task_id)
        assert completed_task.is_completed is True
    
    def test_skip_task(self, test_db: Session, onboarding_service: OnboardingService):
        """Test skipping a task."""
        onboarding_service.get_or_create_state(test_db)
        next_q, tasks = onboarding_service.answer_question(test_db, "cash_accounts", "yes")
        
        task_id = tasks[0].id
        onboarding_service.skip_task(test_db, task_id)
        
        # Verify task is marked complete but no entity
        state = onboarding_service.get_state(test_db)
        skipped_task = next(t for t in state.tasks if t.id == task_id)
        assert skipped_task.is_completed is True
        assert skipped_task.entity_id is None
    
    def test_complete_onboarding(self, test_db: Session, onboarding_service: OnboardingService):
        """Test marking onboarding as complete."""
        onboarding_service.get_or_create_state(test_db)
        
        assert onboarding_service.is_complete(test_db) is False
        
        onboarding_service.complete_onboarding(test_db)
        
        assert onboarding_service.is_complete(test_db) is True
    
    def test_get_progress_initial(self, test_db: Session, onboarding_service: OnboardingService):
        """Test getting progress at start."""
        onboarding_service.get_or_create_state(test_db)
        
        progress = onboarding_service.get_progress(test_db)
        
        assert progress.current_step == 1  # welcome is first
        assert progress.total_steps == len(QUESTION_ORDER)
        assert progress.percentage == 0.0
    
    def test_get_progress_midway(self, test_db: Session, onboarding_service: OnboardingService):
        """Test getting progress midway through."""
        onboarding_service.get_or_create_state(test_db)
        onboarding_service.go_to_step(test_db, "retirement")
        
        progress = onboarding_service.get_progress(test_db)
        
        retirement_index = QUESTION_ORDER.index("retirement")
        assert progress.current_step == retirement_index + 1
        assert 0 < progress.percentage < 100
    
    def test_get_progress_end(self, test_db: Session, onboarding_service: OnboardingService):
        """Test getting progress at end."""
        onboarding_service.get_or_create_state(test_db)
        last_step = QUESTION_ORDER[-1]
        onboarding_service.go_to_step(test_db, last_step)
        
        progress = onboarding_service.get_progress(test_db)
        
        assert progress.current_step == len(QUESTION_ORDER)
        assert progress.percentage == 100.0
    
    def test_go_to_step(self, test_db: Session, onboarding_service: OnboardingService):
        """Test navigating to a specific step."""
        onboarding_service.get_or_create_state(test_db)
        
        onboarding_service.go_to_step(test_db, "investments")
        
        state = onboarding_service.get_state(test_db)
        assert state.current_step_id == "investments"
    
    def test_reset(self, test_db: Session, onboarding_service: OnboardingService, create_asset):
        """Test resetting onboarding and all data."""
        onboarding_service.get_or_create_state(test_db)
        onboarding_service.answer_question(test_db, "cash_accounts", "yes")
        create_asset()  # Add some data
        
        onboarding_service.reset(test_db)
        
        # Verify everything is cleared
        assert onboarding_service.get_state(test_db) is None
    
    def test_question_flow_progression(self, test_db: Session, onboarding_service: OnboardingService):
        """Test that questions progress in correct order."""
        onboarding_service.get_or_create_state(test_db)
        
        current_step = "welcome"
        for _ in range(5):
            next_step, _ = onboarding_service.answer_question(test_db, current_step, "no")
            assert next_step is not None
            
            current_index = QUESTION_ORDER.index(current_step)
            next_index = QUESTION_ORDER.index(next_step)
            assert next_index == current_index + 1
            
            current_step = next_step
    
    def test_answer_question_saves_answer(
        self, 
        test_db: Session, 
        onboarding_service: OnboardingService
    ):
        """Test that answers are persisted."""
        onboarding_service.get_or_create_state(test_db)
        
        onboarding_service.answer_question(test_db, "cash_accounts", "yes")
        onboarding_service.answer_question(test_db, "savings", "no")
        
        state = onboarding_service.get_state(test_db)
        
        assert state.answers["cash_accounts"] == "yes"
        assert state.answers["savings"] == "no"
    
    def test_complete_task_invalid_task_id(
        self, 
        test_db: Session, 
        onboarding_service: OnboardingService
    ):
        """Test completing a non-existent task raises error."""
        onboarding_service.get_or_create_state(test_db)
        
        with pytest.raises(ValueError, match="Task .* not found"):
            onboarding_service.complete_task(
                test_db, 
                "invalid-id", 
                "Test", 
                100.00
            )

