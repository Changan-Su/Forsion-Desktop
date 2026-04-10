import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import widgetLayoutService from '../services/widgetLayoutService'
import { deskCardRegistry } from '../plugins/DeskCardRegistry'
import { CardZone, ZONE_ACCEPTED_TYPE } from './CardZone'
import { CardPicker } from './CardPicker'
import { CardSettingsPopover } from './CardSettingsPopover'
import type { WidgetLayoutData, ZoneId, WidgetPlacement, DeskCardSettingField } from '../plugins/types'
import { useI18n } from '../services/i18nService'

const ALL_ZONES: ZoneId[] = ['top', 'left', 'right', 'title']

function findPlacementZone(layout: WidgetLayoutData, placementId: string): ZoneId | null {
  for (const zoneId of ALL_ZONES) {
    if (layout.zones[zoneId].some(p => p.id === placementId)) return zoneId
  }
  return null
}

export const CardZoneManager: React.FC = () => {
  const { t } = useI18n()
  const [layout, setLayout] = useState<WidgetLayoutData>(() => widgetLayoutService.getLayout())
  const [isEditing, setIsEditing] = useState(false)
  const [draftLayout, setDraftLayout] = useState<WidgetLayoutData | null>(null)

  // Card picker state
  const [pickerZone, setPickerZone] = useState<ZoneId | null>(null)

  // Card settings state
  const [settingsCardId, setSettingsCardId] = useState<string | null>(null)

  // Active drag state
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Listen for edit mode toggle from Dock
  useEffect(() => {
    const handler = () => {
      setIsEditing(prev => {
        if (!prev) {
          // Entering edit mode — snapshot layout
          setDraftLayout(widgetLayoutService.cloneLayout(layout))
        } else {
          // Exiting edit mode without save — discard draft
          setDraftLayout(null)
        }
        return !prev
      })
    }
    window.addEventListener('widget-edit-toggle', handler)
    return () => window.removeEventListener('widget-edit-toggle', handler)
  }, [layout])

  // The active layout (draft when editing, persisted otherwise)
  const activeLayout = isEditing && draftLayout ? draftLayout : layout

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (draftLayout) {
      widgetLayoutService.saveLayout(draftLayout)
      setLayout(draftLayout)
    }
    setDraftLayout(null)
    setIsEditing(false)
    window.dispatchEvent(new CustomEvent('widget-edit-saved'))
  }, [draftLayout])

  const handleCancel = useCallback(() => {
    setDraftLayout(null)
    setIsEditing(false)
    window.dispatchEvent(new CustomEvent('widget-edit-cancelled'))
  }, [])

  const handleAddCard = useCallback((zoneId: ZoneId) => {
    setPickerZone(zoneId)
  }, [])

  const handlePickCard = useCallback((cardType: string) => {
    if (!draftLayout || !pickerZone) return
    const descriptor = deskCardRegistry.getDescriptor(cardType)
    if (!descriptor) return

    const placement = widgetLayoutService.createPlacement(cardType, descriptor.defaultProps)
    const newDraft = widgetLayoutService.cloneLayout(draftLayout)
    newDraft.zones[pickerZone].push(placement)
    setDraftLayout(newDraft)
    setPickerZone(null)
  }, [draftLayout, pickerZone])

  const handleDeleteCard = useCallback((placementId: string) => {
    if (!draftLayout) return
    const newDraft = widgetLayoutService.cloneLayout(draftLayout)
    for (const zoneId of ALL_ZONES) {
      newDraft.zones[zoneId] = newDraft.zones[zoneId].filter(p => p.id !== placementId)
    }
    setDraftLayout(newDraft)
  }, [draftLayout])

  const handleSettingsCard = useCallback((placementId: string) => {
    setSettingsCardId(placementId)
  }, [])

  const handleSaveSettings = useCallback((values: Record<string, unknown>) => {
    if (!draftLayout || !settingsCardId) return
    const newDraft = widgetLayoutService.cloneLayout(draftLayout)
    for (const zoneId of ALL_ZONES) {
      const idx = newDraft.zones[zoneId].findIndex(p => p.id === settingsCardId)
      if (idx !== -1) {
        newDraft.zones[zoneId][idx].props = values
        break
      }
    }
    setDraftLayout(newDraft)
    setSettingsCardId(null)
  }, [draftLayout, settingsCardId])

  // ── Drag and Drop ────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)
    if (!draftLayout) return

    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as { zoneId: ZoneId; placement: WidgetPlacement } | undefined
    if (!activeData) return

    const sourceZone = activeData.zoneId

    // Determine target zone
    let targetZone: ZoneId = sourceZone
    const overData = over.data.current as { zoneId?: ZoneId } | undefined

    if (over.id.toString().startsWith('zone-')) {
      targetZone = over.id.toString().replace('zone-', '') as ZoneId
    } else if (overData?.zoneId) {
      targetZone = overData.zoneId
    }

    // Validate zone type compatibility
    const descriptor = deskCardRegistry.getDescriptor(activeData.placement.cardType)
    if (descriptor) {
      const acceptedType = ZONE_ACCEPTED_TYPE[targetZone]
      if (descriptor.zoneType !== acceptedType) return // Reject incompatible drop
    }

    const newDraft = widgetLayoutService.cloneLayout(draftLayout)

    if (sourceZone === targetZone) {
      // Reorder within same zone
      const items = newDraft.zones[sourceZone]
      const oldIndex = items.findIndex(p => p.id === active.id)
      const newIndex = items.findIndex(p => p.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        newDraft.zones[sourceZone] = arrayMove(items, oldIndex, newIndex)
      }
    } else {
      // Move between zones (immutable)
      const moved = newDraft.zones[sourceZone].find(p => p.id === active.id)
      if (moved) {
        newDraft.zones[sourceZone] = newDraft.zones[sourceZone].filter(p => p.id !== active.id)
        newDraft.zones[targetZone] = [...newDraft.zones[targetZone], moved]
      }
    }

    setDraftLayout(newDraft)
  }, [draftLayout])

  // ── Settings card lookup ─────────────────────────────────────────────────────

  let settingsSchema: DeskCardSettingField[] = []
  let settingsValues: Record<string, unknown> = {}
  if (settingsCardId && draftLayout) {
    for (const zoneId of ALL_ZONES) {
      const placement = draftLayout.zones[zoneId].find(p => p.id === settingsCardId)
      if (placement) {
        const descriptor = deskCardRegistry.getDescriptor(placement.cardType)
        settingsSchema = descriptor?.settingsSchema || []
        settingsValues = placement.props
        break
      }
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {ALL_ZONES.map(zoneId => (
          <CardZone
            key={zoneId}
            zoneId={zoneId}
            placements={activeLayout.zones[zoneId]}
            isEditing={isEditing}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onSettingsCard={handleSettingsCard}
          />
        ))}
      </DndContext>

      {/* Save/Cancel bar */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[10010] glass-dark rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-xl"
          >
            <span className="text-xs text-surface-text opacity-60 mr-2">{t('widget.editTitle')}</span>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-xl text-xs text-surface-text hover:bg-white/10 transition-colors flex items-center gap-1"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <X size={12} /> {t('widget.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-xl text-xs text-white font-medium flex items-center gap-1 transition-colors"
              style={{ background: 'var(--color-primary, #6366f1)' }}
            >
              <Check size={12} /> {t('widget.save')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card picker modal */}
      <CardPicker
        isOpen={pickerZone !== null}
        zoneId={pickerZone || 'left'}
        onSelect={handlePickCard}
        onClose={() => setPickerZone(null)}
      />

      {/* Card settings modal */}
      <CardSettingsPopover
        isOpen={settingsCardId !== null}
        schema={settingsSchema}
        values={settingsValues}
        onSave={handleSaveSettings}
        onClose={() => setSettingsCardId(null)}
      />
    </>
  )
}
