
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';
import { WindowState, AppId } from '../types';
import { APPS } from '../constants';

interface WindowManagerProps {
  windows: WindowState[];
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onFocus: (id: string) => void;
}

export const WindowManager: React.FC<WindowManagerProps> = ({ 
  windows, 
  onClose, 
  onMinimize, 
  onFocus 
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {windows.filter(w => !w.isMinimized).map((win) => {
          const app = APPS.find(a => a.id === win.appId);
          
          return (
            <motion.div
              key={win.id}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              drag
              dragMomentum={false}
              onMouseDown={() => onFocus(win.id)}
              className="absolute pointer-events-auto rounded-2xl glass-dark shadow-[0_20px_50px_rgba(62,64,111,0.1)] flex flex-col overflow-hidden border border-white/60"
              style={{
                zIndex: win.zIndex,
                width: win.width,
                height: win.height,
                left: win.x,
                top: win.y,
              }}
            >
              {/* Title Bar */}
              <div className="h-10 bg-white/40 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing border-b border-white/40 select-none">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-2 group-controls">
                    <button 
                      onClick={() => onClose(win.id)}
                      className="w-3 h-3 rounded-full bg-[#C1A3B5]/80 hover:bg-[#C1A3B5] transition-colors"
                    />
                    <button 
                      onClick={() => onMinimize(win.id)}
                      className="w-3 h-3 rounded-full bg-[#EBD3B4] hover:bg-[#d8c0a5] transition-colors"
                    />
                    <button className="w-3 h-3 rounded-full bg-[#98B0B9] hover:bg-[#809ba5] transition-colors" />
                  </div>
                  <span className="text-[#3E406F] text-xs font-semibold ml-4 tracking-tight">{win.title}</span>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 text-slate-800 overflow-auto bg-white/20 backdrop-blur-md">
                {renderAppContent(win.appId)}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const renderAppContent = (appId: AppId) => {
  switch (appId) {
    case 'knowledge':
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[#3E406F]">Sea Library</h2>
          <div className="grid grid-cols-2 gap-4">
            {['Impressionist Light', 'Cliffs of Étretat', 'Mist Studies', 'Tidal Patterns'].map(item => (
              <div key={item} className="glass p-4 rounded-xl hover:bg-white/40 transition-colors cursor-pointer group border-white/50">
                <div className="w-10 h-10 rounded bg-[#C1A3B5]/20 mb-3 flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#C1A3B5] rounded-sm" />
                </div>
                <div className="font-semibold text-slate-700">{item}</div>
                <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Archive</div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'calendar':
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-700">Autumn Equinox</h2>
            <button className="glass px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase">Season</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 uppercase font-bold">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 h-full">
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-colors cursor-pointer ${i === 11 ? 'bg-[#3E406F] text-white shadow-md' : 'hover:bg-white/40 text-slate-600'}`}>
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
            className="flex-1 bg-transparent resize-none outline-none text-lg text-[#2D2E4A] placeholder:text-slate-300 italic"
          />
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-medium">Drafting in Forsion Desktop</span>
            <button className="bg-[#3E406F] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">Save</button>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center h-full flex-col text-slate-400">
          <div className="w-16 h-16 border-2 border-slate-100 rounded-full flex items-center justify-center mb-4 opacity-50">
             <span className="text-[10px] font-bold">...</span>
          </div>
          <p className="text-xs uppercase tracking-widest font-bold">Refining Vision</p>
        </div>
      );
  }
};