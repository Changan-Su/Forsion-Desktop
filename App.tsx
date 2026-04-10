import React, { useState, useCallback, useEffect } from 'react';
import { Dock } from './components/Dock';
import { WindowManager } from './components/WindowManager';
import { AIChat } from './components/AIChat';
import { CardZoneManager } from './components/CardZoneManager';
import UserSettingsModal from './components/UserSettingsModal';
import Avatar from './components/Avatar';
import { WindowState, AppId, Theme, ForsionApp } from './types';
import { APPS, THEMES } from './constants';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import AuthService from './services/authService';
import SettingsStorageService from './services/settingsStorageService';
import { initAuth, validateToken, redirectToLogin } from './services/authRedirect';
import { ModeToggle } from './components/ModeToggle';
import { LocaleToggle } from './components/LocaleToggle';
import { FullscreenToggle } from './components/FullscreenToggle';
import { useI18n } from './services/i18nService';
import { getShortcutBindings, ShortcutBindings, ShortcutAction } from './components/Settings/ShortcutSettings';
import { getAutoAdapt, getBingDaily } from './components/Settings/AppearanceSettings';
import { fetchBingWallpapers } from './services/wallpaperService';
import { generateThemeFromWallpaper } from './services/colorExtractionService';
import { initDeskPlugins } from './plugins/initPlugins';

// Initialize desk plugins (idempotent — safe on HMR)
initDeskPlugins();

