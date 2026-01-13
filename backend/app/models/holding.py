"""
Holding Model

Represents a user's holding of a security in a specific account.
"""

from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Holding(Base):
    """
    Holding database model.
    Links an account to a security with quantity and value info.
    """
    
    __tablename__ = "holdings"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    connected_account_id: Mapped[str] = mapped_column(String(36), ForeignKey("connected_accounts.id"), nullable=False, index=True)
    security_id: Mapped[str] = mapped_column(String(36), ForeignKey("securities.id"), nullable=False, index=True)
    
    # Relationships
    security: Mapped["Security"] = relationship()
    
    # Holding details
    institution_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    institution_price_as_of: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    institution_value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    cost_basis: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    iso_currency_code: Mapped[Optional[str]] = mapped_column(String(3), nullable=True, default="USD")
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<Holding(id={self.id}, account_id={self.connected_account_id}, quantity={self.quantity})>"
