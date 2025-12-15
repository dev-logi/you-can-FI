/**
 * Net Worth Category Configuration
 * 
 * Display information for asset and liability categories.
 * Used by UI components for labels and colors.
 * 
 * Note: Business logic is now handled by the Python backend.
 * This file only contains display configuration.
 */

import { AssetCategory, LiabilityCategory } from '../../shared/types';

// Category display configuration for assets
export const ASSET_CATEGORY_CONFIG: Record<AssetCategory, { label: string; color: string }> = {
  cash: { label: 'Cash & Checking', color: '#4a7c59' },
  savings: { label: 'Savings', color: '#5a9b6a' },
  retirement_401k: { label: '401(k)', color: '#1e3a5f' },
  retirement_ira: { label: 'Traditional IRA', color: '#2d5a8a' },
  retirement_roth: { label: 'Roth IRA', color: '#3d6a9a' },
  retirement_hsa: { label: 'HSA', color: '#4d7aaa' },
  retirement_pension: { label: 'Pension', color: '#5d8aba' },
  retirement_other: { label: 'Other Retirement', color: '#6d9aca' },
  brokerage: { label: 'Brokerage', color: '#d4a84b' },
  real_estate_primary: { label: 'Primary Residence', color: '#8b7355' },
  real_estate_rental: { label: 'Rental Property', color: '#9b8365' },
  real_estate_land: { label: 'Land', color: '#ab9375' },
  vehicle: { label: 'Vehicles', color: '#636e72' },
  business: { label: 'Business', color: '#2d3436' },
  valuables: { label: 'Valuables', color: '#b8922f' },
  other: { label: 'Other Assets', color: '#a0a0a0' },
};

// Category display configuration for liabilities
export const LIABILITY_CATEGORY_CONFIG: Record<LiabilityCategory, { label: string; color: string }> = {
  mortgage: { label: 'Mortgage', color: '#c75c5c' },
  credit_card: { label: 'Credit Cards', color: '#d77070' },
  auto_loan: { label: 'Auto Loan', color: '#e78484' },
  student_loan: { label: 'Student Loans', color: '#f79898' },
  personal_loan: { label: 'Personal Loan', color: '#e7a8a8' },
  other: { label: 'Other Debt', color: '#c7b8b8' },
};

/**
 * Get display label for an asset category.
 */
export function getAssetCategoryLabel(category: AssetCategory): string {
  return ASSET_CATEGORY_CONFIG[category]?.label ?? category;
}

/**
 * Get display label for a liability category.
 */
export function getLiabilityCategoryLabel(category: LiabilityCategory): string {
  return LIABILITY_CATEGORY_CONFIG[category]?.label ?? category;
}

/**
 * Get display color for an asset category.
 */
export function getAssetCategoryColor(category: AssetCategory): string {
  return ASSET_CATEGORY_CONFIG[category]?.color ?? '#a0a0a0';
}

/**
 * Get display color for a liability category.
 */
export function getLiabilityCategoryColor(category: LiabilityCategory): string {
  return LIABILITY_CATEGORY_CONFIG[category]?.color ?? '#c7b8b8';
}
