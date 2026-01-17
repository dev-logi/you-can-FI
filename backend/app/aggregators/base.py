"""
Base Aggregator Interfaces

Defines provider-agnostic interfaces for financial data aggregation.
All aggregator implementations (Plaid, Finicity, Yodlee, MX, etc.)
must implement the AggregatorProvider abstract class.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import date, datetime
from pydantic import BaseModel, Field


class AggregatorType(str, Enum):
    """Supported aggregator providers."""
    PLAID = "plaid"
    FINICITY = "finicity"
    YODLEE = "yodlee"
    MX = "mx"
    AKOYA = "akoya"


class AccountType(str, Enum):
    """Normalized account types across all providers."""
    DEPOSITORY = "depository"  # Checking, savings
    CREDIT = "credit"          # Credit cards
    LOAN = "loan"              # Mortgages, auto loans, student loans
    INVESTMENT = "investment"  # Brokerage, retirement accounts
    OTHER = "other"


class AccountInfo(BaseModel):
    """
    Provider-agnostic account information.
    
    All aggregator implementations must normalize their account data
    to this format.
    """
    provider_account_id: str = Field(..., description="Unique ID from the provider")
    name: str = Field(..., description="Account name (e.g., 'Chase Checking')")
    account_type: str = Field(..., description="Normalized type: depository, credit, loan, investment, other")
    account_subtype: Optional[str] = Field(None, description="Subtype: checking, savings, credit_card, mortgage, etc.")
    mask: Optional[str] = Field(None, description="Last 4 digits of account number")
    current_balance: Optional[float] = Field(None, description="Current balance")
    available_balance: Optional[float] = Field(None, description="Available balance (for credit: available credit)")
    credit_limit: Optional[float] = Field(None, description="Credit limit (for credit accounts)")
    is_asset: bool = Field(..., description="True if this is an asset, False if liability")
    institution_id: Optional[str] = Field(None, description="Provider's institution ID")
    institution_name: Optional[str] = Field(None, description="Human-readable institution name")
    currency_code: str = Field(default="USD", description="ISO currency code")
    raw_data: Optional[Dict[str, Any]] = Field(None, description="Original provider response for debugging")

    class Config:
        frozen = True


class TransactionInfo(BaseModel):
    """
    Provider-agnostic transaction information.
    """
    provider_transaction_id: str = Field(..., description="Unique ID from the provider")
    provider_account_id: str = Field(..., description="Account ID this transaction belongs to")
    amount: float = Field(..., description="Transaction amount (positive = outflow/expense, negative = inflow/income for Plaid)")
    date: date = Field(..., description="Transaction date")
    authorized_date: Optional[date] = Field(None, description="Date transaction was authorized")
    name: str = Field(..., description="Transaction description")
    merchant_name: Optional[str] = Field(None, description="Merchant name if identified")
    category_primary: Optional[str] = Field(None, description="Primary category")
    category_detailed: Optional[str] = Field(None, description="Detailed category")
    payment_channel: Optional[str] = Field(None, description="Payment channel: online, in_store, etc.")
    pending: bool = Field(default=False, description="Whether transaction is pending")
    currency_code: str = Field(default="USD", description="ISO currency code")
    location_city: Optional[str] = Field(None)
    location_region: Optional[str] = Field(None)
    location_country: Optional[str] = Field(None)

    class Config:
        frozen = True


class SecurityInfo(BaseModel):
    """
    Provider-agnostic security/holding information.
    """
    provider_security_id: str = Field(..., description="Unique ID from the provider")
    name: str = Field(..., description="Security name")
    ticker_symbol: Optional[str] = Field(None, description="Ticker symbol if available")
    security_type: Optional[str] = Field(None, description="Type: equity, etf, mutual_fund, bond, cash, etc.")
    close_price: Optional[float] = Field(None, description="Last known price")
    close_price_as_of: Optional[date] = Field(None, description="Date of last known price")
    is_cash_equivalent: bool = Field(default=False, description="Whether this is cash or cash equivalent")
    currency_code: str = Field(default="USD", description="ISO currency code")

    class Config:
        frozen = True


class HoldingInfo(BaseModel):
    """
    Provider-agnostic investment holding information.
    """
    provider_account_id: str = Field(..., description="Account ID this holding belongs to")
    provider_security_id: str = Field(..., description="Security ID from the provider")
    security_name: str = Field(..., description="Name of the security")
    ticker_symbol: Optional[str] = Field(None, description="Ticker symbol if available")
    quantity: float = Field(..., description="Number of shares/units held")
    institution_price: float = Field(..., description="Price per share as reported by institution")
    institution_price_as_of: Optional[date] = Field(None, description="Date of institution price")
    institution_value: float = Field(..., description="Total value as reported by institution")
    cost_basis: Optional[float] = Field(None, description="Original cost basis if available")
    currency_code: str = Field(default="USD", description="ISO currency code")

    class Config:
        frozen = True


class LinkTokenResult(BaseModel):
    """Result from creating a link token."""
    provider: AggregatorType
    link_token: Optional[str] = Field(None, description="Link token (Plaid)")
    connect_url: Optional[str] = Field(None, description="Connect URL (Finicity)")
    expiration: Optional[datetime] = Field(None, description="When the token expires")
    extra_data: Optional[Dict[str, Any]] = Field(None, description="Provider-specific extra data")


class ExchangeTokenResult(BaseModel):
    """Result from exchanging a public token."""
    provider: AggregatorType
    access_token: str = Field(..., description="Encrypted access token for future API calls")
    provider_item_id: str = Field(..., description="Provider's ID for this connection/item")
    accounts: List[AccountInfo] = Field(default_factory=list, description="Accounts discovered")
    institution_id: Optional[str] = Field(None, description="Institution ID")
    institution_name: Optional[str] = Field(None, description="Institution name")


class TransactionSyncResult(BaseModel):
    """Result from syncing transactions."""
    added: List[TransactionInfo] = Field(default_factory=list)
    modified: List[TransactionInfo] = Field(default_factory=list)
    removed: List[str] = Field(default_factory=list, description="List of removed transaction IDs")
    next_cursor: Optional[str] = Field(None, description="Cursor for next sync")
    has_more: bool = Field(default=False, description="Whether more data is available")


class AggregatorProvider(ABC):
    """
    Abstract base class for financial data aggregators.
    
    All aggregator implementations (Plaid, Finicity, Yodlee, MX, etc.)
    must implement this interface. The interface provides a unified way
    to interact with any aggregator, abstracting away provider-specific
    details.
    
    Usage:
        provider = AggregatorFactory.get_provider(AggregatorType.PLAID)
        link_result = provider.create_link_token(user_id)
        # ... user completes link flow ...
        exchange_result = provider.exchange_token(public_token)
    """
    
    @property
    @abstractmethod
    def provider_type(self) -> AggregatorType:
        """Return the aggregator type for this provider."""
        pass
    
    @abstractmethod
    def create_link_token(self, user_id: str, **kwargs) -> LinkTokenResult:
        """
        Create a token/URL for the user to link their account.
        
        Args:
            user_id: The user's ID in your system
            **kwargs: Provider-specific options
                - redirect_uri: OAuth redirect URI (Plaid)
                - webhook_url: Webhook URL for notifications
                - institution_id: Pre-select an institution
        
        Returns:
            LinkTokenResult with link_token or connect_url
        """
        pass
    
    @abstractmethod
    def exchange_token(self, public_token: str, **kwargs) -> ExchangeTokenResult:
        """
        Exchange a public/temporary token for a permanent access token.
        
        Args:
            public_token: Token from the link flow
            **kwargs: Provider-specific options
        
        Returns:
            ExchangeTokenResult with access_token and discovered accounts
        """
        pass
    
    @abstractmethod
    def get_accounts(self, access_token: str) -> List[AccountInfo]:
        """
        Get all accounts for a connection.
        
        Args:
            access_token: The stored access token
        
        Returns:
            List of AccountInfo objects
        """
        pass
    
    @abstractmethod
    def get_account_balances(self, access_token: str) -> List[AccountInfo]:
        """
        Get accounts with current balances (may trigger a live balance fetch).
        
        Args:
            access_token: The stored access token
        
        Returns:
            List of AccountInfo objects with current_balance populated
        """
        pass
    
    @abstractmethod
    def sync_transactions(
        self, 
        access_token: str, 
        cursor: Optional[str] = None
    ) -> TransactionSyncResult:
        """
        Sync transactions incrementally.
        
        Args:
            access_token: The stored access token
            cursor: Cursor from previous sync (None for initial sync)
        
        Returns:
            TransactionSyncResult with added, modified, removed transactions
        """
        pass
    
    @abstractmethod
    def get_holdings(self, access_token: str) -> tuple[List[HoldingInfo], List[SecurityInfo]]:
        """
        Get investment holdings (for investment accounts).
        
        Args:
            access_token: The stored access token
        
        Returns:
            Tuple of (holdings, securities)
        """
        pass
    
    @abstractmethod
    def disconnect(self, access_token: str) -> bool:
        """
        Disconnect/remove the item.
        
        Args:
            access_token: The stored access token
        
        Returns:
            True if successful, False otherwise
        """
        pass
    
    def supports_institution(self, institution_id: str) -> bool:
        """
        Check if this provider supports a given institution.
        
        Override in subclasses to provide institution-specific logic.
        Default implementation returns True (assumes support).
        
        Args:
            institution_id: The institution ID to check
        
        Returns:
            True if supported, False otherwise
        """
        return True
    
    def get_institution_name(self, institution_id: str) -> Optional[str]:
        """
        Get the human-readable name for an institution.
        
        Override in subclasses to provide institution lookup.
        
        Args:
            institution_id: The institution ID
        
        Returns:
            Institution name or None if not found
        """
        return None
