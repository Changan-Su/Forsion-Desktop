import type { DeskPluginAPI, DeskCardDescriptor } from './types'
import { deskCardRegistry } from './DeskCardRegistry'

const SETTINGS_PREFIX = 'forsion-desk-plugin-settings-'

export class DeskPluginAPIImpl implements DeskPluginAPI {
  private _registeredTypes: string[] = []
  private _pluginId: string

  constructor(pluginId: string) {
    this._pluginId = pluginId
  }

  registerCard(descriptor: DeskCardDescriptor): void {
    deskCardRegistry.register(descriptor)
    this._registeredTypes.push(descriptor.type)
  }

  getSettings(): Record<string, unknown> {
    try {
      const raw = localStorage.getItem(SETTINGS_PREFIX + this._pluginId)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  saveSettings(settings: Record<string, unknown>): void {
    localStorage.setItem(SETTINGS_PREFIX + this._pluginId, JSON.stringify(settings))
  }

  get registeredTypes(): string[] {
    return [...this._registeredTypes]
  }
}
