
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Shared motion transitions — exported as module-level constants so every
// render of AIChat reuses the same reference (framer-motion treats new objects
// as new transitions and re-schedules animations).
const CHAT_SPRING = { type: 'spring' as const, stiffness: 220, damping: 26, mass: 0.9 };
const DROPDOWN_SPRING = { type: 'spring' as const, stiffness: 280, damping: 26 };
// Staggered list items use a short tween (not spring) — keeps the "fan in"
// feel without the multi-frame overshoot a spring would introduce per item.
const LIST_ITEM_TWEEN = { duration: 0.16, ease: [0.22, 1, 0.36, 1] as const };
import { Send, Sparkles, Command, ChevronDown, MessageSquare, Trash2, Plus, Search, Settings, Clock, X } from 'lucide-react';
import { ChatMessage, Session, AIModel } from '../types';
import ChatService from '../services/chatService';
import ModelService from '../services/modelService';
import AuthService from '../services/authService';
import SettingsStorageService from '../services/settingsStorageService';
import Avatar from './Avatar';
import { SEARCH_ENGINES } from '../constants';
import type { SearchEngine } from '../constants';
import { fetchSuggestions } from '../services/searchService';
import { useI18n } from '../services/i18nService';
import { EngineIcon } from './EngineIcon';
import { SEARCH_ENGINE_KEY, getPreferredEngineId } from '../services/searchEngineService';

const SEARCH_HISTORY_KEY = 'forsion_desktop_search_history';
const SEARCH_HISTORY_MAX = 10;

function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addSearchHistory(query: string): string[] {
  const q = query.trim();
  if (!q) return getSearchHistory();
  let history = getSearchHistory().filter(h => h !== q);
  history.unshift(q);
  if (history.length > SEARCH_HISTORY_MAX) history = history.slice(0, SEARCH_HISTORY_MAX);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  return history;
}

function removeSearchHistoryItem(query: string): string[] {
  const history = getSearchHistory().filter(h => h !== query);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  return history;
}

function clearSearchHistory(): string[] {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
  return [];
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  hasAppOpen?: boolean;
}

