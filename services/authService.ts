import apiService from './apiService';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/shared';

export type { User, LoginRequest, RegisterRequest, AuthResponse };

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
    const response = await apiService.get<any>('/api/auth/me');
    
    // 处理两种可能的响应格式: { user: User } 或直接返回 User
    const user: User = response.user || response;
    
    // 调试：打印响应用于排查头像字段
    console.log('[AuthService] getCurrentUser response:', response);
    console.log('[AuthService] Extracted user:', user);
    console.log('[AuthService] User avatar field:', user.avatar || user.avatarUrl || 'NOT FOUND');
    
    // 更新本地存储的用户信息
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    return user;
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

  /**
   * 获取用户显示名称
   * 优先使用 nickname，如果为空则使用 username
   */
  static getDisplayName(user: User | null): string {
    if (!user) return '用户';
    return user.nickname || user.username;
  }
}

export default AuthService;





