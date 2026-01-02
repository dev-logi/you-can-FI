"""
Plaid Service

Handles all interactions with Plaid API.
"""

from typing import Dict, List, Optional
from plaid.api import plaid_api
from plaid.configuration import Configuration
from plaid.api_client import ApiClient
from plaid.model.country_code import CountryCode
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.accounts_balance_get_request import AccountsBalanceGetRequest
from plaid.model.item_remove_request import ItemRemoveRequest

from app.config import get_settings

settings = get_settings()


class PlaidService:
    """Service for Plaid API interactions."""
    
    def __init__(self):
        """Initialize Plaid client lazily."""
        self._client = None
        self._initialized = False
    
    def _get_plaid_host(self) -> str:
        """Get Plaid host URL based on environment."""
        env = settings.plaid_environment.lower()
        if env == "production":
            return "https://production.plaid.com"
        elif env == "development":
            return "https://development.plaid.com"
        else:  # sandbox
            return "https://sandbox.plaid.com"
    
    @property
    def client(self):
        """Lazy initialization of Plaid client."""
        if not self._initialized:
            try:
                # Validate credentials are set
                if not settings.plaid_client_id or not settings.plaid_secret:
                    raise ValueError("PLAID_CLIENT_ID and PLAID_SECRET must be set")
                
                configuration = Configuration(
                    host=self._get_plaid_host(),
                    api_key={
                        'clientId': settings.plaid_client_id,
                        'secret': settings.plaid_secret,
                    }
                )
                api_client = ApiClient(configuration)
                self._client = plaid_api.PlaidApi(api_client)
                self._initialized = True
            except Exception as e:
                print(f"WARNING: Failed to initialize Plaid client: {e}")
                # Don't raise - allow app to start even if Plaid is misconfigured
                # Actual API calls will fail gracefully with proper error messages
                self._initialized = True  # Mark as initialized to prevent retry loops
                self._client = None
        if self._client is None:
            raise RuntimeError("Plaid client not initialized. Check PLAID_CLIENT_ID and PLAID_SECRET environment variables.")
        return self._client
    
    def create_link_token(self, user_id: str) -> str:
        """
        Create a Plaid Link token for the user.
        
        Args:
            user_id: The user's ID
            
        Returns:
            Link token string
        """
        request = LinkTokenCreateRequest(
            products=[Products('auth'), Products('balance')],
            client_name="You Can FI",
            country_codes=[CountryCode('US')],
            language='en',
            user=LinkTokenCreateRequestUser(
                client_user_id=user_id
            )
        )
        
        response = self.client.link_token_create(request)
        # Plaid SDK v9.0+ returns an object, not a dict
        # Access link_token as an attribute
        if hasattr(response, 'link_token'):
            return response.link_token
        elif isinstance(response, dict):
            return response.get('link_token') or response.get('linkToken')
        else:
            # Try to get it from the response data
            return str(response)
    
    def exchange_public_token(self, public_token: str) -> Dict[str, str]:
        """
        Exchange a public token for an access token.
        
        Args:
            public_token: Public token from Plaid Link
            
        Returns:
            Dictionary with 'access_token' and 'item_id'
        """
        request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )
        
        response = self.client.item_public_token_exchange(request)
        # Plaid SDK v9.0+ returns an object, not a dict
        if hasattr(response, 'access_token'):
            return {
                'access_token': response.access_token,
                'item_id': response.item_id
            }
        elif isinstance(response, dict):
            return {
                'access_token': response.get('access_token') or response.get('accessToken'),
                'item_id': response.get('item_id') or response.get('itemId')
            }
        else:
            # Fallback - try to convert to dict
            return {
                'access_token': getattr(response, 'access_token', ''),
                'item_id': getattr(response, 'item_id', '')
            }
    
    def get_accounts(self, access_token: str) -> List[Dict]:
        """
        Get all accounts for an item.
        
        Args:
            access_token: Plaid access token
            
        Returns:
            List of account dictionaries
        """
        request = AccountsGetRequest(access_token=access_token)
        response = self.client.accounts_get(request)
        
        # Plaid SDK v9.0+ returns an object, not a dict
        accounts_data = response.accounts if hasattr(response, 'accounts') else response.get('accounts', []) if isinstance(response, dict) else []
        
        accounts = []
        for account in accounts_data:
            # Handle both object and dict formats
            if hasattr(account, 'account_id'):
                accounts.append({
                    'account_id': account.account_id,
                    'name': account.name,
                    'type': account.type,
                    'subtype': getattr(account, 'subtype', None),
                    'mask': getattr(account, 'mask', None),  # Last 4 digits
                })
            else:
                accounts.append({
                    'account_id': account.get('account_id') or account.get('accountId'),
                    'name': account.get('name'),
                    'type': account.get('type'),
                    'subtype': account.get('subtype'),
                    'mask': account.get('mask'),  # Last 4 digits
                })
        
        return accounts
    
    def get_balance(self, access_token: str, account_id: str) -> Optional[Dict]:
        """
        Get current balance for a specific account.
        
        Args:
            access_token: Plaid access token
            account_id: Plaid account ID
            
        Returns:
            Dictionary with balance information or None if error
        """
        try:
            request = AccountsBalanceGetRequest(
                access_token=access_token,
                account_ids=[account_id]
            )
            response = self.client.accounts_balance_get(request)
            
            # Plaid SDK v9.0+ returns an object, not a dict
            accounts_data = response.accounts if hasattr(response, 'accounts') else response.get('accounts', []) if isinstance(response, dict) else []
            
            if accounts_data:
                account = accounts_data[0]
                # Handle both object and dict formats
                if hasattr(account, 'balances'):
                    balances = account.balances
                    return {
                        'available': getattr(balances, 'available', None),
                        'current': getattr(balances, 'current', None),
                        'limit': getattr(balances, 'limit', None),
                    }
                else:
                    balances = account.get('balances', {}) if isinstance(account, dict) else {}
                    return {
                        'available': balances.get('available') if isinstance(balances, dict) else None,
                        'current': balances.get('current') if isinstance(balances, dict) else None,
                        'limit': balances.get('limit') if isinstance(balances, dict) else None,
                    }
        except Exception as e:
            print(f"Error fetching balance: {e}")
            return None
        
        return None
    
    def get_item(self, access_token: str) -> Optional[Dict]:
        """
        Get item (institution) information.
        
        Args:
            access_token: Plaid access token
            
        Returns:
            Dictionary with item information or None if error
        """
        try:
            # Note: Plaid Python SDK doesn't have a direct item_get method
            # We'll get institution info from accounts_get response
            request = AccountsGetRequest(access_token=access_token)
            response = self.client.accounts_get(request)
            
            # Get institution from item (if available in response)
            # This is a simplified version - you may need to adjust based on actual SDK
            return {
                'item_id': response.get('item', {}).get('item_id'),
                'institution_id': response.get('item', {}).get('institution_id'),
            }
        except Exception as e:
            print(f"Error fetching item: {e}")
            return None
    
    def remove_item(self, access_token: str) -> bool:
        """
        Remove (disconnect) an item.
        
        Args:
            access_token: Plaid access token
            
        Returns:
            True if successful, False otherwise
        """
        try:
            request = ItemRemoveRequest(access_token=access_token)
            response = self.client.item_remove(request)
            # Plaid SDK v9.0+ returns an object, not a dict
            if hasattr(response, 'removed'):
                return response.removed
            elif isinstance(response, dict):
                return response.get('removed', False)
            else:
                return False
        except Exception as e:
            print(f"Error removing item: {e}")
            return False


# Singleton instance
plaid_service = PlaidService()

