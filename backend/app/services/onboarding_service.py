"""
Onboarding Service

Business logic for the onboarding flow.
Manages question navigation and task generation.
"""

import json
from typing import Dict, List, Optional, Tuple, Union
from sqlalchemy.orm import Session

from app.repositories.onboarding_repository import onboarding_repository
from app.repositories.asset_repository import asset_repository
from app.repositories.liability_repository import liability_repository
from app.schemas.onboarding import (
    OnboardingStateResponse,
    DataEntryTask,
    OnboardingProgress,
)


# Question flow configuration
QUESTION_ORDER = [
    "welcome",
    "household",
    "cash_accounts",
    "retirement",
    "investments",
    "real_estate",
    "vehicles",
    "other_assets",
    "mortgages",
    "credit_cards",
    "auto_loans",
    "student_loans",
    "other_debts",
    "tasks",
    "review",
]

# Task generation rules for each question
TASK_GENERATION_RULES = {
    "cash_accounts": {
        "yes": [{"type": "asset", "category": "cash", "default_name": "Cash & Checking"}],
    },
    "retirement": {
        "401k": [{"type": "asset", "category": "retirement_401k", "default_name": "401(k)"}],
        "ira": [{"type": "asset", "category": "retirement_ira", "default_name": "Traditional IRA"}],
        "roth": [{"type": "asset", "category": "retirement_roth", "default_name": "Roth IRA"}],
        "hsa": [{"type": "asset", "category": "retirement_hsa", "default_name": "HSA"}],
        "pension": [{"type": "asset", "category": "retirement_pension", "default_name": "Pension"}],
        "other_retirement": [{"type": "asset", "category": "retirement_other", "default_name": "Other Retirement"}],
    },
    "investments": {
        "yes": [{"type": "asset", "category": "brokerage", "default_name": "Brokerage Account"}],
    },
    "real_estate": {
        "primary": [{"type": "asset", "category": "real_estate_primary", "default_name": "Primary Residence"}],
        "rental": [{"type": "asset", "category": "real_estate_rental", "default_name": "Rental Property"}],
        "land": [{"type": "asset", "category": "real_estate_land", "default_name": "Land"}],
    },
    "vehicles": {
        "yes": [{"type": "asset", "category": "vehicle", "default_name": "Vehicle"}],
    },
    "other_assets": {
        "business": [{"type": "asset", "category": "business", "default_name": "Business"}],
        "valuables": [{"type": "asset", "category": "valuables", "default_name": "Valuables"}],
        "other": [{"type": "asset", "category": "other", "default_name": "Other Asset"}],
    },
    "mortgages": {
        "yes": [{"type": "liability", "category": "mortgage", "default_name": "Mortgage"}],
    },
    "credit_cards": {
        "yes": [{"type": "liability", "category": "credit_card", "default_name": "Credit Card"}],
    },
    "auto_loans": {
        "yes": [{"type": "liability", "category": "auto_loan", "default_name": "Auto Loan"}],
    },
    "student_loans": {
        "yes": [{"type": "liability", "category": "student_loan", "default_name": "Student Loan"}],
    },
    "other_debts": {
        "yes": [{"type": "liability", "category": "other", "default_name": "Other Debt"}],
    },
}


