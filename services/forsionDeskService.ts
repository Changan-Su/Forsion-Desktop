import apiService from './apiService';
import { ForsionApp } from '../types';

/**
 * Preset Icons Library
 * Must match the backend admin panel preset icons
 * These are SVG strings that will be converted to data URLs
 */
const presetIcons: Record<string, string> = {
  'app-code': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#2563EB" rx="15"/><path d="M30 35 L20 50 L30 65" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M50 30 L40 70" stroke="white" stroke-width="5" stroke-linecap="round"/><path d="M70 35 L80 50 L70 65" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  'app-photo': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#EC4899" rx="15"/><circle cx="50" cy="45" r="18" stroke="white" stroke-width="4" fill="none"/><circle cx="50" cy="45" r="12" fill="white"/><rect x="68" y="25" width="8" height="8" rx="2" fill="white"/></svg>',
  'app-calendar': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#10B981" rx="15"/><rect x="20" y="30" width="60" height="50" rx="5" fill="white"/><rect x="30" y="20" width="4" height="15" fill="white" rx="2"/><rect x="66" y="20" width="4" height="15" fill="white" rx="2"/><line x1="25" y1="45" x2="75" y2="45" stroke="#10B981" stroke-width="2"/><circle cx="35" cy="55" r="3" fill="#10B981"/><circle cx="50" cy="55" r="3" fill="#10B981"/><circle cx="65" cy="55" r="3" fill="#10B981"/><circle cx="35" cy="68" r="3" fill="#10B981"/><circle cx="50" cy="68" r="3" fill="#10B981"/></svg>',
  'app-music': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#8B5CF6" rx="15"/><path d="M35 30 L35 70 M50 25 L50 75 M65 30 L65 70" stroke="white" stroke-width="6" stroke-linecap="round"/><circle cx="35" cy="70" r="8" fill="white"/><circle cx="50" cy="75" r="8" fill="white"/><circle cx="65" cy="70" r="8" fill="white"/></svg>',
  'app-video': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#EF4444" rx="15"/><rect x="25" y="30" width="50" height="40" rx="5" fill="white"/><polygon points="40,45 40,55 50,50" fill="#EF4444"/></svg>',
  'app-chat': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#06B6D4" rx="15"/><rect x="20" y="30" width="60" height="45" rx="8" fill="white"/><circle cx="35" cy="52" r="4" fill="#06B6D4"/><circle cx="50" cy="52" r="4" fill="#06B6D4"/><circle cx="65" cy="52" r="4" fill="#06B6D4"/><path d="M20 75 L30 65 L20 65 Z" fill="white"/></svg>',
  'app-browser': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#3B82F6" rx="15"/><rect x="20" y="25" width="60" height="50" rx="5" fill="white"/><line x1="20" y1="40" x2="80" y2="40" stroke="#3B82F6" stroke-width="3"/><circle cx="35" cy="32" r="3" fill="#EF4444"/><circle cx="45" cy="32" r="3" fill="#FBBF24"/><circle cx="55" cy="32" r="3" fill="#10B981"/><circle cx="45" cy="57" r="8" fill="#3B82F6"/><path d="M37 57 L53 57 M45 49 L45 65" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',
  'app-folder': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#F59E0B" rx="15"/><path d="M25 35 L35 35 L40 45 L75 45 L75 70 L25 70 Z" fill="white" rx="3"/><rect x="30" y="50" width="15" height="3" rx="1" fill="#F59E0B"/><rect x="30" y="57" width="25" height="3" rx="1" fill="#F59E0B"/><rect x="30" y="64" width="20" height="3" rx="1" fill="#F59E0B"/></svg>',
  'app-settings': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#6B7280" rx="15"/><circle cx="50" cy="50" r="20" stroke="white" stroke-width="4" fill="none"/><circle cx="50" cy="50" r="8" fill="white"/><path d="M50 30 L50 35 M50 65 L50 70 M30 50 L35 50 M65 50 L70 50 M38 38 L41 41 M59 59 L62 62 M38 62 L41 59 M59 41 L62 38" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>',
  'app-game': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#10B981" rx="15"/><rect x="30" y="35" width="40" height="30" rx="5" fill="white"/><circle cx="45" cy="50" r="6" fill="#10B981"/><circle cx="55" cy="50" r="6" fill="#10B981"/><path d="M40 42 L35 37 M60 42 L65 37 M40 58 L35 63 M60 58 L65 63" stroke="#10B981" stroke-width="3" stroke-linecap="round"/></svg>',
  'app-mail': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#6366F1" rx="15"/><rect x="25" y="35" width="50" height="35" rx="5" fill="white"/><path d="M25 45 L50 60 L75 45" stroke="#6366F1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  'app-note': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#FBBF24" rx="15"/><rect x="25" y="30" width="50" height="45" rx="3" fill="white"/><line x1="30" y1="42" x2="70" y2="42" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/><line x1="30" y1="52" x2="70" y2="52" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/><line x1="30" y1="62" x2="60" y2="62" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/></svg>',
  'app-shopping': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#EC4899" rx="15"/><path d="M35 35 L30 70 L70 70 L65 35 Z" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M30 40 L25 25 L75 25 L70 40" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="42" cy="62" r="5" fill="white"/><circle cx="58" cy="62" r="5" fill="white"/></svg>',
  'app-weather': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#60A5FA" rx="15"/><circle cx="50" cy="40" r="18" fill="white"/><path d="M35 55 Q30 50 35 45 Q40 50 35 55" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M50 55 Q45 50 50 45 Q55 50 50 55" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M65 55 Q60 50 65 45 Q70 50 65 55" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  'app-book': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#8B5CF6" rx="15"/><path d="M30 30 L30 70 Q30 70 50 65 Q70 70 70 70 L70 30 Q70 30 50 35 Q30 30 30 30" fill="white"/><line x1="50" y1="30" x2="50" y2="70" stroke="#8B5CF6" stroke-width="2"/></svg>',
  'app-social': '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#3B82F6" rx="15"/><circle cx="50" cy="50" r="18" fill="white"/><circle cx="42" cy="45" r="4" fill="#3B82F6"/><circle cx="58" cy="45" r="4" fill="#3B82F6"/><path d="M38 58 Q45 53 50 53 Q55 53 62 58" stroke="#3B82F6" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
};

