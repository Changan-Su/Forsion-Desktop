
import React from 'react';
import { 
  BookOpen, 
  Calendar, 
  Layers, 
  Utensils, 
  Palette, 
  Settings, 
  StickyNote 
} from 'lucide-react';
import { DesktopApp } from './types';

export const APPS: DesktopApp[] = [
  { id: 'knowledge', name: 'Knowledge', icon: 'BookOpen', color: 'bg-[#3E406F]' }, // Deep Sea Indigo
  { id: 'calendar', name: 'Calendar', icon: 'Calendar', color: 'bg-[#EBD3B4]' }, // Sandy Tan
  { id: 'workspace', name: 'Workspace', icon: 'Layers', color: 'bg-[#C1A3B5]' }, // Lavender Mist
  { id: 'recipe', name: 'Recipe', icon: 'Utensils', color: 'bg-[#98B0B9]' }, // Ocean Blue-Grey
  { id: 'studio', name: 'Studio', icon: 'Palette', color: 'bg-[#3E406F]' }, 
  { id: 'notes', name: 'Quick Notes', icon: 'StickyNote', color: 'bg-[#EBD3B4]' },
  { id: 'settings', name: 'Settings', icon: 'Settings', color: 'bg-[#98B0B9]' },
];

export const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-full h-full text-white" />,
  Calendar: <Calendar className="w-full h-full text-[#3E406F]" />,
  Layers: <Layers className="w-full h-full text-white" />,
  Utensils: <Utensils className="w-full h-full text-white" />,
  Palette: <Palette className="w-full h-full text-white" />,
  StickyNote: <StickyNote className="w-full h-full text-[#3E406F]" />,
  Settings: <Settings className="w-full h-full text-white" />,
};

// Monet "Cliffs" Color Palette
export const COLORS = {
  tan: '#EBD3B4',
  mist: '#C1A3B5',
  sea: '#3E406F',
  sky: '#98B0B9',
  cloud: '#F2EDE4',
  text: '#2D2E4A'
};