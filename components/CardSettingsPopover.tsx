import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ChevronDown } from 'lucide-react'
import type { DeskCardSettingField } from '../plugins/types'
import { useI18n } from '../services/i18nService'

interface CardSettingsPopoverProps {
  isOpen: boolean
  schema: DeskCardSettingField[]
  values: Record<string, unknown>
  onSave: (values: Record<string, unknown>) => void
  onClose: () => void
}

// Custom styled dropdown to replace native <select>
const CustomSelect: React.FC<{
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  isFont?: boolean
}> = ({ value, options, onChange, isFont }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 rounded-xl text-sm text-surface-text text-left flex items-center justify-between gap-2 transition-colors"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: `1px solid rgba(255,255,255,${open ? '0.25' : '0.12'})`,
        }}
      >
        <span
          className="truncate"
          style={isFont && selected ? { fontFamily: selected.value } : undefined}
        >
          {selected?.label || value}
        </span>
        <ChevronDown size={14} className={`opacity-50 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden shadow-xl"
            style={{
              background: 'rgba(30,30,30,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                  opt.value === value ? 'text-white bg-white/10' : 'text-white/70 hover:bg-white/8 hover:text-white/90'
                }`}
                style={isFont ? { fontFamily: opt.value } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const CardSettingsPopover: React.FC<CardSettingsPopoverProps> = ({
  isOpen,
  schema,
  values,
  onSave,
  onClose,
}) => {
  const { t } = useI18n()
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...values })

  useEffect(() => {
    if (isOpen) setDraft({ ...values })
  }, [isOpen, values])

  const updateField = (key: string, value: unknown) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

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
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 glass-dark rounded-3xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-surface-text">{t('widget.settings')}</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {schema.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-surface-text opacity-70 mb-1.5">
                    {field.labelKey ? t(field.labelKey) : field.label}
                  </label>
                  {field.description && (
                    <p className="text-[10px] text-surface-text opacity-40 mb-1">{field.description}</p>
                  )}

                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={(draft[field.key] as string) ?? (field.defaultValue as string) ?? ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm text-surface-text"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        outline: 'none',
                      }}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={(draft[field.key] as number) ?? (field.defaultValue as number) ?? 0}
                      onChange={(e) => updateField(field.key, parseFloat(e.target.value) || 0)}
                      step={0.1}
                      min={0}
                      max={1}
                      className="w-full px-3 py-2 rounded-xl text-sm text-surface-text"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        outline: 'none',
                      }}
                    />
                  )}

                  {field.type === 'boolean' && (
                    <button
                      onClick={() => updateField(field.key, !(draft[field.key] ?? field.defaultValue))}
                      className="flex items-center gap-2 text-sm text-surface-text"
                    >
                      <div
                        className="w-9 h-5 rounded-full relative transition-colors"
                        style={{
                          background: (draft[field.key] ?? field.defaultValue) ? 'var(--color-primary, #6366f1)' : 'rgba(255,255,255,0.15)',
                        }}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                          style={{
                            left: (draft[field.key] ?? field.defaultValue) ? '18px' : '2px',
                          }}
                        />
                      </div>
                    </button>
                  )}

                  {(field.type === 'select' || field.type === 'font') && field.options && (
                    <CustomSelect
                      value={(draft[field.key] as string) ?? (field.defaultValue as string) ?? ''}
                      options={field.options}
                      onChange={(val) => updateField(field.key, val)}
                      isFont={field.type === 'font'}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl text-sm text-surface-text hover:bg-white/10 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {t('widget.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-xl text-sm text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
                style={{ background: 'var(--color-primary, #6366f1)' }}
              >
                <Check size={14} />
                {t('widget.save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
