import apiService from './apiService';
import type { AIModel, UserSettings } from '../types/shared';
import SettingsStorageService from './settingsStorageService';

export type { AIModel, UserSettings };

// Backend Service model format (from /api/projects/:projectId/models)
interface BackendModel {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'deepseek' | 'claude' | 'external';
  description?: string;
  icon?: string;
  isEnabled: boolean;
  apiModelId?: string;
  defaultBaseUrl?: string;
}

// Desktop 应用的项目ID
const PROJECT_ID = 'desktop';

export class ModelService {
  // 获取可用模型列表 (from Backend Service)
  static async getAvailableModels(forceRefresh: boolean = false): Promise<AIModel[]> {
    try {
      // 如果强制刷新，清除本地缓存
      if (forceRefresh) {
        this.clearCache();
      }
      
      // Use Backend Service endpoint: /api/projects/:projectId/models
      // 根据 Trackv0.4.4.md，使用项目特定的模型配置端点
      const response = await apiService.get<BackendModel[] | { models: BackendModel[] }>(`/api/projects/${PROJECT_ID}/models`);
      
      // 处理响应格式：可能是数组或包含 models 字段的对象
      const models: BackendModel[] = Array.isArray(response) 
        ? response 
        : (typeof response === 'object' && response !== null && 'models' in response && Array.isArray(response.models))
          ? response.models
          : [];
      
      if (models && Array.isArray(models)) {
        // Map Backend Service format to Desktop format
        const mappedModels: AIModel[] = models
          .filter(model => model.isEnabled) // Only return enabled models
          .map(model => ({
            id: model.id,
            name: model.name,
            provider: model.provider,
            description: model.description,
            enabled: model.isEnabled,
            icon: model.icon,
            avatar: null,
            apiModelId: model.apiModelId || null,
            defaultBaseUrl: model.defaultBaseUrl || null,
          }));
        
        // Cache the models
        this.cachedModels = mappedModels;
        return mappedModels;
      } else {
        console.error('[ModelService] Invalid response format:', models);
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

  // 获取用户设置 (from localStorage via SettingsStorageService)
  static async getUserSettings(): Promise<UserSettings> {
    return SettingsStorageService.getUserSettings();
  }

  // 更新用户设置 (to localStorage via SettingsStorageService)
  static async updateUserSettings(updates: {
    preferred_model?: string;
    theme_preferences?: any;
  }): Promise<UserSettings> {
    return SettingsStorageService.updateUserSettings(updates);
  }

  // 设置默认模型 (to localStorage via SettingsStorageService)
  static async setPreferredModel(modelId: string): Promise<UserSettings> {
    return SettingsStorageService.setPreferredModel(modelId);
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

