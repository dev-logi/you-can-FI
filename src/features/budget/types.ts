/**
 * Budget & Spending Types (Phase 2 Stub)
 * 
 * These types will be fully implemented in Phase 2.
 * Currently defined for architecture planning.
 * 
 * TODO Phase 2:
 * - Implement transaction tracking
 * - Add budget categories
 * - Calculate savings rate
 * - Add income tracking
 */

export type TransactionCategory =
  | 'housing'
  | 'transportation'
  | 'food'
  | 'utilities'
  | 'healthcare'
  | 'insurance'
  | 'entertainment'
  | 'shopping'
  | 'personal'
  | 'education'
  | 'savings'
  | 'debt_payment'
  | 'income'
  | 'other';

export interface Transaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string; // ISO 8601
  isIncome: boolean;
  accountId?: string; // Link to asset (checking account, etc.)
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: TransactionCategory;
  monthlyLimit: number;
  month: string; // YYYY-MM format
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number; // Percentage
  categorySpending: Record<TransactionCategory, number>;
  categoryBudgets: Record<TransactionCategory, number>;
}

export interface MonthlyReport {
  month: string;
  summary: BudgetSummary;
  transactions: Transaction[];
  overBudgetCategories: TransactionCategory[];
}

