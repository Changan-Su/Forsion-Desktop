import { SloganCard } from '../cards/SloganCard'
import type { DeskPlugin, DeskPluginAPI, CardManifest } from '../types'

const SLOGAN_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`

const manifest: CardManifest = {
  id: 'forsion-builtin-slogan',
  name: 'Slogan Card',
  version: '0.1.0',
  minAppVersion: '0.1.0',
  author: 'Forsion Team',
  description: 'Customizable slogan text with font selection.',
  main: 'builtin',
  cardTypes: ['slogan-card'],
}

export class SloganCardPlugin implements DeskPlugin {
  manifest = manifest

  onload(api: DeskPluginAPI): void {
    api.registerCard({
      type: 'slogan-card',
      label: 'Slogan',
      labelKey: 'widget.card.slogan',
      icon: SLOGAN_ICON,
      zoneType: 'title',
      component: SloganCard,
      defaultProps: {
        text: 'Forsion is All You Need',
        fontFamily: '"Dancing Script", cursive',
        opacity: 0.4,
      },
      settingsSchema: [
        {
          key: 'text',
          type: 'text',
          label: 'Text',
          labelKey: 'widget.setting.text',
          defaultValue: 'Forsion is All You Need',
        },
        {
          key: 'fontFamily',
          type: 'font',
          label: 'Font',
          labelKey: 'widget.setting.font',
          defaultValue: 'cursive',
          options: [
            { value: 'cursive', label: 'Cursive' },
            { value: 'serif', label: 'Serif' },
            { value: 'sans-serif', label: 'Sans Serif' },
            { value: 'monospace', label: 'Monospace' },
            { value: '"Dancing Script", cursive', label: 'Dancing Script' },
            { value: "'Playfair Display', serif", label: 'Playfair Display' },
          ],
        },
        {
          key: 'opacity',
          type: 'number',
          label: 'Opacity',
          labelKey: 'widget.setting.opacity',
          defaultValue: 0.4,
        },
      ],
    })
  }

  onunload(): void {}
}
