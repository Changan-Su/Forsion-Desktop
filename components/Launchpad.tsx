import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package } from 'lucide-react';
import { APPS, ICON_MAP } from '../constants';
import { AppId, ForsionApp } from '../types';
import forsionDeskService from '../services/forsionDeskService';

// Forsion App Icon Component
interface ForsionAppIconProps {
  icon?: string;
  name: string;
  size?: number;
}

const ForsionAppIcon: React.FC<ForsionAppIconProps> = ({ icon, name, size = 24 }) => {
  const [iconError, setIconError] = useState(false);

  if (icon && !iconError) {
    return (
      <img 
        src={icon} 
        alt={name}
        className="w-full h-full object-cover rounded-lg"
        onError={() => setIconError(true)}
      />
    );
  }

  return <Package size={size} className="text-white" />;
};

interface LaunchpadProps {
  onLaunch: (appId: AppId) => void;
  onLaunchForsionApp?: (app: ForsionApp) => void;
}

export const Launchpad: React.FC<LaunchpadProps> = ({ onLaunch, onLaunchForsionApp }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [forsionApps, setForsionApps] = useState<ForsionApp[]>([]);
  const [loading, setLoading] = useState(true);

  // Load installed Forsion Desk apps
  const loadForsionApps = useCallback(async () => {
    try {
      const installedApps = await forsionDeskService.getUserInstalledApps();
      // Filter active apps and sort by sortOrder
      const activeApps = installedApps
        .filter(app => app.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      setForsionApps(activeApps);
    } catch (error) {
      console.error('Failed to load Forsion Desk apps:', error);
      // Silently fail - just don't show Forsion apps
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForsionApps();

    // Listen for app installation/uninstallation events
    const handleAppChange = () => {
      loadForsionApps();
    };

    window.addEventListener('forsion-app-installed', handleAppChange);
    window.addEventListener('forsion-app-uninstalled', handleAppChange);

    return () => {
      window.removeEventListener('forsion-app-installed', handleAppChange);
      window.removeEventListener('forsion-app-uninstalled', handleAppChange);
    };
  }, [loadForsionApps]);

  const builtInApps = APPS.filter(app => 
    app.id !== 'launchpad' && 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredForsionApps = forsionApps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleForsionAppClick = (app: ForsionApp) => {
    if (onLaunchForsionApp) {
      onLaunchForsionApp(app);
    } else {
      // Fallback: open URL directly
      window.open(app.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-8 pb-4 flex justify-center">
        <div className="relative w-full max-w-sm group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors" />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full pl-12 pr-4 py-3 bg-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:bg-white/20 transition-all border border-white/10 focus:border-white/30"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-8 pt-4 scrollbar-hide">
        <div className="grid grid-cols-4 gap-8 justify-items-center">
          {/* Built-in Apps */}
          {builtInApps.map((app) => (
            <motion.button
              key={app.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onLaunch(app.id)}
              className="flex flex-col items-center gap-3 group w-24"
            >
              <div className={`w-20 h-20 rounded-[22px] ${app.color} flex items-center justify-center text-white shadow-lg relative overflow-hidden transition-all duration-300 group-hover:shadow-xl ring-0 group-hover:ring-2 ring-white/20`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10">
                  {ICON_MAP[app.icon]}
                </div>
              </div>
              <span className="text-sm font-medium text-white/90 drop-shadow-md text-center leading-tight">
                {app.name}
              </span>
            </motion.button>
          ))}

          {/* Forsion Desk Apps */}
          {filteredForsionApps.map((app) => (
            <motion.button
              key={app.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleForsionAppClick(app)}
              className="flex flex-col items-center gap-3 group w-24"
            >
              <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-purple-500/80 to-pink-500/80 flex items-center justify-center text-white shadow-lg relative overflow-hidden transition-all duration-300 group-hover:shadow-xl ring-0 group-hover:ring-2 ring-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 flex items-center justify-center">
                  <ForsionAppIcon icon={app.icon} name={app.name} size={24} />
                </div>
              </div>
              <span className="text-sm font-medium text-white/90 drop-shadow-md text-center leading-tight">
                {app.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