class OnboardingService:
    """Service for onboarding flow management."""
    
    def get_or_create_state(self, db: Session, user_id: str) -> OnboardingStateResponse:
        """Get or create onboarding state."""
        state = onboarding_repository.get_or_create(db, user_id)
        return self._to_response(state)
    
    def get_state(self, db: Session, user_id: str) -> Optional[OnboardingStateResponse]:
        """Get current onboarding state."""
        state = onboarding_repository.get_default(db, user_id)
        if not state:
            return None
        return self._to_response(state)
    
    def answer_question(
        self, 
        db: Session, 
        question_id: str, 
        answer: Union[str, List[str]],
        user_id: str,
        count: Optional[int] = None,
        counts: Optional[Dict[str, int]] = None
    ) -> Tuple[Optional[str], List[DataEntryTask]]:
        """
        Answer a question and generate tasks.
        Returns (next_question_id, generated_tasks).
        
        Args:
            question_id: The question ID
            answer: The answer (string for yes/no, list for multi-select)
            user_id: The user ID
            count: Optional count for itemization (yes/no questions)
            counts: Optional counts dict for itemization (multi-select questions)
        """
        # Save the answer data (including counts for itemization)
        answer_data = {
            "answer": answer,
        }
        if count is not None:
            answer_data["count"] = count
        if counts is not None:
            answer_data["counts"] = counts
        
        onboarding_repository.save_answer(db, question_id, answer_data, user_id)
        
        # Generate tasks based on answer and counts
        tasks = self._generate_tasks(db, question_id, answer, user_id, count, counts)
        
        # Get next question
        next_question_id = self._get_next_question(question_id)
        
        if next_question_id:
            onboarding_repository.update_current_step(db, next_question_id, user_id)
        
        return next_question_id, tasks
    
    def set_household_type(self, db: Session, household_type: str, user_id: str) -> None:
        """Set the household type."""
        onboarding_repository.set_household_type(db, household_type, user_id)
    
    def complete_task(
        self, 
        db: Session, 
        task_id: str, 
        name: str, 
        value: float,
        interest_rate: Optional[float],
        user_id: str
    ) -> str:
        """Complete a task by creating the asset/liability."""
        tasks = onboarding_repository.get_tasks(db, user_id)
        task = next((t for t in tasks if t.id == task_id), None)
        
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        # Create the entity
        if task.type == "asset":
            entity = asset_repository.create(db, {
                "category": task.category,
                "name": name,
                "value": value,
            }, user_id)
        else:
            entity = liability_repository.create(db, {
                "category": task.category,
                "name": name,
                "balance": value,
                "interest_rate": interest_rate,
            }, user_id)
        
        # Mark task complete
        onboarding_repository.complete_task(db, task_id, entity.id, user_id)
        
        return entity.id
    
    def skip_task(self, db: Session, task_id: str, user_id: str) -> None:
        """Skip a task without creating an entity."""
        onboarding_repository.skip_task(db, task_id, user_id)
    
    def complete_onboarding(self, db: Session, user_id: str) -> None:
        """Mark onboarding as complete."""
        onboarding_repository.mark_complete(db, user_id)
    
    def reset(self, db: Session, user_id: str) -> None:
        """Reset onboarding and delete all data for the user."""
        # Delete all assets and liabilities for the user
        assets = asset_repository.get_all(db, user_id)
        for asset in assets:
            asset_repository.delete(db, asset.id, user_id)
        
        liabilities = liability_repository.get_all(db, user_id)
        for liability in liabilities:
            liability_repository.delete(db, liability.id, user_id)
        
        onboarding_repository.reset(db, user_id)
    
    def get_progress(self, db: Session, user_id: str) -> OnboardingProgress:
        """Get onboarding progress."""
        state = onboarding_repository.get_default(db, user_id)
        if not state:
            return OnboardingProgress(
                current_step=0,
                total_steps=len(QUESTION_ORDER),
                percentage=0,
            )
        
        current_index = QUESTION_ORDER.index(state.current_step_id) if state.current_step_id in QUESTION_ORDER else 0
        total = len(QUESTION_ORDER)
        percentage = (current_index / (total - 1)) * 100 if total > 1 else 0
        
        return OnboardingProgress(
            current_step=current_index + 1,
            total_steps=total,
            percentage=round(percentage, 1),
        )
    
    def is_complete(self, db: Session, user_id: str) -> bool:
        """Check if onboarding is complete."""
        return onboarding_repository.is_complete(db, user_id)
    
    def go_to_step(self, db: Session, step_id: str, user_id: str) -> None:
        """Navigate to a specific step."""
        onboarding_repository.update_current_step(db, step_id, user_id)
    
    def _generate_tasks(
        self, 
        db: Session, 
        question_id: str, 
        answer: Union[str, List[str]],
        user_id: str,
        count: Optional[int] = None,
        counts: Optional[Dict[str, int]] = None
    ) -> List[DataEntryTask]:
        """
        Generate tasks based on question answer and itemization counts.
        
        Args:
            question_id: The question ID
            answer: The answer (string for yes/no, list for multi-select)
            user_id: The user ID
            count: Optional count for itemization (yes/no questions)
            counts: Optional counts dict for itemization (multi-select questions)
        """
        rules = TASK_GENERATION_RULES.get(question_id, {})
        if not rules:
            return []
        
        tasks_to_create = []
        
        # Handle multi-select with counts dict
        if isinstance(answer, list) and counts:
            for ans in answer:
                if ans in rules and ans in counts:
                    task_count = counts[ans]
                    base_task_template = rules[ans][0]
                    for i in range(1, task_count + 1):
                        task = base_task_template.copy()
                        # Add number suffix to default name
                        task["default_name"] = f"{task['default_name']} {i}"
                        tasks_to_create.append(task)
                elif ans in rules:
                    # Fallback: no count specified, create 1 task
                    tasks_to_create.extend(rules[ans])
        
        # Handle yes/no with single count
        elif isinstance(answer, str) and count is not None:
            if answer in rules:
                base_task_template = rules[answer][0]
                for i in range(1, count + 1):
                    task = base_task_template.copy()
                    # Add number suffix to default name
                    task["default_name"] = f"{task['default_name']} {i}"
                    tasks_to_create.append(task)
        
        # Fallback: original behavior (no itemization)
        else:
            answers = answer if isinstance(answer, list) else [answer]
            for ans in answers:
                if ans in rules:
                    tasks_to_create.extend(rules[ans])
        
        if tasks_to_create:
            return onboarding_repository.add_tasks(db, tasks_to_create, user_id)
        
        return []
    
    def _get_next_question(self, current_id: str) -> Optional[str]:
        """Get the next question in the flow."""
        if current_id not in QUESTION_ORDER:
            return None
        
        current_index = QUESTION_ORDER.index(current_id)
        next_index = current_index + 1
        
        if next_index >= len(QUESTION_ORDER):
            return None
        
        return QUESTION_ORDER[next_index]
    
    def _to_response(self, state) -> OnboardingStateResponse:
        """Convert model to response schema."""
        return OnboardingStateResponse(
            id=state.id,
            current_step_id=state.current_step_id,
            household_type=state.household_type,
            answers=json.loads(state.answers_json),
            tasks=[DataEntryTask(**t) for t in json.loads(state.tasks_json)],
            completed_task_ids=json.loads(state.completed_task_ids_json),
            is_complete=state.is_complete,
            created_at=state.created_at,
            updated_at=state.updated_at,
        )


# Singleton instance
onboarding_service = OnboardingService()

