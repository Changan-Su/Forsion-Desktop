import pool from '../db/connection.js';
import { UserSettings } from '../types/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const [settings] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [userId]
  );

  if (settings.length === 0) {
    // 如果不存在，创建默认设置
    return createDefaultSettings(userId);
  }

  return settings[0] as UserSettings;
}

export async function createDefaultSettings(userId: string): Promise<UserSettings> {
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  
  await pool.query<ResultSetHeader>(
    'INSERT INTO user_settings (id, user_id, preferred_model, theme, theme_preset) VALUES (?, ?, ?, ?, ?)',
    [id, userId, 'gemini-3-flash-preview', null, null]
  );

  const [settings] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM user_settings WHERE id = ?',
    [id]
  );

  return settings[0] as UserSettings;
}

export async function updateUserSettings(
  userId: string,
  updates: Partial<Pick<UserSettings, 'preferred_model' | 'theme_preferences'>>
): Promise<UserSettings> {
  const currentSettings = await getUserSettings(userId);
  
  if (!currentSettings) {
    throw new Error('User settings not found');
  }

  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (updates.preferred_model !== undefined) {
    updateFields.push('preferred_model = ?');
    updateValues.push(updates.preferred_model);
  }

  if (updates.theme_preferences !== undefined) {
    updateFields.push('theme_preferences = ?');
    updateValues.push(JSON.stringify(updates.theme_preferences));
  }

  if (updateFields.length === 0) {
    return currentSettings;
  }

  updateValues.push(userId);

  await pool.query(
    `UPDATE user_settings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
    updateValues
  );

  return getUserSettings(userId) as Promise<UserSettings>;
}

