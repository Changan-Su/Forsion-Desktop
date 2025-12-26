import apiService from './apiService';
import { ForsionApp } from '../types';

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

