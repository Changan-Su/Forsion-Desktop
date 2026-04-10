import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { deskCardRegistry } from '../plugins/DeskCardRegistry'
import { ZONE_ACCEPTED_TYPE } from './CardZone'
import type { ZoneId } from '../plugins/types'
import { sanitizeSvg } from '../plugins/sanitizeSvg'
import { useI18n } from '../services/i18nService'

interface CardPickerProps {
  isOpen: boolean
  zoneId: ZoneId
  onSelect: (cardType: string) => void
  onClose: () => void
}

export const CardPicker: React.FC<CardPickerProps> = ({ isOpen, zoneId, onSelect, onClose }) => {
  const { t } = useI18n()
  const acceptedType = ZONE_ACCEPTED_TYPE[zoneId]
  const items = deskCardRegistry.getMenuItems(acceptedType)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10010] flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />

          {/* Picker panel */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 glass-dark rounded-3xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-surface-text">{t('widget.addWidget')}</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <X size={14} />
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-surface-text opacity-50 text-center py-8">
                {t('widget.noWidgets')}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => onSelect(item.type)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl text-surface-text hover:bg-white/10 transition-colors cursor-pointer"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center rounded-xl opacity-70"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                      dangerouslySetInnerHTML={{ __html: sanitizeSvg(item.icon) }}
                    />
                    <span className="text-xs font-medium">{item.labelKey ? t(item.labelKey) : item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
