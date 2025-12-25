
import React from 'react';
import { 
  BookOpen, 
  Calendar, 
  Layers, 
  Utensils, 
  Palette, 
  Settings, 
  StickyNote,
  ShoppingBag,
  LayoutGrid
} from 'lucide-react';
import { DesktopApp, Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: 'monet-cliffs',
    name: 'Monet Cliffs',
    background: 'linear-gradient(to bottom, #98B0B9, #C1A3B5, #3E406F)',
    primary: '#3E406F',
    secondary: '#C1A3B5',
    surface: 'rgba(255, 255, 255, 0.35)',
    text: '#2D2E4A',
    isDark: false
  },
  {
    id: 'van-gogh-starry',
    name: 'Starry Night',
    background: 'linear-gradient(to bottom, #111E4B, #203A81, #EBD3B4)',
    primary: '#EBD3B4',
    secondary: '#111E4B',
    surface: 'rgba(17, 30, 75, 0.4)',
    text: '#EBD3B4',
    isDark: true
  },
  {
    id: 'sunset-meadow',
    name: 'Sunset Meadow',
    background: 'linear-gradient(to bottom, #F5E1A4, #FF9E7D, #4B7A47)',
    primary: '#4B7A47',
    secondary: '#FF9E7D',
    surface: 'rgba(255, 255, 255, 0.3)',
    text: '#2D2E4A',
    isDark: false
  }
];

export const APPS: DesktopApp[] = [
  { id: 'knowledge', name: 'Knowledge', icon: 'BookOpen', color: 'bg-accent' },
  { id: 'calendar', name: 'Calendar', icon: 'Calendar', color: 'bg-white/20' },
  { id: 'workspace', name: 'Workspace', icon: 'Layers', color: 'bg-accent' },
  { id: 'recipe', name: 'Recipe', icon: 'Utensils', color: 'bg-accent' },
  { id: 'studio', name: 'Studio', icon: 'Palette', color: 'bg-accent' }, 
  { id: 'notes', name: 'Quick Notes', icon: 'StickyNote', color: 'bg-white/20' },
  { id: 'app-market', name: 'App Market', icon: 'ShoppingBag', color: 'bg-white/20' },
  { id: 'launchpad', name: 'Launchpad', icon: 'LayoutGrid', color: 'bg-white/20' },
  { id: 'settings', name: 'Settings', icon: 'Settings', color: 'bg-accent' },
];

export const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-full h-full text-white" />,
  Calendar: <Calendar className="w-full h-full text-accent" />,
  Layers: <Layers className="w-full h-full text-white" />,
  Utensils: <Utensils className="w-full h-full text-white" />,
  Palette: <Palette className="w-full h-full text-white" />,
  StickyNote: <StickyNote className="w-full h-full text-accent" />,
  ShoppingBag: <ShoppingBag className="w-full h-full text-white" />,
  LayoutGrid: <LayoutGrid className="w-full h-full text-white" />,
  Settings: <Settings className="w-full h-full text-white" />,
};
