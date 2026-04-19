import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Check, X } from 'lucide-react';
import { SEARCH_ENGINES } from '../constants';
import {
  findEngine,
  getPreferredEngineId,
  openSearchInNewTab,
  setPreferredEngineId,
} from '../services/searchEngineService';
import { useI18n } from '../services/i18nService';
import { EngineIcon } from './EngineIcon';

interface MobileSearchBarProps {
  /** Called when the user wants to chat with AI (engine = 'ai', or tapped Sparkles on empty). */
  onOpenChat: (initialInput?: string) => void;
}

/**
 * MobileSearchBar — real mobile search field with engine switcher.
 *
 * Layout (one line, pill-shaped):
 *   [engine icon button] [text input                  ] [action button]
 *
 * Engine button opens a bottom sheet with the 6 engines (Baidu / Bing /
 * Google / Yandex / DuckDuckGo / AI). Default is Bing. Preference is
 * persisted via shared searchEngineService, so changing it here also
 * affects the desktop AIChat composer.
 *
 * Enter / action button behavior:
 *   - engine = 'ai': opens MobileChatOverlay with the input pre-filled
 *   - any other engine: opens `engine.searchUrl` in a new tab
 *   - empty input + non-ai engine: Sparkles icon opens AI chat
 */
const MobileSearchBar: React.FC<MobileSearchBarProps> = ({ onOpenChat }) => {
  const { t } = useI18n();
  const [engineId, setEngineId] = useState<string>(() => getPreferredEngineId());
  const [input, setInput] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for engine changes from other surfaces (desktop / settings)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.engineId) setEngineId(detail.engineId);
    };
    window.addEventListener('search-engine-changed', handler);
    return () => window.removeEventListener('search-engine-changed', handler);
  }, []);

  // Lock body scroll while the engine picker sheet is open
  useEffect(() => {
    if (!showPicker) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showPicker]);

  const engine = useMemo(() => findEngine(engineId), [engineId]);
  const isAIMode = engineId === 'ai';
  const hasText = input.trim().length > 0;

  const placeholder = useMemo(() => {
    if (isAIMode) return t('mobile.searchOrChat');
    return engine ? t('mobile.searchWith').replace('{engine}', engine.name) : t('mobile.searchOrChat');
  }, [engine, isAIMode, t]);

  const handleSubmit = useCallback(() => {
    const q = input.trim();
    if (!q) {
      // Empty + tapped action → open AI chat
      onOpenChat();
      return;
    }
    if (isAIMode) {
      onOpenChat(q);
      setInput('');
      return;
    }
    // Perform web search
    const ok = openSearchInNewTab(engineId, q);
    if (ok) setInput('');
  }, [input, isAIMode, engineId, onOpenChat]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const chooseEngine = useCallback((id: string) => {
    setEngineId(id);
    setPreferredEngineId(id);
    setShowPicker(false);
    // Restore focus to the input after the sheet closes
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  return (
    <>
      {/* ── Search pill ────────────────────────────────────────────── */}
      <div
        className="w-full max-w-md flex items-center gap-2 pl-1.5 pr-1.5 py-1.5 rounded-full"
        style={{
          background: 'var(--ui-surface)',
          backdropFilter: 'var(--backdrop-glass)',
          WebkitBackdropFilter: 'var(--backdrop-glass)',
          border: '1px solid var(--ui-border-sub)',
          color: 'var(--ui-text)',
          boxShadow: '0 10px 32px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,0.06) inset',
        }}
      >
        {/* Engine switcher */}
        <button
          onClick={() => setShowPicker(true)}
          aria-label={t('mobile.changeEngine')}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
          style={{
            background: 'var(--ui-surface-sub)',
            border: '1px solid var(--ui-border-sub)',
            color: 'var(--ui-text)',
          }}
        >
          <EngineIcon engineId={engineId} size={16} />
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-[14px] focus:outline-none"
          style={{
            color: 'var(--ui-text)',
            // Hide the native clear button for a cleaner look
            WebkitAppearance: 'none',
          }}
        />

        {/* Action button — Sparkles (opens AI) when empty or AI mode,
            Search icon when there's text for a search engine */}
        <button
          onClick={handleSubmit}
          aria-label={hasText && !isAIMode ? t('mobile.search') : t('mobile.openChat')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 active:scale-95 transition-transform"
          style={{
            background: 'var(--color-primary)',
            boxShadow: '0 4px 12px color-mix(in srgb, var(--color-primary) 40%, transparent)',
          }}
        >
          {hasText && !isAIMode ? <Search size={15} /> : <Sparkles size={15} />}
        </button>
      </div>

      {/* ── Engine picker — bottom sheet ─────────────────────────── */}
      <AnimatePresence>
        {showPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              key="engine-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setShowPicker(false)}
              className="fixed inset-0 z-[10002]"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            />
            {/* Sheet */}
            <motion.div
              key="engine-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 0.9 }}
              className="fixed left-0 right-0 bottom-0 z-[10003] flex flex-col"
              style={{
                background: 'var(--ui-surface)',
                backdropFilter: 'var(--backdrop-glass)',
                WebkitBackdropFilter: 'var(--backdrop-glass)',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderTop: '1px solid var(--ui-border-sub)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
                color: 'var(--ui-text)',
                boxShadow: '0 -20px 60px rgba(0,0,0,0.25)',
              }}
            >
              {/* Sheet header */}
              <div className="flex items-center justify-between px-5 pt-3 pb-1">
                {/* Drag handle indicator */}
                <div className="flex-1 flex justify-center">
                  <div
                    className="rounded-full"
                    style={{
                      width: 36,
                      height: 4,
                      background: 'var(--ui-border-sub)',
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-2">
                <h3 className="text-[15px] font-semibold" style={{ color: 'var(--ui-text)' }}>
                  {t('mobile.chooseEngine')}
                </h3>
                <button
                  onClick={() => setShowPicker(false)}
                  aria-label={t('mobile.close')}
                  className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70 transition-opacity"
                  style={{
                    background: 'var(--ui-surface-sub)',
                    color: 'var(--ui-text)',
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Engine list */}
              <ul className="px-3 pb-3">
                {SEARCH_ENGINES.map((eng) => {
                  const isSelected = eng.id === engineId;
                  return (
                    <li key={eng.id}>
                      <button
                        onClick={() => chooseEngine(eng.id)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl active:opacity-70 transition-all"
                        style={{
                          background: isSelected ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
                          color: 'var(--ui-text)',
                        }}
                      >
                        <span
                          className="flex items-center justify-center rounded-full flex-shrink-0"
                          style={{
                            width: 34,
                            height: 34,
                            background: isSelected ? 'var(--color-primary)' : 'var(--ui-surface-sub)',
                            color: isSelected ? '#fff' : 'var(--ui-text)',
                            border: isSelected ? 'none' : '1px solid var(--ui-border-sub)',
                          }}
                        >
                          <EngineIcon engineId={eng.id} size={16} />
                        </span>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-[15px] font-medium truncate">{eng.name}</div>
                          {eng.id !== 'ai' ? (
                            <div
                              className="text-[11px] truncate"
                              style={{ color: 'var(--ui-text-muted)' }}
                            >
                              {new URL(eng.searchUrl.replace('{query}', '')).hostname}
                            </div>
                          ) : (
                            <div
                              className="text-[11px] truncate"
                              style={{ color: 'var(--ui-text-muted)' }}
                            >
                              {t('mobile.searchOrChat')}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <Check
                            size={16}
                            strokeWidth={2.75}
                            style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileSearchBar;
