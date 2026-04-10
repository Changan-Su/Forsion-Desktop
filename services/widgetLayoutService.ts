import type { WidgetLayoutData, ZoneId, WidgetPlacement } from '../plugins/types'

const WIDGET_LAYOUT_KEY = 'forsion-desk-widgets'

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

function getDefaultLayout(): WidgetLayoutData {
  return {
    version: 1,
    zones: {
      top: [],
      left: [
        { id: 'default-date', cardType: 'date-card', props: { calendarType: 'solar' } },
        { id: 'default-announcement', cardType: 'announcement-card', props: {} },
      ],
      right: [],
      title: [
        {
          id: 'default-slogan',
          cardType: 'slogan-card',
          props: { text: 'Forsion is All You Need', fontFamily: '"Dancing Script", cursive', opacity: 0.4 },
        },
      ],
    },
  }
}

class WidgetLayoutService {
  getLayout(): WidgetLayoutData {
    try {
      const raw = localStorage.getItem(WIDGET_LAYOUT_KEY)
      if (raw) {
        const data = JSON.parse(raw) as WidgetLayoutData
        const allZones: ZoneId[] = ['top', 'left', 'right', 'title']
        if (data.version === 1 && data.zones && allZones.every(z => Array.isArray(data.zones[z]))) return data
      }
    } catch {}
    return getDefaultLayout()
  }

  saveLayout(layout: WidgetLayoutData): void {
    localStorage.setItem(WIDGET_LAYOUT_KEY, JSON.stringify(layout))
  }

  createPlacement(cardType: string, defaultProps: Record<string, unknown>): WidgetPlacement {
    return {
      id: generateId(),
      cardType,
      props: { ...defaultProps },
    }
  }

  cloneLayout(layout: WidgetLayoutData): WidgetLayoutData {
    return JSON.parse(JSON.stringify(layout))
  }
}

const widgetLayoutService = new WidgetLayoutService()
export default widgetLayoutService
export { widgetLayoutService, generateId }
