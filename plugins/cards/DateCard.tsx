import React, { useState, useEffect } from 'react'
import { Sun } from 'lucide-react'
import { useI18n } from '../../services/i18nService'
import type { DeskCardProps } from '../types'

// Simple lunar calendar lookup (2024-2030 approximate)
// Uses a basic algorithm for Chinese lunar calendar conversion
function getLunarDate(date: Date): { month: number; day: number; monthStr: string; dayStr: string } {
  const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const LUNAR_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
  const LUNAR_DAYS = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
  ]

  // Simplified: estimate lunar date from solar date
  // This is an approximation — for production, use a proper library
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000)

  // Approximate lunar offset (lunar new year ~late Jan/early Feb, ~30-50 days offset)
  const lunarOffset = 30 + (year % 4) * 3
  let lunarDayOfYear = dayOfYear - lunarOffset
  if (lunarDayOfYear < 0) lunarDayOfYear += 354

  const lunarMonth = Math.floor(lunarDayOfYear / 29.5) % 12
  const lunarDay = Math.floor(lunarDayOfYear % 29.5)

  return {
    month: lunarMonth + 1,
    day: lunarDay + 1,
    monthStr: LUNAR_MONTHS[lunarMonth] || '正月',
    dayStr: LUNAR_DAYS[lunarDay] || '初一',
  }
}

export const DateCard: React.FC<DeskCardProps> = ({ settings }) => {
  const { t } = useI18n()
  const [now, setNow] = useState(new Date())
  const calendarType = (settings.calendarType as string) || 'solar'

  useEffect(() => {
    // Update at midnight
    const msToMidnight = () => {
      const tomorrow = new Date()
      tomorrow.setHours(24, 0, 0, 0)
      return tomorrow.getTime() - Date.now()
    }
    const timer = setTimeout(() => setNow(new Date()), msToMidnight())
    return () => clearTimeout(timer)
  }, [now])

  const solarDate = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const fullDate = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  const lunar = getLunarDate(now)

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center opacity-50">
        <Sun size={18} />
        <span className="text-xs font-bold uppercase tracking-widest">{t('widget.horizon') || 'Horizon'}</span>
      </div>
      <div>
        <h4 className="text-3xl font-light">
          {calendarType === 'lunar' ? `${lunar.monthStr} ${lunar.dayStr}` : solarDate}
        </h4>
        {calendarType === 'lunar' ? (
          <>
            <p className="text-sm opacity-60">{solarDate}</p>
            <p className="text-[10px] opacity-30 mt-0.5">~ approximate</p>
          </>
        ) : (
          <p className="text-sm opacity-60">{fullDate}</p>
        )}
      </div>
    </div>
  )
}
