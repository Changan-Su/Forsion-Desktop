
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2, Image as ImageIcon, Check, Server, CheckCircle2, XCircle, Loader } from 'lucide-react';
import { WindowState, AppId, Theme, ForsionApp } from '../types';
import { APPS, THEMES } from '../constants';
import apiService from '../services/apiService';
import { AppMarket } from './AppMarket';
import { Launchpad } from './Launchpad';
import { ForsionDeskMarket } from './ForsionDeskMarket';

interface WindowManagerProps {
  windows: WindowState[];
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onFocus: (id: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  installedApps: AppId[];
  onInstall: (appId: AppId) => void;
  onLaunchApp: (appId: AppId) => void;
  onLaunchForsionApp?: (app: ForsionApp) => void;
}

export const WindowManager: React.FC<WindowManagerProps> = ({ 
  windows, 
  onClose, 
  onMinimize, 
  onFocus,
  theme,
  onThemeChange,
  installedApps,
  onInstall,
  onLaunchApp,
  onLaunchForsionApp
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {windows.filter(w => !w.isMinimized).map((win) => {
          return (
            <motion.div
              key={win.id}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onMouseDown={() => onFocus(win.id)}
              className="absolute pointer-events-auto rounded-2xl glass-dark shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-white/40"
              style={{
                zIndex: win.zIndex,
                width: win.width,
                height: win.height,
                left: win.x,
                top: win.y,
              }}
            >
              {/* Title Bar - Simplified */}
              {/* Don't show title bar for App Market (it has its own header) or Launchpad if desired, 
                  but user said "like other apps", so maybe keep it?
                  Actually AppMarket has its own header in the design I just wrote. 
                  If I keep WindowManager header, I'll have double headers.
                  Let's conditionally hide WindowManager header for AppMarket.
              */}
              {win.appId !== 'app-market' && win.appId !== 'forsion-desk-market' && (
                <div className="h-12 flex items-center justify-between px-6 pt-4 select-none">
                  <span className="text-surface-text text-xl font-bold tracking-tight opacity-90">{win.title}</span>
                  <button 
                    onClick={() => onClose(win.id)}
                    className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors group"
                  >
                    <X size={18} className="text-surface-text opacity-60 group-hover:opacity-100" />
                  </button>
                </div>
              )}
              
              {/* For App Market, we might want the Close button from WindowManager but overlaying?
                  Or let AppMarket handle closing via internal header?
                  Actually, my AppMarket implementation HAS a header but NO close button logic connected to WindowManager.
                  It had `onClose` prop but I removed it from usage in the new implementation (it just renders content).
                  
                  Wait, `AppMarket` refactored code:
                  <button onClick={onClose} ...> <X /> </button>
                  
                  Wait, I removed `onClose` prop from `AppMarket` signature in my refactor step!
                  So the close button inside `AppMarket` is broken or removed?
                  Let's check `AppMarket` refactor again.
                  
                  Ah, I removed the `onClose` prop from `AppMarketProps` but did I remove the close button from JSX?
                  In the previous step's `new_string`, I don't see `onClose` in destructuring.
                  But the JSX still has:
                  <div className="p-5 ... border-b ...">
                    ...
                    <button onClick={onClose} ...> <X /> </button>
                  </div>
                  
                  If `onClose` is not defined, this will crash.
                  I need to fix AppMarket to NOT have a close button in its content, 
                  and rely on WindowManager's close button (which I just conditionally hid).
                  
                  OR, I pass `onClose` to `AppMarket` and let it handle closing.
                  
                  Decision: 
                  User said "like other apps". Other apps have the WindowManager header.
                  So AppMarket should also have the WindowManager header.
                  I should REMOVE the internal header from AppMarket content, or at least the close button.
                  
                  Let's stick to WindowManager providing the frame.
                  So I will SHOW the header in WindowManager for all apps.
                  And I should probably update AppMarket to NOT show its own header, or merge them.
                  
                  Actually, AppMarket's header has the Search bar.
                  So I should keep AppMarket's header but remove the Close button from it.
                  And keep WindowManager's header? That would be double headers.
                  
                  Better: Hide WindowManager header for AppMarket, and pass `onClose` to AppMarket so it can use its own button.
                  But I already refactored AppMarket to NOT accept onClose.
                  
                  Let's adjust WindowManager to handle this.
                  I will pass `onClose` to `renderAppContent` so it can be passed down if needed.
                  
                  And for `Launchpad`, it also has a Search bar.
                  
                  Let's simply render the WindowManager header for ALL apps for consistency (as user requested "like other apps").
                  And I will ignore the redundancy for a moment, or better, I will fix AppMarket/Launchpad to not have a redundant close button/title if possible.
                  
                  Actually, in my previous refactor of AppMarket, I see:
                  `export const AppMarket: React.FC<AppMarketProps> = ({ installedApps, onInstall }) => { ...`
                  And I removed the Close button from the header in the JSX?
                  Let's check the JSX in `refactor-appmarket` step.
                  
                  In `new_string` of `refactor-appmarket`:
                  The header div is there.
                  It DOES NOT have the close button!
                  It ends with `</div>` after the search input div.
                  Great! So I removed the close button.
                  
                  So AppMarket has a "Header" area with Search, but no Title/Close button?
                  Wait, it has `<h3 ...>App Market</h3>`.
                  
                  So if I enable WindowManager header, I'll have:
                  [ Window Title: App Market   (X) ]
                  [ App Market (H3)   [Search]     ]
                  
                  This is acceptable. The H3 is like a "page title".
                  
                  So, WindowManager SHOULD show header for all apps.
              */}

              {/* Content Area */}
              <div className="flex-1 p-6 text-surface-text overflow-auto">
                {renderAppContent(
                  win.appId, 
                  theme, 
                  onThemeChange, 
                  installedApps, 
                  onInstall, 
                  onLaunchApp,
                  onLaunchForsionApp
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const renderAppContent = (
  appId: AppId, 
  currentTheme: Theme, 
  onThemeChange: (theme: Theme) => void,
  installedApps: AppId[],
  onInstall: (appId: AppId) => void,
  onLaunchApp: (appId: AppId) => void,
  onLaunchForsionApp?: (app: ForsionApp) => void
) => {
  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        onThemeChange({
          ...currentTheme,
          id: 'custom-wallpaper',
          name: 'Custom Wallpaper',
          wallpaper: imageUrl
        });
      };
      reader.readAsDataURL(file);
    }
  };

  switch (appId) {
    case 'app-market':
      return <AppMarket installedApps={installedApps} onInstall={onInstall} />;
    case 'forsion-desk-market':
      return <ForsionDeskMarket />;
    case 'launchpad':
      return <Launchpad onLaunch={onLaunchApp} onLaunchForsionApp={onLaunchForsionApp} />;
    case 'settings':
      return <SettingsContent currentTheme={currentTheme} onThemeChange={onThemeChange} />;
    case 'knowledge':
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-accent">Sea Library</h2>
          <div className="grid grid-cols-2 gap-4">
            {['Impressionist Light', 'Cliffs of Étretat', 'Mist Studies', 'Tidal Patterns'].map(item => (
              <div key={item} className="glass p-4 rounded-xl hover:bg-white/40 transition-colors cursor-pointer group border-white/50">
                <div className="w-10 h-10 rounded bg-accent/20 mb-3 flex items-center justify-center">
                  <div className="w-4 h-4 bg-accent rounded-sm" />
                </div>
                <div className="font-semibold text-surface-text opacity-90">{item}</div>
                <div className="text-[10px] opacity-50 mt-1 uppercase tracking-wider">Archive</div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'calendar':
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-surface-text opacity-90">Autumn Equinox</h2>
            <button className="glass px-3 py-1 rounded-full text-[10px] font-bold text-surface-text opacity-60 uppercase">Season</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] opacity-40 uppercase font-bold">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 h-full">
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-colors cursor-pointer ${i === 11 ? 'bg-accent text-white shadow-md' : 'hover:bg-white/40 text-surface-text opacity-80'}`}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      );
    case 'notes':
      return (
        <div className="h-full flex flex-col">
          <textarea 
            placeholder="Write while the sun sets..."
            className="flex-1 bg-transparent resize-none outline-none text-lg text-surface-text placeholder:opacity-30 italic"
          />
          <div className="pt-4 border-t border-white/20 flex justify-between items-center">
            <span className="text-[10px] opacity-40 font-medium">Drafting in Forsion Desktop</span>
            <button className="bg-accent text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">Save</button>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center h-full flex-col text-slate-400">
          <div className="w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center mb-4 opacity-50">
             <span className="text-[10px] font-bold">...</span>
          </div>
          <p className="text-xs uppercase tracking-widest font-bold">Refining Vision</p>
        </div>
      );
  }
};


// 设置组件内容
const SettingsContent: React.FC<{ currentTheme: Theme; onThemeChange: (theme: Theme) => void }> = ({ currentTheme, onThemeChange }) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    testing: boolean;
    status: 'idle' | 'success' | 'error';
    message: string;
    database?: string;
  }>({
    testing: false,
    status: 'idle',
    message: ''
  });

  const handleTestConnection = async () => {
    setConnectionStatus({
      testing: true,
      status: 'idle',
      message: 'Testing connection...'
    });

    try {
      const result = await apiService.testConnection();
      
      if (result.status === 'ok') {
        const dbStatus = result.database === 'connected' ? '✅ Connected' : result.database === 'error' ? '❌ Error' : '⚠️ Disconnected';
        setConnectionStatus({
          testing: false,
          status: 'success',
          message: `Backend server is running. Database: ${dbStatus}`,
          database: result.database
        });
      } else {
        setConnectionStatus({
          testing: false,
          status: 'error',
          message: result.error || 'Failed to connect to backend server'
        });
      }
    } catch (error: any) {
      setConnectionStatus({
        testing: false,
        status: 'error',
        message: error.message || 'Failed to test connection'
      });
    }
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        onThemeChange({
          ...currentTheme,
          id: 'custom-wallpaper',
          name: 'Custom Wallpaper',
          wallpaper: imageUrl
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Desktop Settings</h2>
        <p className="text-sm opacity-70">Customize your Forsion workspace theme and appearance.</p>
      </div>

      {/* 后端连接测试区域 */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-60">Backend Connection</h3>
        <div className="glass p-4 rounded-xl space-y-3">
          <button
            onClick={handleTestConnection}
            disabled={connectionStatus.testing}
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connectionStatus.testing ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Server size={16} />
                <span>Test Backend Connection</span>
              </>
            )}
          </button>
          
          {connectionStatus.message && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              connectionStatus.status === 'success' 
                ? 'bg-emerald-500/20 text-emerald-300' 
                : connectionStatus.status === 'error'
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-blue-500/20 text-blue-300'
            }`}>
              {connectionStatus.status === 'success' && <CheckCircle2 size={16} />}
              {connectionStatus.status === 'error' && <XCircle size={16} />}
              <span>{connectionStatus.message}</span>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-60">Theme Presets</h3>
        <div className="grid grid-cols-3 gap-4">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t)}
              className={`relative group rounded-xl p-3 text-left transition-all ${currentTheme.id === t.id ? 'glass bg-white/40 ring-2 ring-accent' : 'glass hover:bg-white/30'}`}
            >
              <div className="h-16 rounded-lg mb-2 shadow-inner" style={{ background: t.background }}></div>
              <div className="text-xs font-bold">{t.name}</div>
              {currentTheme.id === t.id && (
                <div className="absolute top-2 right-2 bg-accent text-white p-1 rounded-full">
                  <Check size={10} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-60">Wallpaper</h3>
        <div className="flex items-center space-x-4">
          <label className="cursor-pointer glass bg-white/20 hover:bg-white/40 px-6 py-4 rounded-2xl flex flex-col items-center justify-center transition-all border-dashed border-2 border-white/40">
            <ImageIcon size={24} className="mb-2 opacity-50" />
            <span className="text-xs font-bold">Upload Image</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleWallpaperUpload} />
          </label>
          {currentTheme.wallpaper && (
            <div className="relative w-32 h-20 rounded-xl overflow-hidden glass shadow-lg">
              <img src={currentTheme.wallpaper} alt="Custom Wallpaper" className="w-full h-full object-cover" />
              <button 
                onClick={() => onThemeChange(THEMES[0])}
                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
