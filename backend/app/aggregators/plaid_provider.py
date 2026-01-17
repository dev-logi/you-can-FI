"""
Plaid Provider Implementation

Implements the AggregatorProvider interface for Plaid.
Wraps the existing PlaidService to provide a unified interface.
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import date, datetime

from app.aggregators.base import (
    AggregatorType,
    AggregatorProvider,
    AccountInfo,
    TransactionInfo,
    HoldingInfo,
    SecurityInfo,
    LinkTokenResult,
    ExchangeTokenResult,
    TransactionSyncResult,
)
from app.services.plaid_service import plaid_service


class PlaidProvider(AggregatorProvider):
    """
    Plaid implementation of AggregatorProvider.
    
    Wraps the existing PlaidService to provide a unified interface
    that works with other aggregators.
    """
    
    # Plaid account types that are assets
    ASSET_TYPES = {'depository', 'investment'}
    
    # Plaid account types that are liabilities
    LIABILITY_TYPES = {'credit', 'loan'}
    
    @property
    def provider_type(self) -> AggregatorType:
        return AggregatorType.PLAID
    
    def create_link_token(self, user_id: str, **kwargs) -> LinkTokenResult:
        """Create a Plaid Link token."""
        try:
            link_token = plaid_service.create_link_token(user_id)
            return LinkTokenResult(
                provider=AggregatorType.PLAID,
                link_token=link_token,
                expiration=None,  # Plaid tokens expire in 4 hours
            )
        except Exception as e:
            raise RuntimeError(f"Failed to create Plaid link token: {e}")
    
    def exchange_token(self, public_token: str, **kwargs) -> ExchangeTokenResult:
        """Exchange Plaid public token for access token and fetch accounts."""
        try:
            # Exchange the token
            token_result = plaid_service.exchange_public_token(public_token)
            access_token = token_result['access_token']
            item_id = token_result['item_id']
            
            # Get accounts with balances
            accounts = self.get_account_balances(access_token)
            
            # Get institution info
            institution_id = None
            institution_name = None
            try:
                item_info = plaid_service.get_item(access_token)
                if item_info:
                    institution_id = item_info.get('institution_id')
                    if institution_id:
                        institution_name = plaid_service.get_institution_name(institution_id)
            except Exception as e:
                print(f"[PlaidProvider] Failed to get institution info: {e}")
            
            # Set institution info on accounts
            for account in accounts:
                # AccountInfo is frozen, so we need to create new instances
                # with institution info. For now, we'll handle this at the API level.
                pass
            
            return ExchangeTokenResult(
                provider=AggregatorType.PLAID,
                access_token=access_token,
                provider_item_id=item_id,
                accounts=accounts,
                institution_id=institution_id,
                institution_name=institution_name,
            )
        except Exception as e:
            raise RuntimeError(f"Failed to exchange Plaid token: {e}")
    
    def get_accounts(self, access_token: str) -> List[AccountInfo]:
        """Get all accounts for a Plaid connection."""
        try:
            raw_accounts = plaid_service.get_accounts(access_token)
            return [self._normalize_account(acc) for acc in raw_accounts]
        except Exception as e:
            raise RuntimeError(f"Failed to get Plaid accounts: {e}")
    
    def get_account_balances(self, access_token: str) -> List[AccountInfo]:
        """Get accounts with current balances from Plaid."""
        try:
            raw_accounts = plaid_service.get_accounts_with_balances(access_token)
            return [self._normalize_account(acc) for acc in raw_accounts]
        except Exception as e:
            raise RuntimeError(f"Failed to get Plaid account balances: {e}")
    
    def sync_transactions(
        self, 
        access_token: str, 
        cursor: Optional[str] = None
    ) -> TransactionSyncResult:
        """Sync transactions from Plaid."""
        try:
            result = plaid_service.sync_transactions(access_token, cursor)
            
            return TransactionSyncResult(
                added=[self._normalize_transaction(t) for t in result['added']],
                modified=[self._normalize_transaction(t) for t in result['modified']],
                removed=result['removed'],
                next_cursor=result['next_cursor'],
                has_more=result['has_more'],
            )
        except Exception as e:
            raise RuntimeError(f"Failed to sync Plaid transactions: {e}")
    
    def get_holdings(self, access_token: str) -> Tuple[List[HoldingInfo], List[SecurityInfo]]:
        """Get investment holdings from Plaid."""
        try:
            result = plaid_service.get_holdings(access_token)
            
            securities = [self._normalize_security(s) for s in result['securities']]
            
            # Build a lookup for security info
            security_lookup = {s.provider_security_id: s for s in securities}
            
            holdings = [
                self._normalize_holding(h, security_lookup) 
                for h in result['holdings']
            ]
            
            return holdings, securities
        except Exception as e:
            raise RuntimeError(f"Failed to get Plaid holdings: {e}")
    
    def disconnect(self, access_token: str) -> bool:
        """Remove a Plaid item."""
        try:
            return plaid_service.remove_item(access_token)
        except Exception as e:
            print(f"[PlaidProvider] Failed to disconnect: {e}")
            return False
    
    def supports_institution(self, institution_id: str) -> bool:
        """
        Check if Plaid supports an institution.
        
        Note: Some institutions like Fidelity have limited support in Plaid
        and may require alternative providers like Finicity.
        """
        # Known institutions with limited/no Plaid support
        LIMITED_SUPPORT = {
            'ins_fidelity',  # Fidelity NetBenefits
        }
        return institution_id not in LIMITED_SUPPORT
    
    def get_institution_name(self, institution_id: str) -> Optional[str]:
        """Get institution name from Plaid."""
        try:
            return plaid_service.get_institution_name(institution_id)
        except Exception:
            return None
    
    # === Normalization helpers ===
    
    def _normalize_account(self, raw: Dict[str, Any]) -> AccountInfo:
        """Normalize a Plaid account to AccountInfo."""
        account_type = raw.get('type', 'other')
        is_asset = account_type in self.ASSET_TYPES
        
        return AccountInfo(
            provider_account_id=raw['account_id'],
            name=raw['name'],
            account_type=account_type,
            account_subtype=raw.get('subtype'),
            mask=raw.get('mask'),
            current_balance=raw.get('current_balance'),
            available_balance=None,  # Would need to fetch from balances object
            credit_limit=None,
            is_asset=is_asset,
            institution_id=None,  # Set at higher level
            institution_name=None,  # Set at higher level
            currency_code='USD',
            raw_data=raw,
        )
    
    def _normalize_transaction(self, raw: Dict[str, Any]) -> TransactionInfo:
        """Normalize a Plaid transaction to TransactionInfo."""
        # Parse date strings to date objects
        txn_date = raw['date']
        if isinstance(txn_date, str):
            txn_date = date.fromisoformat(txn_date)
        
        authorized_date = raw.get('authorized_date')
        if authorized_date and isinstance(authorized_date, str):
            authorized_date = date.fromisoformat(authorized_date)
        
        return TransactionInfo(
            provider_transaction_id=raw['plaid_transaction_id'],
            provider_account_id=raw['plaid_account_id'],
            amount=raw['amount'],
            date=txn_date,
            authorized_date=authorized_date,
            name=raw['name'],
            merchant_name=raw.get('merchant_name'),
            category_primary=raw.get('category_primary'),
            category_detailed=raw.get('category_detailed'),
            payment_channel=raw.get('payment_channel'),
            pending=raw.get('pending', False),
            currency_code=raw.get('iso_currency_code', 'USD'),
            location_city=raw.get('location_city'),
            location_region=raw.get('location_region'),
            location_country=raw.get('location_country'),
        )
    
    def _normalize_security(self, raw: Dict[str, Any]) -> SecurityInfo:
        """Normalize a Plaid security to SecurityInfo."""
        close_price_as_of = raw.get('close_price_as_of')
        if close_price_as_of and isinstance(close_price_as_of, str):
            close_price_as_of = date.fromisoformat(close_price_as_of)
        
        return SecurityInfo(
            provider_security_id=raw['security_id'],
            name=raw['name'],
            ticker_symbol=raw.get('ticker_symbol'),
            security_type=raw.get('type'),
            close_price=raw.get('close_price'),
            close_price_as_of=close_price_as_of,
            is_cash_equivalent=raw.get('is_cash_equivalent', False),
            currency_code=raw.get('iso_currency_code', 'USD'),
        )
    
    def _normalize_holding(
        self, 
        raw: Dict[str, Any], 
        security_lookup: Dict[str, SecurityInfo]
    ) -> HoldingInfo:
        """Normalize a Plaid holding to HoldingInfo."""
        security_id = raw['security_id']
        security = security_lookup.get(security_id)
        
        institution_price_as_of = raw.get('institution_price_as_of')
        if institution_price_as_of and isinstance(institution_price_as_of, str):
            institution_price_as_of = date.fromisoformat(institution_price_as_of)
        
        return HoldingInfo(
            provider_account_id=raw['account_id'],
            provider_security_id=security_id,
            security_name=security.name if security else 'Unknown',
            ticker_symbol=security.ticker_symbol if security else None,
            quantity=raw['quantity'],
            institution_price=raw['institution_price'],
            institution_price_as_of=institution_price_as_of,
            institution_value=raw['institution_value'],
            cost_basis=raw.get('cost_basis'),
            currency_code=raw.get('iso_currency_code', 'USD'),
        )


# Singleton instance
plaid_provider = PlaidProvider()
