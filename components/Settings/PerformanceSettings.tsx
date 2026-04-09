import React, { useState, useEffect } from 'react';
import SettingsStorageService from '../../services/settingsStorageService';
import { useI18n } from '../../services/i18nService';

export const PerformanceSettings: React.FC = () => {
  const { t } = useI18n();
  const [gpuAcceleration, setGpuAcceleration] = useState(false);

  useEffect(() => {
    setGpuAcceleration(SettingsStorageService.getGPUAcceleration());
  }, []);

  const handleToggle = (enabled: boolean) => {
    setGpuAcceleration(enabled);
    SettingsStorageService.setGPUAccelerationGlobal(enabled);
    if (enabled) {
      document.body.classList.add('gpu-acceleration');
    } else {
      document.body.classList.remove('gpu-acceleration');
    }
    window.dispatchEvent(new CustomEvent('gpu-acceleration-changed', { detail: { enabled } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-surface-text mb-1">{t('performance.title')}</h2>
        <p className="text-xs text-surface-text/50">{t('performance.subtitle')}</p>
      </div>

      <section className="bg-surface-text/5 p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-bold text-surface-text mb-1">{t('performance.gpuAcceleration')}</div>
            <div className="text-xs text-surface-text/50">{t('performance.gpuDesc')}</div>
          </div>
          <button
            onClick={() => handleToggle(!gpuAcceleration)}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
              gpuAcceleration ? 'bg-accent' : 'bg-surface-text/20'
            }`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
              gpuAcceleration ? 'translate-x-5 bg-white' : 'translate-x-0 bg-surface-text/40'
            }`} />
          </button>
        </div>
      </section>
    </div>
  );
};
