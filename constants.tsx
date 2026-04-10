
import React from 'react';
import {
  Settings,
  LayoutGrid,
  Store,
  LayoutDashboard,
} from 'lucide-react';
import { DesktopApp, Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: 'curtain-of-light',
    name: '光之水帘',
    background: 'linear-gradient(to bottom, #2A4A2E, #4A6B3A, #1A3A1E)',
    wallpaper: '/wallpapers/bing-curtain-of-light.jpg',
    primary: '#4A6B3A',
    secondary: '#2A4A2E',
    surface: 'rgba(30, 50, 30, 0.5)',
    text: '#E8F0E0',
    isDark: true
  },
  {
    id: 'monet-cliffs',
    name: 'Monet Cliffs',
    background: 'linear-gradient(to bottom, #98B0B9, #C1A3B5, #3E406F)',
    primary: '#3E406F',
    secondary: '#C1A3B5',
    surface: 'rgba(255, 255, 255, 0.5)',
    text: '#2D2E4A',
    isDark: false
  },
  {
    id: 'van-gogh-starry',
    name: 'Starry Night',
    background: 'linear-gradient(to bottom, #111E4B, #203A81, #EBD3B4)',
    primary: '#EBD3B4',
    secondary: '#111E4B',
    surface: 'rgba(17, 30, 75, 0.5)',
    text: '#EBD3B4',
    isDark: true
  },
  {
    id: 'sunset-meadow',
    name: 'Sunset Meadow',
    background: 'linear-gradient(to bottom, #F5E1A4, #FF9E7D, #4B7A47)',
    primary: '#4B7A47',
    secondary: '#FF9E7D',
    surface: 'rgba(255, 255, 255, 0.5)',
    text: '#2D2E4A',
    isDark: false
  }
];

export const APPS: DesktopApp[] = [
  { id: 'forsion-desk-market', name: 'Market', nameKey: 'app.name.forsion-desk-market', icon: 'Store', color: '' },
  { id: 'launchpad', name: 'Drawer', nameKey: 'app.name.launchpad', icon: 'LayoutGrid', color: '' },
  { id: 'widgets', name: 'Widgets', nameKey: 'app.name.widgets', icon: 'LayoutDashboard', color: '' },
  { id: 'settings', name: 'Settings', nameKey: 'app.name.settings', icon: 'Settings', color: '' },
];

export interface SearchEngine {
  id: string;
  name: string;
  searchUrl: string;
  suggestEngine?: string; // engine param for suggest API (bing/baidu/google), undefined = no suggest
  shortcutKey: string;    // '1' ~ '5'
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'baidu',      name: '百度',       searchUrl: 'https://www.baidu.com/s?wd={query}',          suggestEngine: 'baidu',  shortcutKey: '1' },
  { id: 'bing',       name: '必应',       searchUrl: 'https://www.bing.com/search?q={query}',       suggestEngine: 'bing',   shortcutKey: '2' },
  { id: 'google',     name: '谷歌',       searchUrl: 'https://www.google.com/search?q={query}',     suggestEngine: 'google', shortcutKey: '3' },
  { id: 'yandex',     name: 'Yandex',    searchUrl: 'https://yandex.com/search/?text={query}',     suggestEngine: undefined, shortcutKey: '4' },
  { id: 'duckduckgo', name: 'DuckDuckGo', searchUrl: 'https://duckduckgo.com/?q={query}',          suggestEngine: undefined, shortcutKey: '5' },
  { id: 'ai',         name: '汤谷智能体', searchUrl: '',                                           suggestEngine: undefined, shortcutKey: '6' },
];

export const DEFAULT_SEARCH_ENGINE = 'bing';

export const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-full h-full" />,
  Store: <Store className="w-full h-full" />,
  LayoutGrid: <LayoutGrid className="w-full h-full" />,
  Settings: <Settings className="w-full h-full" />,
};
