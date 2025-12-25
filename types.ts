
export type AppId = 'knowledge' | 'calendar' | 'workspace' | 'recipe' | 'studio' | 'settings' | 'notes' | 'app-market' | 'launchpad';

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

import type { User, Session, AIModel } from './types/shared';

export type { User, Session, AIModel };

// ChatMessage is frontend-specific (uses timestamp instead of created_at)
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  id?: number;
  model_used?: string;
}
