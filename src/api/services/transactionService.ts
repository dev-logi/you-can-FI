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
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MerchantSummary {
  merchant_name: string;
  total_amount: number;
  transaction_count: number;
  last_transaction_date: string;
  category?: string;
}

export interface MerchantListResponse {
  merchants: MerchantSummary[];
  total: number;
}

export interface TransactionUpdateRequest {
  user_category?: string;
  user_notes?: string;
  is_hidden?: boolean;
}

class TransactionServiceClass {
  /**
   * Get transactions with optional filters.
   */
  async getTransactions(filters?: TransactionFilters): Promise<TransactionListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.connected_account_id) {
      params.append('account_id', filters.connected_account_id);
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
    if (filters?.search) {
      params.append('search', filters.search);
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

  /**
   * Get a single transaction by ID.
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    return ApiClient.get<Transaction>(`/transactions/${transactionId}`);
  }

  /**
   * Update a transaction (recategorize, add notes, hide).
   */
  async updateTransaction(
    transactionId: string, 
    data: TransactionUpdateRequest
  ): Promise<Transaction> {
    return ApiClient.put<Transaction>(`/transactions/${transactionId}`, data);
  }

  /**
   * Get merchant spending summary.
   */
  async getMerchants(filters?: {
    start_date?: string;
    end_date?: string;
    account_id?: string;
    limit?: number;
  }): Promise<MerchantListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.start_date) {
      params.append('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params.append('end_date', filters.end_date);
    }
    if (filters?.account_id) {
      params.append('account_id', filters.account_id);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/transactions/merchants?${queryString}` : '/transactions/merchants';
    
    return ApiClient.get<MerchantListResponse>(url);
  }
}

export const TransactionService = new TransactionServiceClass();
