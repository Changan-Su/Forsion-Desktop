import { pool } from '../db/connection.js';

export interface UserCredits {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'initial' | 'usage' | 'refund' | 'bonus' | 'adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
  createdAt: Date;
}

/**
 * 确保用户有积分账户，如果不存在则创建
 */
export async function ensureCreditAccount(userId: string): Promise<UserCredits> {
  try {
    // 检查账户是否存在
    const [existing] = await pool.query(
      'SELECT * FROM user_credits WHERE user_id = ?',
      [userId]
    );

    if ((existing as any[]).length > 0) {
      const row = (existing as any[])[0];
      return {
        id: row.id,
        userId: row.user_id,
        balance: parseFloat(row.balance),
        totalEarned: parseFloat(row.total_earned),
        totalSpent: parseFloat(row.total_spent),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    }

    // 创建新账户
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();

    await pool.query(
      'INSERT INTO user_credits (id, user_id, balance, total_earned, total_spent) VALUES (?, ?, 0.00, 0.00, 0.00)',
      [id, userId]
    );

    return {
      id,
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Failed to ensure credit account:', error);
    throw new Error('Unable to create or retrieve credit account');
  }
}

/**
 * 获取用户积分余额
 */
export async function getCreditBalance(userId: string): Promise<number> {
  try {
    await ensureCreditAccount(userId);

    const [rows] = await pool.query(
      'SELECT balance FROM user_credits WHERE user_id = ?',
      [userId]
    );

    if ((rows as any[]).length === 0) {
      return 0;
    }

    return parseFloat((rows as any[])[0].balance);
  } catch (error) {
    console.error('Failed to get credit balance:', error);
    throw new Error('Unable to retrieve credit balance');
  }
}

/**
 * 获取用户积分账户详情
 */
export async function getCreditAccount(userId: string): Promise<UserCredits> {
  try {
    const account = await ensureCreditAccount(userId);

    // 获取最新数据
    const [rows] = await pool.query(
      'SELECT * FROM user_credits WHERE user_id = ?',
      [userId]
    );

    if ((rows as any[]).length === 0) {
      throw new Error('Credit account not found');
    }

    const row = (rows as any[])[0];
    return {
      id: row.id,
      userId: row.user_id,
      balance: parseFloat(row.balance),
      totalEarned: parseFloat(row.total_earned),
      totalSpent: parseFloat(row.total_spent),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  } catch (error) {
    console.error('Failed to get credit account:', error);
    throw new Error('Unable to retrieve credit account');
  }
}

/**
 * 获取积分交易记录
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  try {
    const limitInt = Math.max(1, Math.min(1000, Math.floor(limit)));

    const [rows] = await pool.query(
      `SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ${limitInt}`,
      [userId]
    );

    return (rows as any[]).map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      amount: parseFloat(row.amount),
      balanceBefore: parseFloat(row.balance_before),
      balanceAfter: parseFloat(row.balance_after),
      description: row.description,
      referenceId: row.reference_id,
      createdAt: new Date(row.created_at)
    }));
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    throw new Error('Unable to retrieve transaction history');
  }
}

/**
 * 检查积分是否充足
 */
export async function checkSufficientCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  try {
    const balance = await getCreditBalance(userId);
    return balance >= amount;
  } catch (error) {
    console.error('Failed to check sufficient credits:', error);
    return false;
  }
}

/**
 * 扣除积分（使用事务）
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string
): Promise<boolean> {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 使用 FOR UPDATE 锁防止并发问题
    const [accountRows] = await connection.query<any[]>(
      'SELECT * FROM user_credits WHERE user_id = ? FOR UPDATE',
      [userId]
    );

    if (accountRows.length === 0) {
      await connection.rollback();
      return false;
    }

    const currentBalance = parseFloat(accountRows[0].balance);
    if (currentBalance < amount) {
      await connection.rollback();
      return false;
    }

    const newBalance = currentBalance - amount;
    const totalSpent = parseFloat(accountRows[0].total_spent) + amount;

    // 更新余额
    await connection.query(
      'UPDATE user_credits SET balance = ?, total_spent = ?, updated_at = NOW() WHERE user_id = ?',
      [newBalance, totalSpent, userId]
    );

    // 记录交易
    const { v4: uuidv4 } = await import('uuid');
    const transactionId = uuidv4();
    await connection.query(
      'INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, description, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [transactionId, userId, 'usage', amount, currentBalance, newBalance, description || null, referenceId || null]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Failed to deduct credits:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 添加积分
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'initial' | 'bonus' | 'refund' = 'bonus',
  description?: string,
  referenceId?: string
): Promise<void> {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [accountRows] = await connection.query<any[]>(
      'SELECT * FROM user_credits WHERE user_id = ? FOR UPDATE',
      [userId]
    );

    let account = accountRows;
    if (account.length === 0) {
      await connection.commit();
      await ensureCreditAccount(userId);
      await connection.beginTransaction();
      const [newAccountRows] = await connection.query<any[]>(
        'SELECT * FROM user_credits WHERE user_id = ? FOR UPDATE',
        [userId]
      );
      account = newAccountRows;
    }

    const currentBalance = parseFloat(account[0].balance);
    const newBalance = currentBalance + amount;
    const totalEarned = parseFloat(account[0].total_earned) + amount;

    await connection.query(
      'UPDATE user_credits SET balance = ?, total_earned = ?, updated_at = NOW() WHERE user_id = ?',
      [newBalance, totalEarned, userId]
    );

    const { v4: uuidv4 } = await import('uuid');
    const transactionId = uuidv4();
    await connection.query(
      'INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, description, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [transactionId, userId, type, amount, currentBalance, newBalance, description || null, referenceId || null]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error('Failed to add credits:', error);
    throw error;
  } finally {
    connection.release();
  }
}
