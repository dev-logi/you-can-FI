/**
 * Financial Independence Service (Phase 3 Stub)
 * 
 * This service will handle FI/FIRE calculations in Phase 3.
 * Currently implements core calculation functions only.
 * 
 * TODO Phase 3:
 * - Integrate with FISettingsRepository
 * - Connect with NetWorthService for current values
 * - Connect with BudgetService for savings rate
 * - Implement scenario comparisons
 */

import { FISettings, FIProgress, FIScenario, FI_MILESTONES, FIMilestone } from './types';
// Note: Will integrate with NetWorthApiService in Phase 3

class FIServiceClass {
  // Default assumptions
  private defaultSWR = 0.04; // 4% safe withdrawal rate
  private defaultReturnRate = 0.07; // 7% annual return
  private defaultInflationRate = 0.03; // 3% inflation

  /**
   * Calculate FI number (target net worth for independence).
   * Formula: Annual Expenses / Safe Withdrawal Rate
   * 
   * Example: $50,000 / 0.04 = $1,250,000
   */
  calculateFINumber(annualExpenses: number, swr: number = this.defaultSWR): number {
    if (swr <= 0 || swr > 1) {
      throw new Error('Safe withdrawal rate must be between 0 and 1');
    }
    return annualExpenses / swr;
  }

  /**
   * Calculate years to FI based on current savings rate.
   * Uses the "shockingly simple math" formula.
   * 
   * Note: This is a simplified calculation. Real implementation
   * should account for sequence of returns risk, inflation, etc.
   */
  calculateYearsToFI(
    currentNetWorth: number,
    targetFINumber: number,
    monthlyContribution: number,
    annualReturnRate: number = this.defaultReturnRate
  ): number {
    if (currentNetWorth >= targetFINumber) {
      return 0; // Already FI!
    }

    if (monthlyContribution <= 0) {
      // Without contributions, use compound growth only
      const yearsNeeded = Math.log(targetFINumber / Math.max(currentNetWorth, 1)) / 
                         Math.log(1 + annualReturnRate);
      return Math.max(0, yearsNeeded);
    }

    // Future Value calculation with monthly contributions
    const monthlyRate = annualReturnRate / 12;
    const annualContribution = monthlyContribution * 12;

    // Iterative calculation (more accurate than closed-form for this use case)
    let balance = currentNetWorth;
    let years = 0;
    const maxYears = 100;

    while (balance < targetFINumber && years < maxYears) {
      balance = balance * (1 + annualReturnRate) + annualContribution;
      years++;
    }

    return years;
  }

  /**
   * Calculate Coast FI number.
   * The amount needed where compound growth alone will reach FI by target age.
   */
  calculateCoastFI(
    targetFINumber: number,
    currentAge: number,
    targetRetirementAge: number,
    annualReturnRate: number = this.defaultReturnRate
  ): number {
    const yearsToRetirement = targetRetirementAge - currentAge;
    if (yearsToRetirement <= 0) return targetFINumber;

    // Present value calculation
    return targetFINumber / Math.pow(1 + annualReturnRate, yearsToRetirement);
  }

  /**
   * Calculate FI progress percentage.
   */
  calculateProgress(currentNetWorth: number, targetFINumber: number): number {
    if (targetFINumber <= 0) return 0;
    return Math.min(100, (currentNetWorth / targetFINumber) * 100);
  }

  /**
   * Get FI milestones with status.
   */
  getMilestones(currentProgress: number): FIMilestone[] {
    return FI_MILESTONES.map((milestone) => ({
      ...milestone,
      reached: currentProgress >= milestone.percentage,
    }));
  }

  /**
   * Get full FI progress report.
   * TODO Phase 3: Implement with actual data from services.
   */
  async getProgress(): Promise<FIProgress> {
    throw new Error('[FIService] Full implementation coming in Phase 3.');
  }

  /**
   * Save FI settings.
   * TODO Phase 3: Implement with FISettingsRepository.
   */
  async saveSettings(_settings: Partial<FISettings>): Promise<FISettings> {
    throw new Error('[FIService] Not implemented. Coming in Phase 3.');
  }

  /**
   * Get FI settings.
   * TODO Phase 3: Implement with FISettingsRepository.
   */
  async getSettings(): Promise<FISettings | null> {
    throw new Error('[FIService] Not implemented. Coming in Phase 3.');
  }

  /**
   * Create a scenario for comparison.
   */
  async createScenario(_scenario: Omit<FIScenario, 'id' | 'createdAt'>): Promise<FIScenario> {
    throw new Error('[FIService] Not implemented. Coming in Phase 3.');
  }

  /**
   * Compare multiple scenarios.
   */
  async compareScenarios(_scenarioIds: string[]): Promise<FIScenario[]> {
    throw new Error('[FIService] Not implemented. Coming in Phase 3.');
  }
}

// Export singleton instance
export const FIService = new FIServiceClass();

