import React, { useState } from 'react';
import { Image as ImageIcon, Check } from 'lucide-react';
import { Theme } from '../../types';
import { THEMES, SEARCH_ENGINES, DEFAULT_SEARCH_ENGINE } from '../../constants';
import { generateThemeFromWallpaper } from '../../services/colorExtractionService';
import { BingGallery } from './BingGallery';
import { useI18n } from '../../services/i18nService';

const SEARCH_ENGINE_KEY = 'forsion_desktop_search_engine';

interface AppearanceSettingsProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ currentTheme, onThemeChange }) => {
  const { t } = useI18n();
  const [autoAdapt, setAutoAdapt] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [vignetting, setVignetting] = useState(() => localStorage.getItem('forsion_desktop_vignetting') !== 'false');
  const [focusBlur, setFocusBlur] = useState(() => localStorage.getItem('forsion_desktop_focus_blur') !== 'false');
  const [defaultEngine, setDefaultEngine] = useState(() => localStorage.getItem(SEARCH_ENGINE_KEY) || DEFAULT_SEARCH_ENGINE);

  const toggleVignetting = () => {
    const next = !vignetting;
    setVignetting(next);
    localStorage.setItem('forsion_desktop_vignetting', String(next));
    window.dispatchEvent(new CustomEvent('wallpaper-overlay-changed', { detail: { vignetting: next } }));
  };

  const toggleFocusBlur = () => {
    const next = !focusBlur;
    setFocusBlur(next);
    localStorage.setItem('forsion_desktop_focus_blur', String(next));
    window.dispatchEvent(new CustomEvent('wallpaper-overlay-changed', { detail: { focusBlur: next } }));
  };

  const applyWallpaper = async (imageUrl: string) => {
    if (autoAdapt) {
      setExtracting(true);
      try {
        const theme = await generateThemeFromWallpaper(imageUrl);
        onThemeChange(theme);
      } catch (err) {
        console.error('[AppearanceSettings] Color extraction failed:', err);
        onThemeChange({ ...currentTheme, id: 'custom-wallpaper', name: 'Custom Wallpaper', wallpaper: imageUrl });
      } finally {
        setExtracting(false);
      }
    } else {
      onThemeChange({ ...currentTheme, id: 'custom-wallpaper', name: 'Custom Wallpaper', wallpaper: imageUrl });
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      applyWallpaper(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-surface-text mb-1">{t('appearance.title')}</h2>
        <p className="text-xs text-surface-text/50">{t('appearance.subtitle')}</p>
      </div>

      {/* Theme Presets */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-surface-text/50">{t('appearance.themePresets')}</h3>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t)}
              className={`relative group rounded-xl p-2.5 text-left transition-all ${
                currentTheme.id === t.id
                  ? 'bg-accent/15 ring-2 ring-accent'
                  : 'bg-surface-text/5 hover:bg-surface-text/10'
              }`}
            >
              <div className="h-12 rounded-lg mb-1.5 shadow-inner" style={{ background: t.background }} />
              <div className="text-[11px] font-bold text-surface-text">{t.name}</div>
              {currentTheme.id === t.id && (
                <div className="absolute top-1.5 right-1.5 bg-accent text-surface-text p-0.5 rounded-full">
                  <Check size={8} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Wallpaper */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-surface-text/50">{t('appearance.wallpaper')}</h3>
        <div className="space-y-3">
          {/* Upload + current preview */}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-surface-text/5 hover:bg-surface-text/10 px-5 py-3 rounded-xl flex flex-col items-center justify-center transition-all border-2 border-dashed border-surface-text/20 hover:border-accent/40">
              <ImageIcon size={20} className="mb-1.5 text-surface-text/40" />
              <span className="text-[10px] font-bold text-surface-text/70">{t('appearance.upload')}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
            </label>
            {currentTheme.wallpaper && (
              <div className="relative w-28 h-16 rounded-lg overflow-hidden shadow-lg">
                <img src={currentTheme.wallpaper} alt="Wallpaper" className="w-full h-full object-cover" />
                <button
                  onClick={() => onThemeChange(THEMES[0])}
                  className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white/90 text-[9px] font-bold transition-opacity"
                >
                  {t('appearance.reset')}
                </button>
              </div>
            )}
            {extracting && (
              <span className="text-[10px] text-accent animate-pulse">{t('appearance.extracting')}</span>
            )}
          </div>

          {/* Bing Gallery */}
          <BingGallery
            onSelectWallpaper={applyWallpaper}
            selectedUrl={currentTheme.wallpaper}
          />
        </div>
      </section>

      {/* Auto-adapt toggle */}
      <section className="bg-surface-text/5 p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-bold text-surface-text mb-1">{t('appearance.autoAdapt')}</div>
            <div className="text-xs text-surface-text/50">{t('appearance.autoAdaptDesc')}</div>
          </div>
          <button
            onClick={() => setAutoAdapt(!autoAdapt)}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
              autoAdapt ? 'bg-accent' : 'bg-surface-text/20'
            }`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
              autoAdapt ? 'translate-x-5 bg-white' : 'translate-x-0 bg-surface-text/40'
            }`} />
          </button>
        </div>
      </section>

      {/* Wallpaper Overlay Effects */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-surface-text/50">{t('appearance.overlayEffects')}</h3>
        <div className="space-y-3">
          {/* Vignetting toggle */}
          <div className="bg-surface-text/5 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-bold text-surface-text mb-1">{t('appearance.vignetting')}</div>
                <div className="text-xs text-surface-text/50">{t('appearance.vignettingDesc')}</div>
              </div>
              <button
                onClick={toggleVignetting}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  vignetting ? 'bg-accent' : 'bg-surface-text/20'
                }`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                  vignetting ? 'translate-x-5 bg-white' : 'translate-x-0 bg-surface-text/40'
                }`} />
              </button>
            </div>
          </div>
          {/* Focus blur toggle */}
          <div className="bg-surface-text/5 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-bold text-surface-text mb-1">{t('appearance.focusBlur')}</div>
                <div className="text-xs text-surface-text/50">{t('appearance.focusBlurDesc')}</div>
              </div>
              <button
                onClick={toggleFocusBlur}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  focusBlur ? 'bg-accent' : 'bg-surface-text/20'
                }`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                  focusBlur ? 'translate-x-5 bg-white' : 'translate-x-0 bg-surface-text/40'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Default Search Engine */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-surface-text/50">{t('search.defaultEngine')}</h3>
        <p className="text-xs text-surface-text/50 mb-3">{t('search.defaultEngineDesc')}</p>
        <div className="grid grid-cols-3 gap-2">
          {SEARCH_ENGINES.map(engine => (
            <button
              key={engine.id}
              onClick={() => {
                setDefaultEngine(engine.id);
                localStorage.setItem(SEARCH_ENGINE_KEY, engine.id);
                window.dispatchEvent(new CustomEvent('search-engine-changed', { detail: { engineId: engine.id } }));
              }}
              className={`relative p-3 rounded-xl text-center text-xs font-medium transition-all ${
                defaultEngine === engine.id
                  ? 'bg-accent/15 ring-2 ring-accent text-accent'
                  : 'bg-surface-text/5 hover:bg-surface-text/10 text-surface-text/70'
              }`}
            >
              {engine.name}
              {defaultEngine === engine.id && (
                <div className="absolute top-1.5 right-1.5 bg-accent text-white p-0.5 rounded-full">
                  <Check size={8} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
