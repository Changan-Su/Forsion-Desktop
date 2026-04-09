import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Download, Check } from 'lucide-react';
import { APPS, ICON_MAP } from '../constants';
import { AppId } from '../types';

interface AppMarketProps {
  installedApps: AppId[];
  onInstall: (appId: AppId) => void;
}

export const AppMarket: React.FC<AppMarketProps> = ({ installedApps, onInstall }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = APPS.filter(app => 
    app.id !== 'app-market' && 
    app.id !== 'launchpad' && 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 bg-surface-text/5 flex items-center justify-between border-b border-surface-text/10 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold text-surface-text">App Market</h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-text opacity-50" />
            <input 
              type="text" 
              placeholder="Search apps..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-surface-text/5 rounded-xl text-sm text-surface-text placeholder:text-surface-text/50 focus:outline-none focus:bg-surface-text/10 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="grid grid-cols-2 gap-4">
          {filteredApps.map((app) => {
            const isInstalled = installedApps.includes(app.id);
            return (
              <div key={app.id} className="glass p-4 rounded-2xl flex items-center space-x-4 hover:bg-surface-text/10 transition-colors group">
                <div className={`w-14 h-14 rounded-xl ${app.color} flex items-center justify-center text-white shadow-lg`}>
                  <div className="w-7 h-7">
                    {ICON_MAP[app.icon]}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-surface-text text-base">{app.name}</h4>
                  <p className="text-xs text-surface-text opacity-60 truncate">Productivity & Tools</p>
                </div>
                <button
                  onClick={() => !isInstalled && onInstall(app.id)}
                  disabled={isInstalled}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                    isInstalled 
                      ? 'bg-surface-text/10 text-surface-text opacity-50 cursor-default'
                      : 'bg-accent text-white hover:bg-accent/90 shadow-md hover:scale-105 active:scale-95'
                  }`}
                >
                  {isInstalled ? (
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

