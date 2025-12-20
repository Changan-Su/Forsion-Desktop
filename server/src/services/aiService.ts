import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { getModelById } from './modelService.js';

interface ChatHistory {
  role: string;
  content: string;
}

// 初始化各个AI客户端
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.API_KEY || '');
const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const deepseekClient = process.env.DEEPSEEK_API_KEY ? new OpenAI({ 
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
}) : null;
const claudeClient = process.env.ANTHROPIC_API_KEY ? new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com/v1'
}) : null;

export async function generateAIResponse(
  modelId: string,
  message: string,
  history: ChatHistory[] = []
): Promise<string> {
  const model = await getModelById(modelId);
  
  if (!model) {
    throw new Error(`Model ${modelId} not found or not available`);
  }

  switch (model.provider) {
    case 'gemini':
      return generateGeminiResponse(model.apiModelId || modelId, message, history);
    case 'openai':
      return generateOpenAIResponse(model.apiModelId || modelId, message, history);
    case 'deepseek':
      return generateDeepSeekResponse(model.apiModelId || modelId, message, history);
    case 'claude':
      return generateClaudeResponse(model.apiModelId || modelId, message, history);
    case 'external':
      return generateExternalResponse(model, message, history);
    default:
      throw new Error(`Provider ${model.provider} not supported`);
  }
}

async function generateGeminiResponse(
  modelId: string,
  message: string,
  history: ChatHistory[]
): Promise<string> {
  try {
    const model = geminiClient.getGenerativeModel({ model: modelId });
    
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      })),
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        maxOutputTokens: 8192,
      }
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

async function generateOpenAIResponse(
  modelId: string,
  message: string,
  history: ChatHistory[]
): Promise<string> {
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are Forsion Assistant, an AI agent inside the Forsion Desktop environment. You help users with productivity tasks in a professional and creative manner.'
      },
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user' as const, content: message }
    ];

    const response = await openaiClient.chat.completions.create({
      model: modelId,
      messages,
      temperature: 0.7,
      max_tokens: 4096
    });

    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

async function generateDeepSeekResponse(
  modelId: string,
  message: string,
  history: ChatHistory[]
): Promise<string> {
  if (!deepseekClient) {
    throw new Error('DeepSeek API key not configured');
  }

  try {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are Forsion Assistant, helping users with productivity tasks.'
      },
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user' as const, content: message }
    ];

    const response = await deepseekClient.chat.completions.create({
      model: modelId,
      messages,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error: any) {
    console.error('DeepSeek API Error:', error);
    throw new Error(`DeepSeek API error: ${error.message}`);
  }
}

async function generateClaudeResponse(
  modelId: string,
  message: string,
  history: ChatHistory[]
): Promise<string> {
  if (!claudeClient) {
    throw new Error('Claude API key not configured');
  }

  try {
    const messages = [
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user' as const, content: message }
    ];

    const response = await claudeClient.chat.completions.create({
      model: modelId,
      messages,
      max_tokens: 4096
    });

    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error: any) {
    console.error('Claude API Error:', error);
    throw new Error(`Claude API error: ${error.message}`);
  }
}

// 生成外部 API 响应（支持 OpenAI 兼容的 API）
async function generateExternalResponse(
  model: any,
  message: string,
  history: ChatHistory[]
): Promise<string> {
  if (!model.apiModelId || !model.defaultBaseUrl) {
    throw new Error(`External model "${model.name}" (${model.id}) requires apiModelId and defaultBaseUrl to be configured in the database`);
  }

  // 优先使用数据库中的 API key，如果没有则从环境变量获取
  const apiKey = model.apiKey 
    || process.env[`${model.id.toUpperCase().replace(/-/g, '_')}_API_KEY`] 
    || process.env.EXTERNAL_API_KEY 
    || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(`API key not configured for external model ${model.id}. Please configure it in the database (api_key field) or set environment variable.`);
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: model.defaultBaseUrl
    });

    const messages = [
      {
        role: 'system' as const,
        content: 'You are Forsion Assistant, an AI agent inside the Forsion Desktop environment. You help users with productivity tasks in a professional and creative manner.'
      },
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user' as const, content: message }
    ];

    const response = await client.chat.completions.create({
      model: model.apiModelId,
      messages,
      temperature: 0.7,
      max_tokens: 4096
    });

    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error: any) {
    console.error(`External API Error (${model.defaultBaseUrl}):`, error);
    throw new Error(`External API error: ${error.message}`);
  }
}

// 流式响应生成器
export async function* generateAIResponseStream(
  modelId: string,
  message: string,
  history: ChatHistory[] = []
): AsyncGenerator<string, void, unknown> {
  const model = await getModelById(modelId);
  
  if (!model) {
    throw new Error(`Model ${modelId} not found or not available`);
  }

  if (model.provider === 'gemini') {
    // Gemini 流式响应
    const actualModelId = model.apiModelId || modelId;
    const geminiModel = geminiClient.getGenerativeModel({ model: actualModelId });
    const chat = geminiModel.startChat({
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      }))
    });

    const result = await chat.sendMessageStream(message);
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } else if (model.provider === 'openai' && openaiClient) {
    // OpenAI 流式响应
    const actualModelId = model.apiModelId || modelId;
    const messages = [
      {
        role: 'system' as const,
        content: 'You are Forsion Assistant.'
      },
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user' as const, content: message }
    ];

    const stream = await openaiClient.chat.completions.create({
      model: actualModelId,
      messages,
      stream: true,
      temperature: 0.7
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        yield text;
      }
    }
  } else if (model.provider === 'deepseek' && deepseekClient) {
    // DeepSeek 流式响应
    const actualModelId = model.apiModelId || modelId;
    const messages = [
      {
        role: 'system' as const,
        content: 'You are Forsion Assistant.'
      },
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user' as const, content: message }
    ];

    const stream = await deepseekClient.chat.completions.create({
      model: actualModelId,
      messages,
      stream: true,
      temperature: 0.7
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        yield text;
      }
    }
  } else if (model.provider === 'claude' && claudeClient) {
    // Claude 流式响应
    const actualModelId = model.apiModelId || modelId;
    const messages = [
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user' as const, content: message }
    ];

    const stream = await claudeClient.chat.completions.create({
      model: actualModelId,
      messages,
      stream: true,
      max_tokens: 4096
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        yield text;
      }
    }
  } else if (model.provider === 'external') {
    // External 流式响应
    if (!model.apiModelId || !model.defaultBaseUrl) {
      throw new Error(`External model "${model.name}" (${model.id}) requires apiModelId and defaultBaseUrl to be configured in the database`);
    }

    // 优先使用数据库中的 API key，如果没有则从环境变量获取
    const apiKey = model.apiKey 
      || process.env[`${model.id.toUpperCase().replace(/-/g, '_')}_API_KEY`] 
      || process.env.EXTERNAL_API_KEY 
      || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(`API key not configured for external model ${model.id}. Please configure it in the database (api_key field) or set environment variable.`);
    }

    const client = new OpenAI({
      apiKey,
      baseURL: model.defaultBaseUrl
    });

    const messages = [
      {
        role: 'system' as const,
        content: 'You are Forsion Assistant.'
      },
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content
      })),
      { role: 'user' as const, content: message }
    ];

    const stream = await client.chat.completions.create({
      model: model.apiModelId,
      messages,
      stream: true,
      temperature: 0.7
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        yield text;
      }
    }
  } else {
    // 对于不支持流式的模型，返回完整响应
    const response = await generateAIResponse(modelId, message, history);
    yield response;
  }
}

