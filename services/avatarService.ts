/**
 * Avatar Service - 头像服务
 * 处理用户头像上传、获取和默认头像生成
 */

import apiService from './apiService';
import type { User } from '../types/shared';

export class AvatarService {
  /**
   * 上传头像文件到服务器
   */
  static async uploadAvatar(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // 尝试 POST /api/users/avatar 端点
      const apiUrl = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '' 
        ? import.meta.env.VITE_API_URL 
        : (import.meta.env.DEV ? 'http://localhost:3001' : '');
      const response = await fetch(`${apiUrl}/api/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-Project-Source': import.meta.env.VITE_PROJECT_SOURCE || 'desktop',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data.avatarUrl || data.avatar || data.url;
    } catch (error: any) {
      console.error('[AvatarService] Upload failed:', error);
      throw error;
    }
  }

  /**
   * 更新用户头像 URL
   */
  static async updateAvatarUrl(avatarUrl: string): Promise<User> {
    try {
      const response = await apiService.put<{ user: User }>('/api/users/profile', {
        avatar: avatarUrl,
      });
      
      // 更新本地存储的用户信息
      const user = response.user || response;
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      console.error('[AvatarService] Update avatar URL failed:', error);
      throw error;
    }
  }

  /**
   * 获取用户头像 URL
   * 如果用户没有头像，返回默认头像
   */
  static getAvatarUrl(user: User | null): string {
    if (!user) {
      return this.generateDefaultAvatar(null);
    }

    // 尝试多个可能的字段名
    const avatarUrl = user.avatar || user.avatarUrl;
    
    if (avatarUrl) {
      return avatarUrl;
    }

    // 返回默认头像（基于 nickname 或 username）
    return this.generateDefaultAvatar(user);
  }

  /**
   * 生成默认头像（使用 DiceBear API）
   * 基于用户名或昵称生成唯一的头像
   */
  static generateDefaultAvatar(user: import('../types/shared').User | null): string {
    if (!user) return `https://api.dicebear.com/7.x/initials/svg?seed=User&backgroundColor=6366f1&textColor=ffffff`;
    
    // 优先使用 nickname，回退到 username
    const displayName = user.nickname || user.username || 'User';
    
    // 使用 DiceBear API 生成基于显示名的头像
    // initials 样式会显示首字母
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=6366f1&textColor=ffffff`;
  }

  /**
   * 验证文件是否为有效的图片
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: '请选择图片文件' };
    }

    // 检查文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: '图片大小不能超过 5MB' };
    }

    // 检查文件格式
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: '仅支持 JPG、PNG、WEBP 和 GIF 格式' };
    }

    return { valid: true };
  }

  /**
   * 获取用户名首字母（用于默认头像）
   * 优先使用 nickname，如果为空则使用 username
   */
  static getUserInitials(user: import('../types/shared').User | null): string {
    if (!user) return '?';
    
    // 优先使用 nickname，回退到 username
    const displayName = user.nickname || user.username;
    if (!displayName) return '?';
    
    // 如果是中文名，取第一个字
    if (/[\u4e00-\u9fa5]/.test(displayName)) {
      return displayName.charAt(0);
    }
    
    // 如果是英文名，取前两个字母的首字母
    const parts = displayName.split(' ');
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    
    // 单个单词，取前两个字母
    return displayName.slice(0, 2).toUpperCase();
  }
}

export default AvatarService;