/**
 * Convert icon value to usable image URL
 * Supports three formats:
 * 1. Preset icons: "preset:icon-id" -> converts to SVG data URL
 * 2. Base64 encoded: "data:image/..." -> returns as is
 * 3. URL: "https://..." -> returns as is
 * 
 * @param iconValue The icon value from the API
 * @returns The converted icon URL, or undefined if icon is invalid
 */
export function getAppIconUrl(iconValue: string | undefined): string | undefined {
  if (!iconValue) return undefined;
  
  // If it's a preset icon, convert to SVG data URL
  if (iconValue.startsWith('preset:')) {
    const iconId = iconValue.substring(7); // Remove 'preset:' prefix
    const svg = presetIcons[iconId];
    if (svg) {
      // Convert SVG string to data URL using UTF-8 encoding
      try {
        // Use encodeURIComponent for proper UTF-8 encoding of SVG
        const encoded = encodeURIComponent(svg);
        return `data:image/svg+xml;charset=utf-8,${encoded}`;
      } catch (error) {
        console.error(`[getAppIconUrl] Failed to encode preset icon ${iconId}:`, error);
        return undefined;
      }
    }
    // If preset icon doesn't exist, return undefined (frontend should show default icon)
    console.warn(`[getAppIconUrl] Preset icon not found: ${iconId}`);
    return undefined;
  }
  
  // Return URL or Base64 data as is
  return iconValue;
}

/**
 * Forsion Desk Service
 * Handles all API calls related to Forsion Desk applications
 */
class ForsionDeskService {
  /**
   * Get all available apps (global + user-created)
   */
  async getAllApps(): Promise<ForsionApp[]> {
    try {
      const apps = await apiService.get<ForsionApp[]>('/api/desk/apps');
      return apps || [];
    } catch (error: any) {
      console.error('[ForsionDeskService] Failed to get all apps:', error);
      throw error;
    }
  }

  /**
   * Get user's installed apps
   */
  async getUserInstalledApps(): Promise<ForsionApp[]> {
    try {
      const apps = await apiService.get<ForsionApp[]>('/api/desk/user-apps');
      return apps || [];
    } catch (error: any) {
      console.error('[ForsionDeskService] Failed to get user installed apps:', error);
      throw error;
    }
  }

  /**
   * Install an app
   */
  async installApp(appId: string): Promise<void> {
    try {
      await apiService.post<{ success: boolean }>(`/api/desk/apps/${appId}/install`);
    } catch (error: any) {
      console.error('[ForsionDeskService] Failed to install app:', error);
      throw error;
    }
  }

  /**
   * Uninstall an app
   */
  async uninstallApp(appId: string): Promise<void> {
    try {
      await apiService.delete<{ success: boolean }>(`/api/desk/apps/${appId}/uninstall`);
    } catch (error: any) {
      console.error('[ForsionDeskService] Failed to uninstall app:', error);
      throw error;
    }
  }

  /**
   * Get app by ID
   */
  async getAppById(appId: string): Promise<ForsionApp> {
    try {
      const app = await apiService.get<ForsionApp>(`/api/desk/apps/${appId}`);
      return app;
    } catch (error: any) {
      console.error('[ForsionDeskService] Failed to get app by id:', error);
      throw error;
    }
  }
}

export const forsionDeskService = new ForsionDeskService();
export default forsionDeskService;

