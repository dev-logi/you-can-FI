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

// ========== Global Holdings (Grouped) Types ==========

export interface AccountInfo {
  account_id: string;
  account_name: string;
  institution_name: string;
  quantity: number;
  value: number;
}

export interface AggregatedHolding {
  security_id: string;
  security_name: string;
  ticker_symbol?: string;
  security_type?: string;
  is_cash_equivalent: boolean;
  
  total_quantity: number;
  total_value: number;
  total_cost_basis?: number;
  average_price: number;
  
  accounts_count: number;
  accounts: AccountInfo[];
}

export interface HoldingGroup {
  type: string;
  display_name: string;
  total_value: number;
  holdings_count: number;
  holdings: AggregatedHolding[];
}

export interface GlobalHoldingsResponse {
  total_value: number;
  total_holdings: number;
  groups: HoldingGroup[];
}

class HoldingServiceClass {
  /**
   * Get all holdings for the user, grouped by security type.
   * Securities held across multiple accounts are aggregated.
   */
  async getAllHoldings(): Promise<GlobalHoldingsResponse> {
    return ApiClient.get<GlobalHoldingsResponse>('/holdings/all');
  }

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
