import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home as HomeIcon,
  LayoutGrid,
  Store,
  Settings as SettingsIcon,
  Send,
  Plus,
  User as UserIcon,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import ChatService from '../services/chatService';
import ModelService from '../services/modelService';
import AuthService from '../services/authService';
import { redirectToLogin } from '../services/authRedirect';
import { useI18n } from '../services/i18nService';
import widgetLayoutService from '../services/widgetLayoutService';
import { deskCardRegistry } from '../plugins/DeskCardRegistry';
import type { ChatMessage, Session, AIModel } from '../types';
import type { WidgetLayoutData, WidgetPlacement } from '../plugins/types';
import Avatar from './Avatar';
import { ModeToggle } from './ModeToggle';
import { LocaleToggle } from './LocaleToggle';
import { Launchpad } from './Launchpad';
import { ForsionDeskMarket } from './ForsionDeskMarket';
import MobileSettings from './MobileSettings';
import MobileSearchBar from './MobileSearchBar';
import type { AppId, ForsionApp, Theme } from '../types';

type MobileTabId = 'home' | 'launchpad' | 'market' | 'settings';

interface MobileShellProps {
  isAuthenticated: boolean;
  currentUser: any;
  onLogout: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  focusBlur: boolean;
  vignetting: boolean;
}

/**
 * MobileShell — Forsion 移动端 UI 外壳
 *
 * 布局与 PC 端同构：壁纸 + 标题卡片 + 内联搜索/聊天栏 + 聚焦模糊。
 * 不使用多窗口，改为底部 Tab 栏：
 *
 *   1. Home      —— 壁纸 + CardZoneManager 的 title 区卡片（Greeting/Slogan/Time）
 *                   + 内联搜索/聊天栏。点击栏展开为全屏聊天（聚焦模糊背景）
 *   2. Launchpad —— 复用桌面 Launchpad 组件（应用网格）
 *   3. Market    —— 复用 ForsionDeskMarket
 *   4. Settings  —— 复用 SettingsPanel
 *
 * 所有业务逻辑（auth / chat / 存储 / 主题）全部走 services 层，与 PC 端共享。
 */
