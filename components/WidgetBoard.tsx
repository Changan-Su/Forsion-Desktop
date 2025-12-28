
import React from 'react';
import { motion } from 'framer-motion';
import { Sun, HelpCircle } from 'lucide-react';

export const WidgetBoard: React.FC = () => {
  return (
    <div className="fixed top-12 left-6 bottom-24 w-64 pointer-events-none flex flex-col space-y-6">
      {/* Today Widget */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="pointer-events-auto glass-dark p-5 rounded-3xl space-y-3"
      >
        <div className="flex justify-between items-center opacity-50">
          <Sun size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Horizon</span>
        </div>
        <div>
          <h4 className="text-3xl font-light text-surface-text">Nov 14</h4>
          <p className="text-sm opacity-60">A calm tide ahead</p>
        </div>
        <div className="pt-2">
          <div className="flex items-center space-x-2 text-xs opacity-70 mb-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full" />
            <span>9:00 AM - Deep Work</span>
          </div>
          <div className="flex items-center space-x-2 text-xs opacity-70">
            <div className="w-1.5 h-1.5 bg-accent opacity-50 rounded-full" />
            <span>1:30 PM - Creative Drift</span>
          </div>
        </div>
      </motion.div>

      {/* Dock Usage Guide Widget */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="pointer-events-auto glass-dark p-5 rounded-3xl"
      >
        <div className="flex justify-between items-center opacity-50">
          <HelpCircle size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Quick Tips</span>
        </div>
        <div className="space-y-3 pt-3">
          <div className="space-y-2">
            <div className="text-xs text-surface-text opacity-90">
              <span className="font-semibold">点击图标：</span>打开应用
            </div>
            <div className="text-xs text-surface-text opacity-90">
              <span className="font-semibold">长按拖动：</span>重新排列 Dock
            </div>
            <div className="text-xs text-surface-text opacity-90">
              <span className="font-semibold">启动台：</span>点击图标右上角 <span className="inline-block">⋮</span> 查看选项
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
