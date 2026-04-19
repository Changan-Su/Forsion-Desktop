import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home as HomeIcon,
  LayoutGrid,
  Store,
  Settings as SettingsIcon,
  Send,
  Plus,
  LogOut,
  User as UserIcon,
  Search as SearchIcon,
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
import { SettingsPanel } from './Settings/SettingsPanel';
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

  // Close chat when switching tabs away from home
  useEffect(() => {
    if (activeTab !== 'home') setIsChatOpen(false);
  }, [activeTab]);

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
        <div className="absolute top-[5%] right-[10%] w-[60%] h-[40%] bg-white opacity-[0.1] blur-[140px] rounded-full" />
        <div className="absolute top-[40%] left-[5%] w-[50%] h-[40%] bg-white opacity-[0.05] blur-[110px] rounded-full" />
        <div className="absolute bottom-[0%] right-[-5%] w-[70%] h-[50%] bg-black opacity-[0.1] blur-[120px] rounded-full" />
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
      <main
        className="relative flex-1 min-h-0 z-10"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }}
      >
        {activeTab === 'home' && (
          <MobileHome
            isAuthenticated={isAuthenticated}
            onOpenChat={() => setIsChatOpen(true)}
          />
        )}
        {activeTab === 'launchpad' && (
          <div className="absolute inset-0">
            <Launchpad onLaunch={handleLaunchApp} onLaunchForsionApp={handleLaunchForsionApp} />
          </div>
        )}
        {activeTab === 'market' && (
          <div className="absolute inset-0 overflow-y-auto">
            <ForsionDeskMarket />
          </div>
        )}
        {activeTab === 'settings' && (
          <div
            className="absolute inset-0 overflow-y-auto"
            style={{ background: 'var(--ui-surface)', backdropFilter: 'var(--backdrop-glass)' }}
          >
            <SettingsPanel currentTheme={theme} onThemeChange={onThemeChange} />
            {isAuthenticated && (
              <div className="p-4">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl"
                  style={{
                    background: 'var(--ui-surface-sub)',
                    border: '1px solid var(--ui-border-sub)',
                    color: 'var(--ui-text)',
                  }}
                >
                  <LogOut size={16} /> {t('user.logout')}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Full-screen chat overlay (only on home tab) ──────────────── */}
      <AnimatePresence>
        {isChatOpen && (
          <MobileChatOverlay
            isAuthenticated={isAuthenticated}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Bottom tab bar ───────────────────────────────────────────── */}
      <nav
        className="absolute left-0 right-0 bottom-0 z-20 flex items-stretch"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          borderTop: '1px solid var(--ui-border-sub)',
          background: 'var(--ui-surface)',
          backdropFilter: 'var(--backdrop-glass)',
          WebkitBackdropFilter: 'var(--backdrop-glass)',
        }}
      >
        <TabButton
          id="home"
          active={activeTab === 'home'}
          onClick={setActiveTab}
          icon={<HomeIcon size={20} />}
          label={t('mobile.tab.home')}
        />
        <TabButton
          id="launchpad"
          active={activeTab === 'launchpad'}
          onClick={setActiveTab}
          icon={<LayoutGrid size={20} />}
          label={t('mobile.tab.launchpad')}
        />
        <TabButton
          id="market"
          active={activeTab === 'market'}
          onClick={setActiveTab}
          icon={<Store size={20} />}
          label={t('mobile.tab.market')}
        />
        <TabButton
          id="settings"
          active={activeTab === 'settings'}
          onClick={setActiveTab}
          icon={<SettingsIcon size={20} />}
          label={t('mobile.tab.settings')}
        />
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
    className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5"
    style={{
      color: active ? 'var(--color-primary)' : 'var(--ui-text-muted)',
      transition: 'color 180ms var(--ease-apple)',
    }}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// MobileHome — 壁纸 + 标题卡片 + 内联搜索/聊天栏
// ─────────────────────────────────────────────────────────────────────────────

const MobileHome: React.FC<{
  isAuthenticated: boolean;
  onOpenChat: () => void;
}> = ({ isAuthenticated, onOpenChat }) => {
  const { t } = useI18n();
  const [layout, setLayout] = useState<WidgetLayoutData>(() => widgetLayoutService.getLayout());

  // Refresh layout if it changes in another tab (e.g. edited on PC then opened on phone)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'forsion-desk-widgets') setLayout(widgetLayoutService.getLayout());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const titleCards = layout.zones.title;

  return (
    <div className="absolute inset-0 flex flex-col items-center px-5">
      {/* Title zone cards — render directly via registry (no dnd, no edit) */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
        {titleCards.length === 0 ? (
          <div className="text-center opacity-60">
            <div className="text-2xl font-semibold text-surface-text">Forsion</div>
            <div className="text-xs text-surface-text opacity-70 mt-1">All You Need</div>
          </div>
        ) : (
          titleCards.map((placement) => (
            <MobileTitleCard key={placement.id} placement={placement} />
          ))
        )}
      </div>

      {/* Inline search/chat bar — tap to open chat overlay */}
      <button
        onClick={() => {
          if (!isAuthenticated) {
            redirectToLogin('desktop');
            return;
          }
          onOpenChat();
        }}
        className="w-full max-w-md mb-6 flex items-center gap-3 px-4 py-3.5 rounded-full text-left"
        style={{
          background: 'var(--ui-surface)',
          backdropFilter: 'var(--backdrop-glass)',
          WebkitBackdropFilter: 'var(--backdrop-glass)',
          border: '1px solid var(--ui-border-sub)',
          color: 'var(--ui-text)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <SearchIcon size={18} className="opacity-60 flex-shrink-0" />
        <span className="flex-1 text-sm opacity-60 truncate">
          {t('mobile.searchOrChat')}
        </span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
          style={{ background: 'var(--color-primary)' }}
        >
          <Sparkles size={14} />
        </div>
      </button>
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
  onClose: () => void;
}> = ({ isAuthenticated, onClose }) => {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
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
