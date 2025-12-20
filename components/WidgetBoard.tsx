
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Inbox, Sun } from 'lucide-react';

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

      {/* Focus Widget */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="pointer-events-auto glass-dark p-5 rounded-3xl bg-white/20"
      >
        <div className="flex justify-between items-center text-accent">
          <Zap size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Stillness</span>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="4" className="opacity-10" />
              <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="276" strokeDashoffset="70" className="text-accent" />
            </svg>
            <span className="text-xl font-bold text-surface-text">25:00</span>
          </div>
        </div>
        <button className="w-full py-2 bg-accent text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-sm">FOCUS</button>
      </motion.div>

      {/* Inbox Widget */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="pointer-events-auto glass-dark p-5 rounded-3xl"
      >
        <div className="flex justify-between items-center opacity-50">
          <Inbox size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Messages</span>
        </div>
        <div className="space-y-3 pt-3">
          {[
            { from: 'Studio', msg: 'New harmony draft' },
            { from: 'Ocean', msg: 'The tide is rising' },
          ].map((item, i) => (
            <div key={i} className="bg-white/20 p-2 rounded-xl border border-white/20 cursor-pointer hover:bg-white/30 transition-colors">
              <div className="text-[10px] font-bold opacity-40 uppercase mb-0.5">{item.from}</div>
              <div className="text-xs text-surface-text">{item.msg}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
