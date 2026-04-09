/**
 * Settings storage service — hybrid backend + localStorage
 *
 * Syncs theme to backend via PUT /api/users/settings (themePreset field).
 * Keeps gpu_acceleration and preferred_model in localStorage (device-specific / no backend support).
 */

import apiService from './apiService';
import type { UserSettings } from '../types/shared';

const SETTINGS_KEY = 'forsion_desktop_settings';
const GLOBAL_GPU_KEY = 'forsion_desktop_gpu_acceleration';

interface BackendSettings {
  theme?: string;
  themePreset?: string;
  nickname?: string;
  avatar?: string;
  [key: string]: any;
}

export class SettingsStorageService {
  private static getUserId(): string | number | null {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        return JSON.parse(userStr).id || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private static getLocalSettings(): Record<string, any> {
    try {
      const str = localStorage.getItem(SETTINGS_KEY);
      return str ? JSON.parse(str) : {};
    } catch {
      return {};
    }
  }

  private static saveLocalSettings(settings: Record<string, any>): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  /**
   * Fetch settings from backend, merge with local, return unified UserSettings.
   */
  static async getUserSettings(): Promise<UserSettings> {
    const userId = this.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const local = this.getLocalSettings();

    // Try to fetch from backend, fall back to local-only
    try {
      const remote = await apiService.get<BackendSettings>('/api/users/settings');
      // Sync themePreset from backend → local if backend has one
      if (remote.themePreset && remote.themePreset !== 'default') {
        local.theme_preset = remote.themePreset;
        this.saveLocalSettings(local);
      }
    } catch {
      // Offline or error — use local only
    }

    const now = new Date().toISOString();
    return {
      id: local.id || 1,
      user_id: userId,
      preferred_model: local.preferred_model || undefined,
      theme_preferences: local.theme_preferences || {},
      gpu_acceleration: local.gpu_acceleration ?? true,
      created_at: local.created_at || now,
      updated_at: local.updated_at || now,
    };
  }

  static async updateUserSettings(updates: {
    preferred_model?: string;
    theme_preferences?: any;
    gpu_acceleration?: boolean;
  }): Promise<UserSettings> {
    const userId = this.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const local = this.getLocalSettings();
    const merged = { ...local, ...updates, updated_at: new Date().toISOString() };
    this.saveLocalSettings(merged);

    // Sync theme preset to backend if theme_preferences changed
    if (updates.theme_preferences?.id) {
      try {
        await apiService.put('/api/users/settings', {
          themePreset: updates.theme_preferences.id,
        });
      } catch {
        // Non-critical — local settings saved regardless
      }
    }

    return this.getUserSettings();
  }

  static async setPreferredModel(modelId: string): Promise<UserSettings> {
    return this.updateUserSettings({ preferred_model: modelId });
  }

  static async setGPUAcceleration(enabled: boolean): Promise<UserSettings> {
    return this.updateUserSettings({ gpu_acceleration: enabled });
  }

  // GPU acceleration — works for both authenticated and unauthenticated users
  static getGPUAcceleration(): boolean {
    const userId = this.getUserId();
    if (userId) {
      try {
        const settings = this.getLocalSettings();
        if (settings.gpu_acceleration !== undefined) {
          return settings.gpu_acceleration;
        }
      } catch {
        // fall through
      }
    }
    const global = localStorage.getItem(GLOBAL_GPU_KEY);
    return global === null ? true : global === 'true';
  }

  static setGPUAccelerationGlobal(enabled: boolean): void {
    const userId = this.getUserId();
    if (userId) {
      this.setGPUAcceleration(enabled).catch(() => {
        localStorage.setItem(GLOBAL_GPU_KEY, enabled.toString());
      });
    } else {
      localStorage.setItem(GLOBAL_GPU_KEY, enabled.toString());
    }
  }

  static clearSettings(): void {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(GLOBAL_GPU_KEY);
  }
}

export default SettingsStorageService;
