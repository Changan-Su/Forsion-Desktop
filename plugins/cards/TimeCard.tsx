import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { DeskCardProps } from '../types'

function formatTime(date: Date, is24h: boolean, showSeconds: boolean): string {
  const h = is24h ? date.getHours() : date.getHours() % 12 || 12
  const m = date.getMinutes().toString().padStart(2, '0')
  const s = date.getSeconds().toString().padStart(2, '0')
  const hStr = h.toString().padStart(2, '0')
  return showSeconds ? `${hStr}:${m}:${s}` : `${hStr}:${m}`
}

export const TimeCard: React.FC<DeskCardProps> = ({ settings }) => {
  const showSeconds = (settings.showSeconds as boolean) ?? false
  const fontFamily = (settings.fontFamily as string) || 'system-ui'
  const is24h = (settings.is24h as boolean) ?? true

  const [time, setTime] = useState(() => formatTime(new Date(), is24h, showSeconds))

  useEffect(() => {
    const ms = showSeconds ? 1000 : 60_000
    const interval = setInterval(() => {
      setTime(formatTime(new Date(), is24h, showSeconds))
    }, ms)
    return () => clearInterval(interval)
  }, [is24h, showSeconds])

  const period = !is24h ? (new Date().getHours() >= 12 ? 'PM' : 'AM') : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.8 }}
      className="flex items-center justify-center gap-3 select-none"
    >
      <span
        className="text-8xl font-normal text-surface-text opacity-60 tracking-tight"
        style={{ fontFamily }}
      >
        {time}
      </span>
      {period && (
        <span className="text-2xl text-surface-text opacity-40" style={{ fontFamily }}>
          {period}
        </span>
      )}
    </motion.div>
  )
}
