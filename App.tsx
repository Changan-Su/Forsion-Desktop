
import React, { useState, useCallback, useEffect } from 'react';
import { Dock } from './components/Dock';
import { WindowManager } from './components/WindowManager';
import { AIChat } from './components/AIChat';
import { WidgetBoard } from './components/WidgetBoard';
import { WindowState, AppId, Theme } from './types';
import { APPS, THEMES } from './constants';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);

  // Apply theme variables to root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', currentTheme.primary);
    root.style.setProperty('--color-secondary', currentTheme.secondary);
    root.style.setProperty('--color-text', currentTheme.text);
    root.style.setProperty('--glass-surface', currentTheme.surface);
    root.style.setProperty('--bg-desktop', currentTheme.wallpaper ? `url(${currentTheme.wallpaper})` : currentTheme.background);
  }, [currentTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAIChatOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const launchApp = useCallback((appId: AppId) => {
    const existing = windows.find(w => w.appId === appId);
    if (existing) {
      setWindows(prev => prev.map(w => 
        w.appId === appId ? { ...w, isMinimized: false, zIndex: nextZIndex } : w
      ));
      setNextZIndex(z => z + 1);
      return;
    }

    const appInfo = APPS.find(a => a.id === appId);
    const newWindow: WindowState = {
      id: Math.random().toString(36).substring(7),
      appId,
      title: appInfo?.name || 'Application',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
      x: 300 + (windows.length * 20),
      y: 150 + (windows.length * 20),
      width: 600,
      height: 500
    };

    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(z => z + 1);
  }, [windows, nextZIndex]);

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  // Fixed typo: changed 'i' to 'w' to correctly reference the mapping parameter
  const minimizeWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
  };

  const focusWindow = (id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: nextZIndex } : w
    ));
    setNextZIndex(z => z + 1);
  };

  const updateTheme = (theme: Theme) => {
    setCurrentTheme(theme);
  };

  const activeAppIds = Array.from(new Set(windows.map(w => w.appId)));

  return (
    <div className="relative w-screen h-screen overflow-hidden transition-colors duration-500">
      <div className="absolute inset-0 z-0 bg-desktop-surface">
        <div className="brush-stroke" />
        <div className="absolute top-[5%] right-[10%] w-[60%] h-[40%] bg-white opacity-[0.1] blur-[140px] rounded-full" />
        <div className="absolute top-[40%] left-[5%] w-[50%] h-[40%] bg-white opacity-[0.05] blur-[110px] rounded-full" />
        <div className="absolute bottom-[0%] right-[-5%] w-[70%] h-[50%] bg-black opacity-[0.1] blur-[120px] rounded-full" />
      </div>

      <main className="relative h-full pt-4 pb-24 z-10">
        <WidgetBoard />
        
        {/* Desktop Content: Slogan and Account Settings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-7xl font-cursive text-surface-text opacity-40 select-none tracking-tight"
          >
            Forsion is All You Need
          </motion.h1>
        </div>

        {/* Account Settings Area in Top Right */}
        <div className="absolute top-6 right-6 pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-dark p-4 rounded-3xl flex items-center space-x-3 cursor-pointer hover:bg-white/40 transition-all group"
            onClick={() => launchApp('settings')}
          >
            <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <User size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-surface-text">账户设置</span>
              <span className="text-[10px] text-surface-text opacity-50 uppercase tracking-widest font-medium">User Profile</span>
            </div>
          </motion.div>
        </div>

        <WindowManager 
          windows={windows} 
          onClose={closeWindow} 
          onMinimize={minimizeWindow} 
          onFocus={focusWindow}
          theme={currentTheme}
          onThemeChange={updateTheme}
        />
      </main>

      <AIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(prev => !prev)} />
      
      <Dock onLaunch={launchApp} activeApps={activeAppIds} />
    </div>
  );
};

export default App;
