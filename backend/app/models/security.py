"""
Security Model

Represents a financial security (stock, bond, mutual fund, etc.) from Plaid.
"""

from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Float, DateTime, Boolean, Date
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Security(Base):
    """
    Security database model.
    Stores information about individual stocks, funds, etc.
    """
    
    __tablename__ = "securities"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    plaid_security_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    
    # Security details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    ticker_symbol: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    is_cash_equivalent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # e.g., 'stock', 'mutual fund'
    
    # Price info
    close_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    close_price_as_of: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    iso_currency_code: Mapped[Optional[str]] = mapped_column(String(3), nullable=True, default="USD")
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<Security(id={self.id}, symbol={self.ticker_symbol}, name={self.name})>"
