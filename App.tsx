import React, { useState, useCallback, useEffect } from 'react';
import { Dock } from './components/Dock';
import { WindowManager } from './components/WindowManager';
import { AIChat } from './components/AIChat';
import { LoginModal } from './components/LoginModal';
import { WidgetBoard } from './components/WidgetBoard';
import UserSettingsModal from './components/UserSettingsModal';
import Avatar from './components/Avatar';
import { WindowState, AppId, Theme } from './types';
import { APPS, THEMES } from './constants';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import AuthService from './services/authService';

const App: React.FC = () => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [installedApps, setInstalledApps] = useState<AppId[]>(['knowledge', 'calendar', 'workspace', 'recipe', 'studio', 'notes', 'settings']);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showUserSettings, setShowUserSettings] = useState(false);

  // Apply theme variables to root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', currentTheme.primary);
    root.style.setProperty('--color-secondary', currentTheme.secondary);
    root.style.setProperty('--color-text', currentTheme.text);
    root.style.setProperty('--glass-surface', currentTheme.surface);
    root.style.setProperty('--bg-desktop', currentTheme.wallpaper ? `url(${currentTheme.wallpaper})` : currentTheme.background);
  }, [currentTheme]);

  // Check authentication status and sync user info from backend
  useEffect(() => {
    const initAuth = async () => {
      const authenticated = AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        try {
          // 从后端获取最新的用户信息（包括头像）
          const latestUser = await AuthService.getCurrentUser();
          setCurrentUser(latestUser);
        } catch (error) {
          console.error('Failed to fetch current user:', error);
          // 如果失败，使用本地存储的用户信息
          setCurrentUser(AuthService.getUser());
        }
      }
    };
    
    initAuth();
  }, []);

  // Listen for user updates (e.g., avatar changes)
  useEffect(() => {
    const handleUserUpdate = () => {
      const updatedUser = AuthService.getUser();
      setCurrentUser(updatedUser);
    };

    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

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

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    try {
      // 登录成功后，从后端获取最新的用户信息（包括头像）
      const latestUser = await AuthService.getCurrentUser();
      setCurrentUser(latestUser);
    } catch (error) {
      console.error('Failed to fetch current user after login:', error);
      // 如果失败，使用本地存储的用户信息
      setCurrentUser(AuthService.getUser());
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const hasAppOpen = windows.some(w => !w.isMinimized);

  // Update window positions when layout changes
  // Windows should always remain centered
  useEffect(() => {
    const centerWindows = () => {
      const screenCenter = window.innerWidth / 2;
      const windowWidth = 680;
      const targetX = screenCenter - (windowWidth / 2);
      
      setWindows(prev => prev.map(w => {
        if (w.x !== targetX) {
          return { ...w, x: targetX };
        }
        return w;
      }));
    };

    // Center immediately
    centerWindows();

    // Also recenter on window resize
    window.addEventListener('resize', centerWindows);
    return () => window.removeEventListener('resize', centerWindows);
  }, [windows.length]); // Trigger when windows are added/removed

  const launchApp = useCallback((appId: AppId) => {
    const existing = windows.find(w => w.appId === appId);
    
    // Toggle Close Logic: If app is already open, close it.
    if (existing) {
      setWindows(prev => prev.filter(w => w.id !== existing.id));
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
      // Start centered, the useEffect will keep it centered
      x: (window.innerWidth / 2) - 340,
      y: window.innerHeight / 2 - 280,
      width: 680,
      height: 560
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
        <div className="absolute top-6 right-6 pointer-events-auto flex items-center gap-3">
          {isAuthenticated && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleLogout}
              className="glass-dark p-3 rounded-2xl hover:bg-white/40 transition-all"
              title="Logout"
            >
              <LogOut size={18} className="text-surface-text" />
            </motion.button>
          )}
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-dark p-4 rounded-3xl flex items-center space-x-3 cursor-pointer hover:bg-white/40 transition-all group"
            onClick={() => {
              if (isAuthenticated) {
                setShowUserSettings(true);
              } else {
                setIsLoginModalOpen(true);
              }
            }}
          >
            <div className="group-hover:scale-110 transition-transform">
              <Avatar user={currentUser} size="md" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-surface-text">
                {isAuthenticated ? (currentUser?.nickname || currentUser?.username) : '账户设置'}
              </span>
              <span className="text-[10px] text-surface-text opacity-50 uppercase tracking-widest font-medium">
                {isAuthenticated ? 'Logged In' : 'User Profile'}
              </span>
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
          installedApps={installedApps}
          onInstall={(appId) => setInstalledApps(prev => [...prev, appId])}
          onLaunchApp={launchApp}
        />
      </main>

      <AIChat 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(prev => !prev)} 
        hasAppOpen={hasAppOpen}
      />
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      
      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
      />
      
      <Dock onLaunch={launchApp} activeApps={activeAppIds} />
    </div>
  );
};

export default App;