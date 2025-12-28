import apiService from './apiService';
import type { Session, Message, ChatRequest, ChatResponse, OpenAIMessage, OpenAIChatRequest, OpenAIChatChunk } from '../types/shared';
import SessionStorageService from './sessionStorageService';
import AuthService from './authService';

// 如果 VITE_API_URL 为空，使用相对路径（通过 nginx 代理）
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '' 
  ? import.meta.env.VITE_API_URL 
  : (import.meta.env.DEV ? 'http://localhost:3001' : '');
const PROJECT_SOURCE = import.meta.env.VITE_PROJECT_SOURCE || 'desktop';

export type { Session, Message, ChatRequest, ChatResponse };

export class ChatService {
  private static getUserId(): number {
    const user = AuthService.getUser();
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  // 获取所有会话 (from IndexedDB)
  static async getSessions(): Promise<Session[]> {
    const userId = this.getUserId();
    return SessionStorageService.getSessions(userId);
  }

  // 获取单个会话 (from IndexedDB)
  static async getSession(sessionId: number): Promise<Session> {
    const userId = this.getUserId();
    const session = await SessionStorageService.getSession(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  }

  // 创建新会话 (to IndexedDB)
  static async createSession(title?: string): Promise<Session> {
    const userId = this.getUserId();
    return SessionStorageService.createSession(userId, title || 'New Conversation');
  }

  // 更新会话标题 (in IndexedDB)
  static async updateSession(sessionId: number, title: string): Promise<Session> {
    const userId = this.getUserId();
    const session = await SessionStorageService.updateSession(sessionId, userId, title);
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  }

  // 删除会话 (from IndexedDB)
  static async deleteSession(sessionId: number): Promise<void> {
    const userId = this.getUserId();
    await SessionStorageService.deleteSession(sessionId, userId);
  }

  // 获取会话消息 (from IndexedDB)
  static async getMessages(sessionId: number): Promise<Message[]> {
    const userId = this.getUserId();
    return SessionStorageService.getMessages(sessionId, userId);
  }

  // 保存消息 (to IndexedDB)
  static async saveMessage(
    sessionId: number,
    role: 'user' | 'assistant',
    content: string,
    modelUsed?: string
  ): Promise<Message> {
    const userId = this.getUserId();
    return SessionStorageService.saveMessage(sessionId, userId, role, content, modelUsed);
  }

  // 删除消息 (from IndexedDB)
  static async deleteMessage(messageId: number): Promise<void> {
    const userId = this.getUserId();
    await SessionStorageService.deleteMessage(messageId, userId);
  }

  // 发送聊天消息（非流式） - OpenAI format
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const userId = this.getUserId();
    const sessionId = request.sessionId;
    
    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await this.createSession();
      currentSessionId = newSession.id;
    }

    // Get conversation history
    const messages = await this.getMessages(currentSessionId);
    const openAIMessages: OpenAIMessage[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Add current user message
    openAIMessages.push({
      role: 'user',
      content: request.message,
    });

    // Prepare OpenAI-compatible request
    const openAIRequest: OpenAIChatRequest = {
      model_id: request.model || '',
      messages: openAIMessages,
      stream: false,
    };

    // Save user message to IndexedDB
    const userMessage = await this.saveMessage(currentSessionId, 'user', request.message);

    // Call Backend Service
    let response: {
      choices: Array<{ message: { role: string; content: string } }>;
      model: string;
      usage?: { total_tokens: number };
    };
    
    try {
      response = await apiService.post<{
        choices: Array<{ message: { role: string; content: string } }>;
        model: string;
        usage?: { total_tokens: number };
      }>('/api/chat/completions', openAIRequest);
    } catch (error: any) {
      // Handle credit insufficient error (402)
      if (error.status === 402) {
        throw new Error(`积分不足: ${error.message}`);
      }
      throw error;
    }

    // Extract assistant response
    const assistantContent = response.choices[0]?.message?.content || '';
    
    // Save assistant message
    const assistantMessage = await this.saveMessage(
      currentSessionId,
      'assistant',
      assistantContent,
      request.model
    );

    return {
      content: assistantContent,
      model: request.model || '',
      sessionId: currentSessionId,
      messageId: assistantMessage.id,
    };
  }

  // 发送聊天消息（流式） - OpenAI format
  static async sendMessageStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: (sessionId: number, messageId: number) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const userId = this.getUserId();
      const sessionId = request.sessionId;
      
      // Get or create session
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const newSession = await this.createSession();
        currentSessionId = newSession.id;
      }

      // Get conversation history
      const messages = await this.getMessages(currentSessionId);
      const openAIMessages: OpenAIMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Add current user message
      openAIMessages.push({
        role: 'user',
        content: request.message,
      });

      // Save user message to IndexedDB
      await this.saveMessage(currentSessionId, 'user', request.message);

      // Prepare OpenAI-compatible request
      const openAIRequest: OpenAIChatRequest = {
        model_id: request.model || '',
        messages: openAIMessages,
        stream: true,
      };

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Project-Source': PROJECT_SOURCE,
        },
        body: JSON.stringify(openAIRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // 处理积分不足错误 (402)
        if (response.status === 402) {
          const errorMsg = errorData.detail || 'Insufficient credits';
          onError(`积分不足: ${errorMsg}`);
          return;
        }
        
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            
            if (dataStr === '[DONE]') {
              // Save complete assistant message
              const assistantMessage = await this.saveMessage(
                currentSessionId,
                'assistant',
                fullResponse,
                request.model
              );
              onComplete(currentSessionId, assistantMessage.id);
              return;
            }

            try {
              const data: OpenAIChatChunk = JSON.parse(dataStr);
              
              if (data.error) {
                onError(data.error);
                return;
              }
              
              // Extract content from OpenAI format: choices[0].delta.content
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                onChunk(content);
              }
            } catch (parseError) {
              console.warn('[ChatService] Failed to parse SSE chunk:', dataStr);
            }
          }
        }
      }

      // If we exit the loop without [DONE], save what we have
      if (fullResponse) {
        const assistantMessage = await this.saveMessage(
          currentSessionId,
          'assistant',
          fullResponse,
          request.model
        );
        onComplete(currentSessionId, assistantMessage.id);
      }
    } catch (error: any) {
      onError(error.message || 'Unknown error');
    }
  }
}

export default ChatService;

