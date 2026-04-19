import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  MousePointerClick,
  LayoutGrid,
  Zap,
  Puzzle,
  Info,
  ChevronRight,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { Theme } from '../types';
import { useI18n } from '../services/i18nService';
import { AppearanceSettings } from './Settings/AppearanceSettings';
import { ShortcutSettings } from './Settings/ShortcutSettings';
import { LaunchpadSettings } from './Settings/LaunchpadSettings';
import { PerformanceSettings } from './Settings/PerformanceSettings';
import { ExtensionSettings } from './Settings/ExtensionSettings';
import { AboutSettings } from './Settings/AboutSettings';

/**
 * MobileSettings — 移动端原生设置面板。
 *
 * 取代 SettingsPanel（其左侧 160px 固定侧边栏会在 mobile 挤爆内容）。
 * 采用 iOS-风格的两层结构：
 *   - 登陆页：分组列表，每个分类一行 + 彩色图标徽章 + 右侧 chevron
 *   - 详情页：push-in 全屏，顶部返回栏 + 分类标题；内容复用现有子面板组件
 *
 * 所有子面板（AppearanceSettings / ShortcutSettings 等）在桌面版本中已经
 * 是响应式 grid 布局，只是当时外面被 160px 侧边栏挤窄；放到全宽 mobile
 * 容器后天然能用（theme grid-cols-3 在 335px 宽度下每卡片 ~110px，正好）。
 */

type Category = 'appearance' | 'shortcuts' | 'launchpad' | 'performance' | 'extension' | 'about';

interface CategoryMeta {
  id: Category;
  icon: typeof Palette;
  // iOS Settings-style：每类一个独特色调的图标方块
  iconBg: string; // CSS color or gradient
  iconColor: string;
  descriptionKey: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    id: 'appearance',
    icon: Palette,
    iconBg: 'linear-gradient(135deg, #f472b6, #c084fc)',
    iconColor: '#fff',
    descriptionKey: 'appearance.subtitle',
  },
  {
    id: 'shortcuts',
    icon: MousePointerClick,
    iconBg: 'linear-gradient(135deg, #38bdf8, #6366f1)',
    iconColor: '#fff',
    descriptionKey: 'shortcuts.subtitle',
  },
  {
    id: 'launchpad',
    icon: LayoutGrid,
    iconBg: 'linear-gradient(135deg, #34d399, #14b8a6)',
    iconColor: '#fff',
    descriptionKey: 'settings.category.launchpad',
  },
  {
    id: 'performance',
    icon: Zap,
    iconBg: 'linear-gradient(135deg, #fbbf24, #f97316)',
    iconColor: '#fff',
    descriptionKey: 'performance.subtitle',
  },
  {
    id: 'extension',
    icon: Puzzle,
    iconBg: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    iconColor: '#fff',
    descriptionKey: 'extension.subtitle',
  },
  {
    id: 'about',
    icon: Info,
    iconBg: 'linear-gradient(135deg, #94a3b8, #64748b)',
    iconColor: '#fff',
    descriptionKey: 'about.subtitle',
  },
];

