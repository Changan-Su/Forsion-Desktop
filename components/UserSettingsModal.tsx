import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, CreditCard, History, User, Settings } from 'lucide-react';
import CreditService, { UserCredits, CreditTransaction } from '../services/creditService';
import AuthService from '../services/authService';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // 获取用户信息
      const userInfo = AuthService.getUser();
      setUser(userInfo);

      // 获取积分信息
      const [creditAccount, transactionHistory] = await Promise.all([
        CreditService.getCreditAccount(),
        CreditService.getTransactionHistory(20)
      ]);

      setCredits(creditAccount);
      setTransactions(transactionHistory);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'usage':
        return 'text-red-400';
      case 'bonus':
        return 'text-green-400';
      case 'refund':
        return 'text-blue-400';
      case 'initial':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'usage':
        return '使用';
      case 'bonus':
        return '奖励';
      case 'refund':
        return '退款';
      case 'initial':
        return '初始';
      case 'adjustment':
        return '调整';
      default:
        return type;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-dark rounded-[32px] shadow-2xl border border-white/40 overflow-hidden">
              {/* 头部 */}
              <div className="p-6 bg-white/10 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white shadow-lg">
                      <User size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-surface-text">个人设置</h2>
                      <p className="text-sm text-surface-text opacity-70">{user?.username || '用户'}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-surface-text"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* 标签页 */}
              <div className="flex border-b border-white/20">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-surface-text opacity-70 hover:text-surface-text hover:opacity-100'
                  }`}
                >
                  <Coins size={16} className="inline mr-2" />
                  积分概览
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'transactions'
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-surface-text opacity-70 hover:text-surface-text hover:opacity-100'
                  }`}
                >
                  <History size={16} className="inline mr-2" />
                  交易记录
                </button>
              </div>

              {/* 内容区域 */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                    <p className="mt-2 text-surface-text opacity-70">加载中...</p>
                  </div>
                ) : (
                  <>
                    {/* 积分概览 */}
                    {activeTab === 'overview' && credits && (
                      <div className="p-6 space-y-6">
                        {/* 当前余额 */}
                        <div className="text-center">
                          <div className="text-3xl font-bold text-surface-text mb-1">
                            {formatCurrency(credits.balance)}
                          </div>
                          <div className="text-sm text-surface-text opacity-70">可用积分</div>
                        </div>

                        {/* 统计信息 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/20">
                            <div className="text-lg font-semibold text-green-400">
                              +{formatCurrency(credits.totalEarned)}
                            </div>
                            <div className="text-xs text-green-400 opacity-80">累计获得</div>
                          </div>
                          <div className="bg-red-500/10 rounded-lg p-4 text-center border border-red-500/20">
                            <div className="text-lg font-semibold text-red-400">
                              -{formatCurrency(credits.totalSpent)}
                            </div>
                            <div className="text-xs text-red-400 opacity-80">累计使用</div>
                          </div>
                        </div>

                        {/* 账户信息 */}
                        <div className="bg-white/5 rounded-lg p-4 space-y-2 border border-white/10">
                          <div className="flex justify-between text-sm">
                            <span className="text-surface-text opacity-70">账户ID:</span>
                            <span className="font-mono text-xs text-surface-text">{credits.id.slice(0, 8)}...</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-surface-text opacity-70">创建时间:</span>
                            <span className="text-surface-text">
                              {new Date(credits.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-surface-text opacity-70">最后更新:</span>
                            <span className="text-surface-text">
                              {new Date(credits.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 交易记录 */}
                    {activeTab === 'transactions' && (
                      <div className="p-6">
                        {transactions.length === 0 ? (
                          <div className="text-center py-8">
                            <CreditCard size={48} className="mx-auto text-surface-text opacity-30 mb-4" />
                            <p className="text-surface-text opacity-70">暂无交易记录</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {transactions.map((transaction) => (
                              <div key={transaction.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.type)}`}>
                                      {getTransactionTypeLabel(transaction.type)}
                                    </span>
                                    <span className={`text-sm font-bold ${
                                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                                    </span>
                                  </div>
                                  <span className="text-xs text-surface-text opacity-60">
                                    {new Date(transaction.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                {transaction.description && (
                                  <p className="text-sm text-surface-text opacity-80 mb-2">{transaction.description}</p>
                                )}
                                <div className="flex justify-between text-xs text-surface-text opacity-60">
                                  <span>交易前: {formatCurrency(transaction.balanceBefore)}</span>
                                  <span>交易后: {formatCurrency(transaction.balanceAfter)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserSettingsModal;
