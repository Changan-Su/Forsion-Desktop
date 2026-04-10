import type { DeskPlugin, CardManifest } from './types'
import { DeskPluginAPIImpl } from './DeskPluginAPI'
import { deskCardRegistry } from './DeskCardRegistry'

interface LoadedPlugin {
  plugin: DeskPlugin
  api: DeskPluginAPIImpl
}

class DeskPluginManagerClass {
  private _plugins: Map<string, LoadedPlugin> = new Map()

  loadBuiltin(plugin: DeskPlugin): void {
    const { id } = plugin.manifest
    if (this._plugins.has(id)) return

    const api = new DeskPluginAPIImpl(id)
    plugin.onload(api)
    this._plugins.set(id, { plugin, api })
  }

  unload(pluginId: string): void {
    const loaded = this._plugins.get(pluginId)
    if (!loaded) return

    loaded.plugin.onunload()
    deskCardRegistry.unregisterByPlugin(loaded.api.registeredTypes)
    this._plugins.delete(pluginId)
  }

  getLoadedPluginIds(): string[] {
    return Array.from(this._plugins.keys())
  }

  isLoaded(pluginId: string): boolean {
    return this._plugins.has(pluginId)
  }

  getLoadedPlugins(): { manifest: CardManifest }[] {
    return Array.from(this._plugins.values()).map(l => ({ manifest: l.plugin.manifest }))
  }
}

export const deskPluginManager = new DeskPluginManagerClass()
export default deskPluginManager
