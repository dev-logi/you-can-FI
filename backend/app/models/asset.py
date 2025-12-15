"""
Asset Model

Represents financial assets like bank accounts, investments, real estate, etc.
"""

from datetime import datetime
from sqlalchemy import String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Asset(Base):
    """
    Asset database model.
    
    Categories:
    - cash, savings
    - retirement_401k, retirement_ira, retirement_roth, retirement_hsa, retirement_pension, retirement_other
    - brokerage
    - real_estate_primary, real_estate_rental, real_estate_land
    - vehicle, business, valuables, other
    """
    
    __tablename__ = "assets"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
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
        return f"<Asset(id={self.id}, name={self.name}, value={self.value})>"

