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
        """Initialize Plaid client."""
        configuration = Configuration(
            host=getattr(plaid_api.Environment, settings.plaid_environment.upper(), plaid_api.Environment.sandbox),
            api_key={
                'clientId': settings.plaid_client_id,
                'secret': settings.plaid_secret,
            }
        )
        api_client = ApiClient(configuration)
        self.client = plaid_api.PlaidApi(api_client)
    
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
        return response['link_token']
    
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
        return {
            'access_token': response['access_token'],
            'item_id': response['item_id']
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
        
        accounts = []
        for account in response['accounts']:
            accounts.append({
                'account_id': account['account_id'],
                'name': account['name'],
                'type': account['type'],
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
            
            if response['accounts']:
                account = response['accounts'][0]
                return {
                    'available': account.get('balances', {}).get('available'),
                    'current': account.get('balances', {}).get('current'),
                    'limit': account.get('balances', {}).get('limit'),
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
            return response.get('removed', False)
        except Exception as e:
            print(f"Error removing item: {e}")
            return False


# Singleton instance
plaid_service = PlaidService()

