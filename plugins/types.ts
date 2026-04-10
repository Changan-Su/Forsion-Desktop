import type React from 'react'

// ── Card Manifest (identical to Canvas) ───────────────────────────────────────

export interface CardManifest {
  id: string
  name: string
  version: string
  minAppVersion: string
  author: string
  description: string
  main: string
  styles?: string
  cardTypes: string[]
}

// ── Desk-specific types ───────────────────────────────────────────────────────

export type DeskZoneType = 'regular' | 'title'
export type ZoneId = 'top' | 'left' | 'right' | 'title'

export interface DeskCardProps {
  instanceId: string
  settings: Record<string, unknown>
  isEditing: boolean
}

export interface DeskCardSettingField {
  key: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'font'
  label: string
  labelKey?: string
  description?: string
  defaultValue?: unknown
  options?: { value: string; label: string }[]
}

export interface DeskCardDescriptor {
  type: string
  label: string
  labelKey?: string
  icon: string
  category?: string
  zoneType: DeskZoneType
  component: React.ComponentType<DeskCardProps>
  defaultProps: Record<string, unknown>
  settingsSchema?: DeskCardSettingField[]
}

// ── Desk Plugin API ───────────────────────────────────────────────────────────

export interface DeskPluginAPI {
  registerCard(descriptor: DeskCardDescriptor): void
  getSettings(): Record<string, unknown>
  saveSettings(settings: Record<string, unknown>): void
}

// ── Desk Plugin ───────────────────────────────────────────────────────────────

export interface DeskPlugin {
  manifest: CardManifest
  onload(api: DeskPluginAPI): void
  onunload(): void
}

// ── Layout persistence ────────────────────────────────────────────────────────

export interface WidgetPlacement {
  id: string
  cardType: string
  props: Record<string, unknown>
  size?: { w?: number; h?: number }
}

export interface WidgetLayoutData {
  version: 1
  zones: Record<ZoneId, WidgetPlacement[]>
}

// ── Menu item (for CardPicker) ────────────────────────────────────────────────

export interface DeskCardMenuItem {
  type: string
  label: string
  labelKey?: string
  icon: string
  zoneType: DeskZoneType
}
