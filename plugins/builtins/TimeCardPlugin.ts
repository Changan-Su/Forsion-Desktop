import { TimeCard } from '../cards/TimeCard'
import type { DeskPlugin, DeskPluginAPI, CardManifest } from '../types'

const TIME_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`

const manifest: CardManifest = {
  id: 'forsion-builtin-time',
  name: 'Time Card',
  version: '0.1.0',
  minAppVersion: '0.1.0',
  author: 'Forsion Team',
  description: 'Displays current time with customizable format and font.',
  main: 'builtin',
  cardTypes: ['time-card'],
}

export class TimeCardPlugin implements DeskPlugin {
  manifest = manifest

  onload(api: DeskPluginAPI): void {
    api.registerCard({
      type: 'time-card',
      label: 'Time',
      labelKey: 'widget.card.time',
      icon: TIME_ICON,
      zoneType: 'title',
      component: TimeCard,
      defaultProps: {
        showSeconds: false,
        fontFamily: 'system-ui',
        is24h: true,
      },
      settingsSchema: [
        {
          key: 'showSeconds',
          type: 'boolean',
          label: 'Show Seconds',
          labelKey: 'widget.setting.showSeconds',
          defaultValue: false,
        },
        {
          key: 'is24h',
          type: 'boolean',
          label: '24-hour Format',
          labelKey: 'widget.setting.is24h',
          defaultValue: true,
        },
        {
          key: 'fontFamily',
          type: 'font',
          label: 'Font',
          labelKey: 'widget.setting.font',
          defaultValue: 'system-ui',
          options: [
            { value: 'system-ui', label: 'System' },
            { value: 'monospace', label: 'Monospace' },
            { value: 'serif', label: 'Serif' },
            { value: 'sans-serif', label: 'Sans Serif' },
            { value: "'Courier New', monospace", label: 'Courier New' },
          ],
        },
      ],
    })
  }

  onunload(): void {}
}
