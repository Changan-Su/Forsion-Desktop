import apiService from './apiService';

export interface AIModel {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'deepseek' | 'claude' | 'external';
  description?: string;
  enabled: boolean;
  icon?: string;
  avatar?: string | null;
  apiModelId?: string | null;
  defaultBaseUrl?: string | null;
}

export interface UserSettings {
  id: number;
  user_id: number;
  preferred_model: string;
  theme_preferences?: any;
  created_at: string;
  updated_at: string;
}

export class ModelService {
  // 获取可用模型列表
  static async getAvailableModels(): Promise<AIModel[]> {
    try {
      console.log('[ModelService] Fetching models from API: /api/chat/models');
      const token = localStorage.getItem('auth_token');
      console.log('[ModelService] Auth token exists:', !!token);
      if (token) {
        console.log('[ModelService] Token preview:', token.substring(0, 20) + '...');
      }
      
      const response = await apiService.get<{ models: AIModel[] }>('/api/chat/models');
      console.log('[ModelService] API response received:', response);
      console.log('[ModelService] Response type:', typeof response);
      console.log('[ModelService] Response keys:', Object.keys(response || {}));
      console.log('[ModelService] Models received:', response?.models?.length || 0);
      
      if (response && response.models && Array.isArray(response.models)) {
        console.log(`[ModelService] Successfully loaded ${response.models.length} models:`);
        response.models.forEach((model: AIModel, index: number) => {
          console.log(`  ${index + 1}. ${model.id} - ${model.name} (${model.provider})`);
        });
        return response.models;
      } else {
        console.error('[ModelService] Invalid response format:', response);
        console.error('[ModelService] Response structure:', JSON.stringify(response, null, 2));
        return [];
      }
    } catch (error) {
      console.error('[ModelService] Failed to get models:', error);
      if (error instanceof Error) {
        console.error('[ModelService] Error message:', error.message);
        console.error('[ModelService] Error stack:', error.stack);
      } else {
        console.error('[ModelService] Error object:', error);
      }
      return [];
    }
  }

  // 获取用户设置
  static async getUserSettings(): Promise<UserSettings> {
    const response = await apiService.get<{ settings: UserSettings }>('/api/settings');
    return response.settings;
  }

  // 更新用户设置
  static async updateUserSettings(updates: {
    preferred_model?: string;
    theme_preferences?: any;
  }): Promise<UserSettings> {
    const response = await apiService.put<{ settings: UserSettings }>('/api/settings', updates);
    return response.settings;
  }

  // 设置默认模型
  static async setPreferredModel(modelId: string): Promise<UserSettings> {
    return this.updateUserSettings({ preferred_model: modelId });
  }

  // 本地缓存模型列表
  private static cachedModels: AIModel[] | null = null;

  static async getModelsWithCache(): Promise<AIModel[]> {
    if (this.cachedModels) {
      return this.cachedModels;
    }

    this.cachedModels = await this.getAvailableModels();
    return this.cachedModels;
  }

  static clearCache(): void {
    this.cachedModels = null;
  }
}

export default ModelService;

