/**
 * Liability API Service
 * 
 * Handles liability CRUD operations via the backend API.
 */

import { ApiClient } from '../client';
import { Liability, LiabilityCategory } from '../../shared/types';

interface LiabilityCreateRequest {
  category: LiabilityCategory;
  name: string;
  balance: number;
  interest_rate?: number;
}

interface LiabilityUpdateRequest {
  category?: LiabilityCategory;
  name?: string;
  balance?: number;
  interest_rate?: number;
}

interface LiabilityResponse {
  id: string;
  category: string;
  name: string;
  balance: number;
  interest_rate: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert API response to Liability type.
 */
function toLiability(response: LiabilityResponse): Liability {
  return {
    id: response.id,
    category: response.category as LiabilityCategory,
    name: response.name,
    balance: response.balance,
    interestRate: response.interest_rate ?? undefined,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

class LiabilityApiServiceClass {
  /**
   * Create a new liability.
   */
  async create(data: LiabilityCreateRequest): Promise<Liability> {
    const response = await ApiClient.post<LiabilityResponse>('/liabilities', data);
    return toLiability(response);
  }

  /**
   * Get all liabilities.
   */
  async list(): Promise<Liability[]> {
    const response = await ApiClient.get<LiabilityResponse[]>('/liabilities');
    return response.map(toLiability);
  }

  /**
   * Get a liability by ID.
   */
  async getById(id: string): Promise<Liability | null> {
    try {
      const response = await ApiClient.get<LiabilityResponse>(`/liabilities/${id}`);
      return toLiability(response);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update a liability.
   */
  async update(id: string, data: LiabilityUpdateRequest): Promise<Liability | null> {
    try {
      const response = await ApiClient.put<LiabilityResponse>(`/liabilities/${id}`, data);
      return toLiability(response);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a liability.
   */
  async delete(id: string): Promise<boolean> {
    try {
      await ApiClient.delete(`/liabilities/${id}`);
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get liabilities by category.
   */
  async getByCategory(category: LiabilityCategory): Promise<Liability[]> {
    const response = await ApiClient.get<LiabilityResponse[]>(`/liabilities/category/${category}`);
    return response.map(toLiability);
  }
}

// Export singleton instance
export const LiabilityApiService = new LiabilityApiServiceClass();

