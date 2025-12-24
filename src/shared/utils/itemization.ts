/**
 * Itemization Utilities
 * 
 * Helper functions to determine which categories support itemization.
 */

import { AssetCategory, LiabilityCategory } from '../types';

/**
 * Asset categories that support itemization (can have multiple instances)
 */
export const ITEMIZABLE_ASSET_CATEGORIES: AssetCategory[] = [
  'cash',
  'savings',
  'retirement_401k',
  'retirement_ira',
  'retirement_roth',
  'retirement_hsa',
  'retirement_pension',
  'retirement_other',
  'brokerage',
  'vehicle',
];

/**
 * Liability categories that support itemization (can have multiple instances)
 */
export const ITEMIZABLE_LIABILITY_CATEGORIES: LiabilityCategory[] = [
  'mortgage',
  'credit_card',
  'auto_loan',
  'student_loan',
  'other',
];

/**
 * Check if an asset category supports itemization
 */
export function isAssetCategoryItemizable(category: AssetCategory): boolean {
  return ITEMIZABLE_ASSET_CATEGORIES.includes(category);
}

/**
 * Check if a liability category supports itemization
 */
export function isLiabilityCategoryItemizable(category: LiabilityCategory): boolean {
  return ITEMIZABLE_LIABILITY_CATEGORIES.includes(category);
}

/**
 * Get itemization label for an asset category
 */
export function getAssetItemizationLabel(category: AssetCategory): string {
  const labels: Record<AssetCategory, string> = {
    cash: 'How many checking or cash accounts do you have?',
    savings: 'How many savings accounts do you have?',
    retirement_401k: 'How many 401(k) / 403(b) accounts?',
    retirement_ira: 'How many Traditional IRA accounts?',
    retirement_roth: 'How many Roth IRA accounts?',
    retirement_hsa: 'How many HSA accounts?',
    retirement_pension: 'How many pension accounts?',
    retirement_other: 'How many other retirement accounts?',
    brokerage: 'How many brokerage or investment accounts do you have?',
    vehicle: 'How many vehicles do you own?',
    real_estate_primary: 'How many primary residences?',
    real_estate_rental: 'How many rental properties?',
    real_estate_land: 'How many land properties?',
    business: 'How many businesses?',
    valuables: 'How many valuable items?',
    other: 'How many other assets?',
  };
  return labels[category] || 'How many do you have?';
}

/**
 * Get itemization label for a liability category
 */
export function getLiabilityItemizationLabel(category: LiabilityCategory): string {
  const labels: Record<LiabilityCategory, string> = {
    mortgage: 'How many mortgages do you have?',
    credit_card: 'How many credit cards do you have?',
    auto_loan: 'How many auto loans do you have?',
    student_loan: 'How many student loans do you have?',
    personal_loan: 'How many personal loans do you have?',
    other: 'How many other debts do you have?',
  };
  return labels[category] || 'How many do you have?';
}

/**
 * Get itemization label for adding additional asset items (when some already exist)
 */
export function getAssetAdditionalItemizationLabel(category: AssetCategory): string {
  const labels: Record<AssetCategory, string> = {
    cash: 'How many additional checking or cash accounts do you have?',
    savings: 'How many additional savings accounts do you have?',
    retirement_401k: 'How many additional 401(k) / 403(b) accounts?',
    retirement_ira: 'How many additional Traditional IRA accounts?',
    retirement_roth: 'How many additional Roth IRA accounts?',
    retirement_hsa: 'How many additional HSA accounts?',
    retirement_pension: 'How many additional pension accounts?',
    retirement_other: 'How many additional other retirement accounts?',
    brokerage: 'How many additional brokerage or investment accounts do you have?',
    vehicle: 'How many additional vehicles do you own?',
    real_estate_primary: 'How many additional primary residences?',
    real_estate_rental: 'How many additional rental properties?',
    real_estate_land: 'How many additional land properties?',
    business: 'How many additional businesses?',
    valuables: 'How many additional valuable items?',
    other: 'How many additional other assets?',
  };
  return labels[category] || 'How many additional do you have?';
}

/**
 * Get itemization label for adding additional liability items (when some already exist)
 */
export function getLiabilityAdditionalItemizationLabel(category: LiabilityCategory): string {
  const labels: Record<LiabilityCategory, string> = {
    mortgage: 'How many additional mortgages do you have?',
    credit_card: 'How many additional credit cards do you have?',
    auto_loan: 'How many additional auto loans do you have?',
    student_loan: 'How many additional student loans do you have?',
    personal_loan: 'How many additional personal loans do you have?',
    other: 'How many additional other debts do you have?',
  };
  return labels[category] || 'How many additional do you have?';
}

