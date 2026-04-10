import React, { useState } from 'react';
import { useI18n } from '../../services/i18nService';

const LAUNCHPAD_COLS_KEY = 'forsion_desktop_launchpad_cols';
const DEFAULT_COLS = 5;

export function getLaunchpadCols(): number {
  const saved = localStorage.getItem(LAUNCHPAD_COLS_KEY);
  if (saved) {
    const n = parseInt(saved, 10);
    if (n >= 4 && n <= 6) return n;
  }
  return DEFAULT_COLS;
}

export const LaunchpadSettings: React.FC = () => {
  const { t } = useI18n();
  const [cols, setCols] = useState(getLaunchpadCols);

  const options = [4, 5, 6];

  const updateCols = (n: number) => {
    setCols(n);
    localStorage.setItem(LAUNCHPAD_COLS_KEY, String(n));
    window.dispatchEvent(new CustomEvent('launchpad-cols-changed', { detail: { cols: n } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-surface-text mb-1">{t('launchpad.settings.title')}</h2>
        <p className="text-xs text-surface-text/50">{t('launchpad.settings.subtitle')}</p>
      </div>

      <section className="bg-surface-text/5 p-4 rounded-xl">
        <div className="mb-3">
          <div className="text-sm font-bold text-surface-text">{t('launchpad.settings.columns')}</div>
          <div className="text-xs text-surface-text/50">{t('launchpad.settings.columnsDesc')}</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {options.map(n => (
            <button
              key={n}
              onClick={() => updateCols(n)}
              className={`relative p-2.5 rounded-xl text-center text-sm font-medium transition-all ${
                cols === n
                  ? 'bg-accent/15 ring-2 ring-accent text-accent'
                  : 'bg-surface-text/5 hover:bg-surface-text/10 text-surface-text/70'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