export const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, hasAppOpen = false }) => {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your Forsion Assistant. How can I help you navigate these waters today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showSessions, setShowSessions] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gpuAcceleration, setGpuAcceleration] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Search engine state — initialized from shared helper so PC and mobile agree
  const [searchMode, setSearchMode] = useState<string>(() => getPreferredEngineId());
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(getSearchHistory);
  const [showHistory, setShowHistory] = useState(false);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engineDropdownRef = useRef<HTMLDivElement>(null);
  const suggestDropdownRef = useRef<HTMLDivElement>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ bottom: number; left: number; width: number } | null>(null);

  const isAIMode = searchMode === 'ai';
  const currentEngine = SEARCH_ENGINES.find(e => e.id === searchMode);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Load GPU acceleration setting
  useEffect(() => {
    const gpuEnabled = SettingsStorageService.getGPUAcceleration();
    setGpuAcceleration(gpuEnabled);

    const handleStorageChange = () => {
      setGpuAcceleration(SettingsStorageService.getGPUAcceleration());
    };
    const handleGPUChange = (e: CustomEvent) => {
      setGpuAcceleration(e.detail.enabled);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gpu-acceleration-changed', handleGPUChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gpu-acceleration-changed', handleGPUChange as EventListener);
    };
  }, []);

  const [layoutConfig, setLayoutConfig] = useState({ x: 0, width: 680 });

  useEffect(() => {
    const updateLayout = () => {
      if (hasAppOpen) {
        const screenWidth = window.innerWidth;
        const targetX = (screenWidth * 0.25) + 170;
        const targetWidth = Math.min((screenWidth * 0.5) - 380, 500);
        setLayoutConfig({ x: targetX, width: Math.max(targetWidth, 300) });
      } else {
        setLayoutConfig({ x: 0, width: 680 });
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [hasAppOpen, isOpen]);

  // Listen for search engine changes from Settings
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail?.engineId) setSearchMode(e.detail.engineId);
    };
    window.addEventListener('search-engine-changed', handler as EventListener);
    return () => window.removeEventListener('search-engine-changed', handler as EventListener);
  }, []);

  // Listen for shortcut-triggered focus
  useEffect(() => {
    const handler = () => {
      searchInputRef.current?.focus();
    };
    window.addEventListener('shortcut-focus-search', handler);
    return () => window.removeEventListener('shortcut-focus-search', handler);
  }, []);

  // Notify App when the search input enters/leaves the focused state so the
  // wallpaper can apply the focus-blur overlay. Intentionally NOT auto-focused
  // on mount — page load should stay unblurred until the user actively
  // interacts with the search box.
  const [inputFocused, setInputFocused] = useState(false);
  const isSearchActive = !isAIMode && !isOpen && inputFocused;
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('search-focus-changed', { detail: { focused: isSearchActive } }));
  }, [isSearchActive]);

  // Load session messages
  const loadSession = async (sessionId: string) => {
    try {
      const sessionMessages = await ChatService.getMessages(sessionId);
      const session = await ChatService.getSession(sessionId);

      setCurrentSession(session);
      setMessages(sessionMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp || new Date(m.created_at).getTime(),
        id: m.id,
        model_used: m.model_used
      })));
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        const authenticated = AuthService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          try {
            ModelService.clearCache();
            const sessionsList = await ChatService.getSessions();
            setSessions(sessionsList);

            const models = await ModelService.getAvailableModels(true);
            setAvailableModels(models);

            if (models.length > 0) {
              try {
                const settings = await ModelService.getUserSettings();
                if (settings.preferred_model && models.find(m => m.id === settings.preferred_model)) {
                  setSelectedModel(settings.preferred_model);
                } else {
                  setSelectedModel(models[0].id);
                }
              } catch (error) {
                setSelectedModel(models[0].id);
              }
            } else {
              setSelectedModel('');
            }

            if (sessionsList.length > 0) {
              await loadSession(sessionsList[0].id);
            }
          } catch (error) {
            console.error('[AIChat] Failed to initialize authenticated features:', error);
            setAvailableModels([]);
          }
        } else {
          setAvailableModels([]);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    if (isOpen) {
      init();
    }
  }, [isOpen]);

  // Create new session
  const createNewSession = async () => {
    try {
      const newSession = await ChatService.createSession('New Conversation');
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([
        { role: 'assistant', content: "Hello! I'm your Forsion Assistant. How can I help you navigate these waters today?", timestamp: Date.now() }
      ]);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ChatService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([
          { role: 'assistant', content: "Hello! I'm your Forsion Assistant. How can I help you navigate these waters today?", timestamp: Date.now() }
        ]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // Send AI message
  const handleSendAI = async () => {
    if (!input.trim() || isLoading) return;

    if (!isAuthenticated) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '请先登录以使用AI聊天功能。点击右上角的用户图标进行登录。',
        timestamp: Date.now()
      }]);
      return;
    }

    if (!selectedModel || availableModels.length === 0) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '错误：没有可用的AI模型。请确保数据库连接正常且已配置模型。',
        timestamp: Date.now()
      }]);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    try {
      let assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);

      await ChatService.sendMessageStream(
        {
          message: messageText,
          sessionId: currentSession?.id,
          model: selectedModel,
          stream: true
        },
        (chunk: string) => {
          assistantMsg.content += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...assistantMsg };
            return newMessages;
          });
        },
        async (sessionId: string, messageId: string) => {
          setIsLoading(false);
          if (!currentSession) {
            const session = await ChatService.getSession(sessionId);
            setCurrentSession(session);
            setSessions(prev => [session, ...prev]);
          }
        },
        (error: string) => {
          console.error('Stream error:', error);
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: `Error: ${error}`, timestamp: Date.now() }
          ]);
          setIsLoading(false);
        }
      );
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: `Error: ${error.message}`, timestamp: Date.now() }
      ]);
      setIsLoading(false);
    }
  };

  // Perform web search
  const performSearch = useCallback((query: string) => {
    if (!query.trim() || !currentEngine) return;
    setSearchHistory(addSearchHistory(query));
    setShowHistory(false);
    const url = currentEngine.searchUrl.replace('{query}', encodeURIComponent(query.trim()));
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [currentEngine]);

  // Handle Enter key
  const handleSubmit = () => {
    if (!input.trim()) return;
    setShowSuggestions(false);
    setSuggestions([]);

    if (isAIMode) {
      if (!isOpen) {
        // In AI mode collapsed state: open chat
        onClose();
      } else {
        handleSendAI();
      }
    } else {
      performSearch(input);
      setInput('');
    }
  };

  // Change search engine
  const switchEngine = useCallback((engineId: string) => {
    setSearchMode(engineId);
    localStorage.setItem(SEARCH_ENGINE_KEY, engineId);
    setShowEngineDropdown(false);
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);

    if (!input.trim() || isAIMode || isOpen) {
      setSuggestions([]);
      setShowSuggestions(false);
      if (!input.trim() && !isAIMode && !isOpen && searchHistory.length > 0) setShowHistory(true);
      return;
    }
    setShowHistory(false);

    const engine = currentEngine;
    if (!engine?.suggestEngine) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    suggestTimerRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(input.trim(), engine.suggestEngine!);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedSuggestionIdx(-1);
    }, 300);

    return () => {
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    };
  }, [input, searchMode, isOpen, isAIMode, currentEngine]);

  // Keyboard shortcuts: Alt+1~5 for engines, Alt+6 for AI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const engines = SEARCH_ENGINES;
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < engines.length) {
          e.preventDefault();
          switchEngine(engines[idx].id);
        } else if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          switchEngine('ai');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchEngine]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (engineDropdownRef.current && !engineDropdownRef.current.contains(e.target as Node)) {
        setShowEngineDropdown(false);
      }
      if (suggestDropdownRef.current && !suggestDropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Track input bar position for dropdown placement
  useEffect(() => {
    const updatePos = () => {
      if (inputBarRef.current) {
        const rect = inputBarRef.current.getBoundingClientRect();
        setDropdownPos({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };
    updatePos();
    // Recompute on resize and when layout changes
    window.addEventListener('resize', updatePos);
    const interval = setInterval(updatePos, 200); // catch spring animation settling
    return () => { window.removeEventListener('resize', updatePos); clearInterval(interval); };
  }, [isOpen, hasAppOpen, layoutConfig]);

  const gpuStyle = useMemo<React.CSSProperties>(
    () => (gpuAcceleration ? { willChange: 'transform, opacity', transform: 'translateZ(0)' } : {}),
    [gpuAcceleration]
  );

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none">
      <motion.div
        layout
        initial={false}
        animate={{
          height: isOpen ? 560 : 84,
          y: isOpen ? 0 : 180,
          x: layoutConfig.x,
          width: layoutConfig.width,
          scale: hasAppOpen && !isOpen ? 0.9 : 1
        }}
        transition={CHAT_SPRING}
        className="w-full max-w-[680px] rounded-[32px] flex flex-col overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.2)] pointer-events-auto glass-dark text-surface-text"
        data-gpu-accelerated={gpuAcceleration ? 'true' : undefined}
        style={gpuStyle}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Header */}
              <div className="p-5 bg-surface-text/5 flex items-center justify-between border-b border-surface-text/10">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-2xl bg-accent flex items-center justify-center text-white shadow-md">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-surface-text">Forsion Studio AI</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-accent opacity-60 rounded-full animate-pulse" />
                      <span className="text-[10px] text-surface-text opacity-50 font-medium tracking-wide">
                        {isAuthenticated ? (currentSession?.title || t('chat.newConversation')) : 'INSPIRED BY ART'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAuthenticated && (
                    <>
                      <button
                        onClick={() => availableModels.length > 0 && setShowModels(!showModels)}
                        disabled={availableModels.length === 0}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors text-surface-text ${
                          availableModels.length === 0
                            ? 'bg-surface-text/20 cursor-not-allowed opacity-50'
                            : 'bg-surface-text/10 hover:bg-surface-text/15'
                        }`}
                        title={availableModels.length === 0 ? t('chat.noModels') : t('chat.selectModel')}
                      >
                        {availableModels.length === 0
                          ? t('chat.noModels')
                          : availableModels.find(m => m.id === selectedModel)?.name || t('chat.selectModel')}
                      </button>
                      <button
                        onClick={() => setShowSessions(!showSessions)}
                        className="p-2 hover:bg-surface-text/10 rounded-xl transition-colors text-surface-text/50 hover:text-surface-text"
                        title="Sessions"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button
                        onClick={createNewSession}
                        className="p-2 hover:bg-surface-text/10 rounded-xl transition-colors text-surface-text/50 hover:text-surface-text"
                        title="New Chat"
                      >
                        <Plus size={18} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-surface-text/10 rounded-xl transition-colors text-surface-text/50 hover:text-surface-text"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              </div>

              {/* Model Selector Dropdown */}
              {showModels && isAuthenticated && availableModels.length > 0 && (
                <div className="absolute top-16 right-24 glass-dark rounded-2xl shadow-xl p-2 z-50 min-w-[200px] text-surface-text">
                  {availableModels.map(model => (
                    <button
                      key={model.id}
                      onClick={async () => {
                        setSelectedModel(model.id);
                        setShowModels(false);
                        try {
                          await ModelService.setPreferredModel(model.id);
                        } catch (error) {
                          console.error('[AIChat] Failed to save preferred model:', error);
                        }
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors ${
                        selectedModel === model.id
                          ? 'bg-accent text-white'
                          : 'hover:bg-surface-text/10 text-surface-text'
                      }`}
                    >
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs opacity-60">{model.provider}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Sessions Dropdown */}
              {showSessions && isAuthenticated && (
                <div className="absolute top-16 right-16 glass-dark rounded-2xl shadow-xl p-2 z-50 min-w-[250px] max-h-[400px] overflow-y-auto text-surface-text">
                  {sessions.length === 0 ? (
                    <div className="px-4 py-6 text-center text-surface-text opacity-50 text-sm">
                      {t('chat.noConversations')}
                    </div>
                  ) : (
                    sessions.map(session => (
                      <div
                        key={session.id}
                        onClick={() => {
                          loadSession(session.id);
                          setShowSessions(false);
                        }}
                        className={`group flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-colors ${
                          currentSession?.id === session.id
                            ? 'bg-accent text-white'
                            : 'hover:bg-surface-text/10 text-surface-text'
                        }`}
                      >
                        <div className="flex-1 truncate">
                          <div className="font-medium text-sm truncate">{session.title}</div>
                          <div className="text-xs opacity-60">
                            {new Date(session.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((m, i) => (
                  <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Sparkles size={16} className="text-white" />
                      </div>
                    )}

                    <div className={`max-w-[85%] p-4 rounded-[22px] text-[15px] leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'bg-accent text-white rounded-tr-none font-medium'
                        : 'bg-surface-text/10 text-surface-text rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>

                    {m.role === 'user' && (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Avatar user={AuthService.getUser()} size="sm" />
                        <span className="text-xs text-surface-text opacity-50">
                          {AuthService.getUser()?.nickname || AuthService.getUser()?.username || '用户'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start items-start gap-3">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <div className="bg-surface-text/10 p-4 rounded-[20px] rounded-tl-none flex space-x-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-accent opacity-60 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-accent opacity-60 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-accent opacity-60 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar */}
        <div ref={inputBarRef} className={isOpen ? 'p-5 flex flex-col bg-surface-text/5 border-t border-surface-text/10' : 'flex-1 flex items-center px-5'}>
          <div className="relative group flex items-center w-full">
            {/* Left icon: search engine selector (collapsed) or nothing (open AI chat) */}
            {!isOpen && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowEngineDropdown(!showEngineDropdown); setShowSuggestions(false); setShowHistory(false); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-surface-text/60 hover:text-surface-text hover:bg-surface-text/10 hover:scale-110 active:scale-95 transition-all duration-150"
                title={isAIMode ? t('search.aiAssistant') : currentEngine?.name}
              >
                {isAIMode ? <Sparkles size={18} /> : <EngineIcon engineId={searchMode} size={18} />}
              </button>
            )}

            <input
              ref={searchInputRef}
              type="text"
              value={input}
              onFocus={() => {
                if (!isOpen && isAIMode) onClose();
                if (!isOpen && !isAIMode && !input.trim() && searchHistory.length > 0) setShowHistory(true);
                setInputFocused(true);
              }}
              onBlur={() => setInputFocused(false)}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (selectedSuggestionIdx >= 0 && suggestions[selectedSuggestionIdx]) {
                    performSearch(suggestions[selectedSuggestionIdx]);
                    setInput('');
                    setShowSuggestions(false);
                  } else {
                    handleSubmit();
                  }
                } else if (e.key === 'ArrowDown' && showSuggestions) {
                  e.preventDefault();
                  setSelectedSuggestionIdx(prev => Math.min(prev + 1, suggestions.length - 1));
                } else if (e.key === 'ArrowUp' && showSuggestions) {
                  e.preventDefault();
                  setSelectedSuggestionIdx(prev => Math.max(prev - 1, -1));
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setShowEngineDropdown(false);
                  setShowHistory(false);
                }
              }}
              placeholder={
                isOpen
                  ? t('chat.placeholder')
                  : isAIMode
                    ? t('chat.compose')
                    : t('search.placeholder')
              }
              className={`w-full rounded-[24px] py-3.5 text-base text-surface-text focus:outline-none placeholder:text-surface-text/30 ${!isOpen ? 'pl-14 pr-14' : 'pl-6 pr-14'}`}
              style={{
                background: 'var(--glass-surface)',
                backdropFilter: 'var(--backdrop-glass)',
                WebkitBackdropFilter: 'var(--backdrop-glass)',
                border: '1px solid var(--ui-border-sub)',
                transition: 'padding var(--dur-fast) var(--ease-apple)',
              }}
            />

            <div className="absolute right-2 flex items-center space-x-2">
              {!isOpen && !isAIMode && (
                <div className="hidden sm:flex items-center space-x-1 glass px-2 py-1 rounded-lg text-[10px] opacity-40 font-mono">
                  <span>{currentEngine?.name}</span>
                </div>
              )}
              {!isOpen && isAIMode && (
                <div className="hidden sm:flex items-center space-x-1 glass px-2 py-1 rounded-lg text-[10px] opacity-50 font-mono">
                  <Command size={10} />
                  <span>K</span>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-accent rounded-[16px] flex items-center justify-center text-white hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-md"
              >
                {isAIMode ? <Send size={16} /> : <Search size={16} />}
              </button>
            </div>
          </div>

          {isOpen && isAIMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex justify-center space-x-6"
            >
               {['/style', '/color', '/sea', '/draft'].map(cmd => (
                 <button key={cmd} className="text-[11px] font-bold opacity-40 hover:text-accent hover:opacity-100 transition-all tracking-widest uppercase">{cmd}</button>
               ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ===== Dropdowns rendered OUTSIDE overflow-hidden container, above the search bar ===== */}

      {/* Engine selector dropdown — pops up above input */}
      <AnimatePresence>
        {!isOpen && showEngineDropdown && dropdownPos && (
          <motion.div
            ref={engineDropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={DROPDOWN_SPRING}
            className="glass-dark rounded-2xl shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.25)] p-2 min-w-[220px] pointer-events-auto text-surface-text"
            style={{
              position: 'fixed',
              bottom: dropdownPos.bottom,
              left: dropdownPos.left,
              zIndex: 10002,
            }}
          >
            {SEARCH_ENGINES.map((engine, idx) => (
              <React.Fragment key={engine.id}>
                {engine.id === 'ai' && <div className="my-1 border-t border-surface-text/10" />}
                <motion.button
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...LIST_ITEM_TWEEN, delay: idx * 0.025 }}
                  onClick={() => switchEngine(engine.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    searchMode === engine.id
                      ? 'bg-accent text-white'
                      : 'hover:bg-surface-text/10 text-surface-text'
                  }`}
                >
                  <EngineIcon engineId={engine.id} size={16} />
                  <span className="text-sm font-medium flex-1 text-left">{engine.name}</span>
                  <span className="text-xs opacity-50 font-mono">Alt+{engine.shortcutKey}</span>
                </motion.button>
              </React.Fragment>
            ))}

            <div className="my-1 border-t border-surface-text/10" />

            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-text/10 text-surface-text/50 transition-colors"
              onClick={() => setShowEngineDropdown(false)}
            >
              <Settings size={14} />
              <span className="text-xs">{t('search.enginePrefs')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search suggestions dropdown — pops up above input */}
      <AnimatePresence>
        {!isOpen && showSuggestions && suggestions.length > 0 && !isAIMode && dropdownPos && (
          <motion.div
            ref={suggestDropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={DROPDOWN_SPRING}
            className="glass-dark rounded-2xl shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.25)] p-2 max-h-[400px] overflow-y-auto scrollbar-hide pointer-events-auto text-surface-text"
            style={{
              position: 'fixed',
              bottom: dropdownPos.bottom,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 10002,
            }}
          >
            {suggestions.map((suggestion, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...LIST_ITEM_TWEEN, delay: idx * 0.02 }}
                onClick={() => {
                  performSearch(suggestion);
                  setInput('');
                  setShowSuggestions(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors ${
                  idx === selectedSuggestionIdx
                    ? 'bg-surface-text/15 text-surface-text'
                    : 'hover:bg-surface-text/10 text-surface-text/80'
                }`}
              >
                <Search size={14} className="opacity-40 flex-shrink-0" />
                <span className="text-sm truncate">{suggestion}</span>
                {idx === 0 && (
                  <span className="ml-auto text-[10px] opacity-30 font-mono flex-shrink-0">Enter</span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search history dropdown — shows when input is empty and focused */}
      <AnimatePresence>
        {!isOpen && showHistory && !showSuggestions && !isAIMode && searchHistory.length > 0 && dropdownPos && (
          <motion.div
            ref={historyDropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={DROPDOWN_SPRING}
            className="glass-dark rounded-2xl shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.25)] p-2 max-h-[400px] overflow-y-auto scrollbar-hide pointer-events-auto text-surface-text"
            style={{
              position: 'fixed',
              bottom: dropdownPos.bottom,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 10002,
            }}
          >
            <div className="flex items-center justify-between px-3 py-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-text/40">{t('search.history')}</span>
              <button
                onClick={() => { setSearchHistory(clearSearchHistory()); setShowHistory(false); }}
                className="text-[10px] text-surface-text/40 hover:text-accent transition-colors"
              >
                {t('search.clearHistory')}
              </button>
            </div>
            {searchHistory.map((item, idx) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...LIST_ITEM_TWEEN, delay: idx * 0.02 }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors hover:bg-surface-text/10 text-surface-text/80 group"
              >
                <Clock size={14} className="opacity-30 flex-shrink-0" />
                <button
                  className="flex-1 text-sm truncate text-left"
                  onClick={() => { performSearch(item); setInput(''); }}
                >
                  {item}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSearchHistory(removeSearchHistoryItem(item)); }}
                  className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity flex-shrink-0"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
