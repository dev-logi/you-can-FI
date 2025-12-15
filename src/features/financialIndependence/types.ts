/**
 * Financial Independence Types (Phase 3 Stub)
 * 
 * These types will be fully implemented in Phase 3.
 * Currently defined for architecture planning.
 * 
 * TODO Phase 3:
 * - Implement FI number calculation
 * - Add progress tracking
 * - Support multiple scenarios
 * - Coast FI calculations
 */

export interface FISettings {
  id: string;
  
  // Core inputs
  annualExpenses: number;
  safeWithdrawalRate: number; // Default 4% (0.04)
  
  // Optional adjustments
  expectedReturnRate?: number; // Default 7%
  inflationRate?: number; // Default 3%
  currentAge?: number;
  targetRetirementAge?: number;
  
  // Calculated values (stored for quick access)
  targetFINumber: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface FIProgress {
  // Current state
  currentNetWorth: number;
  targetFINumber: number;
  progressPercentage: number;
  
  // Projections
  yearsToFI: number;
  monthsToFI: number;
  projectedFIDate: string;
  
  // Savings metrics (from budget integration)
  monthlySavings?: number;
  savingsRate?: number;
  
  // Coast FI
  coastFINumber: number;
  coastFIReached: boolean;
  
  // Status
  fiReached: boolean;
  lastUpdated: string;
}

export interface FIScenario {
  id: string;
  name: string;
  
  // Scenario adjustments
  annualExpenses: number;
  monthlyContribution: number;
  expectedReturnRate: number;
  
  // Calculated
  yearsToFI: number;
  targetFINumber: number;
  
  createdAt: string;
}

export type FIMilestone = {
  percentage: number;
  label: string;
  reached: boolean;
  reachedDate?: string;
};

export const FI_MILESTONES: FIMilestone[] = [
  { percentage: 0, label: 'Getting Started', reached: false },
  { percentage: 25, label: '25% - Quarter Way', reached: false },
  { percentage: 50, label: '50% - Half Way', reached: false },
  { percentage: 75, label: '75% - Coast FI Zone', reached: false },
  { percentage: 100, label: '100% - FI Achieved!', reached: false },
];

