
export type AppId = 'settings' | 'launchpad' | 'forsion-desk-market' | string;

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
  nameKey?: string;
  icon: string;
  color: string;
}

export interface ForsionApp {
  id: string;
  name: string;
  description?: string;
  icon?: string;  // Supports: preset:icon-id, data:image/..., or URL
  url: string;
  isGlobal: boolean;
  // 内置应用：所有用户默认拥有，但可卸载
  isBuiltin?: boolean;
  isActive: boolean;
  sortOrder: number;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LaunchpadBookmark {
  id: string;
  type: 'bookmark';
  name: string;
  url: string;
  icon?: string;
}

export interface LaunchpadFolder {
  id: string;
  type: 'folder';
  name: string;
  children: string[];
}

export type LaunchpadItem = DesktopApp | ForsionApp | LaunchpadBookmark | LaunchpadFolder;

import type { User, Session, AIModel } from './types/shared';

export type { User, Session, AIModel };

// ChatMessage is frontend-specific (uses timestamp instead of created_at)
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  id?: string;
  model_used?: string;
}