interface MobileSettingsProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const MobileSettings: React.FC<MobileSettingsProps> = ({
  currentTheme,
  onThemeChange,
  isAuthenticated,
  onLogout,
}) => {
  const { t } = useI18n();
  const [active, setActive] = useState<Category | null>(null);

  // Intercept system back / swipe-back (where supported) to pop detail view
  useEffect(() => {
    if (!active) return;
    const handler = (e: PopStateEvent) => {
      e.preventDefault();
      setActive(null);
    };
    window.history.pushState({ mobileSettingsCategory: active }, '');
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [active]);

  const renderCategoryContent = useCallback(
    (cat: Category) => {
      switch (cat) {
        case 'appearance':
          return <AppearanceSettings currentTheme={currentTheme} onThemeChange={onThemeChange} />;
        case 'shortcuts':
          return <ShortcutSettings />;
        case 'launchpad':
          return <LaunchpadSettings />;
        case 'performance':
          return <PerformanceSettings />;
        case 'extension':
          return <ExtensionSettings />;
        case 'about':
          return <AboutSettings />;
        default:
          return null;
      }
    },
    [currentTheme, onThemeChange]
  );

  const activeMeta = active ? CATEGORIES.find(c => c.id === active) : null;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: 'var(--ui-surface)',
        backdropFilter: 'var(--backdrop-glass)',
        WebkitBackdropFilter: 'var(--backdrop-glass)',
      }}
    >
      {/* ── Landing: grouped list ─────────────────────────────────────── */}
      <div
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
      >
        {/* Section header — editorial */}
        <div className="px-5 pt-6 pb-4">
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: 'var(--ui-text-muted)' }}
          >
            Forsion Desk
          </div>
          <h1
            className="mt-1 font-semibold leading-tight"
            style={{ fontSize: 28, color: 'var(--ui-text)' }}
          >
            {t('mobile.tab.settings')}
          </h1>
        </div>

        {/* Grouped list — iOS-style rounded cluster, one group for now */}
        <div className="px-4 pb-8">
          <ul
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--ui-surface-sub)',
              border: '1px solid var(--ui-border-sub)',
            }}
          >
            {CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon;
              const isLast = idx === CATEGORIES.length - 1;
              return (
                <li key={cat.id}>
                  <button
                    onClick={() => setActive(cat.id)}
                    className="w-full flex items-center gap-3.5 px-4 py-3 text-left active:opacity-70 transition-opacity"
                    style={{
                      borderBottom: isLast ? 'none' : '1px solid var(--ui-border-sub)',
                    }}
                  >
                    <span
                      className="flex items-center justify-center rounded-[10px] flex-shrink-0 shadow-sm"
                      style={{
                        width: 34,
                        height: 34,
                        background: cat.iconBg,
                        color: cat.iconColor,
                      }}
                    >
                      <Icon size={17} strokeWidth={2.25} />
                    </span>
                    <span
                      className="flex-1 text-[15px] font-medium"
                      style={{ color: 'var(--ui-text)' }}
                    >
                      {t(`settings.category.${cat.id}`)}
                    </span>
                    <ChevronRight
                      size={17}
                      className="flex-shrink-0"
                      style={{ color: 'var(--ui-text-muted)', opacity: 0.6 }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {isAuthenticated && (
            <div className="mt-6 pb-6">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-medium active:opacity-70 transition-opacity"
                style={{
                  background: 'var(--ui-surface-sub)',
                  border: '1px solid var(--ui-border-sub)',
                  color: '#ef4444',
                }}
              >
                <LogOut size={15} />
                {t('user.logout')}
              </button>
            </div>
          )}

          {/* Subtle brand mark at bottom — editorial flourish */}
          <div
            className="text-center pt-6 pb-2 font-cursive text-lg opacity-40"
            style={{ color: 'var(--ui-text)' }}
          >
            Forsion is All You Need
          </div>
        </div>
      </div>

      {/* ── Detail: push-in from right ────────────────────────────────── */}
      <AnimatePresence>
        {active && activeMeta && (
          <motion.div
            key={active}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
            className="absolute inset-0 flex flex-col"
            style={{
              background: 'var(--ui-surface)',
              backdropFilter: 'var(--backdrop-glass)',
              WebkitBackdropFilter: 'var(--backdrop-glass)',
            }}
          >
            {/* Detail top bar */}
            <div
              className="flex items-center gap-2 px-2 py-2"
              style={{
                borderBottom: '1px solid var(--ui-border-sub)',
              }}
            >
              <button
                onClick={() => {
                  setActive(null);
                  // consume the pushed history entry
                  if (window.history.state?.mobileSettingsCategory) {
                    window.history.back();
                  }
                }}
                className="flex items-center gap-0.5 py-2 pr-3 pl-2 active:opacity-60 transition-opacity"
                style={{ color: 'var(--color-primary)' }}
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
                <span className="text-[15px] font-medium">{t('mobile.back')}</span>
              </button>
              <div className="flex-1" />
              <div
                className="flex items-center gap-2 pr-3"
                style={{ color: 'var(--ui-text)' }}
              >
                <span
                  className="flex items-center justify-center rounded-[8px] flex-shrink-0"
                  style={{
                    width: 26,
                    height: 26,
                    background: activeMeta.iconBg,
                    color: activeMeta.iconColor,
                  }}
                >
                  <activeMeta.icon size={13} strokeWidth={2.5} />
                </span>
                <span className="text-[15px] font-semibold">
                  {t(`settings.category.${active}`)}
                </span>
              </div>
            </div>

            {/* Detail content — scrollable, full mobile width */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div
                className="p-5"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
              >
                {renderCategoryContent(active)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileSettings;
