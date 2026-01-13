/**
 * Client-side session storage service using IndexedDB
 * Replaces backend session management for Desktop app
 */

import type { Session, Message } from '../types/shared';

const DB_NAME = 'forsion_desktop_db';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const MESSAGES_STORE = 'messages';

let dbInstance: IDBDatabase | null = null;

// Initialize IndexedDB
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create sessions object store
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionsStore = db.createObjectStore(SESSIONS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        sessionsStore.createIndex('user_id', 'user_id', { unique: false });
        sessionsStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Create messages object store
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = db.createObjectStore(MESSAGES_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        messagesStore.createIndex('session_id', 'session_id', { unique: false });
        messagesStore.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
}

export class SessionStorageService {
  // Session operations
  static async getSessions(userId: number): Promise<Session[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const index = store.index('user_id');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const sessions = request.result.map((s: any) => ({
          ...s,
          created_at: s.created_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString(),
        }));
        // Sort by updated_at descending
        sessions.sort((a: Session, b: Session) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        resolve(sessions);
      };

      request.onerror = () => {
        reject(new Error('Failed to get sessions'));
      };
    });
  }

  static async getSession(sessionId: number, userId: number): Promise<Session | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(sessionId);

      request.onsuccess = () => {
        const session = request.result;
        if (!session || session.user_id !== userId) {
          resolve(null);
          return;
        }
        resolve({
          ...session,
          created_at: session.created_at || new Date().toISOString(),
          updated_at: session.updated_at || new Date().toISOString(),
        });
      };

      request.onerror = () => {
        reject(new Error('Failed to get session'));
      };
    });
  }

  static async createSession(userId: number, title: string = 'New Conversation'): Promise<Session> {
    const db = await getDB();
    const now = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      
      const session: Omit<Session, 'id'> = {
        user_id: userId,
        title,
        created_at: now,
        updated_at: now,
      };

      const request = store.add(session);

      request.onsuccess = () => {
        const newSession: Session = {
          id: request.result as number,
          ...session,
        };
        resolve(newSession);
      };

      request.onerror = () => {
        reject(new Error('Failed to create session'));
      };
    });
  }

  static async updateSession(sessionId: number, userId: number, title: string): Promise<Session | null> {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const getRequest = store.get(sessionId);

      getRequest.onsuccess = () => {
        const session = getRequest.result;
        if (!session || session.user_id !== userId) {
          resolve(null);
          return;
        }

        const updatedSession: Session = {
          ...session,
          title,
          updated_at: new Date().toISOString(),
        };

        const putRequest = store.put(updatedSession);
        putRequest.onsuccess = () => {
          resolve(updatedSession);
        };
        putRequest.onerror = () => {
          reject(new Error('Failed to update session'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get session for update'));
      };
    });
  }

  static async deleteSession(sessionId: number, userId: number): Promise<boolean> {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      // First verify ownership
      const readTransaction = db.transaction([SESSIONS_STORE], 'readonly');
      const readStore = readTransaction.objectStore(SESSIONS_STORE);
      const getRequest = readStore.get(sessionId);

      getRequest.onsuccess = () => {
        const session = getRequest.result;
        if (!session || session.user_id !== userId) {
          resolve(false);
          return;
        }

        // Delete session
        const deleteTransaction = db.transaction([SESSIONS_STORE], 'readwrite');
        const deleteStore = deleteTransaction.objectStore(SESSIONS_STORE);
        const deleteRequest = deleteStore.delete(sessionId);

        deleteRequest.onsuccess = () => {
          // Also delete all messages in this session
          const messagesTransaction = db.transaction([MESSAGES_STORE], 'readwrite');
          const messagesStore = messagesTransaction.objectStore(MESSAGES_STORE);
          const messagesIndex = messagesStore.index('session_id');
          const messagesRequest = messagesIndex.openCursor(IDBKeyRange.only(sessionId));

          messagesRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            } else {
              resolve(true);
            }
          };

          messagesRequest.onerror = () => {
            // Session deleted, but messages deletion failed - still resolve true
            resolve(true);
          };
        };

        deleteRequest.onerror = () => {
          reject(new Error('Failed to delete session'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to verify session ownership'));
      };
    });
  }

  // Message operations
  static async getMessages(sessionId: number, userId: number): Promise<Message[]> {
    const db = await getDB();
    
    // First verify session ownership
    const session = await this.getSession(sessionId, userId);
    if (!session) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MESSAGES_STORE], 'readonly');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('session_id');
      const request = index.getAll(sessionId);

      request.onsuccess = () => {
        const messages = request.result.map((m: any) => ({
          ...m,
          created_at: m.created_at || new Date().toISOString(),
        }));
        // Sort by created_at ascending
        messages.sort((a: Message, b: Message) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        resolve(messages);
      };

      request.onerror = () => {
        reject(new Error('Failed to get messages'));
      };
    });
  }

  static async saveMessage(
    sessionId: number,
    userId: number,
    role: 'user' | 'assistant',
    content: string,
    modelUsed?: string
  ): Promise<Message> {
    const db = await getDB();
    
    // Verify session ownership
    const session = await this.getSession(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Update session updated_at
    await this.updateSession(sessionId, userId, session.title);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);

      const message: Omit<Message, 'id'> = {
        session_id: sessionId,
        role,
        content,
        model_used: modelUsed,
        created_at: new Date().toISOString(),
      };

      const request = store.add(message);

      request.onsuccess = () => {
        const newMessage: Message = {
          id: request.result as number,
          ...message,
        };
        resolve(newMessage);
      };

      request.onerror = () => {
        reject(new Error('Failed to save message'));
      };
    });
  }

  static async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      const getRequest = store.get(messageId);

      getRequest.onsuccess = async () => {
        const message = getRequest.result;
        if (!message) {
          resolve(false);
          return;
        }

        // Verify session ownership
        const session = await this.getSession(message.session_id, userId);
        if (!session) {
          resolve(false);
          return;
        }

        const deleteRequest = store.delete(messageId);
        deleteRequest.onsuccess = () => {
          resolve(true);
        };
        deleteRequest.onerror = () => {
          reject(new Error('Failed to delete message'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get message'));
      };
    });
  }
}

export default SessionStorageService;








