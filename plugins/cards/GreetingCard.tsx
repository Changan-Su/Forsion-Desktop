import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AuthService from '../../services/authService'
import { useI18n } from '../../services/i18nService'
import type { DeskCardProps } from '../types'

function getGreeting(locale: string): { text: string; emoji: string } {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return { text: locale === 'zh' ? '早上好' : 'Good Morning', emoji: '' }
  if (hour >= 12 && hour < 18) return { text: locale === 'zh' ? '下午好' : 'Good Afternoon', emoji: '' }
  if (hour >= 18 && hour < 23) return { text: locale === 'zh' ? '晚上好' : 'Good Evening', emoji: '' }
  return { text: locale === 'zh' ? '晚安' : 'Good Night', emoji: '' }
}

export const GreetingCard: React.FC<DeskCardProps> = ({ settings }) => {
  const { locale } = useI18n()
  const showName = (settings.showName as boolean) ?? true
  const [greeting, setGreeting] = useState(() => getGreeting(locale))
  const user = AuthService.getUser()
  const name = user?.nickname || user?.username || ''

  useEffect(() => {
    setGreeting(getGreeting(locale))
    const interval = setInterval(() => setGreeting(getGreeting(locale)), 60_000)
    return () => clearInterval(interval)
  }, [locale])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.8 }}
      className="flex flex-col items-center justify-center gap-1 select-none"
    >
      <span className="text-6xl font-light text-surface-text opacity-50 tracking-tight">
        {greeting.text}
      </span>
      {showName && name && (
        <span className="text-2xl font-light text-surface-text opacity-30 tracking-wide">
          {name}
        </span>
      )}
    </motion.div>
  )
}
