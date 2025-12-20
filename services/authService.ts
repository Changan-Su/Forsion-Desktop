import apiService from './apiService';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export class AuthService {
  private static TOKEN_KEY = 'auth_token';
  private static USER_KEY = 'auth_user';

  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/login', credentials);
    
    // 保存token和用户信息
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    
    return response;
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/register', data);
    
    // 保存token和用户信息
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    
    return response;
  }

  static async getCurrentUser(): Promise<User> {
    const response = await apiService.get<{ user: User }>('/api/auth/me');
    
    // 更新本地存储的用户信息
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    
    return response.user;
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }
}

export default AuthService;

