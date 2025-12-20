import apiService from './apiService';

export interface UserCredits {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
}

export interface CreditCheckResult {
  sufficient: boolean;
  required: number;
}

export class CreditService {
  /**
   * 获取用户积分余额
   */
  static async getCreditBalance(): Promise<number> {
    const response = await apiService.get<{ balance: number }>('/api/credits/balance');
    return response.balance;
  }

  /**
   * 获取用户积分账户详情
   */
  static async getCreditAccount(): Promise<UserCredits> {
    const response = await apiService.get<{ account: UserCredits }>('/api/credits/account');
    return response.account;
  }

  /**
   * 获取积分交易记录
   */
  static async getTransactionHistory(limit: number = 50): Promise<CreditTransaction[]> {
    const response = await apiService.get<{ transactions: CreditTransaction[] }>(`/api/credits/transactions?limit=${limit}`);
    return response.transactions;
  }

  /**
   * 检查积分是否充足
   */
  static async checkSufficientCredits(amount: number): Promise<CreditCheckResult> {
    const response = await apiService.post<CreditCheckResult>('/api/credits/check', { amount });
    return response;
  }

  // 本地缓存
  private static cachedBalance: number | null = null;
  private static balanceCacheTime: number | null = null;
  private static readonly CACHE_DURATION = 30 * 1000; // 30秒缓存

  /**
   * 获取积分余额（带缓存）
   */
  static async getCreditBalanceWithCache(): Promise<number> {
    const now = Date.now();

    if (this.cachedBalance !== null &&
        this.balanceCacheTime !== null &&
        (now - this.balanceCacheTime) < this.CACHE_DURATION) {
      return this.cachedBalance;
    }

    const balance = await this.getCreditBalance();
    this.cachedBalance = balance;
    this.balanceCacheTime = now;

    return balance;
  }

  /**
   * 清除余额缓存
   */
  static clearBalanceCache(): void {
    this.cachedBalance = null;
    this.balanceCacheTime = null;
  }
}

export default CreditService;