const MobileShell: React.FC<MobileShellProps> = ({
  isAuthenticated,
  currentUser,
  onLogout,
  theme,
  onThemeChange,
  focusBlur,
  vignetting,
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<MobileTabId>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialInput, setChatInitialInput] = useState<string>('');

  // Close chat when switching tabs away from home
  useEffect(() => {
    if (activeTab !== 'home') setIsChatOpen(false);
  }, [activeTab]);

  const openChatWith = useCallback((initial?: string) => {
    setChatInitialInput(initial || '');
    setIsChatOpen(true);
  }, []);

  // Focus blur fires when chat is open (mirrors PC `isDesktopFocused` logic)
  const isFocused = isChatOpen;

  const handleLaunchApp = useCallback((appId: AppId) => {
    // On mobile, all app launches route to appropriate tabs (no window manager)
    if (appId === 'forsion-desk-market') setActiveTab('market');
    else if (appId === 'settings') setActiveTab('settings');
    else if (appId === 'launchpad') setActiveTab('launchpad');
    // 'widgets' edit-mode doesn't apply on mobile
  }, []);

  const handleLaunchForsionApp = useCallback((app: ForsionApp) => {
    window.open(app.url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ color: 'var(--ui-text)' }}
    >
      {/* ── Wallpaper layer (same as PC App.tsx) ─────────────────────────── */}
      <div
        className={`absolute inset-0 z-0 bg-desktop-surface${focusBlur && isFocused ? ' wallpaper-focus-blur' : ''}`}
      >
        <div className="brush-stroke" />
        <div className="ambient-glow absolute top-[5%] right-[10%] w-[60%] h-[40%] bg-white opacity-[0.1] blur-[140px] rounded-full" />
        <div className="ambient-glow absolute top-[40%] left-[5%] w-[50%] h-[40%] bg-white opacity-[0.05] blur-[110px] rounded-full" />
        <div className="ambient-glow absolute bottom-[0%] right-[-5%] w-[70%] h-[50%] bg-black opacity-[0.1] blur-[120px] rounded-full" />
      </div>
      <div
        className={`bg-overlay${vignetting ? ' vignetting' : ''}${vignetting || (focusBlur && isFocused) ? ' show' : ''}${focusBlur && isFocused ? ' focus-lite' : ''}`}
      />

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header
        className="relative z-20 flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
      >
        <div className="flex items-center gap-2 min-w-0 pointer-events-auto">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'var(--color-primary)' }}
          >
            <Sparkles size={18} />
          </div>
          <div className="min-w-0 hidden xs:block">
            <div className="text-sm font-semibold truncate text-surface-text">Forsion</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <ModeToggle />
          <LocaleToggle />
          <button
            onClick={() => {
              if (isAuthenticated) {
                const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const token = AuthService.getToken();
                window.open(`${apiBaseUrl}/account?token=${token}`, '_blank', 'noopener,noreferrer');
              } else {
                redirectToLogin('desktop');
              }
            }}
            className="ml-1 flex-shrink-0 rounded-full overflow-hidden"
            style={{ width: 36, height: 36 }}
            aria-label={isAuthenticated ? t('user.center') : t('user.login')}
          >
            {isAuthenticated ? (
              <Avatar user={currentUser} size="md" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: 'var(--ui-surface-sub)',
                  border: '1px solid var(--ui-border-sub)',
                  color: 'var(--ui-text)',
                }}
              >
                <UserIcon size={18} />
              </div>
            )}
          </button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      {/* paddingBottom leaves room for the floating pill tab bar (its height + gap + safe-area) */}
      <main
        className="relative flex-1 min-h-0 z-10"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
      >
        {activeTab === 'home' && (
          <MobileHome
            isAuthenticated={isAuthenticated}
            onOpenChat={openChatWith}
          />
        )}
        {activeTab === 'launchpad' && (
          <div className="absolute inset-0">
            <Launchpad onLaunch={handleLaunchApp} onLaunchForsionApp={handleLaunchForsionApp} />
          </div>
        )}
        {activeTab === 'market' && (
          <div
            className="absolute inset-0 overflow-y-auto overscroll-contain"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
          >
            <ForsionDeskMarket />
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="absolute inset-0">
            <MobileSettings
              currentTheme={theme}
              onThemeChange={onThemeChange}
              isAuthenticated={isAuthenticated}
              onLogout={onLogout}
            />
          </div>
        )}
      </main>

      {/* ── Full-screen chat overlay (only on home tab) ──────────────── */}
      <AnimatePresence>
        {isChatOpen && (
          <MobileChatOverlay
            isAuthenticated={isAuthenticated}
            initialInput={chatInitialInput}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Bottom tab bar — floating pill ───────────────────────────── */}
      <nav
        className="absolute left-0 right-0 z-20 flex justify-center pointer-events-none"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
        }}
      >
        <div
          className="pointer-events-auto flex items-stretch gap-1 p-1.5 rounded-full"
          style={{
            background: 'var(--ui-surface)',
            backdropFilter: 'var(--backdrop-glass)',
            WebkitBackdropFilter: 'var(--backdrop-glass)',
            border: '1px solid var(--ui-border-sub)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.06) inset',
          }}
        >
          <TabButton
            id="home"
            active={activeTab === 'home'}
            onClick={setActiveTab}
            icon={<HomeIcon size={18} strokeWidth={2.25} />}
            label={t('mobile.tab.home')}
          />
          <TabButton
            id="launchpad"
            active={activeTab === 'launchpad'}
            onClick={setActiveTab}
            icon={<LayoutGrid size={18} strokeWidth={2.25} />}
            label={t('mobile.tab.launchpad')}
          />
          <TabButton
            id="market"
            active={activeTab === 'market'}
            onClick={setActiveTab}
            icon={<Store size={18} strokeWidth={2.25} />}
            label={t('mobile.tab.market')}
          />
          <TabButton
            id="settings"
            active={activeTab === 'settings'}
            onClick={setActiveTab}
            icon={<SettingsIcon size={18} strokeWidth={2.25} />}
            label={t('mobile.tab.settings')}
          />
        </div>
      </nav>
    </div>
  );
};

