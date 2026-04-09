import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

type Mode = 'light' | 'dark';
const MODE_KEY = 'forsion_desktop_mode';

function getInitialMode(): Mode {
  const saved = localStorage.getItem(MODE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export const ModeToggle: React.FC = () => {
  const [mode, setMode] = useState<Mode>(getInitialMode);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  const toggle = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

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
      title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {mode === 'light' ? <Moon size={14} strokeWidth={2} /> : <Sun size={14} strokeWidth={2} />}
    </button>
  );
};
