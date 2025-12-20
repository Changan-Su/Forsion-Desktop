
export type AppId = 'knowledge' | 'calendar' | 'workspace' | 'recipe' | 'studio' | 'settings' | 'notes';

export interface Theme {
  id: string;
  name: string;
  background: string;
  primary: string;
  secondary: string;
  surface: string;
  text: string;
  isDark: boolean;
  wallpaper?: string;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesktopApp {
  id: AppId;
  name: string;
  icon: string;
  color: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  id?: number;
  model_used?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Session {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
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
}
