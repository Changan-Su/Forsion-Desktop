import { CountdownCard } from '../cards/CountdownCard'
import type { DeskPlugin, DeskPluginAPI, CardManifest } from '../types'

const COUNTDOWN_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="12" y2="10"/><circle cx="12" cy="14" r="8"/></svg>`

const manifest: CardManifest = {
  id: 'forsion-builtin-countdown',
  name: 'Countdown Card',
  version: '0.1.0',
  minAppVersion: '0.1.0',
  author: 'Forsion Team',
  description: 'Countdown to a target date.',
  main: 'builtin',
  cardTypes: ['countdown-card'],
}

export class CountdownCardPlugin implements DeskPlugin {
  manifest = manifest

  onload(api: DeskPluginAPI): void {
    api.registerCard({
      type: 'countdown-card',
      label: 'Countdown',
      labelKey: 'widget.card.countdown',
      icon: COUNTDOWN_ICON,
      zoneType: 'regular',
      component: CountdownCard,
      defaultProps: { targetDate: '', label: '' },
      settingsSchema: [
        {
          key: 'label',
          type: 'text',
          label: 'Event Name',
          labelKey: 'widget.setting.eventLabel',
          defaultValue: '',
        },
        {
          key: 'targetDate',
          type: 'text',
          label: 'Target Date',
          labelKey: 'widget.setting.targetDate',
          description: 'YYYY-MM-DD',
          defaultValue: '',
        },
      ],
    })
  }

  onunload(): void {}
}
