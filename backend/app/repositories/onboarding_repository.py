"""
Onboarding Repository

Data access for onboarding state.
"""

import json
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.onboarding import OnboardingState
from app.repositories.base import BaseRepository
from app.schemas.onboarding import DataEntryTask


# Default onboarding ID (one per user/device)
DEFAULT_ONBOARDING_ID = "default"
INITIAL_STEP_ID = "welcome"


class OnboardingRepository(BaseRepository[OnboardingState]):
    """Repository for onboarding state operations."""
    
    def __init__(self):
        super().__init__(OnboardingState)
    
    def get_or_create(self, db: Session) -> OnboardingState:
        """Get existing onboarding state or create a new one."""
        state = self.get(db, DEFAULT_ONBOARDING_ID)
        if state:
            return state
        
        # Create new onboarding state
        return super().create(db, {
            "id": DEFAULT_ONBOARDING_ID,
            "current_step_id": INITIAL_STEP_ID,
            "household_type": None,
            "answers_json": "{}",
            "tasks_json": "[]",
            "completed_task_ids_json": "[]",
            "is_complete": False,
        })
    
    def get_default(self, db: Session) -> Optional[OnboardingState]:
        """Get the default onboarding state."""
        return self.get(db, DEFAULT_ONBOARDING_ID)
    
    def update_current_step(self, db: Session, step_id: str) -> Optional[OnboardingState]:
        """Update the current step."""
        return self.update(db, DEFAULT_ONBOARDING_ID, {
            "current_step_id": step_id,
            "updated_at": datetime.utcnow(),
        })
    
    def set_household_type(self, db: Session, household_type: str) -> Optional[OnboardingState]:
        """Set the household type."""
        return self.update(db, DEFAULT_ONBOARDING_ID, {
            "household_type": household_type,
            "updated_at": datetime.utcnow(),
        })
    
    def save_answer(self, db: Session, question_id: str, answer) -> Optional[OnboardingState]:
        """Save an answer for a question."""
        state = self.get_default(db)
        if not state:
            return None
        
        answers = json.loads(state.answers_json)
        answers[question_id] = answer
        
        return self.update(db, DEFAULT_ONBOARDING_ID, {
            "answers_json": json.dumps(answers),
            "updated_at": datetime.utcnow(),
        })
    
    def add_tasks(self, db: Session, tasks: List[dict]) -> List[DataEntryTask]:
        """Add multiple data entry tasks."""
        state = self.get_default(db)
        if not state:
            return []
        
        existing_tasks = json.loads(state.tasks_json)
        
        new_tasks = []
        for task in tasks:
            new_task = {
                "id": str(uuid.uuid4()),
                "type": task["type"],
                "category": task["category"],
                "default_name": task.get("default_name", task["category"]),
                "is_completed": False,
                "entity_id": None,
            }
            new_tasks.append(new_task)
            existing_tasks.append(new_task)
        
        self.update(db, DEFAULT_ONBOARDING_ID, {
            "tasks_json": json.dumps(existing_tasks),
            "updated_at": datetime.utcnow(),
        })
        
        return [DataEntryTask(**t) for t in new_tasks]
    
    def complete_task(self, db: Session, task_id: str, entity_id: str) -> Optional[OnboardingState]:
        """Mark a task as completed and link to created entity."""
        state = self.get_default(db)
        if not state:
            return None
        
        tasks = json.loads(state.tasks_json)
        completed_ids = json.loads(state.completed_task_ids_json)
        
        for task in tasks:
            if task["id"] == task_id:
                task["is_completed"] = True
                task["entity_id"] = entity_id
                break
        
        if task_id not in completed_ids:
            completed_ids.append(task_id)
        
        return self.update(db, DEFAULT_ONBOARDING_ID, {
            "tasks_json": json.dumps(tasks),
            "completed_task_ids_json": json.dumps(completed_ids),
            "updated_at": datetime.utcnow(),
        })
    
    def skip_task(self, db: Session, task_id: str) -> Optional[OnboardingState]:
        """Skip a task (mark as completed without entity)."""
        state = self.get_default(db)
        if not state:
            return None
        
        tasks = json.loads(state.tasks_json)
        completed_ids = json.loads(state.completed_task_ids_json)
        
        for task in tasks:
            if task["id"] == task_id:
                task["is_completed"] = True
                break
        
        if task_id not in completed_ids:
            completed_ids.append(task_id)
        
        return self.update(db, DEFAULT_ONBOARDING_ID, {
            "tasks_json": json.dumps(tasks),
            "completed_task_ids_json": json.dumps(completed_ids),
            "updated_at": datetime.utcnow(),
        })
    
    def mark_complete(self, db: Session) -> Optional[OnboardingState]:
        """Mark onboarding as complete."""
        return self.update(db, DEFAULT_ONBOARDING_ID, {
            "is_complete": True,
            "updated_at": datetime.utcnow(),
        })
    
    def reset(self, db: Session) -> bool:
        """Reset onboarding state."""
        return self.delete(db, DEFAULT_ONBOARDING_ID)
    
    def is_complete(self, db: Session) -> bool:
        """Check if onboarding is complete."""
        state = self.get_default(db)
        return state.is_complete if state else False
    
    def get_tasks(self, db: Session) -> List[DataEntryTask]:
        """Get all tasks."""
        state = self.get_default(db)
        if not state:
            return []
        
        tasks = json.loads(state.tasks_json)
        return [DataEntryTask(**t) for t in tasks]
    
    def get_answers(self, db: Session) -> dict:
        """Get all answers."""
        state = self.get_default(db)
        if not state:
            return {}
        
        return json.loads(state.answers_json)


# Singleton instance
onboarding_repository = OnboardingRepository()

