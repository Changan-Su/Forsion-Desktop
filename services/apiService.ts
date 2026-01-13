// 如果 VITE_API_URL 为空，使用相对路径（通过 nginx 代理）
// 否则使用配置的 URL 或默认值
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '' 
  ? import.meta.env.VITE_API_URL 
  : (import.meta.env.DEV ? 'http://localhost:3001' : '');
const PROJECT_SOURCE = import.meta.env.VITE_PROJECT_SOURCE || 'desktop';

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
      'X-Project-Source': PROJECT_SOURCE,
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
      const response = await fetch(url, config);
      
      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Non-JSON response (e.g., text/plain, text/html)
        const text = await response.text();
        
        // 如果是 HTML 响应（通常是重定向到登录页），说明认证失败
        if (contentType && contentType.includes('text/html')) {
          // 401/403 通常意味着 token 无效或过期
          if (response.status === 401 || response.status === 403) {
            const error: any = new Error('Authentication failed - token may be invalid or expired');
            error.status = response.status;
            error.response = { detail: 'Authentication required', isHtml: true };
            throw error;
          }
        }
        
        data = { detail: text || `HTTP error! status: ${response.status}` };
      }

      if (!response.ok) {
        // Backend Service uses { detail: "..." } format for errors
        const errorMsg = data.detail || data.error || `HTTP error! status: ${response.status}`;
        console.error(`[ApiService] Request failed: ${errorMsg}`);
        
        // 创建自定义错误，保留状态码
        const error: any = new Error(errorMsg);
        error.status = response.status;
        error.response = data;
        throw error;
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
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-Source': PROJECT_SOURCE,
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

