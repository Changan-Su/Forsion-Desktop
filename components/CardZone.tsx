import React from 'react'
import { Plus } from 'lucide-react'
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CardWrapper } from './CardWrapper'
import type { WidgetPlacement, ZoneId, DeskZoneType } from '../plugins/types'
import { useI18n } from '../services/i18nService'

const ZONE_LABELS: Record<ZoneId, string> = {
  top: 'Top',
  left: 'Left',
  right: 'Right',
  title: 'Title',
}

const ZONE_ACCEPTED_TYPE: Record<ZoneId, DeskZoneType> = {
  top: 'regular',
  left: 'regular',
  right: 'regular',
  title: 'title',
}

interface CardZoneProps {
  zoneId: ZoneId
  placements: WidgetPlacement[]
  isEditing: boolean
  onAddCard?: (zoneId: ZoneId) => void
  onDeleteCard?: (placementId: string) => void
  onSettingsCard?: (placementId: string) => void
}

export const CardZone: React.FC<CardZoneProps> = ({
  zoneId,
  placements,
  isEditing,
  onAddCard,
  onDeleteCard,
  onSettingsCard,
}) => {
  const { t } = useI18n()
  const { setNodeRef, isOver } = useDroppable({ id: `zone-${zoneId}`, data: { zoneId } })

  const isHorizontal = zoneId === 'top'
  const isTitle = zoneId === 'title'
  const strategy = isHorizontal ? horizontalListSortingStrategy : verticalListSortingStrategy
  const placementIds = placements.map(p => p.id)

  // Zone container styles
  const zoneClasses: Record<ZoneId, string> = {
    top: 'fixed top-14 left-1/2 -translate-x-1/2 flex flex-row gap-4 items-start max-w-[60vw] z-10 pointer-events-none',
    left: 'fixed top-12 left-6 bottom-24 w-64 flex flex-col gap-4 z-10 pointer-events-none overflow-y-auto scrollbar-thin',
    right: 'fixed top-28 right-6 bottom-24 w-64 flex flex-col gap-4 z-10 pointer-events-none overflow-y-auto scrollbar-thin',
    title: 'absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none z-[5]',
  }

  const editBorderStyle: React.CSSProperties = isEditing ? {
    border: '2px dashed rgba(255,255,255,0.25)',
    borderRadius: '1.5rem',
    padding: isTitle ? '2rem' : '1rem',
    background: isOver ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
    transition: 'background 0.2s ease',
    minHeight: isTitle ? 120 : 80,
    minWidth: isHorizontal ? 200 : undefined,
  } : {}

  return (
    <div
      ref={setNodeRef}
      className={zoneClasses[zoneId]}
      style={editBorderStyle}
    >
      {/* Zone label in edit mode */}
      {isEditing && (
        <div className="absolute -top-3 left-4 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/50 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '6px', backdropFilter: 'blur(4px)' }}
        >
          {ZONE_LABELS[zoneId]}
        </div>
      )}

      <SortableContext items={placementIds} strategy={strategy}>
        {placements.map((placement) => (
          <div key={placement.id} className="pointer-events-auto">
            <CardWrapper
              placement={placement}
              zoneId={zoneId}
              isEditing={isEditing}
              onDelete={onDeleteCard}
              onSettings={onSettingsCard}
            />
          </div>
        ))}
      </SortableContext>

      {/* Add card button in edit mode */}
      {isEditing && onAddCard && (
        <button
          onClick={() => onAddCard(zoneId)}
          className="pointer-events-auto flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 text-white/40 hover:text-white/70 hover:border-white/40 transition-all cursor-pointer"
          style={{
            minHeight: isTitle ? 60 : 80,
            minWidth: isHorizontal ? 140 : undefined,
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <Plus size={20} />
          <span className="text-xs font-medium">{t('widget.add')}</span>
        </button>
      )}
    </div>
  )
}

export { ZONE_ACCEPTED_TYPE }
