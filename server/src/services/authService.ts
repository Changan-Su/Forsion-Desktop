import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';
import { User, AuthRequest, AuthResponse } from '../types/index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

export async function registerUser(data: AuthRequest): Promise<AuthResponse> {
  const { username, password, email } = data;

  if (!username || !password || !email) {
    throw new Error('Username, password, and email are required');
  }

  // 检查用户是否已存在
  const [existingUsers] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [username, email]
  );

  if (existingUsers.length > 0) {
    throw new Error('Username or email already exists');
  }

  // 加密密码（使用 password 字段以兼容 AI Studio）
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // 创建用户（使用 password 字段以兼容 AI Studio 数据库结构）
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
    [username, password_hash, email, 'user']
  );

  const userId = result.insertId;

  // 创建默认用户设置
  await pool.query(
    'INSERT INTO user_settings (user_id, preferred_model) VALUES (?, ?)',
    [userId, 'gemini-3-flash-preview']
  );

  // 获取用户信息
  const [users] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );

  const user = users[0] as User;

  // 生成JWT token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { token, user };
}

export async function loginUser(data: AuthRequest): Promise<AuthResponse> {
  const { username, password } = data;

  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  // 查找用户
  const [users] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );

  if (users.length === 0) {
    throw new Error('Invalid username or password');
  }

  const user = users[0];

  // 验证密码（兼容 AI Studio 的 password 字段和 Desktop 的 password_hash 字段）
  const passwordHash = user.password || user.password_hash;
  if (!passwordHash) {
    throw new Error('Invalid username or password');
  }
  const isValid = await bcrypt.compare(password, passwordHash);

  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  // 生成JWT token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // 返回用户信息（不包含密码）
  const { password_hash, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword as User };
}

export async function getUserById(userId: string): Promise<User | null> {
  const [users] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );

  return users.length > 0 ? (users[0] as User) : null;
}

