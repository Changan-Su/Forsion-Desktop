
import React from 'react';
import { motion } from 'framer-motion';
import { APPS, ICON_MAP } from '../constants';
import { AppId } from '../types';

interface DockProps {
  onLaunch: (id: AppId) => void;
  activeApps: AppId[];
}

export const Dock: React.FC<DockProps> = ({ onLaunch, activeApps }) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000]">
      <motion.div 
        layout
        className="glass-dark px-3 py-2 rounded-2xl flex items-end space-x-2 shadow-2xl"
      >
        {APPS.map((app) => (
          <div key={app.id} className="relative group">
            <motion.button
              whileHover={{ scale: 1.2, y: -10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onLaunch(app.id)}
              className={`w-12 h-12 rounded-xl ${app.color} flex items-center justify-center text-white shadow-lg relative overflow-hidden transition-all duration-300`}
            >
              <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
              <div className="w-6 h-6">
                {ICON_MAP[app.icon]}
              </div>
            </motion.button>
            
            {activeApps.includes(app.id) && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/80 rounded-full" />
            )}

            <div className="absolute -top-10 left-1/2 -translate-x-1/2 glass px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {app.name}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
