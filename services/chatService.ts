import apiService from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export interface Session {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: number;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  sessionId: number;
  messageId: number;
}

export class ChatService {
  // 获取所有会话
  static async getSessions(): Promise<Session[]> {
    const response = await apiService.get<{ sessions: Session[] }>('/api/sessions');
    return response.sessions;
  }

  // 获取单个会话
  static async getSession(sessionId: number): Promise<Session> {
    const response = await apiService.get<{ session: Session }>(`/api/sessions/${sessionId}`);
    return response.session;
  }

  // 创建新会话
  static async createSession(title?: string): Promise<Session> {
    const response = await apiService.post<{ session: Session }>('/api/sessions', { title });
    return response.session;
  }

  // 更新会话标题
  static async updateSession(sessionId: number, title: string): Promise<Session> {
    const response = await apiService.put<{ session: Session }>(`/api/sessions/${sessionId}`, { title });
    return response.session;
  }

  // 删除会话
  static async deleteSession(sessionId: number): Promise<void> {
    await apiService.delete(`/api/sessions/${sessionId}`);
  }

  // 获取会话消息
  static async getMessages(sessionId: number): Promise<Message[]> {
    const response = await apiService.get<{ messages: Message[] }>(
      `/api/sessions/${sessionId}/messages`
    );
    return response.messages;
  }

  // 保存消息
  static async saveMessage(
    sessionId: number,
    role: 'user' | 'assistant',
    content: string,
    modelUsed?: string
  ): Promise<Message> {
    const response = await apiService.post<{ message: Message }>(
      `/api/sessions/${sessionId}/messages`,
      { role, content, modelUsed }
    );
    return response.message;
  }

  // 删除消息
  static async deleteMessage(messageId: number): Promise<void> {
    await apiService.delete(`/api/messages/${messageId}`);
  }

  // 发送聊天消息（非流式）
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiService.post<ChatResponse>('/api/chat', {
      ...request,
      stream: false
    });
    return response;
  }

  // 发送聊天消息（流式）
  static async sendMessageStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: (sessionId: number, messageId: number) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...request,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              onError(data.error);
              return;
            }
            
            if (data.done) {
              onComplete(data.sessionId, data.messageId);
              return;
            }
            
            if (data.chunk) {
              onChunk(data.chunk);
            }
          }
        }
      }
    } catch (error: any) {
      onError(error.message);
    }
  }
}

export default ChatService;

