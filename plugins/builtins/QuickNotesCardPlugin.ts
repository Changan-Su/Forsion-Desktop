import { QuickNotesCard } from '../cards/QuickNotesCard'
import type { DeskPlugin, DeskPluginAPI, CardManifest } from '../types'

const NOTES_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M14 3v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>`

const manifest: CardManifest = {
  id: 'forsion-builtin-quicknotes',
  name: 'Quick Notes Card',
  version: '0.1.0',
  minAppVersion: '0.1.0',
  author: 'Forsion Team',
  description: 'Simple persistent memo widget.',
  main: 'builtin',
  cardTypes: ['quicknotes-card'],
}

export class QuickNotesCardPlugin implements DeskPlugin {
  manifest = manifest

  onload(api: DeskPluginAPI): void {
    api.registerCard({
      type: 'quicknotes-card',
      label: 'Quick Notes',
      labelKey: 'widget.card.quicknotes',
      icon: NOTES_ICON,
      zoneType: 'regular',
      component: QuickNotesCard,
      defaultProps: { content: '' },
    })
  }

  onunload(): void {}
}
