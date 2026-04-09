import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForsionApp } from '../types';
import { useI18n } from '../services/i18nService';

interface UninstallConfirmDialogProps {
  app: ForsionApp | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const UninstallConfirmDialog: React.FC<UninstallConfirmDialogProps> = ({
  app,
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const { t } = useI18n();

  if (!isOpen || !app) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-dark p-6 rounded-3xl max-w-sm m-4 shadow-2xl text-surface-text"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-surface-text mb-3">
            {t('dialog.uninstall.title').replace('{name}', app.name)}
          </h3>
          <p className="text-sm text-surface-text opacity-70 mb-6">
            {t('dialog.uninstall.message')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-surface-text/10 hover:bg-surface-text/20 rounded-xl text-surface-text transition-colors font-medium"
            >
              {t('dialog.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold transition-colors shadow-lg shadow-red-500/30"
            >
              {t('dialog.uninstall.confirm')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
