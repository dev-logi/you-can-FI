/**
 * Asset API Service
 * 
 * Handles asset CRUD operations via the backend API.
 */

import { ApiClient } from '../client';
import { Asset, AssetCategory } from '../../shared/types';

interface AssetCreateRequest {
  category: AssetCategory;
  name: string;
  value: number;
}

interface AssetUpdateRequest {
  category?: AssetCategory;
  name?: string;
  value?: number;
}

interface AssetResponse {
  id: string;
  category: string;
  name: string;
  value: number;
  created_at: string;
  updated_at: string;
  connected_account_id?: string | null;
  is_connected?: boolean;
  last_synced_at?: string | null;
}

/**
 * Convert API response to Asset type.
 */
function toAsset(response: AssetResponse): Asset {
  return {
    id: response.id,
    category: response.category as AssetCategory,
    name: response.name,
    value: response.value,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    connectedAccountId: response.connected_account_id || undefined,
    isConnected: response.is_connected || false,
    lastSyncedAt: response.last_synced_at || undefined,
  };
}

class AssetApiServiceClass {
  /**
   * Create a new asset.
   */
  async create(data: AssetCreateRequest): Promise<Asset> {
    const response = await ApiClient.post<AssetResponse>('/assets/', data);
    return toAsset(response);
  }

  /**
   * Get all assets.
   */
  async list(): Promise<Asset[]> {
    const response = await ApiClient.get<AssetResponse[]>('/assets/');
    return response.map(toAsset);
  }

  /**
   * Get an asset by ID.
   */
  async getById(id: string): Promise<Asset | null> {
    try {
      const response = await ApiClient.get<AssetResponse>(`/assets/${id}`);
      return toAsset(response);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update an asset.
   */
  async update(id: string, data: AssetUpdateRequest): Promise<Asset | null> {
    try {
      const response = await ApiClient.put<AssetResponse>(`/assets/${id}`, data);
      return toAsset(response);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete an asset.
   */
  async delete(id: string): Promise<boolean> {
    try {
      await ApiClient.delete(`/assets/${id}`);
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get assets by category.
   */
  async getByCategory(category: AssetCategory): Promise<Asset[]> {
    const response = await ApiClient.get<AssetResponse[]>(`/assets/category/${category}`);
    return response.map(toAsset);
  }
}

// Export singleton instance
export const AssetApiService = new AssetApiServiceClass();

