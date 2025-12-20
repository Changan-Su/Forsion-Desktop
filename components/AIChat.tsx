
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Command, ChevronDown, MessageSquare, Trash2, Plus } from 'lucide-react';
import { generateChatResponse } from '../services/geminiService';
import { ChatMessage, Session, AIModel } from '../types';
import ChatService from '../services/chatService';
import ModelService from '../services/modelService';
import AuthService from '../services/authService';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose }) => {
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // 加载会话消息
  const loadSession = async (sessionId: number) => {
    try {
      const sessionMessages = await ChatService.getMessages(sessionId);
      const session = await ChatService.getSession(sessionId);
      
      setCurrentSession(session);
      setMessages(sessionMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at).getTime(),
        id: m.id,
        model_used: m.model_used
      })));
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  // 初始化：检查认证状态并加载数据
  useEffect(() => {
    const init = async () => {
      try {
        const authenticated = AuthService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          try {
            // 加载会话列表
            const sessionsList = await ChatService.getSessions();
            setSessions(sessionsList);

            // 加载可用模型
            console.log('[AIChat] Starting to load models...');
            const models = await ModelService.getAvailableModels();
            console.log('[AIChat] Loaded models:', models);
            console.log('[AIChat] Models count:', models.length);
            if (models.length === 0) {
              console.warn('[AIChat] WARNING: No models loaded! Check API response and authentication.');
            }
            setAvailableModels(models);

            // 如果有模型，设置选中的模型
            if (models.length > 0) {
              // 加载用户设置
              try {
                const settings = await ModelService.getUserSettings();
                if (settings.preferred_model && models.find(m => m.id === settings.preferred_model)) {
                  setSelectedModel(settings.preferred_model);
                } else {
                  // 如果用户设置的模型不存在，使用第一个可用模型
                  setSelectedModel(models[0].id);
                }
              } catch (error) {
                // 如果获取设置失败，使用第一个可用模型
                setSelectedModel(models[0].id);
              }
            } else {
              // 没有可用模型
              setSelectedModel('');
            }

            // 如果有会话，加载最新的会话
            if (sessionsList.length > 0) {
              await loadSession(sessionsList[0].id);
            }
          } catch (error) {
            console.error('[AIChat] Failed to initialize authenticated features:', error);
            console.error('[AIChat] Error details:', error instanceof Error ? error.message : error);
            // 数据库连接失败，不设置默认模型
            setAvailableModels([]);
          }
        } else {
          // 未认证用户，不显示模型
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

  // 创建新会话
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

  // 删除会话
  const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // 如果未认证，使用原始的Gemini服务
    if (!isAuthenticated) {
      const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await generateChatResponse(history, input);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }]);
      setIsLoading(false);
      return;
    }

    // 认证用户：检查是否有可用模型
    if (!selectedModel || availableModels.length === 0) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '错误：没有可用的AI模型。请确保数据库连接正常且已配置模型。', 
        timestamp: Date.now() 
      }]);
      return;
    }

    // 认证用户：使用后端API
    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    try {
      // 使用流式响应
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
        // onChunk
        (chunk: string) => {
          assistantMsg.content += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { ...assistantMsg };
            return newMessages;
          });
        },
        // onComplete
        async (sessionId: number, messageId: number) => {
          setIsLoading(false);
          
          // 更新当前会话
          if (!currentSession) {
            const session = await ChatService.getSession(sessionId);
            setCurrentSession(session);
            setSessions(prev => [session, ...prev]);
          }
        },
        // onError
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

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none">
      <motion.div
        layout
        initial={false}
        animate={{ 
          height: isOpen ? 560 : 84,
          y: isOpen ? 0 : 180 
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-[680px] rounded-[32px] flex flex-col overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.2)] border border-white/40 pointer-events-auto glass-dark"
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
              <div className="p-5 bg-white/20 flex items-center justify-between border-b border-white/30">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-2xl bg-accent flex items-center justify-center text-white shadow-md">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-surface-text">Forsion Studio AI</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-accent opacity-60 rounded-full animate-pulse" />
                      <span className="text-[10px] text-surface-text opacity-50 font-medium tracking-wide">
                        {isAuthenticated ? (currentSession?.title || 'New Conversation') : 'INSPIRED BY ART'}
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
                            ? 'bg-gray-500/20 cursor-not-allowed opacity-50'
                            : 'bg-white/20 hover:bg-white/30'
                        }`}
                        title={availableModels.length === 0 ? 'No models available' : 'Select Model'}
                      >
                        {availableModels.length === 0
                          ? 'No Models Available'
                          : availableModels.find(m => m.id === selectedModel)?.name || 'Select Model'}
                      </button>
                      <button 
                        onClick={() => setShowSessions(!showSessions)}
                        className="p-2 hover:bg-black/5 rounded-xl transition-colors text-slate-400 hover:text-slate-800"
                        title="Sessions"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button 
                        onClick={createNewSession}
                        className="p-2 hover:bg-black/5 rounded-xl transition-colors text-slate-400 hover:text-slate-800"
                        title="New Chat"
                      >
                        <Plus size={18} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-black/5 rounded-xl transition-colors text-slate-400 hover:text-slate-800"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              </div>

              {/* Model Selector Dropdown */}
              {showModels && isAuthenticated && availableModels.length > 0 && (
                <div className="absolute top-16 right-24 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-2 z-50 min-w-[200px]">
                  {availableModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModels(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors ${
                        selectedModel === model.id 
                          ? 'bg-accent text-white' 
                          : 'hover:bg-black/5 text-surface-text'
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
                <div className="absolute top-16 right-16 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-2 z-50 min-w-[250px] max-h-[400px] overflow-y-auto">
                  {sessions.length === 0 ? (
                    <div className="px-4 py-6 text-center text-surface-text opacity-50 text-sm">
                      No conversations yet
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
                            : 'hover:bg-black/5 text-surface-text'
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
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-[22px] text-[15px] leading-relaxed shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-accent text-white rounded-tr-none font-medium' 
                        : 'bg-white/60 text-surface-text rounded-tl-none border border-white/50'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/40 p-4 rounded-[20px] rounded-tl-none flex space-x-1.5 items-center border border-white/50">
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
        <div className={`p-5 flex flex-col ${isOpen ? 'bg-white/10 border-t border-white/30' : ''}`}>
          <div className="relative group flex items-center">
            {!isOpen && (
              <div className="absolute left-5 text-accent pointer-events-none">
                <Sparkles size={18} />
              </div>
            )}
            <input
              autoFocus
              type="text"
              value={input}
              onFocus={() => { if(!isOpen) onClose(); }}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isOpen ? "What's on your mind?" : "Compose with AI... (⌘K)"}
              className={`w-full bg-white/40 border border-white/60 rounded-[24px] py-3.5 text-base text-surface-text focus:outline-none focus:border-accent/60 focus:bg-white/60 transition-all placeholder:opacity-30 ${!isOpen ? 'pl-12 pr-24' : 'pl-6 pr-14'}`}
            />
            
            <div className="absolute right-2 flex items-center space-x-2">
              {!isOpen && (
                <div className="hidden sm:flex items-center space-x-1 glass px-2 py-1 rounded-lg text-[10px] opacity-50 font-mono">
                  <Command size={10} />
                  <span>K</span>
                </div>
              )}
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-accent rounded-[16px] flex items-center justify-center text-white hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-md"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          
          {isOpen && (
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
    </div>
  );
};
