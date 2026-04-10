import React, { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'
import { useI18n } from '../../services/i18nService'
import type { DeskCardProps } from '../types'

function getRemaining(targetDate: string): { days: number; hours: number; minutes: number; passed: boolean } {
  const target = new Date(targetDate).getTime()
  const now = Date.now()
  const diff = target - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, passed: true }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  return { days, hours, minutes, passed: false }
}

export const CountdownCard: React.FC<DeskCardProps> = ({ settings }) => {
  const { locale } = useI18n()
  const targetDate = (settings.targetDate as string) || ''
  const label = (settings.label as string) || (locale === 'zh' ? '未命名事件' : 'Unnamed Event')

  const [remaining, setRemaining] = useState(() => targetDate ? getRemaining(targetDate) : null)

  useEffect(() => {
    if (!targetDate) return
    setRemaining(getRemaining(targetDate))
    const interval = setInterval(() => setRemaining(getRemaining(targetDate)), 60_000)
    return () => clearInterval(interval)
  }, [targetDate])

  const noDate = !targetDate
  const passedText = locale === 'zh' ? '已过期' : 'Event passed'
  const noDateText = locale === 'zh' ? '请设置目标日期' : 'Set a target date'
  const daysLabel = locale === 'zh' ? '天' : 'd'
  const hoursLabel = locale === 'zh' ? '时' : 'h'
  const minutesLabel = locale === 'zh' ? '分' : 'm'

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center opacity-50">
        <Timer size={16} />
        <span className="text-xs font-bold uppercase tracking-widest truncate ml-2">
          {label}
        </span>
      </div>
      {noDate ? (
        <p className="text-sm opacity-40">{noDateText}</p>
      ) : remaining?.passed ? (
        <p className="text-lg font-medium opacity-60">{passedText}</p>
      ) : remaining && (
        <div className="flex gap-3 items-baseline">
          <div className="text-center">
            <span className="text-3xl font-semibold">{remaining.days}</span>
            <span className="text-xs opacity-50 ml-0.5">{daysLabel}</span>
          </div>
          <div className="text-center">
            <span className="text-xl font-medium opacity-80">{remaining.hours}</span>
            <span className="text-xs opacity-50 ml-0.5">{hoursLabel}</span>
          </div>
          <div className="text-center">
            <span className="text-xl font-medium opacity-80">{remaining.minutes}</span>
            <span className="text-xs opacity-50 ml-0.5">{minutesLabel}</span>
          </div>
        </div>
      )}
    </div>
  )
}
