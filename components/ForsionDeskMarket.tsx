import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Check, Package, Loader } from 'lucide-react';
import forsionDeskService from '../services/forsionDeskService';
import { ForsionApp } from '../types';

// App Card Component
interface AppCardProps {
  app: ForsionApp;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, isInstalled, isInstalling, onInstall, onUninstall }) => {
  const [iconError, setIconError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-4 rounded-2xl flex items-center space-x-4 hover:bg-white/40 transition-colors group"
    >
      {/* App Icon */}
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-white shadow-lg flex-shrink-0 overflow-hidden">
        {app.icon && !iconError ? (
          <img 
            src={app.icon} 
            alt={app.name}
            className="w-full h-full object-cover"
            onError={() => setIconError(true)}
          />
        ) : (
          <Package size={28} className="text-surface-text opacity-60" />
        )}
      </div>

      {/* App Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-surface-text text-base truncate">{app.name}</h4>
        <p className="text-xs text-surface-text opacity-60 truncate">
          {app.description || app.category || 'No description'}
        </p>
      </div>

      {/* Install/Uninstall Button */}
      <button
        onClick={() => isInstalled ? onUninstall() : onInstall()}
        disabled={isInstalling}
        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all flex-shrink-0 ${
          isInstalled 
            ? 'bg-white/10 text-surface-text opacity-50 hover:opacity-70' 
            : 'bg-accent text-white hover:bg-accent/90 shadow-md hover:scale-105 active:scale-95'
        } ${isInstalling ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isInstalling ? (
          <>
            <Loader size={14} className="animate-spin" />
            <span>...</span>
          </>
        ) : isInstalled ? (
          <>
            <Check size={14} />
            <span>Installed</span>
          </>
        ) : (
          <>
            <Download size={14} />
            <span>Get</span>
          </>
        )}
      </button>
    </motion.div>
  );
};

interface ForsionDeskMarketProps {
  onAppInstalled?: () => void;
}

export const ForsionDeskMarket: React.FC<ForsionDeskMarketProps> = ({ onAppInstalled }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [apps, setApps] = useState<ForsionApp[]>([]);
  const [installedAppIds, setInstalledAppIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState<Set<string>>(new Set());

  // Load apps and installed apps
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allApps, installedApps] = await Promise.all([
        forsionDeskService.getAllApps(),
        forsionDeskService.getUserInstalledApps()
      ]);

      // Filter active apps
      const activeApps = allApps.filter(app => app.isActive);
      setApps(activeApps);
      setInstalledAppIds(new Set(installedApps.map(app => app.id)));
    } catch (err: any) {
      console.error('Failed to load Forsion Desk apps:', err);
      setError(err.message || 'Failed to load apps. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (appId: string) => {
    try {
      setInstalling(prev => new Set(prev).add(appId));
      await forsionDeskService.installApp(appId);
      setInstalledAppIds(prev => new Set(prev).add(appId));
      onAppInstalled?.();
      // Dispatch event to notify Launchpad to refresh
      window.dispatchEvent(new CustomEvent('forsion-app-installed'));
    } catch (err: any) {
      console.error('Failed to install app:', err);
      alert(err.message || 'Failed to install app. Please try again.');
    } finally {
      setInstalling(prev => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
    }
  };

  const handleUninstall = async (appId: string) => {
    try {
      setInstalling(prev => new Set(prev).add(appId));
      await forsionDeskService.uninstallApp(appId);
      setInstalledAppIds(prev => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
      onAppInstalled?.();
      // Dispatch event to notify Launchpad to refresh
      window.dispatchEvent(new CustomEvent('forsion-app-uninstalled'));
    } catch (err: any) {
      console.error('Failed to uninstall app:', err);
      alert(err.message || 'Failed to uninstall app. Please try again.');
    } finally {
      setInstalling(prev => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
    }
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 bg-white/20 flex items-center justify-between border-b border-white/30 rounded-t-2xl">
        <div className="flex items-center space-x-3 flex-1">
          <h3 className="text-xl font-bold text-surface-text">Forsion Desk Market</h3>
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-text opacity-50" />
            <input 
              type="text" 
              placeholder="Search apps..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white/20 rounded-xl text-sm text-surface-text placeholder:text-surface-text/50 focus:outline-none focus:bg-white/30 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader size={32} className="animate-spin text-surface-text opacity-60" />
              <p className="text-sm text-surface-text opacity-60">Loading apps...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-rose-400 mb-4">{error}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-bold"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-surface-text opacity-60">
              {searchQuery ? 'No apps found matching your search.' : 'No apps available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                isInstalled={installedAppIds.has(app.id)}
                isInstalling={installing.has(app.id)}
                onInstall={() => handleInstall(app.id)}
                onUninstall={() => handleUninstall(app.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

