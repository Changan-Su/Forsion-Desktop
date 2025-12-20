
export type AppId = 'knowledge' | 'calendar' | 'workspace' | 'recipe' | 'studio' | 'settings' | 'notes';

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
}
