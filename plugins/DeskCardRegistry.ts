import type React from 'react'
import type { DeskCardDescriptor, DeskCardMenuItem, DeskCardProps, DeskZoneType } from './types'

class DeskCardRegistryClass {
  private _descriptors: Map<string, DeskCardDescriptor> = new Map()

  register(descriptor: DeskCardDescriptor): void {
    this._descriptors.set(descriptor.type, descriptor)
  }

  unregister(type: string): void {
    this._descriptors.delete(type)
  }

  unregisterByPlugin(types: string[]): void {
    for (const t of types) this._descriptors.delete(t)
  }

  getMenuItems(zoneType?: DeskZoneType): DeskCardMenuItem[] {
    const items: DeskCardMenuItem[] = []
    for (const d of this._descriptors.values()) {
      if (zoneType && d.zoneType !== zoneType) continue
      items.push({
        type: d.type,
        label: d.label,
        labelKey: d.labelKey,
        icon: d.icon,
        zoneType: d.zoneType,
      })
    }
    return items
  }

  getDescriptor(type: string): DeskCardDescriptor | undefined {
    return this._descriptors.get(type)
  }

  getComponent(type: string): React.ComponentType<DeskCardProps> | undefined {
    return this._descriptors.get(type)?.component
  }

  getAllTypes(): string[] {
    return Array.from(this._descriptors.keys())
  }

  get size(): number {
    return this._descriptors.size
  }
}

export const deskCardRegistry = new DeskCardRegistryClass()
export default deskCardRegistry
