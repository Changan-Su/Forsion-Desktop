import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForsionApp } from '../types';

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
  if (!isOpen || !app) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-dark p-6 rounded-3xl max-w-sm m-4 border border-white/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold text-surface-text mb-3">
            Uninstall {app.name}?
          </h3>
          <p className="text-sm text-surface-text opacity-70 mb-6">
            This app will be removed from your Launchpad. You can reinstall it later from the App Market.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-surface-text transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold transition-colors shadow-lg shadow-red-500/30"
            >
              Uninstall
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

