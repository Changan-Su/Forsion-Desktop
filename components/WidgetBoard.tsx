
import React from 'react';
import { motion } from 'framer-motion';
import { Sun, HelpCircle } from 'lucide-react';
import { useI18n } from '../services/i18nService';

export const WidgetBoard: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="fixed top-12 left-6 bottom-24 w-64 pointer-events-none flex flex-col space-y-6">
      {/* Today Widget */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="pointer-events-auto glass-dark p-5 rounded-3xl space-y-3 text-surface-text"
      >
        <div className="flex justify-between items-center opacity-50">
          <Sun size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">{t('widget.horizon')}</span>
        </div>
        <div>
          <h4 className="text-3xl font-light">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</h4>
          <p className="text-sm opacity-60">{t('widget.calmTide')}</p>
        </div>
        <div className="pt-2">
          <div className="flex items-center space-x-2 text-xs opacity-70 mb-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full" />
            <span>{t('widget.deepWork')}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs opacity-70">
            <div className="w-1.5 h-1.5 bg-accent opacity-50 rounded-full" />
            <span>{t('widget.creativeDrift')}</span>
          </div>
        </div>
      </motion.div>

      {/* Dock Usage Guide Widget */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="pointer-events-auto glass-dark p-5 rounded-3xl text-surface-text"
      >
        <div className="flex justify-between items-center opacity-50">
          <HelpCircle size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">{t('widget.quickTips')}</span>
        </div>
        <div className="space-y-3 pt-3">
          <div className="space-y-2">
            <div className="text-xs text-surface-text opacity-90">
              <span className="font-semibold">{t('widget.tip.click')}</span>{t('widget.tip.clickDesc')}
            </div>
            <div className="text-xs text-surface-text opacity-90">
              <span className="font-semibold">{t('widget.tip.drag')}</span>{t('widget.tip.dragDesc')}
            </div>
            <div className="text-xs text-surface-text opacity-90">
              <span className="font-semibold">{t('widget.tip.launchpad')}</span>{t('widget.tip.launchpadDesc')}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
