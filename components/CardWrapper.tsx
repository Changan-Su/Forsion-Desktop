import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Settings as SettingsIcon, GripVertical } from 'lucide-react'
import { deskCardRegistry } from '../plugins/DeskCardRegistry'
import type { WidgetPlacement, ZoneId } from '../plugins/types'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'

interface CardWrapperProps {
  placement: WidgetPlacement
  zoneId: ZoneId
  isEditing: boolean
  onDelete?: (placementId: string) => void
  onSettings?: (placementId: string) => void
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
  placement,
  zoneId,
  isEditing,
  onDelete,
  onSettings,
}) => {
  const descriptor = deskCardRegistry.getDescriptor(placement.cardType)
  const Component = descriptor?.component

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: placement.id,
    disabled: !isEditing,
    data: { zoneId, placement },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (!Component) {
    return (
      <div ref={setNodeRef} style={style} className="glass-dark p-4 rounded-2xl text-surface-text text-sm opacity-50">
        Unknown card: {placement.cardType}
      </div>
    )
  }

  // Title zone cards render without glass-dark wrapper
  if (zoneId === 'title') {
    return (
      <div ref={setNodeRef} style={style} className="relative overflow-visible">
        {isEditing && (
          <div className="absolute -top-3 -right-3 flex gap-1 z-20">
            {onSettings && descriptor?.settingsSchema?.length && (
              <button
                onClick={() => onSettings(placement.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors shadow-lg"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              >
                <SettingsIcon size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(placement.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-red-400 transition-colors shadow-lg"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
        {isEditing && (
          <div
            {...attributes}
            {...listeners}
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-7 h-9 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing text-white/60 hover:text-white/80 z-20 shadow-lg"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          >
            <GripVertical size={13} />
          </div>
        )}
        <Component
          instanceId={placement.id}
          settings={placement.props}
          isEditing={isEditing}
        />
      </div>
    )
  }

  // Regular zone cards use glass-dark wrapper
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ x: zoneId === 'left' ? -30 : zoneId === 'right' ? 30 : 0, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="relative glass-dark p-5 rounded-3xl text-surface-text overflow-visible"
    >
      {isEditing && (
        <div className="absolute -top-3 -right-3 flex gap-1 z-20">
          {onSettings && descriptor?.settingsSchema?.length && (
            <button
              onClick={() => onSettings(placement.id)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors shadow-lg"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            >
              <SettingsIcon size={13} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(placement.id)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-red-400 transition-colors shadow-lg"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-7 h-9 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing text-white/60 hover:text-white/80 z-20 shadow-lg"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        >
          <GripVertical size={13} />
        </div>
      )}
      <Component
        instanceId={placement.id}
        settings={placement.props}
        isEditing={isEditing}
      />
    </motion.div>
  )
}
