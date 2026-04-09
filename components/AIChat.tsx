
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Command, ChevronDown, MessageSquare, Trash2, Plus, Search, Settings, Clock, X } from 'lucide-react';
import { ChatMessage, Session, AIModel } from '../types';
import ChatService from '../services/chatService';
import ModelService from '../services/modelService';
import AuthService from '../services/authService';
import SettingsStorageService from '../services/settingsStorageService';
import Avatar from './Avatar';
import { SEARCH_ENGINES, DEFAULT_SEARCH_ENGINE } from '../constants';
import type { SearchEngine } from '../constants';
import { fetchSuggestions } from '../services/searchService';
import { useI18n } from '../services/i18nService';

// --- Search engine SVG icons (Simple Icons official paths, single-color currentColor) ---
const EngineIcon: React.FC<{ engineId: string; size?: number }> = ({ engineId, size = 18 }) => {
  const s = size;
  const f = "currentColor";
  switch (engineId) {
    case 'baidu':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path fill={f} d="M9.154 0C7.71 0 6.54 1.658 6.54 3.707c0 2.051 1.171 3.71 2.615 3.71 1.446 0 2.614-1.659 2.614-3.71C11.768 1.658 10.6 0 9.154 0zm7.025.594C14.86.58 13.347 2.589 13.2 3.927c-.187 1.745.25 3.487 2.179 3.735 1.933.25 3.175-1.806 3.422-3.364.252-1.555-.995-3.364-2.362-3.674a1.218 1.218 0 0 0-.261-.03zM3.582 5.535a2.811 2.811 0 0 0-.156.008c-2.118.19-2.428 3.24-2.428 3.24-.287 1.41.686 4.425 3.297 3.864 2.617-.561 2.262-3.68 2.183-4.362-.125-1.018-1.292-2.773-2.896-2.75zm16.534 1.753c-2.308 0-2.617 2.119-2.617 3.616 0 1.43.121 3.425 2.988 3.362 2.867-.063 2.553-3.238 2.553-3.988 0-.745-.62-2.99-2.924-2.99zM12 11.632c-1.424.014-2.708.925-3.323 1.947-1.118 1.868-2.863 3.05-3.112 3.363-.25.309-3.61 2.116-2.864 5.42.746 3.301 3.365 3.237 3.365 3.237s1.93.19 4.171-.31c2.24-.495 4.17.123 4.17.123s5.233 1.748 6.665-1.616c1.43-3.364-.808-5.109-.808-5.109s-2.99-2.306-4.736-4.798c-1.072-1.665-2.348-2.268-3.528-2.257z"/></svg>;
    case 'bing':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path fill={f} d="M20.176 15.406a6.48 6.48 0 01-1.736 4.414c1.338-1.47.803-3.869-1.003-4.635-.862-.305-2.488-.85-3.367-1.158a1.834 1.834 0 01-.932-.818c-.381-.975-1.163-2.968-1.548-3.948-.095-.285-.31-.625-.265-.938.046-.598.724-1.003 1.276-.754l3.682 1.888c.621.292 1.305.692 1.796 1.172a6.486 6.486 0 012.097 4.777zm-1.44 1.888c-.264-1.194-1.135-1.744-2.216-2.028-1.527.902-4.853 2.878-6.952 4.13-1.103.68-2.13 1.35-2.919 1.242a2.866 2.866 0 01-2.77-2.325c-.012-.048-.008-.03-.001.01a6.4 6.4 0 00.947 2.653 6.498 6.498 0 005.486 3.022c1.908.062 3.536-1.153 5.099-2.096.292-.188.804-.496 1.332-.831l1.423-1.51c.553-.577.764-1.426.571-2.267zm-12.04 2.97c.422 0 .822-.1 1.173-.29.355-.215.964-.579 1.7-1.018L9.57 4.502c0-.99-.497-1.864-1.257-2.382-.08-.059-2.91-1.901-2.99-1.956-.605-.432-1.523.045-1.5.797v14.887l.417 2.36a2.488 2.488 0 002.455 2.056z"/></svg>;
    case 'google':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path fill={f} d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>;
    case 'yandex':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path fill={f} d="M1.902 16.349v-2.85L0 8.398h.957l1.4 3.938L3.97 7.573h.877l-2.069 5.96v2.815h-.876zm5.638 0h-.734c-.033-.125-.065-.3-.075-.447h-.057c-.246.313-.559.525-1.051.525-.798 0-1.344-.601-1.344-1.704 0-1.2.611-1.956 2.18-1.956h.123v-.333c0-.735-.246-1.048-.735-1.048-.445 0-.824.234-1.112.49l-.167-.766c.256-.213.766-.447 1.336-.447.99 0 1.533.424 1.533 1.781v2.636c0 .534.055 1.002.1 1.267l.003.002zm-.955-2.925h-.101c-1.08 0-1.313.479-1.313 1.2 0 .645.21 1.067.655 1.067.3 0 .601-.2.757-.445l.002-1.822zm2.802 2.925h-.869v-5.621h.869v.491h.056c.154-.21.578-.556 1.101-.556.732 0 1.121.412 1.121 1.268v4.418h-.878v-4.34c0-.423-.188-.57-.524-.57-.364 0-.675.279-.877.559v4.35l.001.001zm3.135-2.592c0-2.08.78-3.094 1.901-3.094.268 0 .545.09.713.211V8.398h.869v7.95h-.645l-.069-.445h-.055c-.245.312-.556.521-1.013.521-1.1 0-1.699-.933-1.699-2.667h-.002zm2.615-2.115c-.176-.176-.366-.266-.656-.266-.7 0-1.035 1.057-1.035 2.202 0 1.313.246 2.114.881 2.114.436 0 .666-.213.811-.435v-3.615zm3.604 4.785c-1.155 0-1.869-.924-1.869-2.647 0-1.804.501-3.116 1.69-3.116.935 0 1.544.701 1.544 2.604v.478h-2.331c0 1.268.355 1.935 1.045 1.935.489 0 .847-.222 1.068-.378l.2.667c-.354.278-.79.456-1.345.456l-.002.001zm-.957-3.394h1.435c0-.957-.155-1.657-.656-1.657-.532 0-.72.657-.78 1.657h.001zm6.095-2.292l-1.045 2.625L24 16.349h-.899l-.87-2.314-.844 2.313h-.855l1.166-2.904-1.057-2.702h.901l.727 2.035.765-2.036h.846z"/></svg>;
    case 'duckduckgo':
      return <svg width={s} height={s} viewBox="0 0 24 24"><path fill={f} d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 23C5.925 23 1 18.074 1 12S5.926 1 12 1s11 4.925 11 11-4.925 11-11 11zm10.219-11c0 4.805-3.317 8.833-7.786 9.925-.27-.521-.53-1.017-.749-1.438.645.249 1.93.718 2.208.615.376-.144.282-3.149-.14-3.245-.338-.075-1.632.837-2.141 1.209l.034.156c.078.397.144.993.03 1.247-.001.004-.002.01-.004.013a.218.218 0 0 1-.068.088c-.284.188-1.081.284-1.503.188a.516.516 0 0 1-.064-.02c-.694.396-2.01 1.109-2.25.971-.329-.188-.377-2.676-.329-3.288.035-.46 1.653.286 2.442.679.174-.163.602-.272.98-.31-.57-1.389-.99-2.977-.733-4.105 0 .002.002.002.002.002.356.248 2.73 1.05 3.91 1.027 1.18-.024 3.114-.743 2.903-1.323-.212-.58-2.135.51-4.142.324-1.486-.138-1.748-.804-1.42-1.29.414-.611 1.168.116 2.411-.256 1.245-.371 2.987-1.035 3.632-1.397 1.494-.833-.625-1.177-1.125-.947-.474.22-2.123.637-2.889.82.428-1.516-.603-4.149-1.757-5.3-.376-.376-.951-.612-1.603-.736-.25-.344-.654-.671-1.225-.977a5.772 5.772 0 0 0-3.595-.584l-.024.004-.034.004.004.002c-.148.028-.237.08-.357.098.148.016.705.276 1.057.418-.174.068-.412.108-.596.184a.828.828 0 0 0-.204.056c-.173.08-.303.375-.3.515.84-.086 2.082-.026 2.991.246-.644.09-1.235.258-1.661.482-.016.008-.03.018-.048.028-.054.02-.106.042-.152.066-1.367.72-1.971 2.405-1.611 4.424.323 1.824 1.665 8.088 2.29 11.064-3.973-1.4-6.822-5.186-6.822-9.639C1.781 6.356 6.356 1.781 12 1.781S22.219 6.356 22.219 12zM9.095 9.581a.758.758 0 1 0 0 1.516.758.758 0 0 0 0-1.516zm.338.702a.196.196 0 1 1 0-.392.196.196 0 0 1 0 .392zm4.724-1.043a.65.65 0 1 0 0 1.299.65.65 0 0 0 0-1.3zm.29.601a.168.168 0 1 1 0-.336.168.168 0 0 1 0 .336zM9.313 8.146s-.571-.26-1.125.09c-.554.348-.534.704-.534.704s-.294-.656.49-.978c.786-.32 1.17.184 1.17.184zm5.236-.052s-.41-.234-.73-.23c-.654.008-.831.296-.831.296s.11-.688.945-.55a.84.84 0 0 1 .616.484z"/></svg>;
    default:
      return <Sparkles size={s} />;
  }
};

