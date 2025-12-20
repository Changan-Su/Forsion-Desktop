
import React, { useState, useEffect } from 'react';
import { Search, Bell, Battery, Wifi, User } from 'lucide-react';

export const TopBar: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-8 glass-dark fixed top-0 left-0 right-0 flex items-center justify-between px-4 z-[9999] text-xs font-medium text-white/90 select-none">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded transition-colors">
          <div className="w-3.5 h-3.5 bg-amber-400 rounded-sm"></div>
          <span className="font-semibold tracking-tight">Forsion</span>
        </div>
        <div className="flex items-center space-x-4 ml-2">
          <span className="hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors">Workspace</span>
          <span className="hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors">View</span>
          <span className="hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors">Help</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center glass bg-white/5 rounded px-2 py-0.5 space-x-2 cursor-pointer hover:bg-white/10 transition-colors">
          <Search size={14} className="text-white/60" />
          <span className="text-white/40">Search (⌘K)</span>
        </div>
        
        <div className="flex items-center space-x-3 text-white/80">
          <Wifi size={14} />
          <Battery size={14} />
          <Bell size={14} />
          <div className="border-l border-white/20 h-3 mx-1" />
          <span className="min-w-[70px] text-right">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden border border-white/20">
            <User size={12} />
          </div>
        </div>
      </div>
    </div>
  );
};
