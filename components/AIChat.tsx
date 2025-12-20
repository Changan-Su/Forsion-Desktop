
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Command, ChevronDown } from 'lucide-react';
import { generateChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const response = await generateChatResponse(history, input);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }]);
    setIsLoading(false);
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
                      <span className="text-[10px] text-surface-text opacity-50 font-medium tracking-wide">INSPIRED BY ART</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 rounded-xl transition-colors text-slate-400 hover:text-slate-800"
                >
                  <ChevronDown size={20} />
                </button>
              </div>

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
