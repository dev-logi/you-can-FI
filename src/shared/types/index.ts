/**
 * Core types for the You Can FI personal finance app.
 * These types are designed to be Postgres-compatible for future migration.
 */

// =============================================================================
// Asset & Liability Types
// =============================================================================

export type AssetCategory = 
  | 'cash'
  | 'savings'
  | 'retirement_401k'
  | 'retirement_ira'
  | 'retirement_roth'
  | 'retirement_hsa'
  | 'retirement_pension'
  | 'retirement_other'
  | 'brokerage'
  | 'real_estate_primary'
  | 'real_estate_rental'
  | 'real_estate_land'
  | 'vehicle'
  | 'business'
  | 'valuables'
  | 'other';

export type LiabilityCategory =
  | 'mortgage'
  | 'credit_card'
  | 'auto_loan'
  | 'student_loan'
  | 'personal_loan'
  | 'other';

export interface Asset {
  id: string;
  category: AssetCategory;
  name: string;
  value: number;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
  // Plaid connection fields
  connectedAccountId?: string;
  isConnected?: boolean;
  lastSyncedAt?: string;
}

export interface Liability {
  id: string;
  category: LiabilityCategory;
  name: string;
  balance: number;
  interestRate?: number; // Optional, percentage (e.g., 6.5 for 6.5%)
  createdAt: string;
  updatedAt: string;
  // Plaid connection fields
  connectedAccountId?: string;
  isConnected?: boolean;
  lastSyncedAt?: string;
}

// =============================================================================
// Onboarding Types
// =============================================================================

export type HouseholdType = 'individual' | 'couple' | 'family';

export type QuestionType = 
  | 'welcome'
  | 'single_choice'
  | 'multi_choice'
  | 'yes_no';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  /** If true, selecting this option will create a data entry task */
  createsTask?: boolean;
  /** Task details if createsTask is true */
  taskConfig?: {
    type: 'asset' | 'liability';
    category: AssetCategory | LiabilityCategory;
    defaultName?: string;
  };
  /** If true, this option supports itemization (asking for count) */
  supportsItemization?: boolean;
  /** Label for the count input screen (e.g., "How many savings accounts?") */
  itemizationLabel?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  options?: QuestionOption[];
  /** Next question ID based on answer, or null for default next */
  nextQuestionId?: string | null;
  /** For branching based on specific answers */
  conditionalNext?: Record<string, string>;
  /** If true, this question supports itemization for multi-select */
  supportsItemization?: boolean;
}

export interface DataEntryTask {
  id: string;
  type: 'asset' | 'liability';
  category: AssetCategory | LiabilityCategory;
  defaultName: string;
  isCompleted: boolean;
  /** Reference to the created asset/liability ID once completed */
  entityId?: string;
}

export interface OnboardingState {
  id: string;
  currentStepId: string;
  householdType: HouseholdType | null;
  answers: Record<string, string | string[]>;
  tasks: DataEntryTask[];
  completedTaskIds: string[];
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Net Worth Types
// =============================================================================

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetsByCategory: Record<AssetCategory, number>;
  liabilitiesByCategory: Record<LiabilityCategory, number>;
  lastUpdated: string;
}

export interface CategoryBreakdown {
  category: AssetCategory | LiabilityCategory;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

// =============================================================================
// Database Types (for adapters)
// =============================================================================

/** Snake_case version of Asset for database storage (Postgres-compatible) */
export interface AssetRow {
  [key: string]: unknown;
  id: string;
  category: string;
  name: string;
  value: number;
  created_at: string;
  updated_at: string;
}

/** Snake_case version of Liability for database storage */
export interface LiabilityRow {
  [key: string]: unknown;
  id: string;
  category: string;
  name: string;
  balance: number;
  interest_rate: number | null;
  created_at: string;
  updated_at: string;
}

/** Snake_case version of OnboardingState for database storage */
export interface OnboardingStateRow {
  [key: string]: unknown;
  id: string;
  current_step_id: string;
  household_type: string | null;
  answers_json: string;
  tasks_json: string;
  completed_task_ids_json: string;
  is_complete: number; // SQLite stores booleans as 0/1
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Utility Types
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Category display information */
export interface CategoryInfo {
  id: AssetCategory | LiabilityCategory;
  label: string;
  icon: string;
  color: string;
}

// =============================================================================
// Phase 2 Types (Budget) - Stubs for future implementation
// =============================================================================

/**
 * TODO Phase 2: Transaction tracking
 * These types will be implemented when budget features are added.
 */
export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  isIncome: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string; // YYYY-MM format
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Phase 3 Types (Financial Independence) - Stubs for future implementation
// =============================================================================

/**
 * TODO Phase 3: FI/FIRE calculations
 * These types will be implemented when FI tracking is added.
 */
export interface FISettings {
  id: string;
  annualExpenses: number;
  safeWithdrawalRate: number; // Default 4% (0.04)
  targetFINumber: number;
  currentSavingsRate: number;
  projectedRetirementAge: number;
  createdAt: string;
  updatedAt: string;
}

export interface FIProgress {
  fiNumber: number;
  currentNetWorth: number;
  progressPercentage: number;
  yearsToFI: number;
  coastFINumber: number;
}

