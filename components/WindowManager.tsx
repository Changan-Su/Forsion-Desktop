
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2, Image as ImageIcon, Check, Server, CheckCircle2, XCircle, Loader } from 'lucide-react';
import { WindowState, AppId, Theme } from '../types';
import { APPS, THEMES } from '../constants';
import apiService from '../services/apiService';

interface WindowManagerProps {
  windows: WindowState[];
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onFocus: (id: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const WindowManager: React.FC<WindowManagerProps> = ({ 
  windows, 
  onClose, 
  onMinimize, 
  onFocus,
  theme,
  onThemeChange
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
              drag
              dragMomentum={false}
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
              {/* Title Bar */}
              <div className="h-10 bg-white/20 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing border-b border-white/20 select-none">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-2 group-controls">
                    <button 
                      onClick={() => onClose(win.id)}
                      className="w-3 h-3 rounded-full bg-rose-400 hover:bg-rose-500 transition-colors"
                    />
                    <button 
                      onClick={() => onMinimize(win.id)}
                      className="w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors"
                    />
                    <button className="w-3 h-3 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors" />
                  </div>
                  <span className="text-surface-text text-xs font-semibold ml-4 tracking-tight">{win.title}</span>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 text-surface-text overflow-auto bg-white/10 backdrop-blur-md">
                {renderAppContent(win.appId, theme, onThemeChange)}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const renderAppContent = (appId: AppId, currentTheme: Theme, onThemeChange: (theme: Theme) => void) => {
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
