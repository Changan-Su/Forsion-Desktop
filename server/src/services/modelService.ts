import { AIModel } from '../types/index.js';
import { pool } from '../db/connection.js';

// 缓存已加载的模型列表
let cachedModels: AIModel[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 从数据库加载模型列表
 * 只返回数据库中实际存在的模型，不返回任何硬编码的fallback模型
 */
export async function loadModelsFromDatabase(): Promise<AIModel[]> {
  try {
    console.log('[ModelService] Querying database for models from global_models table...');
    const [rows] = await pool.query(`
      SELECT
        id, name, provider, description, icon, avatar,
        api_model_id, default_base_url, api_key, is_enabled
      FROM global_models
      WHERE is_enabled = TRUE
      ORDER BY name
    `);

    const modelRows = rows as any[];
    console.log(`[ModelService] Database query returned ${modelRows.length} models`);

    if (modelRows.length === 0) {
      console.warn('[ModelService] WARNING: No enabled models found in database!');
      return [];
    }

    const models: AIModel[] = modelRows.map(row => {
      const model = {
        id: row.id,
        name: row.name,
        provider: row.provider as AIModel['provider'],
        description: row.description || undefined,
        enabled: row.is_enabled === 1,
        icon: row.icon || 'Box',
        avatar: row.avatar || null,
        apiModelId: row.api_model_id || null,
        defaultBaseUrl: row.default_base_url || null,
        apiKey: row.api_key || null // 从数据库读取 API key
      };
      console.log(`[ModelService] Model from DB: ${model.id} - ${model.name} (${model.provider})`);
      return model;
    });

    console.log(`[ModelService] Successfully loaded ${models.length} models from database`);
    return models;
  } catch (error) {
    console.error('[ModelService] CRITICAL: Failed to load models from database:', error);
    if (error instanceof Error) {
      console.error('[ModelService] Error message:', error.message);
      console.error('[ModelService] Error stack:', error.stack);
    }
    // 不返回fallback模型，返回空数组，让前端知道数据库连接失败
    // 这样用户就能知道模型列表没有正确同步
    throw new Error(`Failed to load models from database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 获取可用模型列表（带缓存）
 * 只返回数据库中的模型，不返回任何fallback模型
 */
export async function getAvailableModels(): Promise<AIModel[]> {
  const now = Date.now();

  // 检查缓存是否有效
  if (cachedModels && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log(`[ModelService] Returning ${cachedModels.length} models from cache`);
    return cachedModels;
  }

  // 从数据库加载并缓存
  console.log('[ModelService] Cache expired or not available, loading from database...');
  try {
    cachedModels = await loadModelsFromDatabase();
    cacheTimestamp = now;
    console.log(`[ModelService] Cached ${cachedModels.length} models from database`);
    return cachedModels;
  } catch (error) {
    // 如果数据库加载失败，清除缓存并抛出错误
    cachedModels = null;
    cacheTimestamp = null;
    throw error;
  }
}

/**
 * 获取指定ID的模型
 */
export async function getModelById(modelId: string): Promise<AIModel | undefined> {
  const models = await getAvailableModels();
  return models.find(model => model.id === modelId && model.enabled);
}

/**
 * 检查模型是否可用
 */
export async function isModelAvailable(modelId: string): Promise<boolean> {
  const model = await getModelById(modelId);
  return !!model;
}

/**
 * 获取默认模型
 */
export async function getDefaultModel(): Promise<AIModel> {
  const models = await getAvailableModels();
  return models.find(m => m.id === 'gemini-3-flash-preview') || models[0];
}

/**
 * 清除模型缓存
 */
export function clearModelCache(): void {
  cachedModels = null;
  cacheTimestamp = null;
}

/**
 * 获取后备模型列表（当数据库不可用时使用）
 */
function getFallbackModels(): AIModel[] {
  return [
    {
      id: 'gemini-3-flash-preview',
      name: 'Gemini 3 Flash',
      provider: 'gemini',
      description: 'Fast and efficient Gemini model',
      enabled: true,
      icon: 'Box',
      avatar: null,
      apiModelId: null,
      defaultBaseUrl: null
    },
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash',
      provider: 'gemini',
      description: 'Latest Gemini 2.0 experimental model',
      enabled: true,
      icon: 'Box',
      avatar: null,
      apiModelId: null,
      defaultBaseUrl: null
    }
  ];
}

// 向后兼容的同步函数（已废弃，建议使用异步版本）
export function getAvailableModelsSync(): AIModel[] {
  // 如果缓存存在且有效，返回缓存
  if (cachedModels && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return cachedModels;
  }

  // 否则返回后备模型
  return getFallbackModels();
}

export function getModelByIdSync(modelId: string): AIModel | undefined {
  return getAvailableModelsSync().find(model => model.id === modelId && model.enabled);
}

export function isModelAvailableSync(modelId: string): boolean {
  const model = getModelByIdSync(modelId);
  return !!model;
}

export function getDefaultModelSync(): AIModel {
  return getAvailableModelsSync().find(m => m.id === 'gemini-3-flash-preview') || getAvailableModelsSync()[0];
}

