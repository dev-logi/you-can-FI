/**
 * Holding Service
 * 
 * Handles API calls for investment holdings.
 */

import { ApiClient } from '../client';

export interface Security {
  id: string;
  plaid_security_id: string;
  name: string;
  ticker_symbol?: string;
  is_cash_equivalent: boolean;
  type?: string;
  close_price?: number;
  close_price_as_of?: string;
  iso_currency_code: string;
}

export interface Holding {
  id: string;
  connected_account_id: string;
  security_id: string;
  security?: Security;
  
  institution_price: number;
  institution_price_as_of?: string;
  institution_value: number;
  cost_basis?: number;
  quantity: number;
  iso_currency_code: string;
  
  created_at: string;
  updated_at: string;
}

export interface HoldingListResponse {
  holdings: Holding[];
  total: number;
}

export interface HoldingSyncResponse {
  success: boolean;
  message: string;
  added: number;
  securities: number;
}

class HoldingServiceClass {
  /**
   * Get holdings for a specific connected account.
   */
  async getAccountHoldings(connectedAccountId: string): Promise<HoldingListResponse> {
    return ApiClient.get<HoldingListResponse>(
      `/holdings/account/${connectedAccountId}`
    );
  }

  /**
   * Sync holdings for a specific connected account.
   */
  async syncAccount(connectedAccountId: string): Promise<HoldingSyncResponse> {
    return ApiClient.post<HoldingSyncResponse>(
      `/holdings/sync/${connectedAccountId}`
    );
  }
}

export const HoldingService = new HoldingServiceClass();
