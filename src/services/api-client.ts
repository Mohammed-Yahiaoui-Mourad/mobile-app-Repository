/**
 * Secure API Client for AMAL Mobile Application (Expo/React Native)
 * Handles JWT authentication, secure storage, and API communication
 */

import { secureStorage } from '../lib/secure-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError extends Error {
  status?: number;
  details?: any;
}

class MobileApiClient {
  private readonly baseUrl: string;
  private tokenKey = 'access_token';

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the stored JWT token from secure storage
   */
  async getToken(): Promise<string | null> {
    try {
      return await secureStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Error reading token from storage:', error);
      return null;
    }
  }

  /**
   * Store JWT token in secure storage
   */
  async setToken(token: string): Promise<void> {
    try {
      await secureStorage.setItem(this.tokenKey, token);
    } catch (error) {
      console.error('Error storing token in storage:', error);
    }
  }

  /**
   * Clear authentication token from secure storage
   */
  async clearToken(): Promise<void> {
    try {
      await secureStorage.removeItem(this.tokenKey);
    } catch (error) {
      console.error('Error deleting token from storage:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  /**
   * Build headers with authentication
   */
  private async getHeaders(contentType?: string): Promise<HeadersInit> {
    const headers: HeadersInit = {};
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const token = await this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`[API Response] ${response.status} ${response.statusText}`);
    
    // Handle 401 Unauthorized - clear token and redirect to login
    if (response.status === 401) {
      await this.clearToken();
      // Navigation to login should be handled by the app's auth flow
      throw this.createError('Session expirée. Veuillez vous reconnecter.', 401);
    }

    // Try to parse JSON response
    let data: any;
    try {
      data = await response.json();
      console.log(`[API Response Data]`, data);
    } catch {
      // If not JSON, throw a generic error
      if (!response.ok) {
        throw this.createError(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }
      return undefined as T;
    }

    // Check for API-level errors
    if (!response.ok) {
      const errorMsg = data.error || data.message || data.detail || `Erreur serveur (${response.status})`;
      console.error(`[API Error] ${errorMsg}`, data);
      throw this.createError(errorMsg, response.status, data);
    }

    // Handle standardized API response format
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        const errorMsg = data.error || data.message || 'Erreur serveur';
        console.error(`[API Error] ${errorMsg}`, data);
        throw this.createError(errorMsg, response.status, data);
      }
      return data.data as T;
    }

    return data as T;
  }

  /**
   * Create a standardized API error
   */
  private createError(message: string, status?: number, details?: any): ApiError {
    const error: ApiError = new Error(message);
    error.status = status;
    error.details = details;
    return error;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    contentType?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Auto-detect content type if not provided
    if (!contentType) {
      if (body instanceof URLSearchParams) {
        contentType = 'application/x-www-form-urlencoded';
      } else if (body instanceof FormData) {
        // FormData doesn't need Content-Type header (browser sets it)
        contentType = '';
      } else if (body) {
        contentType = 'application/json';
      }
    }
    
    const headers = await this.getHeaders(contentType);

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      if (body instanceof URLSearchParams) {
        options.body = body.toString();
      } else if (body instanceof FormData) {
        options.body = body;
        // Remove Content-Type header for FormData to allow fetch to set it
        delete (options.headers as any)['Content-Type'];
      } else if (typeof body === 'object') {
        options.body = JSON.stringify(body);
      } else {
        options.body = body;
      }
    }

    console.log(`[API ${method}] ${endpoint}`, {
      contentType,
      bodyType: body?.constructor?.name,
      bodyPreview: body instanceof URLSearchParams ? body.toString() : typeof body === 'string' ? body : '[object]',
    });

    try {
      const response = await fetch(url, options);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`[API Error] ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'GET');
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, 'POST', body);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', body);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'DELETE');
  }
}

// Export singleton instance
export const mobileApiClient = new MobileApiClient();
