"""
Onboarding State Model

Stores the user's progress through the onboarding flow.
Enables resuming after app restart.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class OnboardingState(Base):
    """
    Onboarding state database model.
    
    Stores:
    - Current step in the flow
    - All answers given
    - Generated data entry tasks
    - Completion status
    """
    
    __tablename__ = "onboarding_state"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    current_step_id: Mapped[str] = mapped_column(String(50), nullable=False)
    household_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # JSON stored as text (PostgreSQL has native JSON, but TEXT is more portable)
    answers_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    tasks_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    completed_task_ids_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    
    is_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        nullable=False, 
        default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        nullable=False, 
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    def __repr__(self) -> str:
        return f"<OnboardingState(id={self.id}, step={self.current_step_id}, complete={self.is_complete})>"

