/**
 * Credit Service - 积分服务
 * 与 Forsion Backend Service 的积分系统集成
 */

import apiService from './apiService';

export interface CreditBalance {
  userId: string | number;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: string;
}

// Backend Service 返回的原始格式
interface BackendCreditBalance {
  userId?: string;
  balance?: number;
  totalEarned?: number;
  totalSpent?: number;
  updatedAt?: string;
  // 可能的其他字段名格式
  user_id?: string;
  total_earned?: number;
  total_spent?: number;
  updated_at?: string;
}

export class CreditService {
  /**
   * 获取积分余额
   */
  static async getBalance(): Promise<CreditBalance> {
    try {
      const response = await apiService.get<BackendCreditBalance>('/api/credits/balance');
      
      // 映射字段名（支持驼峰和下划线格式）
      const creditBalance: CreditBalance = {
        userId: response.userId || response.user_id || '',
        balance: response.balance ?? 0,
        totalEarned: response.totalEarned ?? response.total_earned ?? 0,
        totalSpent: response.totalSpent ?? response.total_spent ?? 0,
        updatedAt: response.updatedAt || response.updated_at || new Date().toISOString(),
      };
      
      return creditBalance;
    } catch (error: any) {
      console.error('[CreditService] Failed to get balance:', error);
      throw error;
    }
  }

}

export default CreditService;

