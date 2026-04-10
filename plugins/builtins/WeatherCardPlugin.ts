import { WeatherCard } from '../cards/WeatherCard'
import type { DeskPlugin, DeskPluginAPI, CardManifest } from '../types'

const WEATHER_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 1 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>`

const manifest: CardManifest = {
  id: 'forsion-builtin-weather',
  name: 'Weather Card',
  version: '0.1.0',
  minAppVersion: '0.1.0',
  author: 'Forsion Team',
  description: 'Shows current weather for your location.',
  main: 'builtin',
  cardTypes: ['weather-card'],
}

export class WeatherCardPlugin implements DeskPlugin {
  manifest = manifest

  onload(api: DeskPluginAPI): void {
    api.registerCard({
      type: 'weather-card',
      label: 'Weather',
      labelKey: 'widget.card.weather',
      icon: WEATHER_ICON,
      zoneType: 'regular',
      component: WeatherCard,
      defaultProps: { location: '' },
      settingsSchema: [
        {
          key: 'location',
          type: 'text',
          label: 'Location',
          labelKey: 'widget.setting.location',
          description: 'Leave empty for auto-detect',
          defaultValue: '',
        },
      ],
    })
  }

  onunload(): void {}
}
