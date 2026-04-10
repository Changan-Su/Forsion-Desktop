import React, { useState } from 'react';
import { Palette, Zap, Info, MousePointerClick, LayoutGrid } from 'lucide-react';
import { Theme } from '../../types';
import { AppearanceSettings } from './AppearanceSettings';
import { ShortcutSettings } from './ShortcutSettings';
import { LaunchpadSettings } from './LaunchpadSettings';
import { PerformanceSettings } from './PerformanceSettings';
import { AboutSettings } from './AboutSettings';
import { useI18n } from '../../services/i18nService';

interface SettingsPanelProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

type Category = 'appearance' | 'shortcuts' | 'launchpad' | 'performance' | 'about';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentTheme, onThemeChange }) => {
  const { t } = useI18n();
  const [active, setActive] = useState<Category>('appearance');

  const categories: { id: Category; label: string; icon: typeof Palette }[] = [
    { id: 'appearance', label: t('settings.category.appearance'), icon: Palette },
    { id: 'shortcuts', label: t('settings.category.shortcuts'), icon: MousePointerClick },
    { id: 'launchpad', label: t('settings.category.launchpad'), icon: LayoutGrid },
    { id: 'performance', label: t('settings.category.performance'), icon: Zap },
    { id: 'about', label: t('settings.category.about'), icon: Info },
  ];

  return (
    <div className="flex h-full -m-6">
      {/* Sidebar */}
      <div className="w-[160px] border-r border-surface-text/10 p-3 space-y-1 flex-shrink-0">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
              active === cat.id
                ? 'bg-accent/20 text-accent font-semibold'
                : 'text-surface-text/60 hover:text-surface-text hover:bg-surface-text/5'
            }`}
          >
            <cat.icon size={16} />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto scrollbar-thin">
        {active === 'appearance' && (
          <AppearanceSettings currentTheme={currentTheme} onThemeChange={onThemeChange} />
        )}
        {active === 'shortcuts' && <ShortcutSettings />}
        {active === 'launchpad' && <LaunchpadSettings />}
        {active === 'performance' && <PerformanceSettings />}
        {active === 'about' && <AboutSettings />}
      </div>
    </div>
  );
};
