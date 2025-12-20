export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: number;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string;
  created_at: Date;
}

export interface UserSettings {
  id: string;
  user_id: string;
  preferred_model?: string;
  theme_preferences?: any;
  created_at: Date;
  updated_at: Date;
}

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
  apiKey?: string | null; // API key from database (backend only, not exposed to frontend)
}

export interface ChatRequest {
  message: string;
  sessionId?: number;
  model?: string;
  history?: { role: string; content: string }[];
}

export interface ChatResponse {
  content: string;
  model: string;
  sessionId: number;
  messageId: number;
}

export interface AuthRequest {
  username: string;
  password: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

