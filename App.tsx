
import React, { useState, useCallback, useEffect } from 'react';
import { Dock } from './components/Dock';
import { WindowManager } from './components/WindowManager';
import { AIChat } from './components/AIChat';
import { WidgetBoard } from './components/WidgetBoard';
import { WindowState, AppId } from './types';
import { APPS } from './constants';

const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false); // Collapsed by default
  const [nextZIndex, setNextZIndex] = useState(10);

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

  const minimizeWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
  };

  const focusWindow = (id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: nextZIndex } : w
    ));
    setNextZIndex(z => z + 1);
  };

  const activeAppIds = Array.from(new Set(windows.map(w => w.appId)));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#EBD3B4]">
      {/* Background with Monet "Cliffs" palette */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#98B0B9] via-[#C1A3B5] to-[#3E406F]">
        <div className="brush-stroke" />
        {/* Soft, textured decorative blobs echoing the cliffs and surf */}
        <div className="absolute top-[5%] right-[10%] w-[60%] h-[40%] bg-white opacity-[0.2] blur-[140px] rounded-full" />
        <div className="absolute top-[40%] left-[5%] w-[50%] h-[40%] bg-[#EBD3B4] opacity-[0.15] blur-[110px] rounded-full" />
        <div className="absolute bottom-[0%] right-[-5%] w-[70%] h-[50%] bg-[#3E406F] opacity-[0.25] blur-[120px] rounded-full" />
      </div>

      <main className="relative h-full pt-4 pb-24 z-10">
        <WidgetBoard />
        
        <div className="h-full px-8 flex items-start justify-center">
          <div className="grid grid-cols-1 grid-flow-row auto-rows-min gap-8 pt-8 opacity-40">
          </div>
        </div>

        <WindowManager 
          windows={windows} 
          onClose={closeWindow} 
          onMinimize={minimizeWindow} 
          onFocus={focusWindow}
        />
      </main>

      {/* AIChat - Initial state is collapsed */}
      <AIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(prev => !prev)} />
      
      <Dock onLaunch={launchApp} activeApps={activeAppIds} />
    </div>
  );
};

export default App;