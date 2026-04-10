import React, { useState } from 'react';
import { useI18n } from '../../services/i18nService';

export type ShortcutAction = 'none' | 'open-launchpad' | 'focus-search';
export type ShortcutTrigger = 'right-click-empty' | 'click-title';

const SHORTCUT_KEY = 'forsion_desktop_shortcuts';

export interface ShortcutBindings {
  'right-click-empty': ShortcutAction;
  'click-title': ShortcutAction;
}

const DEFAULT_BINDINGS: ShortcutBindings = {
  'right-click-empty': 'none',
  'click-title': 'none',
};

export function getShortcutBindings(): ShortcutBindings {
  try {
    const raw = localStorage.getItem(SHORTCUT_KEY);
    if (raw) return { ...DEFAULT_BINDINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_BINDINGS };
}

function saveShortcutBindings(bindings: ShortcutBindings): void {
  localStorage.setItem(SHORTCUT_KEY, JSON.stringify(bindings));
  window.dispatchEvent(new CustomEvent('shortcut-bindings-changed', { detail: bindings }));
}

export const ShortcutSettings: React.FC = () => {
  const { t } = useI18n();
  const [bindings, setBindings] = useState<ShortcutBindings>(getShortcutBindings);

  const updateBinding = (trigger: ShortcutTrigger, action: ShortcutAction) => {
    const next = { ...bindings, [trigger]: action };
    setBindings(next);
    saveShortcutBindings(next);
  };

  const triggers: { id: ShortcutTrigger; label: string; desc: string }[] = [
    {
      id: 'right-click-empty',
      label: t('shortcuts.rightClickEmpty'),
      desc: t('shortcuts.rightClickEmptyDesc'),
    },
    {
      id: 'click-title',
      label: t('shortcuts.clickTitle'),
      desc: t('shortcuts.clickTitleDesc'),
    },
  ];

  const actions: { id: ShortcutAction; label: string }[] = [
    { id: 'none', label: t('shortcuts.actionNone') },
    { id: 'open-launchpad', label: t('shortcuts.actionLaunchpad') },
    { id: 'focus-search', label: t('shortcuts.actionSearch') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-surface-text mb-1">{t('shortcuts.title')}</h2>
        <p className="text-xs text-surface-text/50">{t('shortcuts.subtitle')}</p>
      </div>

      {triggers.map(trigger => (
        <section key={trigger.id} className="bg-surface-text/5 p-4 rounded-xl">
          <div className="mb-3">
            <div className="text-sm font-bold text-surface-text">{trigger.label}</div>
            <div className="text-xs text-surface-text/50">{trigger.desc}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {actions.map(action => (
              <button
                key={action.id}
                onClick={() => updateBinding(trigger.id, action.id)}
                className={`relative p-2.5 rounded-xl text-center text-xs font-medium transition-all ${
                  bindings[trigger.id] === action.id
                    ? 'bg-accent/15 ring-2 ring-accent text-accent'
                    : 'bg-surface-text/5 hover:bg-surface-text/10 text-surface-text/70'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
