const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      console.log(`[ApiService] Requesting: ${url}`);
      const response = await fetch(url, config);
      console.log(`[ApiService] Response status: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      console.log(`[ApiService] Response data:`, data);

      if (!response.ok) {
        const errorMsg = data.error || `HTTP error! status: ${response.status}`;
        console.error(`[ApiService] Request failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      return data;
    } catch (error: any) {
      console.error('[ApiService] Request error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('[ApiService] Network error - check if backend is running on', this.baseUrl);
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // EventSource for streaming responses
  createEventSource(endpoint: string): EventSource {
    const token = localStorage.getItem('auth_token');
    const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${token}`;
    return new EventSource(url);
  }

  // 测试后端连接
  async testConnection(): Promise<{ status: string; database?: string; timestamp?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      return {
        status: 'error',
        error: error.message || 'Failed to connect to backend server'
      };
    }
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;

