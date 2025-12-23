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
  private authToken: string | null = null;

  constructor() {
    // Ensure baseUrl uses HTTPS for production (non-localhost) URLs
    let baseUrl = API_CONFIG.baseUrl;
    if (baseUrl.startsWith('http://') && !baseUrl.includes('localhost')) {
      baseUrl = baseUrl.replace('http://', 'https://');
    }
    this.baseUrl = baseUrl;
    this.timeout = API_CONFIG.timeout;
    this.headers = API_CONFIG.headers;
  }

  /**
   * Update the base URL (e.g., when switching environments).
   */
  setBaseUrl(url: string): void {
    // Ensure URL uses HTTPS for production (non-localhost) URLs
    let finalUrl = url;
    if (finalUrl.startsWith('http://') && !finalUrl.includes('localhost')) {
      finalUrl = finalUrl.replace('http://', 'https://');
    }
    this.baseUrl = finalUrl;
  }

  /**
   * Set the authentication token for API requests.
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear the authentication token.
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Get headers with auth token if available.
   */
  private getHeaders(): Record<string, string> {
    const headers = { ...this.headers };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
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
      // Ensure URL uses HTTPS and has proper format
      let finalUrl = url;
      
      // Log URL construction for debugging
      if (finalUrl.includes('onboarding')) {
        console.log('[API Client] Original URL:', finalUrl);
      }
      
      // Force HTTPS for any Railway URLs or production URLs to avoid Mixed Content errors
      if (finalUrl.startsWith('http://')) {
        if (finalUrl.includes('railway.app') || finalUrl.includes('localhost') === false) {
          // Force HTTPS for Railway URLs and any non-localhost URLs
          const before = finalUrl;
          finalUrl = finalUrl.replace('http://', 'https://');
          console.warn('[API Client] Converted HTTP to HTTPS:', before, '→', finalUrl);
        }
      }
      
      if (finalUrl.includes('onboarding')) {
        console.log('[API Client] Final URL:', finalUrl);
      }
      
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
        signal: controller.signal,
        redirect: 'follow', // Follow redirects (but preflight can't follow)
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const fetchPromise = fetch(finalUrl, options).then(async (response) => {
        if (!response.ok) {
          // Try to parse error response, but handle empty/non-JSON gracefully
          let errorData = {};
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const text = await response.text();
              if (text) {
                errorData = JSON.parse(text);
              }
            } catch {
              // If parsing fails, use empty object
            }
          }
          
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

        // Check if response has content before parsing
        const contentType = response.headers.get('content-type');
        const text = await response.text();
        
        // If no content or not JSON, return null
        if (!text || !contentType?.includes('application/json')) {
          return null as T;
        }

        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('[API Client] JSON parse error:', parseError, 'Response text:', text);
          throw { detail: 'Invalid response from server', status: response.status };
        }
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
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const healthUrl = `${this.baseUrl.replace('/api/v1', '')}/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // Silently fail - don't throw errors from health check
      console.warn('[API Client] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const ApiClient = new ApiClientClass();

