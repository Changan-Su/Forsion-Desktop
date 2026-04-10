import { DateCard } from '../cards/DateCard'
import type { DeskPlugin, DeskPluginAPI, CardManifest } from '../types'

const DATE_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`

const manifest: CardManifest = {
  id: 'forsion-builtin-date',
  name: 'Date Card',
  version: '0.1.0',
  minAppVersion: '0.1.0',
  author: 'Forsion Team',
  description: 'Displays today\'s date with optional lunar calendar.',
  main: 'builtin',
  cardTypes: ['date-card'],
}

export class DateCardPlugin implements DeskPlugin {
  manifest = manifest

  onload(api: DeskPluginAPI): void {
    api.registerCard({
      type: 'date-card',
      label: 'Date',
      labelKey: 'widget.card.date',
      icon: DATE_ICON,
      zoneType: 'regular',
      component: DateCard,
      defaultProps: { calendarType: 'solar' },
      settingsSchema: [
        {
          key: 'calendarType',
          type: 'select',
          label: 'Calendar Type',
          labelKey: 'widget.setting.calendarType',
          defaultValue: 'solar',
          options: [
            { value: 'solar', label: 'Solar' },
            { value: 'lunar', label: 'Lunar (农历)' },
          ],
        },
      ],
    })
  }

  onunload(): void {}
}
