/**
 * Forsion 统一登录系统 - 客户端重定向工具
 * 用于处理统一登录页面的跳转和 Token 管理
 */

const AUTH_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth`;
const TOKEN_KEY = 'auth_token';

/**
 * 统一登录检测
 * 在应用启动时调用，处理从登录页返回的 token
 */
export function initAuth(): boolean {
  // 1. 检查 URL 中是否有 token（从登录页返回）
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  if (tokenFromUrl) {
    // 保存 token
    localStorage.setItem(TOKEN_KEY, tokenFromUrl);
    
    // 清理 URL 中的 token 参数
    urlParams.delete('token');
    const newUrl = urlParams.toString() 
      ? `${window.location.pathname}?${urlParams}` 
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    
    return true;
  }
  
  // 2. 检查本地存储的 token
  const storedToken = localStorage.getItem(TOKEN_KEY);
  return !!storedToken;
}

/**
 * 跳转到统一登录页
 * @param appName 应用标识（用于统计）
 */
export function redirectToLogin(appName?: string): void {
  const currentUrl = encodeURIComponent(window.location.href);
  let authUrl = `${AUTH_BASE_URL}?redirect=${currentUrl}`;
  
  if (appName) {
    authUrl += `&app=${appName}`;
  }
  
  window.location.href = authUrl;
}

/**
 * 验证 Token 有效性
 * 如果无效，自动跳转登录页
 */
export async function validateAndRedirect(apiBaseUrl: string, appName?: string): Promise<boolean> {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (!token) {
    redirectToLogin(appName);
    return false;
  }
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return true;
    }
    
    // Token 无效，清除并跳转
    localStorage.removeItem(TOKEN_KEY);
    redirectToLogin(appName);
    return false;
  } catch (error) {
    console.error('Token validation failed:', error);
    // 网络错误时不跳转，允许离线使用
    return true;
  }
}

/**
 * 清除认证信息并跳转登录页
 */
export function logout(appName?: string): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('auth_user');
  // 清除其他相关存储...
  
  redirectToLogin(appName);
}