const App: React.FC = () => {
  const { t } = useI18n();
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('forsion_desktop_theme');
      if (saved) {
        const theme = JSON.parse(saved) as Theme;
        if (theme.id && theme.background && theme.primary && theme.secondary && theme.surface && theme.text && typeof theme.isDark === 'boolean') return theme;
      }
    } catch {}
    return THEMES[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [vignetting, setVignetting] = useState(() => localStorage.getItem('forsion_desktop_vignetting') !== 'false');
  const [focusBlur, setFocusBlur] = useState(() => localStorage.getItem('forsion_desktop_focus_blur') === 'true');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [shortcutBindings, setShortcutBindings] = useState<ShortcutBindings>(getShortcutBindings);
  const [isWidgetEditing, setIsWidgetEditing] = useState(false);

  // Focus blur fires when a window / AI chat is open, or the user has
  // actively focused the search input. The search input is NOT auto-focused
  // on mount, so page load/refresh remains unblurred; blur only kicks in
  // once the user clicks or tabs into the search box.
  const isDesktopFocused = windows.length > 0 || isAIChatOpen || isSearchFocused;

  // Apply theme variables to root — blends desk theme with dark/light mode
  useEffect(() => {
    const root = document.documentElement;
    const mode = root.getAttribute('data-mode') || 'light';
    const isDark = mode === 'dark';

    root.style.setProperty('--color-primary', currentTheme.primary);
    root.style.setProperty('--color-secondary', currentTheme.secondary);
    root.style.setProperty('--bg-desktop', currentTheme.wallpaper ? `url(${currentTheme.wallpaper})` : currentTheme.background);

    // Mode-aware: dark mode overrides text and surface for all components
    if (isDark) {
      root.style.setProperty('--color-text', 'rgba(255,255,255,0.94)');
      root.style.setProperty('--glass-surface', 'rgba(30,30,30,0.45)');
      root.style.setProperty('--glass-surface-light', 'rgba(30,30,30,0.25)');
    } else {
      root.style.setProperty('--color-text', currentTheme.text);
      root.style.setProperty('--glass-surface', currentTheme.surface);
      root.style.setProperty('--glass-surface-light', 'rgba(255,255,255,0.3)');
    }
  }, [currentTheme]);

  // Re-apply theme when dark/light mode changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-mode') {
          const root = document.documentElement;
          const isDark = root.getAttribute('data-mode') === 'dark';
          if (isDark) {
            root.style.setProperty('--color-text', 'rgba(255,255,255,0.94)');
            root.style.setProperty('--glass-surface', 'rgba(30,30,30,0.45)');
            root.style.setProperty('--glass-surface-light', 'rgba(30,30,30,0.25)');
          } else {
            root.style.setProperty('--color-text', currentTheme.text);
            root.style.setProperty('--glass-surface', currentTheme.surface);
            root.style.setProperty('--glass-surface-light', 'rgba(255,255,255,0.3)');
          }
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
    return () => observer.disconnect();
  }, [currentTheme]);

  // Auto-apply Bing daily wallpaper on startup if enabled
  useEffect(() => {
    if (!getBingDaily()) return;

    const BING_DAILY_DATE_KEY = 'forsion_bing_daily_date';
    const today = new Date().toISOString().slice(0, 10);
    // Only fetch once per day
    if (localStorage.getItem(BING_DAILY_DATE_KEY) === today) return;

    (async () => {
      try {
        const wallpapers = await fetchBingWallpapers();
        if (wallpapers.length === 0) return;
        const wallpaperUrl = wallpapers[0].url;
        localStorage.setItem(BING_DAILY_DATE_KEY, today);

        if (getAutoAdapt()) {
          const theme = await generateThemeFromWallpaper(wallpaperUrl);
          setCurrentTheme(theme);
          localStorage.setItem('forsion_desktop_theme', JSON.stringify(theme));
          SettingsStorageService.updateUserSettings({ theme_preferences: theme }).catch(() => {});
        } else {
          // Neutral colors with wallpaper
          const isDark = currentTheme.isDark;
          const neutral = isDark
            ? { primary: 'rgba(255,255,255,0.85)', secondary: 'rgba(255,255,255,0.5)', surface: 'rgba(30,30,30,0.45)', text: 'rgba(255,255,255,0.94)' }
            : { primary: 'rgba(30,30,30,0.85)', secondary: 'rgba(60,60,60,0.5)', surface: 'rgba(255,255,255,0.45)', text: 'rgba(30,30,30,0.94)' };
          const theme: Theme = { ...currentTheme, ...neutral, id: 'bing-daily', name: 'Bing Daily', wallpaper: wallpaperUrl };
          setCurrentTheme(theme);
          localStorage.setItem('forsion_desktop_theme', JSON.stringify(theme));
          SettingsStorageService.updateUserSettings({ theme_preferences: theme }).catch(() => {});
        }
      } catch (err) {
        console.error('[App] Bing daily wallpaper fetch failed:', err);
      }
    })();
  }, []); // Run once on mount

  // Listen for bing-daily toggle to apply immediately when turned on
  useEffect(() => {
    const handler = async (e: CustomEvent) => {
      if (!e.detail.enabled) return;
      try {
        const wallpapers = await fetchBingWallpapers();
        if (wallpapers.length === 0) return;
        const wallpaperUrl = wallpapers[0].url;
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('forsion_bing_daily_date', today);

        if (getAutoAdapt()) {
          const theme = await generateThemeFromWallpaper(wallpaperUrl);
          setCurrentTheme(theme);
          localStorage.setItem('forsion_desktop_theme', JSON.stringify(theme));
          SettingsStorageService.updateUserSettings({ theme_preferences: theme }).catch(() => {});
        } else {
          const isDark = currentTheme.isDark;
          const neutral = isDark
            ? { primary: 'rgba(255,255,255,0.85)', secondary: 'rgba(255,255,255,0.5)', surface: 'rgba(30,30,30,0.45)', text: 'rgba(255,255,255,0.94)' }
            : { primary: 'rgba(30,30,30,0.85)', secondary: 'rgba(60,60,60,0.5)', surface: 'rgba(255,255,255,0.45)', text: 'rgba(30,30,30,0.94)' };
          const theme: Theme = { ...currentTheme, ...neutral, id: 'bing-daily', name: 'Bing Daily', wallpaper: wallpaperUrl };
          setCurrentTheme(theme);
          localStorage.setItem('forsion_desktop_theme', JSON.stringify(theme));
          SettingsStorageService.updateUserSettings({ theme_preferences: theme }).catch(() => {});
        }
      } catch (err) {
        console.error('[App] Bing daily wallpaper fetch failed:', err);
      }
    };
    window.addEventListener('bing-daily-changed', handler as EventListener);
    return () => window.removeEventListener('bing-daily-changed', handler as EventListener);
  }, [currentTheme]);

  // Apply GPU acceleration setting to body
  useEffect(() => {
    const gpuEnabled = SettingsStorageService.getGPUAcceleration();
    if (gpuEnabled) {
      document.body.classList.add('gpu-acceleration');
    } else {
      document.body.classList.remove('gpu-acceleration');
    }

    // Listen for storage changes and custom events to update GPU acceleration in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'forsion_desktop_settings' || e.key === 'forsion_desktop_gpu_acceleration') {
        const newGpuEnabled = SettingsStorageService.getGPUAcceleration();
        if (newGpuEnabled) {
          document.body.classList.add('gpu-acceleration');
        } else {
          document.body.classList.remove('gpu-acceleration');
        }
      }
    };
    const handleGPUChange = (e: CustomEvent) => {
      if (e.detail.enabled) {
        document.body.classList.add('gpu-acceleration');
      } else {
        document.body.classList.remove('gpu-acceleration');
      }
    };

    const handleOverlayChange = (e: CustomEvent) => {
      if (e.detail.vignetting !== undefined) setVignetting(e.detail.vignetting);
      if (e.detail.focusBlur !== undefined) setFocusBlur(e.detail.focusBlur);
    };
    const handleSearchFocus = (e: CustomEvent) => {
      setIsSearchFocused(e.detail.focused);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gpu-acceleration-changed', handleGPUChange as EventListener);
    window.addEventListener('wallpaper-overlay-changed', handleOverlayChange as EventListener);
    window.addEventListener('search-focus-changed', handleSearchFocus as EventListener);
    const handleShortcutChange = (e: CustomEvent) => {
      setShortcutBindings(e.detail as ShortcutBindings);
    };
    window.addEventListener('shortcut-bindings-changed', handleShortcutChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gpu-acceleration-changed', handleGPUChange as EventListener);
      window.removeEventListener('wallpaper-overlay-changed', handleOverlayChange as EventListener);
      window.removeEventListener('search-focus-changed', handleSearchFocus as EventListener);
      window.removeEventListener('shortcut-bindings-changed', handleShortcutChange as EventListener);
    };
  }, []);

  // Check authentication status and sync user info from backend
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoadingAuth(true);

      // 1. 处理从登录页返回的 token
      initAuth();

      // 2. 静默验证 token，不强制跳转
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const isValid = await validateToken(apiBaseUrl);

      if (isValid) {
        setIsAuthenticated(true);
        const localUser = AuthService.getUser();
        setCurrentUser(localUser);

        try {
          const latestUser = await AuthService.getCurrentUser();
          setCurrentUser(latestUser);
        } catch (error: any) {
          console.error('Failed to fetch current user:', error);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }

      setIsLoadingAuth(false);
    };

    checkAuth();
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

  // Track widget edit mode for dock active indicator
  useEffect(() => {
    const onToggle = () => setIsWidgetEditing(prev => !prev);
    const onSaved = () => setIsWidgetEditing(false);
    const onCancelled = () => setIsWidgetEditing(false);
    window.addEventListener('widget-edit-toggle', onToggle);
    window.addEventListener('widget-edit-saved', onSaved);
    window.addEventListener('widget-edit-cancelled', onCancelled);
    return () => {
      window.removeEventListener('widget-edit-toggle', onToggle);
      window.removeEventListener('widget-edit-saved', onSaved);
      window.removeEventListener('widget-edit-cancelled', onCancelled);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isAuthenticated) {
          redirectToLogin('desktop');
          return;
        }
        setIsAIChatOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    AuthService.logout();
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

  // Apps that require authentication to open
  const AUTH_REQUIRED_APPS: AppId[] = ['forsion-desk-market'];

  const launchApp = useCallback((appId: AppId) => {
    // Widgets app toggles edit mode instead of opening a window
    if (appId === 'widgets') {
      window.dispatchEvent(new CustomEvent('widget-edit-toggle'));
      return;
    }

    if (AUTH_REQUIRED_APPS.includes(appId) && !isAuthenticated) {
      redirectToLogin('desktop');
      return;
    }

    const existing = windows.find(w => w.appId === appId);
    
    // If app is already open and not minimized, close it (toggle behavior)
    if (existing && !existing.isMinimized) {
      setWindows(prev => prev.filter(w => w.id !== existing.id));
      return;
    }

    // If app exists but is minimized, restore it and minimize others
    if (existing && existing.isMinimized) {
      setWindows(prev => prev.map(w => 
        w.id === existing.id 
          ? { ...w, isMinimized: false, zIndex: nextZIndex }
          : { ...w, isMinimized: true }
      ));
      setNextZIndex(z => z + 1);
      return;
    }

    // If app doesn't exist, create new window and minimize others
    const appInfo = APPS.find(a => a.id === appId);
    const newWindow: WindowState = {
      id: Math.random().toString(36).substring(7),
      appId,
      title: appInfo?.nameKey ? t(appInfo.nameKey) : (appInfo?.name || 'Application'),
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

    // Minimize all other open windows and add new window in one operation
    setWindows(prev => [
      ...prev.map(w => ({ ...w, isMinimized: true })),
      newWindow
    ]);
    setNextZIndex(z => z + 1);
  }, [windows, nextZIndex, isAuthenticated]);

  const handleLaunchForsionApp = useCallback((app: ForsionApp) => {
    // Open Forsion App URL in new tab
    window.open(app.url, '_blank', 'noopener,noreferrer');
  }, []);

  // Execute a shortcut action
  const executeShortcutAction = useCallback((action: ShortcutAction) => {
    if (action === 'none') return;
    if (action === 'open-launchpad') {
      launchApp('launchpad');
    } else if (action === 'focus-search') {
      // Dispatch event to focus the search input
      window.dispatchEvent(new CustomEvent('shortcut-focus-search'));
    }
  }, [launchApp]);

  // Right-click on empty desktop area
  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    const action = shortcutBindings['right-click-empty'];
    if (action === 'none') return;
    e.preventDefault();
    executeShortcutAction(action);
  }, [shortcutBindings, executeShortcutAction]);

  // Click on title area
  const handleTitleClick = useCallback(() => {
    executeShortcutAction(shortcutBindings['click-title']);
  }, [shortcutBindings, executeShortcutAction]);

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
    localStorage.setItem('forsion_desktop_theme', JSON.stringify(theme));
    SettingsStorageService.updateUserSettings({ theme_preferences: theme }).catch(() => {});
  };

  const activeAppIds = Array.from(new Set([
    ...windows.map(w => w.appId),
    ...(isWidgetEditing ? ['widgets'] : []),
  ]));

  // Show loading screen while checking authentication
  if (isLoadingAuth) {
    return (
      <div className="relative w-screen h-screen overflow-hidden transition-colors duration-500 flex items-center justify-center">
        <div className="text-surface-text opacity-50">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden transition-colors duration-500" onContextMenu={handleDesktopContextMenu}>
      <div className={`absolute inset-0 z-0 bg-desktop-surface${focusBlur && isDesktopFocused ? ' wallpaper-focus-blur' : ''}`}>
        <div className="brush-stroke" />
        <div className="absolute top-[5%] right-[10%] w-[60%] h-[40%] bg-white opacity-[0.1] blur-[140px] rounded-full" />
        <div className="absolute top-[40%] left-[5%] w-[50%] h-[40%] bg-white opacity-[0.05] blur-[110px] rounded-full" />
        <div className="absolute bottom-[0%] right-[-5%] w-[70%] h-[50%] bg-black opacity-[0.1] blur-[120px] rounded-full" />
      </div>
      {/* Background overlay — vignetting & focus dimming */}
      <div className={`bg-overlay${vignetting ? ' vignetting' : ''}${vignetting || (focusBlur && isDesktopFocused) ? ' show' : ''}${focusBlur && isDesktopFocused ? ' focus-lite' : ''}`} />

      <main className="relative h-full pt-4 pb-24 z-10">
        <CardZoneManager />

        {/* Account Settings Area in Top Right */}
        <div className="absolute top-6 right-6 pointer-events-auto flex items-center gap-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5"
          >
            <FullscreenToggle />
            <ModeToggle />
            <LocaleToggle />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center gap-2 cursor-pointer group"
            style={{
              background: 'var(--ui-surface-sub)',
              backdropFilter: 'var(--backdrop-glass)',
              WebkitBackdropFilter: 'var(--backdrop-glass)',
              border: '1px solid var(--ui-border-sub)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              transition: 'all var(--dur-fast) var(--ease-apple)',
            }}
            onClick={() => {
              if (isAuthenticated) {
                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const token = AuthService.getToken();
                window.open(`${apiBaseUrl}/account?token=${token}`, '_blank', 'noopener,noreferrer');
              } else {
                redirectToLogin('desktop');
              }
            }}
          >
            <div className="group-hover:scale-105 transition-transform" style={{ width: 36, height: 36, flexShrink: 0 }}>
              <Avatar user={currentUser} size="md" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate text-surface-text">
                {isAuthenticated ? (currentUser?.nickname || currentUser?.username || '?') : t('user.settings')}
              </span>
              <span className="text-[11px] text-surface-text opacity-70">
                {isAuthenticated ? t('user.center') : t('user.login')}
              </span>
            </div>
            {isAuthenticated && (
              <button
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--ui-surface-sub)',
                  border: '1px solid var(--ui-border-sub)',
                  color: 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                title={t('user.logout')}
              >
                <LogOut size={13} />
              </button>
            )}
          </motion.div>
        </div>

        <WindowManager
          windows={windows}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onFocus={focusWindow}
          theme={currentTheme}
          onThemeChange={updateTheme}
          onLaunchApp={launchApp}
          onLaunchForsionApp={handleLaunchForsionApp}
        />
      </main>

      <AIChat 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(prev => !prev)} 
        hasAppOpen={hasAppOpen}
      />
      
      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
      />
      
      <Dock 
        onLaunch={launchApp} 
        activeApps={activeAppIds}
        onLaunchForsionApp={handleLaunchForsionApp}
      />
    </div>
  );
};

export default App;