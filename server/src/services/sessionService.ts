import pool from '../db/connection.js';
import { Session } from '../types/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function getUserSessions(userId: string): Promise<Session[]> {
  const [sessions] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC',
    [userId]
  );
  return sessions as Session[];
}

export async function getSessionById(sessionId: number, userId: string): Promise<Session | null> {
  const [sessions] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM sessions WHERE id = ? AND user_id = ?',
    [sessionId, userId]
  );
  return sessions.length > 0 ? (sessions[0] as Session) : null;
}

export async function createSession(userId: string, title?: string): Promise<Session> {
  const sessionTitle = title || 'New Conversation';
  
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO sessions (user_id, title) VALUES (?, ?)',
    [userId, sessionTitle]
  );

  const [sessions] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM sessions WHERE id = ?',
    [result.insertId]
  );

  return sessions[0] as Session;
}

export async function updateSession(
  sessionId: number,
  userId: string,
  title: string
): Promise<Session | null> {
  // 验证会话所有权
  const session = await getSessionById(sessionId, userId);
  if (!session) {
    return null;
  }

  await pool.query(
    'UPDATE sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, sessionId]
  );

  return getSessionById(sessionId, userId);
}

export async function deleteSession(sessionId: number, userId: string): Promise<boolean> {
  // 验证会话所有权
  const session = await getSessionById(sessionId, userId);
  if (!session) {
    return false;
  }

  await pool.query('DELETE FROM sessions WHERE id = ?', [sessionId]);
  return true;
}