const TabButton: React.FC<{
  id: MobileTabId;
  active: boolean;
  onClick: (id: MobileTabId) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ id, active, onClick, icon, label }) => (
  <button
    onClick={() => onClick(id)}
    className="relative flex items-center gap-1.5 rounded-full transition-all duration-250 active:scale-95"
    style={{
      padding: active ? '8px 14px' : '8px 10px',
      color: active ? '#fff' : 'var(--ui-text-muted)',
      background: active ? 'var(--color-primary)' : 'transparent',
      transition: 'background-color 200ms var(--ease-apple), color 200ms var(--ease-apple), padding 200ms var(--ease-apple)',
    }}
  >
    {icon}
    {active && (
      <span
        className="text-[12px] font-semibold whitespace-nowrap"
        style={{ letterSpacing: '0.01em' }}
      >
        {label}
      </span>
    )}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// MobileHome — 壁纸 + 标题卡片 + 内联搜索/聊天栏
// ─────────────────────────────────────────────────────────────────────────────

const MobileHome: React.FC<{
  isAuthenticated: boolean;
  onOpenChat: (initialInput?: string) => void;
}> = ({ isAuthenticated, onOpenChat }) => {
  const { t } = useI18n();
  const [layout, setLayout] = useState<WidgetLayoutData>(() => widgetLayoutService.getLayout());
  const [now, setNow] = useState(() => new Date());

  // Tick the clock once a minute so the greeting + time stay current
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Refresh layout if it changes in another tab (e.g. edited on PC then opened on phone)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'forsion-desk-widgets') setLayout(widgetLayoutService.getLayout());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const titleCards = layout.zones.title;

  // Time-of-day greeting — single word that sets the mood
  const greetingKey = useMemo(() => {
    const h = now.getHours();
    if (h < 6) return 'mobile.greeting.night';
    if (h < 12) return 'mobile.greeting.morning';
    if (h < 18) return 'mobile.greeting.afternoon';
    return 'mobile.greeting.evening';
  }, [now]);

  const timeStr = useMemo(() => {
    return now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  }, [now]);

  // Weekday + date as a one-line subtitle (editorial tone)
  const dateStr = useMemo(() => {
    return now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }, [now]);

  const handleOpenChat = useCallback((initial?: string) => {
    if (!isAuthenticated) {
      redirectToLogin('desktop');
      return;
    }
    onOpenChat(initial);
  }, [isAuthenticated, onOpenChat]);

  return (
    <div className="relative h-full w-full flex flex-col items-center px-5">
      {/* ── Hero zone ──────────────────────────────────────────────── */}
      {/* Top spacer lets the hero sit roughly 18% from top — editorial breathing room */}
      <div className="h-[6vh] flex-shrink-0" />

      <div className="w-full max-w-md">
        {/* Greeting meta — small caps + time chip */}
        <div className="flex items-baseline justify-between">
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70"
            style={{ color: 'var(--ui-text)' }}
          >
            {t(greetingKey)}
          </div>
          <div
            className="text-[11px] font-mono tabular-nums opacity-60"
            style={{ color: 'var(--ui-text)' }}
          >
            {timeStr}
          </div>
        </div>

        {/* Cursive brand title — hero */}
        <h1
          className="font-cursive leading-[1.05] mt-3"
          style={{
            fontSize: 'clamp(44px, 12vw, 56px)',
            color: 'var(--ui-text)',
            textShadow: '0 2px 24px rgba(0,0,0,0.25)',
            fontWeight: 700,
          }}
        >
          Forsion is
          <br />
          All You Need
        </h1>

        {/* Date subtitle — quiet */}
        <div
          className="mt-3 text-[12px] opacity-55 capitalize"
          style={{ color: 'var(--ui-text)' }}
        >
          {dateStr}
        </div>
      </div>

      {/* ── Title-zone cards (if user has configured any on desktop) ──── */}
      {titleCards.length > 0 && (
        <div className="w-full max-w-md mt-8 space-y-3">
          {titleCards.map((placement) => (
            <MobileTitleCard key={placement.id} placement={placement} />
          ))}
        </div>
      )}

      {/* Flex spacer pushes the search bar toward the bottom */}
      <div className="flex-1" />

      {/* ── Search bar ───────────────────────────────────────────── */}
      {/* Real search input with engine switcher (default: Bing). Empty input
          + tap Sparkles → opens AI chat. Text + Enter → web search in new tab
          (or AI chat if engine = 'ai'). */}
      <div style={{ marginBottom: 8 }} className="w-full max-w-md">
        <MobileSearchBar onOpenChat={handleOpenChat} />
      </div>
    </div>
  );
};