const SEARCH_ENGINE_KEY = 'forsion_desktop_search_engine';
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

  // Search engine state
  const [searchMode, setSearchMode] = useState<string>(() => {
    return localStorage.getItem(SEARCH_ENGINE_KEY) || DEFAULT_SEARCH_ENGINE;
  });
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(getSearchHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engineDropdownRef = useRef<HTMLDivElement>(null);
  const suggestDropdownRef = useRef<HTMLDivElement>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
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

  // Notify App when search input is actively used (non-AI, non-open, has text or dropdowns visible)
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
        } else if (e.key === '6' || e.key.toLowerCase() === 'a') {
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

  const gpuStyle = gpuAcceleration ? {
    willChange: 'transform, opacity' as const,
    transform: 'translateZ(0)',
  } : {};

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
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
              autoFocus
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
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="glass-dark rounded-2xl shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.25)] p-2 min-w-[220px] pointer-events-auto text-surface-text"
            style={{
              position: 'fixed',
              bottom: dropdownPos.bottom,
              left: dropdownPos.left,
              zIndex: 10002,
            }}
          >
            {SEARCH_ENGINES.map((engine, idx) => (
              <motion.button
                key={engine.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
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
            ))}

            <div className="my-1 border-t border-surface-text/10" />

            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: SEARCH_ENGINES.length * 0.03 }}
              onClick={() => switchEngine('ai')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isAIMode
                  ? 'bg-accent text-white'
                  : 'hover:bg-surface-text/10 text-surface-text'
              }`}
            >
              <Sparkles size={16} />
              <span className="text-sm font-medium flex-1 text-left">{t('search.aiAssistant')}</span>
              <span className="text-xs opacity-50 font-mono">Alt+6</span>
            </motion.button>

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
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
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
                transition={{ delay: idx * 0.025, type: 'spring', stiffness: 500, damping: 30 }}
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
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
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
                transition={{ delay: idx * 0.02, type: 'spring', stiffness: 500, damping: 30 }}
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
