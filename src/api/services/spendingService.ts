/**
 * Spending Service
 * 
 * Handles API calls for spending analytics and cash flow.
 */

import { ApiClient } from '../client';

// ========== Types ==========

export interface CategorySpending {
  category: string;
  display_name: string;
  amount: number;
  percentage: number;
  transaction_count: number;
  icon: string;
}

export interface SpendingSummaryResponse {
  start_date: string;
  end_date: string;
  
  total_spending: number;
  total_income: number;
  net_cash_flow: number;
  
  previous_period_spending?: number;
  spending_change_percent?: number;
  
  categories: CategorySpending[];
  
  transaction_count: number;
  category_count: number;
}

export interface MonthlyAmount {
  month: string;
  amount: number;
  transaction_count: number;
}

export interface SubCategorySpending {
  category: string;
  display_name: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface CategoryDetailResponse {
  category: string;
  display_name: string;
  current_amount: number;
  current_transaction_count: number;
  monthly_trend: MonthlyAmount[];
  sub_categories: SubCategorySpending[];
}

export interface IncomeSource {
  name: string;
  amount: number;
  transaction_count: number;
}

export interface MonthlyCashFlow {
  month: string;
  income: number;
  expenses: number;
  net: number;
  savings_rate: number;
}

export interface CashFlowSummaryResponse {
  start_date: string;
  end_date: string;
  
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  savings_rate: number;
  
  income_sources: IncomeSource[];
  monthly_history: MonthlyCashFlow[];
}

export interface RecurringTransaction {
  merchant_name: string;
  category?: string;
  display_name?: string;
  average_amount: number;
  frequency: string;
  last_date: string;
  next_expected_date?: string;
  transaction_count: number;
  is_subscription: boolean;
}

export interface RecurringTransactionsResponse {
  recurring: RecurringTransaction[];
  estimated_monthly_total: number;
  count: number;
}

// ========== Service ==========

class SpendingServiceClass {
  /**
   * Get spending summary for a time period.
   * Defaults to current month if no dates provided.
   */
  async getSummary(startDate?: string, endDate?: string): Promise<SpendingSummaryResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const query = params.toString();
    return ApiClient.get<SpendingSummaryResponse>(
      `/spending/summary${query ? `?${query}` : ''}`
    );
  }

  /**
   * Get detailed spending for a specific category.
   */
  async getCategoryDetail(category: string): Promise<CategoryDetailResponse> {
    return ApiClient.get<CategoryDetailResponse>(
      `/spending/by-category/${encodeURIComponent(category)}`
    );
  }

  /**
   * Get cash flow summary with income vs expenses.
   * @param months Number of months of history to include
   * @param excludeTransfers Whether to exclude transfers (default: true)
   */
  async getCashFlow(months: number = 6, excludeTransfers: boolean = true): Promise<CashFlowSummaryResponse> {
    const params = new URLSearchParams();
    params.append('months', months.toString());
    params.append('exclude_transfers', excludeTransfers.toString());
    return ApiClient.get<CashFlowSummaryResponse>(
      `/spending/cashflow?${params.toString()}`
    );
  }

  /**
   * Get detected recurring transactions (subscriptions, bills).
   */
  async getRecurring(): Promise<RecurringTransactionsResponse> {
    return ApiClient.get<RecurringTransactionsResponse>('/spending/recurring');
  }
}

export const SpendingService = new SpendingServiceClass();
