/**
 * Transaction Service
 * 
 * Handles API calls for transaction syncing and retrieval.
 */

import { ApiClient } from '../client';

export interface Transaction {
  id: string;
  connected_account_id: string;
  plaid_transaction_id: string;
  
  // Transaction details
  amount: number;
  iso_currency_code: string;
  date: string;
  authorized_date?: string;
  
  // Merchant info
  name: string;
  merchant_name?: string;
  
  // Categories
  category_primary?: string;
  category_detailed?: string;
  
  // Payment info
  payment_channel?: string;
  pending: boolean;
  
  // Location
  location_city?: string;
  location_region?: string;
  location_country?: string;
  
  // User customization
  user_category?: string;
  user_notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface TransactionSyncResponse {
  success: boolean;
  message: string;
  added: number;
  modified: number;
  removed: number;
}

export interface TransactionFilters {
  connected_account_id?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

class TransactionServiceClass {
  /**
   * Get transactions with optional filters.
   */
  async getTransactions(filters?: TransactionFilters): Promise<TransactionListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.connected_account_id) {
      params.append('connected_account_id', filters.connected_account_id);
    }
    if (filters?.start_date) {
      params.append('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params.append('end_date', filters.end_date);
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/transactions/?${queryString}` : '/transactions/';
    
    return ApiClient.get<TransactionListResponse>(url);
  }

  /**
   * Get transactions for a specific connected account.
   */
  async getAccountTransactions(
    connectedAccountId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<TransactionListResponse> {
    return ApiClient.get<TransactionListResponse>(
      `/transactions/account/${connectedAccountId}?limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Sync transactions for a specific connected account.
   */
  async syncAccount(connectedAccountId: string): Promise<TransactionSyncResponse> {
    return ApiClient.post<TransactionSyncResponse>(
      `/transactions/sync/${connectedAccountId}`
    );
  }

  /**
   * Sync transactions for all connected accounts.
   */
  async syncAll(): Promise<TransactionSyncResponse> {
    return ApiClient.post<TransactionSyncResponse>('/transactions/sync');
  }
}

export const TransactionService = new TransactionServiceClass();
