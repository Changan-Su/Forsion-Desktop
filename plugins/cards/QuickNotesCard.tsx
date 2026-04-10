import React, { useState, useRef, useEffect } from 'react'
import { StickyNote } from 'lucide-react'
import { useI18n } from '../../services/i18nService'
import type { DeskCardProps } from '../types'
import widgetLayoutService from '../../services/widgetLayoutService'

export const QuickNotesCard: React.FC<DeskCardProps> = ({ instanceId, settings }) => {
  const { t, locale } = useI18n()
  const [content, setContent] = useState((settings.content as string) || '')
  const [editing, setEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  const saveContent = (text: string) => {
    setContent(text)
    // Persist to layout
    const layout = widgetLayoutService.getLayout()
    for (const zoneId of ['top', 'left', 'right', 'title'] as const) {
      const idx = layout.zones[zoneId].findIndex(p => p.id === instanceId)
      if (idx !== -1) {
        layout.zones[zoneId][idx].props = { ...layout.zones[zoneId][idx].props, content: text }
        widgetLayoutService.saveLayout(layout)
        break
      }
    }
  }

  const placeholder = locale === 'zh' ? '点击写点什么...' : 'Click to write something...'

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center opacity-50">
        <StickyNote size={16} />
        <span className="text-xs font-bold uppercase tracking-widest">
          {t('widget.card.quicknotes')}
        </span>
      </div>
      {editing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => { setEditing(false); saveContent(content) }}
          className="w-full text-sm text-surface-text resize-none min-h-[60px] rounded-lg px-2 py-1.5"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            outline: 'none',
          }}
          placeholder={placeholder}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="text-sm text-surface-text cursor-text min-h-[40px] rounded-lg px-1"
        >
          {content || (
            <span className="opacity-30 italic">{placeholder}</span>
          )}
        </div>
      )}
    </div>
  )
}
