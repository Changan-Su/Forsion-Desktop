import React, { useState, useEffect } from 'react';
import SettingsStorageService from '../../services/settingsStorageService';
import { useI18n } from '../../services/i18nService';

// Reusable inline toggle to keep both rows visually consistent.
const Toggle: React.FC<{ enabled: boolean; onChange: (v: boolean) => void; ariaLabel?: string }> = ({
  enabled,
  onChange,
  ariaLabel,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    aria-label={ariaLabel}
    onClick={() => onChange(!enabled)}
    className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
      enabled ? 'bg-accent' : 'bg-surface-text/20'
    }`}
  >
    <span
      className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
        enabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-surface-text/40'
      }`}
    />
  </button>
);

export const PerformanceSettings: React.FC = () => {
  const { t } = useI18n();
  const [gpuAcceleration, setGpuAcceleration] = useState(false);
  const [reducedFx, setReducedFx] = useState(false);

  useEffect(() => {
    setGpuAcceleration(SettingsStorageService.getGPUAcceleration());
    setReducedFx(SettingsStorageService.getReducedVisualFx());
  }, []);

  const handleGpuToggle = (enabled: boolean) => {
    setGpuAcceleration(enabled);
    SettingsStorageService.setGPUAccelerationGlobal(enabled);
    if (enabled) document.body.classList.add('gpu-acceleration');
    else document.body.classList.remove('gpu-acceleration');
    window.dispatchEvent(new CustomEvent('gpu-acceleration-changed', { detail: { enabled } }));
  };

  const handleReducedFxToggle = (enabled: boolean) => {
    setReducedFx(enabled);
    SettingsStorageService.setReducedVisualFx(enabled);
    if (enabled) document.body.classList.add('reduced-fx');
    else document.body.classList.remove('reduced-fx');
    window.dispatchEvent(new CustomEvent('reduced-visual-fx-changed', { detail: { enabled } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-surface-text mb-1">{t('performance.title')}</h2>
        <p className="text-xs text-surface-text/50">{t('performance.subtitle')}</p>
      </div>

      <section className="bg-surface-text/5 p-4 rounded-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-surface-text mb-1">{t('performance.gpuAcceleration')}</div>
            <div className="text-xs text-surface-text/50">{t('performance.gpuDesc')}</div>
          </div>
          <Toggle
            enabled={gpuAcceleration}
            onChange={handleGpuToggle}
            ariaLabel={t('performance.gpuAcceleration')}
          />
        </div>
      </section>

      <section className="bg-surface-text/5 p-4 rounded-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-surface-text mb-1">
              {t('performance.reducedFx')}
            </div>
            <div className="text-xs text-surface-text/50">
              {t('performance.reducedFxDesc')}
            </div>
          </div>
          <Toggle
            enabled={reducedFx}
            onChange={handleReducedFxToggle}
            ariaLabel={t('performance.reducedFx')}
          />
        </div>
        {/* Effects inventory — tell the user what exactly gets cut */}
        <ul
          className="mt-3 pt-3 border-t border-surface-text/10 space-y-1.5 text-[11px] text-surface-text/60"
        >
          <li className="flex items-start gap-2">
            <span className="mt-[5px] w-1 h-1 rounded-full bg-surface-text/40 flex-shrink-0" />
            <span>{t('performance.reducedFx.item.glass')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-[5px] w-1 h-1 rounded-full bg-surface-text/40 flex-shrink-0" />
            <span>{t('performance.reducedFx.item.wallpaperBlur')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-[5px] w-1 h-1 rounded-full bg-surface-text/40 flex-shrink-0" />
            <span>{t('performance.reducedFx.item.glow')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-[5px] w-1 h-1 rounded-full bg-surface-text/40 flex-shrink-0" />
            <span>{t('performance.reducedFx.item.vignette')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-[5px] w-1 h-1 rounded-full bg-surface-text/40 flex-shrink-0" />
            <span>{t('performance.reducedFx.item.shadow')}</span>
          </li>
        </ul>
      </section>
    </div>
  );
};
