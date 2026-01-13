import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Coins, TrendingUp, TrendingDown, Camera, Upload, Edit2, Check, X as XIcon, CreditCard } from 'lucide-react';
import AuthService from '../services/authService';
import CreditService, { CreditBalance } from '../services/creditService';
import AvatarService from '../services/avatarService';
import Avatar from './Avatar';
import apiService from '../services/apiService';
import { getToken } from '../services/authRedirect';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // 重置状态
      setCreditBalance(null);
      setCreditError(null);
      setIsEditingNickname(false);
      setNicknameInput('');
      return;
    }

    // 从后端获取最新的用户信息（包括头像）
    const loadUserInfo = async () => {
      // 首先使用本地存储的用户信息，确保界面立即显示
      const localUser = AuthService.getUser();
      setUser(localUser);
      
      if (AuthService.isAuthenticated()) {
        try {
          // 尝试从后端获取最新信息（非阻塞）
          const latestUser = await AuthService.getCurrentUser();
          setUser(latestUser);
        } catch (error: any) {
          console.error('Failed to fetch current user:', error);
          // 获取失败时保持使用本地用户信息，不影响界面显示
        }
        
        // 加载积分信息
        setIsLoadingCredits(true);
        setCreditError(null);
        try {
          const balance = await CreditService.getBalance();
          setCreditBalance(balance);
        } catch (error: any) {
          console.error('Failed to load credit balance:', error);
          // 如果是认证错误，显示相应提示
          if (error.status === 401 || error.status === 403) {
            setCreditError('无法获取积分信息');
          } else {
            setCreditError(error.message || '加载积分失败');
          }
          // 不阻止模态框显示
        } finally {
          setIsLoadingCredits(false);
        }
      } else {
        // 未登录状态
        setCreditError('请先登录');
      }
    };
    
    loadUserInfo();
  }, [isOpen]);

  // 初始化昵称输入
  useEffect(() => {
    if (isEditingNickname && user) {
      setNicknameInput(user.nickname || '');
    }
  }, [isEditingNickname, user]);

  // 处理昵称更新
  const handleNicknameUpdate = async () => {
    if (!user) return;
    
    // 验证昵称长度
    if (nicknameInput.length > 100) {
      alert('昵称长度不能超过 100 个字符');
      return;
    }

    setIsUpdatingNickname(true);
    try {
      // 调用 PUT /api/settings 更新昵称（实际端点）
      await apiService.put('/api/settings', {
        nickname: nicknameInput.trim() || null
      });
      
      // 更新本地用户信息
      const updatedUser = await AuthService.getCurrentUser();
      setUser(updatedUser);
      setIsEditingNickname(false);
      
      // 触发全局更新
      window.dispatchEvent(new Event('user-updated'));
    } catch (error: any) {
      console.error('Failed to update nickname:', error);
      alert('更新昵称失败: ' + (error.message || '未知错误'));
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  // 取消编辑昵称
  const handleCancelNicknameEdit = () => {
    setIsEditingNickname(false);
    setNicknameInput(user?.nickname || '');
  };

  // 处理充值跳转
  const handleRecharge = () => {
    const token = getToken();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const currentUrl = window.location.href;
    
    if (!token) {
      alert('请先登录');
      return;
    }
    
    const payUrl = `${apiBaseUrl}/pay?token=${token}&redirect=${encodeURIComponent(currentUrl)}`;
    window.location.href = payUrl;
  };

  // 处理头像上传
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件
    const validation = AvatarService.validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const avatarUrl = await AvatarService.uploadAvatar(file);
      const updatedUser = await AvatarService.updateAvatarUrl(avatarUrl);
      setUser(updatedUser);
      
      // 触发 App.tsx 重新加载用户信息
      window.dispatchEvent(new Event('user-updated'));
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert('上传失败，请重试: ' + (error.message || '未知错误'));
    } finally {
      setIsUploadingAvatar(false);
      // 清空文件输入，允许重新选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
                    {/* 头像显示和上传区域 */}
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Avatar user={user} size="lg" />
                      
                      {/* 悬停时显示上传图标 */}
                      <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {isUploadingAvatar ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Camera size={24} className="text-white" />
                        )}
                      </div>
                      
                      {/* 上传提示 */}
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={14} className="text-white" />
                      </div>
                    </div>

                    {/* 隐藏的文件输入 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />

                    <div>
                      <h2 className="text-lg font-bold text-surface-text">个人设置</h2>
                      <p className="text-sm text-surface-text opacity-70">
                        {user?.nickname || user?.username || '用户'}
                      </p>
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

              {/* 内容区域 */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* 用户信息 */}
                  <div className="bg-white/5 rounded-lg p-4 space-y-2 border border-white/10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-surface-text opacity-70">昵称:</span>
                      {isEditingNickname ? (
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <input
                            type="text"
                            value={nicknameInput}
                            onChange={(e) => setNicknameInput(e.target.value)}
                            placeholder="输入昵称"
                            maxLength={100}
                            className="px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-surface-text text-sm focus:outline-none focus:border-accent flex-1 max-w-[200px]"
                            disabled={isUpdatingNickname}
                          />
                          <button
                            onClick={handleNicknameUpdate}
                            disabled={isUpdatingNickname}
                            className="w-7 h-7 bg-accent hover:bg-accent/80 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            {isUpdatingNickname ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <Check size={14} className="text-white" />
                            )}
                          </button>
                          <button
                            onClick={handleCancelNicknameEdit}
                            disabled={isUpdatingNickname}
                            className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <XIcon size={14} className="text-surface-text" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-surface-text font-medium">{user?.nickname || '未设置'}</span>
                          <button
                            onClick={() => setIsEditingNickname(true)}
                            className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                            title="编辑昵称"
                          >
                            <Edit2 size={12} className="text-surface-text opacity-70" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-text opacity-70">用户名:</span>
                      <span className="text-surface-text font-medium">{user?.username || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-text opacity-70">邮箱:</span>
                      <span className="text-surface-text font-medium">{user?.email || '未设置'}</span>
                    </div>
                    {user?.phone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-text opacity-70">手机:</span>
                        <span className="text-surface-text font-medium">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-text opacity-70">角色:</span>
                      <span className="text-surface-text font-medium capitalize">{user?.role?.toLowerCase() || 'user'}</span>
                    </div>
                    {user?.created_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-text opacity-70">注册时间:</span>
                        <span className="text-surface-text">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 积分信息 */}
                  {isLoadingCredits ? (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-center text-surface-text opacity-50">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent mr-2"></div>
                        加载积分信息...
                      </div>
                    </div>
                  ) : creditError ? (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center space-x-2 text-surface-text opacity-50 text-sm">
                        <Coins size={16} className="text-surface-text opacity-30" />
                        <span>积分信息暂时无法加载</span>
                      </div>
                    </div>
                  ) : creditBalance ? (
                    <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
                      <div className="flex items-center space-x-2 mb-3">
                        <Coins size={18} className="text-accent" />
                        <h3 className="text-sm font-bold text-surface-text">积分账户</h3>
                      </div>
                      
                      <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                        <div className="flex items-baseline justify-between">
                          <span className="text-surface-text opacity-70 text-xs uppercase tracking-wider">当前余额</span>
                          <span className="text-2xl font-bold text-accent">
                            {typeof creditBalance.balance === 'number' ? creditBalance.balance.toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                        <div className="flex items-center space-x-2">
                          <TrendingUp size={14} className="text-green-400" />
                          <div>
                            <div className="text-xs text-surface-text opacity-50">累计获得</div>
                            <div className="text-sm font-medium text-surface-text">
                              {typeof creditBalance.totalEarned === 'number' ? creditBalance.totalEarned.toFixed(2) : '0.00'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingDown size={14} className="text-red-400" />
                          <div>
                            <div className="text-xs text-surface-text opacity-50">累计消费</div>
                            <div className="text-sm font-medium text-surface-text">
                              {typeof creditBalance.totalSpent === 'number' ? creditBalance.totalSpent.toFixed(2) : '0.00'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {creditBalance.updatedAt && (
                        <div className="text-xs text-surface-text opacity-40 pt-2 border-t border-white/5">
                          最后更新: {new Date(creditBalance.updatedAt).toLocaleString()}
                        </div>
                      )}

                      {/* 充值按钮 */}
                      <button
                        onClick={handleRecharge}
                        className="w-full mt-3 py-2.5 bg-accent hover:bg-accent/80 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <CreditCard size={16} />
                        <span>充值积分</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserSettingsModal;
