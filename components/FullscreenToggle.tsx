import React, { useState, useEffect } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

export const FullscreenToggle: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-pill)',
        border: `1px solid ${hovered ? 'var(--ui-primary)' : 'var(--ui-border-sub)'}`,
        background: hovered ? 'var(--ui-primary-tint)' : 'var(--ui-surface-sub)',
        color: hovered ? 'var(--ui-primary)' : 'var(--ui-text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: `all var(--dur-fast) var(--ease-apple)`,
        flexShrink: 0,
      }}
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? <Minimize2 size={14} strokeWidth={2} /> : <Maximize2 size={14} strokeWidth={2} />}
    </button>
  )
}
