/**
 * Client-side settings storage service using localStorage
 * Replaces backend settings API for Desktop app
 */

import type { UserSettings } from '../types/shared';

const SETTINGS_KEY = 'forsion_desktop_settings';

export class SettingsStorageService {
  private static getUserId(): number | null {
    // Get user ID from auth token or user object in localStorage
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  static async getUserSettings(): Promise<UserSettings> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const settingsStr = localStorage.getItem(SETTINGS_KEY);
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        return {
          id: settings.id || 1,
          user_id: userId,
          preferred_model: settings.preferred_model || undefined,
          theme_preferences: settings.theme_preferences || {},
          created_at: settings.created_at || new Date().toISOString(),
          updated_at: settings.updated_at || new Date().toISOString(),
        };
      } catch {
        // Invalid JSON, return default
      }
    }

    // Return default settings
    const now = new Date().toISOString();
    return {
      id: 1,
      user_id: userId,
      preferred_model: undefined,
      theme_preferences: {},
      created_at: now,
      updated_at: now,
    };
  }

  static async updateUserSettings(updates: {
    preferred_model?: string;
    theme_preferences?: any;
  }): Promise<UserSettings> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const current = await this.getUserSettings();
    const updated: UserSettings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Store only the relevant fields in localStorage
    const toStore = {
      id: updated.id,
      preferred_model: updated.preferred_model,
      theme_preferences: updated.theme_preferences,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(toStore));
    return updated;
  }

  static async setPreferredModel(modelId: string): Promise<UserSettings> {
    return this.updateUserSettings({ preferred_model: modelId });
  }

  static clearSettings(): void {
    localStorage.removeItem(SETTINGS_KEY);
  }
}

export default SettingsStorageService;

