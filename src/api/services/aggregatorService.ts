/**
 * Aggregator API Service
 * 
 * Provides a unified interface for financial data aggregation across
 * multiple providers (Plaid, Finicity, etc.).
 * 
 * This service wraps provider-specific implementations and provides
 * a consistent API for the rest of the application.
 */

import { ApiClient } from '../client';

// === Types ===

export type AggregatorType = 'plaid' | 'finicity' | 'yodlee' | 'mx' | 'akoya';

export interface LinkTokenResponse {
  provider: AggregatorType;
  link_token: string | null;
  connect_url: string | null;
  expiration: string | null;
}

export interface CreateLinkTokenRequest {
  institution_id?: string;
  institution_name?: string;
  provider?: AggregatorType;
}

export interface ProviderInfo {
  provider: string;
  is_available: boolean;
  supported_institutions: string[];
}

export interface ProvidersListResponse {
  providers: string[];
  default: string;
}

export interface AccountStats {
  total: number;
  by_provider: Record<string, number>;
  providers_used: string[];
}

export interface InstitutionRecommendation {
  institution_name: string;
  recommended_provider: AggregatorType;
  is_available: boolean;
  note: string | null;
}

export interface ConnectedAccount {
  id: string;
  provider: AggregatorType;
  institution_id: string | null;
  institution_name: string;
  account_name: string;
  account_type: string;
  account_subtype: string | null;
  account_mask: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  last_sync_error: string | null;
  created_at: string;
}

// === Service ===

class AggregatorApiServiceClass {
  /**
   * Get list of available aggregator providers.
   */
  async getProviders(): Promise<ProvidersListResponse> {
    return await ApiClient.get<ProvidersListResponse>('/aggregators/providers');
  }

  /**
   * Get information about a specific provider.
   */
  async getProviderInfo(provider: AggregatorType): Promise<ProviderInfo> {
    return await ApiClient.get<ProviderInfo>(`/aggregators/providers/${provider}`);
  }

  /**
   * Create a link token for connecting a financial account.
   * 
   * The API automatically selects the best provider based on:
   * 1. Explicit provider in request
   * 2. Institution name/ID
   * 3. Default (Plaid)
   */
  async createLinkToken(request?: CreateLinkTokenRequest): Promise<LinkTokenResponse> {
    return await ApiClient.post<LinkTokenResponse>('/aggregators/link-token', request || {});
  }

  /**
   * Get statistics about connected accounts.
   */
  async getAccountStats(): Promise<AccountStats> {
    return await ApiClient.get<AccountStats>('/aggregators/accounts/stats');
  }

  /**
   * Get the recommended provider for an institution.
   */
  async getRecommendedProvider(institutionName: string): Promise<InstitutionRecommendation> {
    const encodedName = encodeURIComponent(institutionName);
    return await ApiClient.get<InstitutionRecommendation>(
      `/aggregators/institutions/recommend?institution_name=${encodedName}`
    );
  }

  /**
   * Check if a provider is available.
   */
  async isProviderAvailable(provider: AggregatorType): Promise<boolean> {
    try {
      const info = await this.getProviderInfo(provider);
      return info.is_available;
    } catch {
      return false;
    }
  }
}

export const AggregatorApiService = new AggregatorApiServiceClass();
