import React, { useState, useEffect } from 'react'
import { Megaphone, HelpCircle } from 'lucide-react'
import { useI18n } from '../../services/i18nService'
import apiService from '../../services/apiService'
import type { DeskCardProps } from '../types'

interface Announcement {
  id: string
  titleZh: string
  titleEn?: string
  contentZh: string
  contentEn?: string
}

const CACHE_KEY = 'forsion-desk-announcements-cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(): Announcement[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function setCache(data: Announcement[]): void {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
}

export const AnnouncementCard: React.FC<DeskCardProps> = () => {
  const { t, locale } = useI18n()
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(getCached)
  const [loading, setLoading] = useState(!getCached())
  const [error, setError] = useState(false)

  useEffect(() => {
    const cached = getCached()
    if (cached) {
      setAnnouncements(cached)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        const data = await apiService.get<Announcement[]>('/api/desk/announcements')
        setCache(data)
        setAnnouncements(data)
        setError(false)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fallback to static tips if API fails or no announcements
  const showFallback = error || (!loading && (!announcements || announcements.length === 0))

  if (showFallback) {
    return (
      <div>
        <div className="flex justify-between items-center opacity-50">
          <HelpCircle size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">{t('widget.quickTips')}</span>
        </div>
        <div className="space-y-2 pt-3">
          <div className="text-xs text-surface-text opacity-90">
            <span className="font-semibold">{t('widget.tip.click')}</span>
            {t('widget.tip.clickDesc')}
          </div>
          <div className="text-xs text-surface-text opacity-90">
            <span className="font-semibold">{t('widget.tip.drag')}</span>
            {t('widget.tip.dragDesc')}
          </div>
          <div className="text-xs text-surface-text opacity-90">
            <span className="font-semibold">{t('widget.tip.launchpad')}</span>
            {t('widget.tip.launchpadDesc')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center opacity-50">
        <Megaphone size={16} />
        <span className="text-xs font-bold uppercase tracking-widest">{t('widget.card.announcement')}</span>
      </div>
      {loading ? (
        <div className="pt-3 text-xs opacity-40 animate-pulse">Loading...</div>
      ) : (
        <div className="space-y-3 pt-3">
          {announcements!.map((a) => (
            <div key={a.id} className="space-y-0.5">
              <div className="text-xs font-semibold text-surface-text opacity-90">
                {locale === 'zh' ? a.titleZh : (a.titleEn || a.titleZh)}
              </div>
              <div className="text-[11px] text-surface-text opacity-60 leading-relaxed">
                {locale === 'zh' ? a.contentZh : (a.contentEn || a.contentZh)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
