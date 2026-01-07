/**
 * Plaid API Service
 * 
 * Handles Plaid integration via the backend API.
 */

import { ApiClient } from '../client';

export interface LinkTokenResponse {
  link_token: string;
}

export interface PlaidAccountInfo {
  account_id: string;
  name: string;
  type: string;
  subtype?: string;
  mask?: string;
  suggested_category?: string;
  is_asset: boolean;
  current_balance?: number;  // Current balance from Plaid
}

export interface ConnectedAccount {
  id: string;
  institution_name: string;
  account_name: string;
  account_type: string;
  account_subtype?: string;
  is_active: boolean;
  last_synced_at?: string;
  last_sync_error?: string;
  created_at: string;
}

export interface ConnectedAccountListResponse {
  accounts: ConnectedAccount[];
}

export interface SyncResponse {
  success: boolean;
  message: string;
  total?: number;
  successful?: number;
  failed?: number;
  errors?: Array<{
    account_id: string;
    account_name: string;
    error: string;
  }>;
}

export interface LinkAccountRequest {
  connected_account_id: string;
  entity_id: string;
  entity_type: 'asset' | 'liability';
}

class PlaidApiServiceClass {
  /**
   * Generate a Plaid Link token for the user.
   */
  async createLinkToken(): Promise<string> {
    const response = await ApiClient.post<LinkTokenResponse>('/plaid/link-token', {});
    return response.link_token;
  }

  /**
   * Exchange public token for access token and fetch accounts.
   */
  async exchangePublicToken(publicToken: string): Promise<PlaidAccountInfo[]> {
    console.log('[PlaidApiService] exchangePublicToken called with publicToken:', publicToken);
    try {
      console.log('[PlaidApiService] Making POST request to /plaid/exchange-token');
      const response = await ApiClient.post<PlaidAccountInfo[]>('/plaid/exchange-token', {
        public_token: publicToken,
      });
      console.log('[PlaidApiService] Exchange successful, response:', response);
      return response;
    } catch (error) {
      console.error('[PlaidApiService] Exchange token error:', error);
      console.error('[PlaidApiService] Error type:', typeof error);
      console.error('[PlaidApiService] Error keys:', Object.keys(error || {}));
      console.error('[PlaidApiService] Error detail:', (error as any)?.detail);
      console.error('[PlaidApiService] Error message:', (error as any)?.message);
      console.error('[PlaidApiService] Error status:', (error as any)?.status);
      throw error;
    }
  }

  /**
   * Get all connected accounts for the current user.
   */
  async getConnectedAccounts(): Promise<ConnectedAccount[]> {
    const response = await ApiClient.get<ConnectedAccountListResponse>('/plaid/accounts');
    return response.accounts;
  }

  /**
   * Sync all connected accounts.
   */
  async syncAllAccounts(): Promise<SyncResponse> {
    return await ApiClient.post<SyncResponse>('/plaid/sync', {});
  }

  /**
   * Sync a specific connected account.
   */
  async syncAccount(accountId: string): Promise<SyncResponse> {
    return await ApiClient.post<SyncResponse>(`/plaid/accounts/${accountId}/sync`, {});
  }

  /**
   * Link a Plaid account to an existing asset or liability.
   */
  async linkAccount(request: LinkAccountRequest): Promise<any> {
    console.log('[PlaidApiService] linkAccount called with:', request);
    try {
      const response = await ApiClient.post(`/plaid/accounts/${request.connected_account_id}/link`, {
        entity_id: request.entity_id,
        entity_type: request.entity_type,
      });
      console.log('[PlaidApiService] linkAccount successful, response:', response);
      return response;
    } catch (error: any) {
      console.error('[PlaidApiService] linkAccount failed:', error);
      console.error('[PlaidApiService] Error detail:', error?.detail);
      console.error('[PlaidApiService] Error status:', error?.status);
      throw error;
    }
  }

  /**
   * Disconnect a Plaid account.
   */
  async disconnectAccount(accountId: string): Promise<void> {
    await ApiClient.delete(`/plaid/accounts/${accountId}`);
  }
}

export const PlaidApiService = new PlaidApiServiceClass();

