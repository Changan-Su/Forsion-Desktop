import pool from '../db/connection.js';
import { Message } from '../types/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getSessionById } from './sessionService.js';

export async function getSessionMessages(
  sessionId: number,
  userId: string
): Promise<Message[]> {
  // 验证会话所有权
  const session = await getSessionById(sessionId, userId);
  if (!session) {
    throw new Error('Session not found or access denied');
  }

  const [messages] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId]
  );

  return messages as Message[];
}

export async function createMessage(
  sessionId: number,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  modelUsed?: string
): Promise<Message> {
  // 验证会话所有权
  const session = await getSessionById(sessionId, userId);
  if (!session) {
    throw new Error('Session not found or access denied');
  }

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO messages (session_id, role, content, model_used) VALUES (?, ?, ?, ?)',
    [sessionId, role, content, modelUsed]
  );

  // 更新会话的updated_at时间
  await pool.query(
    'UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [sessionId]
  );

  const [messages] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM messages WHERE id = ?',
    [result.insertId]
  );

  return messages[0] as Message;
}

export async function deleteMessage(
  messageId: number,
  userId: string
): Promise<boolean> {
  // 通过JOIN验证用户是否拥有该消息
  const [messages] = await pool.query<RowDataPacket[]>(
    `SELECT m.* FROM messages m 
     JOIN sessions s ON m.session_id = s.id 
     WHERE m.id = ? AND s.user_id = ?`,
    [messageId, userId]
  );

  if (messages.length === 0) {
    return false;
  }

  await pool.query('DELETE FROM messages WHERE id = ?', [messageId]);
  return true;
}

export async function batchCreateMessages(
  sessionId: number,
  userId: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string; modelUsed?: string }>
): Promise<Message[]> {
  // 验证会话所有权
  const session = await getSessionById(sessionId, userId);
  if (!session) {
    throw new Error('Session not found or access denied');
  }

  const createdMessages: Message[] = [];

  for (const msg of messages) {
    const message = await createMessage(
      sessionId,
      userId,
      msg.role,
      msg.content,
      msg.modelUsed
    );
    createdMessages.push(message);
  }

  return createdMessages;
}