// Render a single title-zone card from the registry.
// Skips dnd/edit wrappers — read-only rendering only.
const MobileTitleCard: React.FC<{ placement: WidgetPlacement }> = ({ placement }) => {
  const descriptor = deskCardRegistry.getDescriptor(placement.cardType);
  const Component = descriptor?.component;
  if (!Component) return null;
  return (
    <div className="max-w-full">
      <Component instanceId={placement.id} settings={placement.props} isEditing={false} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MobileChatOverlay — 全屏聊天（仅在 Home tab 点击搜索栏后弹出）
// ─────────────────────────────────────────────────────────────────────────────

const MobileChatOverlay: React.FC<{
  isAuthenticated: boolean;
  initialInput?: string;
  onClose: () => void;
}> = ({ isAuthenticated, initialInput, onClose }) => {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialInput || '');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load models + latest session on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const models = await ModelService.getAvailableModels();
        setAvailableModels(models);
        const settings = await ModelService.getUserSettings();
        setSelectedModel(settings?.preferred_model || models[0]?.id || '');
      } catch (err) {
        console.error('[MobileChat] model load failed', err);
      }

      try {
        const sessions = await ChatService.getSessions();
        if (sessions.length > 0) {
          const latest = sessions[0];
          setCurrentSession(latest);
          const msgs = await ChatService.getMessages(latest.id);
          setMessages(
            msgs.map(m => ({
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at as any).getTime() || Date.now(),
              id: m.id,
              model_used: m.model_used || undefined,
            }))
          );
        }
      } catch (err) {
        console.error('[MobileChat] session load failed', err);
      }
    })();
  }, [isAuthenticated]);

  // Auto-focus input on open
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(id);
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    if (!isAuthenticated) {
      redirectToLogin('desktop');
      return;
    }
    if (!selectedModel) {
      alert(t('chat.noModels'));
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    const placeholder: ChatMessage = { role: 'assistant', content: '', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg, placeholder]);
    setInput('');
    setIsLoading(true);

    try {
      await ChatService.sendMessageStream(
        { message: text, model: selectedModel, sessionId: currentSession?.id },
        (chunk) => {
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: last.content + chunk };
            }
            return next;
          });
        },
        async (sessionId) => {
          if (!currentSession || currentSession.id !== sessionId) {
            try {
              const session = await ChatService.getSession(sessionId);
              setCurrentSession(session);
            } catch {}
          }
          setIsLoading(false);
        },
        (errMsg) => {
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: `⚠️ ${errMsg}` };
            }
            return next;
          });
          setIsLoading(false);
        }
      );
    } catch (err: any) {
      console.error('[MobileChat] send failed', err);
      setIsLoading(false);
    }
  }, [input, isLoading, selectedModel, currentSession, isAuthenticated, t]);

  const handleNewChat = useCallback(async () => {
    if (!isAuthenticated) {
      redirectToLogin('desktop');
      return;
    }
    try {
      const session = await ChatService.createSession();
      setCurrentSession(session);
      setMessages([]);
    } catch (err) {
      console.error('[MobileChat] new session failed', err);
    }
  }, [isAuthenticated]);

  return (
    <motion.div
      className="fixed inset-0 z-[10001] flex flex-col"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        background: 'var(--ui-surface)',
        backdropFilter: 'var(--backdrop-glass)',
        WebkitBackdropFilter: 'var(--backdrop-glass)',
        color: 'var(--ui-text)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
          borderBottom: '1px solid var(--ui-border-sub)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
            style={{ background: 'var(--color-primary)' }}
          >
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">Forsion Studio AI</div>
            <div className="text-[10px] opacity-50 tracking-wide truncate">
              {currentSession?.title || t('chat.newConversation')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAuthenticated && availableModels.length > 0 && (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg max-w-[130px] truncate"
              style={{
                background: 'var(--ui-surface-sub)',
                border: '1px solid var(--ui-border-sub)',
                color: 'var(--ui-text)',
              }}
            >
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleNewChat}
            className="p-2 rounded-xl"
            style={{ color: 'var(--ui-text)', opacity: 0.7 }}
            aria-label={t('chat.newConversation')}
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{ color: 'var(--ui-text)', opacity: 0.7 }}
            aria-label="Close"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!isAuthenticated && (
          <div className="text-center opacity-60 text-sm py-8">
            <button
              onClick={() => redirectToLogin('desktop')}
              className="underline"
            >
              {t('user.login')}
            </button>
          </div>
        )}
        {isAuthenticated && messages.length === 0 && (
          <div className="text-center opacity-60 text-sm py-8">
            <Sparkles size={24} className="mx-auto mb-2" />
            {t('chat.placeholder')}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={m.id || i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words"
              style={{
                background: m.role === 'user' ? 'var(--color-primary)' : 'var(--ui-surface-sub)',
                color: m.role === 'user' ? '#fff' : 'var(--ui-text)',
                border: m.role === 'user' ? 'none' : '1px solid var(--ui-border-sub)',
              }}
            >
              {m.content || (isLoading && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div
        className="px-3 pt-2"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          borderTop: '1px solid var(--ui-border-sub)',
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('chat.placeholder')}
            rows={1}
            className="flex-1 resize-none text-sm px-4 py-2.5 rounded-2xl focus:outline-none"
            style={{
              background: 'var(--ui-surface-sub)',
              border: '1px solid var(--ui-border-sub)',
              color: 'var(--ui-text)',
              maxHeight: 120,
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"
            style={{ background: 'var(--color-primary)' }}
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileShell;
