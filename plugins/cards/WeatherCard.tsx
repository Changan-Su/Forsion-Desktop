import React, { useState, useEffect } from 'react'
import { CloudSun } from 'lucide-react'
import { useI18n } from '../../services/i18nService'
import type { DeskCardProps } from '../types'

interface WeatherData {
  tempC: string
  conditionEn: string
  locationEn: string
  humidity: string
  windSpeed: string
  // Localized fields (filled from wttr.in lang_zh when available)
  conditionZh?: string
}

const CACHE_PREFIX = 'forsion-desk-weather-cache:'
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// Fallback translation dictionary for common wttr.in weather conditions
// Used when wttr.in's lang_zh field is missing
const WEATHER_ZH: Record<string, string> = {
  'Sunny': '晴',
  'Clear': '晴朗',
  'Partly cloudy': '局部多云',
  'Partly Cloudy': '局部多云',
  'Cloudy': '多云',
  'Overcast': '阴天',
  'Mist': '薄雾',
  'Fog': '雾',
  'Freezing fog': '冻雾',
  'Patchy rain possible': '可能有零星阵雨',
  'Patchy rain nearby': '附近有零星降雨',
  'Patchy light drizzle': '零星小毛毛雨',
  'Light drizzle': '小毛毛雨',
  'Freezing drizzle': '冻毛毛雨',
  'Heavy freezing drizzle': '大冻毛毛雨',
  'Patchy light rain': '零星小雨',
  'Light rain': '小雨',
  'Moderate rain at times': '间歇性中雨',
  'Moderate rain': '中雨',
  'Heavy rain at times': '间歇性大雨',
  'Heavy rain': '大雨',
  'Light freezing rain': '小冻雨',
  'Moderate or heavy freezing rain': '中到大冻雨',
  'Light sleet': '小雨夹雪',
  'Moderate or heavy sleet': '中到大雨夹雪',
  'Patchy snow possible': '可能有零星降雪',
  'Patchy light snow': '零星小雪',
  'Light snow': '小雪',
  'Patchy moderate snow': '零星中雪',
  'Moderate snow': '中雪',
  'Patchy heavy snow': '零星大雪',
  'Heavy snow': '大雪',
  'Ice pellets': '冰粒',
  'Light rain shower': '小阵雨',
  'Moderate or heavy rain shower': '中到大阵雨',
  'Torrential rain shower': '暴雨',
  'Light sleet showers': '小阵雨夹雪',
  'Moderate or heavy sleet showers': '中到大阵雨夹雪',
  'Light snow showers': '小阵雪',
  'Moderate or heavy snow showers': '中到大阵雪',
  'Light showers of ice pellets': '小阵冰粒',
  'Moderate or heavy showers of ice pellets': '中到大阵冰粒',
  'Patchy light rain with thunder': '零星小雨伴雷',
  'Moderate or heavy rain with thunder': '中到大雨伴雷',
  'Patchy light snow with thunder': '零星小雪伴雷',
  'Moderate or heavy snow with thunder': '中到大雪伴雷',
  'Thundery outbreaks possible': '可能有雷雨',
  'Blowing snow': '吹雪',
  'Blizzard': '暴风雪',
  'Unknown': '未知',
}

function translateCondition(en: string, zhFromApi?: string): string {
  if (zhFromApi) return zhFromApi
  return WEATHER_ZH[en] || en
}

function getCacheKey(location: string): string {
  return CACHE_PREFIX + (location || '_auto')
}

function getCachedWeather(location: string): WeatherData | null {
  try {
    const raw = sessionStorage.getItem(getCacheKey(location))
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function cacheWeather(location: string, data: WeatherData): void {
  sessionStorage.setItem(getCacheKey(location), JSON.stringify({ data, ts: Date.now() }))
}

export const WeatherCard: React.FC<DeskCardProps> = ({ settings }) => {
  const { t, locale } = useI18n()
  const location = (settings.location as string) || ''
  const [weather, setWeather] = useState<WeatherData | null>(() => getCachedWeather(location))
  const [loading, setLoading] = useState(!getCachedWeather(location))
  const [error, setError] = useState(false)

  useEffect(() => {
    const cached = getCachedWeather(location)
    if (cached) {
      setWeather(cached)
      setLoading(false)
      return
    }

    const fetchWeather = async () => {
      setLoading(true)
      setError(false)
      try {
        // Request both English and Chinese via lang parameter
        const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1&lang=zh`)
        if (!res.ok) throw new Error('Weather API error')
        const json = await res.json()
        const current = json.current_condition?.[0]
        const area = json.nearest_area?.[0]

        // Try to get localized description from wttr.in API response
        const zhFromApi = current?.lang_zh?.[0]?.value as string | undefined

        const data: WeatherData = {
          tempC: current?.temp_C || '--',
          conditionEn: current?.weatherDesc?.[0]?.value || 'Unknown',
          conditionZh: zhFromApi,
          locationEn: area?.areaName?.[0]?.value || location || '',
          humidity: current?.humidity || '--',
          windSpeed: current?.windspeedKmph || '--',
        }
        cacheWeather(location, data)
        setWeather(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [location])

  const headerLabel = t('widget.card.weather')

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center opacity-50">
          <CloudSun size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">{headerLabel}</span>
        </div>
        <div className="text-sm opacity-60 animate-pulse">{t('widget.weather.loading')}</div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center opacity-50">
          <CloudSun size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">{headerLabel}</span>
        </div>
        <div className="text-sm opacity-60">{t('widget.weather.unavailable')}</div>
      </div>
    )
  }

  // Display condition: localized if zh mode
  const conditionDisplay = locale === 'zh'
    ? translateCondition(weather.conditionEn, weather.conditionZh)
    : weather.conditionEn

  // Display location: if user set a location in settings, show it as-is (user's own text)
  // Otherwise show the API's areaName, or fall back to "Current Location" / "当前位置"
  const locationDisplay = location
    || weather.locationEn
    || t('widget.weather.currentLocation')

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center opacity-50">
        <CloudSun size={18} />
        <span className="text-xs font-bold uppercase tracking-widest">{headerLabel}</span>
      </div>
      <div>
        <h4 className="text-3xl font-light">{weather.tempC}°C</h4>
        <p className="text-sm opacity-80">{conditionDisplay}</p>
        <p className="text-xs opacity-60 mt-1">{locationDisplay}</p>
      </div>
      <div className="pt-1 flex gap-4">
        <div className="text-xs opacity-70">
          <span className="opacity-50">{t('widget.weather.humidity')} </span>{weather.humidity}%
        </div>
        <div className="text-xs opacity-70">
          <span className="opacity-50">{t('widget.weather.wind')} </span>{weather.windSpeed} km/h
        </div>
      </div>
    </div>
  )
}
