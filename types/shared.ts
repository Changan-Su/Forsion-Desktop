/**
 * Shared type definitions for Forsion Desktop
 * These types represent the API contract between frontend and backend
 */

// User types
export interface User {
  id: number | string;
  username: string;
  email?: string | null;
  phone?: string | null;
  role: 'admin' | 'user' | 'USER' | 'ADMIN';
  avatar?: string | null;
  avatarUrl?: string | null;
  nickname?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Session types (backend uses UUID strings)
export interface Session {
  id: string;
  user_id: string;
  title: string;
  app_id?: string;
  model_id?: string;
  created_at: string;
  updated_at: string;
}

// Message types (backend uses UUID strings)
export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string;
  timestamp?: number;
  created_at: string;
}

// AI Model types (Backend Service format)
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
  // Backend Service fields (mapped from isEnabled)
  isEnabled?: boolean;
}

// OpenAI-compatible message format
export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// OpenAI-compatible chat request
export interface OpenAIChatRequest {
  model_id: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// OpenAI-compatible chat response (streaming chunk)
export interface OpenAIChatChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    message?: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

// OpenAI-compatible complete response
export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// User Settings types
export interface UserSettings {
  id: number | string;
  user_id: number | string;
  preferred_model?: string;
  theme_preferences?: any;
  gpu_acceleration?: boolean;
  created_at: string;
  updated_at: string;
}

// Chat API types
export interface ChatRequest {
  message: string;
  sessionId?: string;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  sessionId: string;
  messageId: string;
}

// Auth API types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  inviteCode?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

