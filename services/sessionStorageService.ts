/**
 * Session storage service using backend API
 * Uses /api/chat/sessions and /api/chat/sessions/:id/messages endpoints
 */

import apiService from './apiService';
import type { Session, Message } from '../types/shared';

const APP_ID = 'desktop';

export class SessionStorageService {
  static async getSessions(userId: string | number): Promise<Session[]> {
    const response = await apiService.get<{ sessions: Session[] }>(
      `/api/chat/sessions?app_id=${APP_ID}&limit=100`
    );
    return response.sessions || [];
  }

  static async getSession(sessionId: string, userId: string | number): Promise<Session | null> {
    const sessions = await this.getSessions(userId);
    return sessions.find(s => s.id === sessionId) || null;
  }

  static async createSession(userId: string | number, title: string = 'New Conversation'): Promise<Session> {
    const response = await apiService.post<{ id: string; success: boolean }>('/api/chat/sessions', {
      title,
      app_id: APP_ID,
    });

    const now = new Date().toISOString();
    return {
      id: response.id,
      user_id: String(userId),
      title,
      app_id: APP_ID,
      created_at: now,
      updated_at: now,
    };
  }

  static async updateSession(sessionId: string, userId: string | number, title: string): Promise<Session | null> {
    await apiService.post<{ id: string; success: boolean }>('/api/chat/sessions', {
      id: sessionId,
      title,
      app_id: APP_ID,
    });

    return {
      id: sessionId,
      user_id: String(userId),
      title,
      app_id: APP_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  static async deleteSession(sessionId: string, userId: string | number): Promise<boolean> {
    await apiService.delete(`/api/chat/sessions/${sessionId}`);
    return true;
  }

  static async getMessages(sessionId: string, userId: string | number): Promise<Message[]> {
    const response = await apiService.get<{ messages: any[] }>(
      `/api/chat/sessions/${sessionId}/messages?limit=200`
    );

    return (response.messages || []).map((m: any) => ({
      id: m.id,
      session_id: m.session_id,
      role: m.role,
      content: m.content || '',
      model_used: m.model_id,
      timestamp: m.timestamp,
      created_at: m.created_at || new Date(m.timestamp || Date.now()).toISOString(),
    }));
  }

  static async saveMessage(
    sessionId: string,
    userId: string | number,
    role: 'user' | 'assistant',
    content: string,
    modelUsed?: string
  ): Promise<Message> {
    const timestamp = Date.now();
    const response = await apiService.post<{ success: boolean; count: number }>(
      `/api/chat/sessions/${sessionId}/messages`,
      {
        role,
        content,
        timestamp,
        modelId: modelUsed,
      }
    );

    return {
      id: crypto.randomUUID(),
      session_id: sessionId,
      role,
      content,
      model_used: modelUsed,
      timestamp,
      created_at: new Date(timestamp).toISOString(),
    };
  }

  static async deleteMessage(messageId: string, userId: string | number): Promise<boolean> {
    // Backend doesn't have individual message delete endpoint
    // Messages are deleted when session is deleted
    return true;
  }
}

export default SessionStorageService;
