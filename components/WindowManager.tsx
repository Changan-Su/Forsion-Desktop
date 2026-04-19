
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WINDOW_SPRING = { type: 'spring' as const, stiffness: 220, damping: 26, mass: 0.9 };
const WINDOW_INITIAL = { scale: 0.92, opacity: 0, y: 16 };
const WINDOW_ANIMATE = { scale: 1, opacity: 1, y: 0 };
const WINDOW_EXIT = { scale: 0.94, opacity: 0, y: 12 };
const GPU_STYLE = { willChange: 'transform, opacity' as const, transform: 'translateZ(0)' };
import { X } from 'lucide-react';
import { WindowState, AppId, Theme, ForsionApp } from '../types';
import SettingsStorageService from '../services/settingsStorageService';
import { APPS } from '../constants';
import { useI18n } from '../services/i18nService';
import { Launchpad } from './Launchpad';
import { ForsionDeskMarket } from './ForsionDeskMarket';
import { SettingsPanel } from './Settings/SettingsPanel';

interface WindowManagerProps {
  windows: WindowState[];
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onFocus: (id: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
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
  onLaunchApp,
  onLaunchForsionApp
}) => {
  const { t } = useI18n();
  const [gpuAcceleration, setGpuAcceleration] = useState<boolean>(true);

  useEffect(() => {
    const gpuEnabled = SettingsStorageService.getGPUAcceleration();
    setGpuAcceleration(gpuEnabled);

    // Listen for storage changes and custom events
    const handleStorageChange = () => {
      setGpuAcceleration(SettingsStorageService.getGPUAcceleration());
    };
    const handleGPUChange = (e: CustomEvent) => {
      setGpuAcceleration(e.detail.enabled);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gpu-acceleration-changed', handleGPUChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gpu-acceleration-changed', handleGPUChange as EventListener);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {windows.filter(w => !w.isMinimized).map((win) => (
            <motion.div
              key={win.id}
              initial={WINDOW_INITIAL}
              animate={WINDOW_ANIMATE}
              exit={WINDOW_EXIT}
              transition={WINDOW_SPRING}
              onMouseDown={() => onFocus(win.id)}
              className="absolute pointer-events-auto rounded-2xl glass-dark shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden"
              data-gpu-accelerated={gpuAcceleration ? 'true' : undefined}
              style={{
                zIndex: win.zIndex,
                width: win.width,
                height: win.height,
                left: win.x,
                top: win.y,
                ...(gpuAcceleration ? GPU_STYLE : null),
              }}
            >
              {/* Title Bar */}
              {win.appId !== 'forsion-desk-market' && (
                <div className="h-12 flex items-center justify-between px-6 pt-4 select-none">
                  <span className="text-surface-text text-xl font-bold tracking-tight opacity-90">{(() => { const appDef = APPS.find(a => a.id === win.appId); return appDef?.nameKey ? t(appDef.nameKey) : win.title; })()}</span>
                  <button
                    onClick={() => onClose(win.id)}
                    className="w-8 h-8 rounded-full bg-surface-text/5 hover:bg-surface-text/10 flex items-center justify-center transition-colors group"
                  >
                    <X size={18} className="text-surface-text opacity-60 group-hover:opacity-100" />
                  </button>
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 p-6 text-surface-text overflow-auto scrollbar-thin">
                {renderAppContent(
                  win.appId,
                  theme,
                  onThemeChange,
                  onLaunchApp,
                  onLaunchForsionApp
                )}
              </div>
            </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const renderAppContent = (
  appId: AppId,
  currentTheme: Theme,
  onThemeChange: (theme: Theme) => void,
  onLaunchApp: (appId: AppId) => void,
  onLaunchForsionApp?: (app: ForsionApp) => void
) => {
  switch (appId) {
    case 'forsion-desk-market':
      return <ForsionDeskMarket />;
    case 'launchpad':
      return <Launchpad onLaunch={onLaunchApp} onLaunchForsionApp={onLaunchForsionApp} />;
    case 'settings':
      return <SettingsPanel currentTheme={currentTheme} onThemeChange={onThemeChange} />;
    default:
      return (
        <div className="flex items-center justify-center h-full flex-col text-surface-text/40">
          <div className="w-16 h-16 border-2 border-surface-text/15 rounded-full flex items-center justify-center mb-4 opacity-50">
             <span className="text-[10px] font-bold">...</span>
          </div>
          <p className="text-xs uppercase tracking-widest font-bold">Refining Vision</p>
        </div>
      );
  }
};


