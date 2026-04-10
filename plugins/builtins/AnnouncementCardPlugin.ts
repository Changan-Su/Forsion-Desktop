import { AnnouncementCard } from '../cards/AnnouncementCard'
import type { DeskPlugin, DeskPluginAPI, CardManifest } from '../types'

const ANNOUNCEMENT_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`

const manifest: CardManifest = {
  id: 'forsion-builtin-announcement',
  name: 'Announcement Card',
  version: '0.1.0',
  minAppVersion: '0.1.0',
  author: 'Forsion Team',
  description: 'Shows latest Desk features and usage tips.',
  main: 'builtin',
  cardTypes: ['announcement-card'],
}

export class AnnouncementCardPlugin implements DeskPlugin {
  manifest = manifest

  onload(api: DeskPluginAPI): void {
    api.registerCard({
      type: 'announcement-card',
      label: 'Announcements',
      labelKey: 'widget.card.announcement',
      icon: ANNOUNCEMENT_ICON,
      zoneType: 'regular',
      component: AnnouncementCard,
      defaultProps: {},
    })
  }

  onunload(): void {}
}
