/**
 * API Client
 * 
 * HTTP client for communicating with the Python backend.
 * Replaces direct SQLite access.
 */

import { API_CONFIG } from './config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiError {
  detail: string;
  status: number;
}

class ApiClientClass {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
    this.headers = API_CONFIG.headers;
  }

  /**
   * Update the base URL (e.g., when switching environments).
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Make an HTTP request.
   */
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Use Promise.race for timeout - more reliable in React Native
    const controller = new AbortController();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject({ detail: 'Request timeout', status: 408 });
      }, this.timeout);
    });

    try {
      const options: RequestInit = {
        method,
        headers: this.headers,
        signal: controller.signal,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const fetchPromise = fetch(url, options).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error: ApiError = {
            detail: errorData.detail || `Request failed with status ${response.status}`,
            status: response.status,
          };
          throw error;
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return null as T;
        }

        return response.json();
      });

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      // Re-throw API errors
      if ((error as ApiError).status) {
        throw error;
      }
      
      // Check for AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        throw { detail: 'Request timeout', status: 408 };
      }
      
      // Network error
      throw { detail: 'Network error. Please check your connection.', status: 0 };
    }
  }

  /**
   * GET request.
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * POST request.
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  /**
   * PUT request.
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  /**
   * DELETE request.
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * Health check.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api/v1', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const ApiClient = new ApiClientClass();

