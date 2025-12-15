/**
 * Net Worth API Service
 * 
 * Handles net worth calculations via the backend API.
 */

import { ApiClient } from '../client';
import {
  Asset,
  Liability,
  AssetCategory,
  LiabilityCategory,
  NetWorthSummary,
  CategoryBreakdown,
} from '../../shared/types';
import { AssetApiService } from './assetService';
import { LiabilityApiService } from './liabilityService';

interface NetWorthResponse {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  assets_by_category: Record<string, number>;
  liabilities_by_category: Record<string, number>;
  asset_breakdown: Array<{
    category: string;
    label: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  liability_breakdown: Array<{
    category: string;
    label: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  last_updated: string;
}

class NetWorthApiServiceClass {
  /**
   * Calculate complete net worth summary.
   */
  async calculate(): Promise<NetWorthSummary> {
    const response = await ApiClient.get<NetWorthResponse>('/net-worth');
    
    return {
      totalAssets: response.total_assets,
      totalLiabilities: response.total_liabilities,
      netWorth: response.net_worth,
      assetsByCategory: response.assets_by_category as Record<AssetCategory, number>,
      liabilitiesByCategory: response.liabilities_by_category as Record<LiabilityCategory, number>,
      lastUpdated: response.last_updated,
    };
  }

  /**
   * Get asset breakdown for charts.
   */
  async getAssetBreakdown(): Promise<CategoryBreakdown[]> {
    const response = await ApiClient.get<NetWorthResponse>('/net-worth');
    return response.asset_breakdown.map((item) => ({
      category: item.category as AssetCategory,
      label: item.label,
      value: item.value,
      percentage: item.percentage,
      color: item.color,
    }));
  }

  /**
   * Get liability breakdown for charts.
   */
  async getLiabilityBreakdown(): Promise<CategoryBreakdown[]> {
    const response = await ApiClient.get<NetWorthResponse>('/net-worth');
    return response.liability_breakdown.map((item) => ({
      category: item.category as LiabilityCategory,
      label: item.label,
      value: item.value,
      percentage: item.percentage,
      color: item.color,
    }));
  }

  /**
   * Get all assets.
   */
  async getAssets(): Promise<Asset[]> {
    return AssetApiService.list();
  }

  /**
   * Get all liabilities.
   */
  async getLiabilities(): Promise<Liability[]> {
    return LiabilityApiService.list();
  }

  /**
   * Add a new asset.
   */
  async addAsset(data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
    return AssetApiService.create(data);
  }

  /**
   * Update an existing asset.
   */
  async updateAsset(
    id: string,
    data: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Asset | null> {
    return AssetApiService.update(id, data);
  }

  /**
   * Delete an asset.
   */
  async deleteAsset(id: string): Promise<boolean> {
    return AssetApiService.delete(id);
  }

  /**
   * Add a new liability.
   */
  async addLiability(
    data: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Liability> {
    return LiabilityApiService.create({
      category: data.category,
      name: data.name,
      balance: data.balance,
      interest_rate: data.interestRate,
    });
  }

  /**
   * Update an existing liability.
   */
  async updateLiability(
    id: string,
    data: Partial<Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Liability | null> {
    return LiabilityApiService.update(id, {
      category: data.category,
      name: data.name,
      balance: data.balance,
      interest_rate: data.interestRate,
    });
  }

  /**
   * Delete a liability.
   */
  async deleteLiability(id: string): Promise<boolean> {
    return LiabilityApiService.delete(id);
  }
}

// Export singleton instance
export const NetWorthApiService = new NetWorthApiServiceClass();

