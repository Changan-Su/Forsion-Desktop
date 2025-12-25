import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail } from 'lucide-react';
import AuthService from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await AuthService.login({ username, password });
      } else {
        await AuthService.register({ username, password, email });
      }
      
      // 登录/注册成功后，从后端获取最新的用户信息（包括头像）
      try {
        await AuthService.getCurrentUser();
      } catch (userError) {
        console.error('Failed to fetch current user after auth:', userError);
        // 继续执行，使用登录/注册响应中的用户信息
      }
      
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white/95 backdrop-blur-lg rounded-[32px] shadow-2xl border border-white/50 p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-surface-text mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-text mb-2">
              <User size={16} className="inline mr-2" />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-white/60 rounded-2xl focus:outline-none focus:border-accent transition-all"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-surface-text mb-2">
                <Mail size={16} className="inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-white/60 rounded-2xl focus:outline-none focus:border-accent transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-text mb-2">
              <Lock size={16} className="inline mr-2" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-white/60 rounded-2xl focus:outline-none focus:border-accent transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-accent text-white rounded-2xl font-medium hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-md"
          >
            {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-accent hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-surface-text opacity-60 hover:opacity-100 transition-opacity"
        >
          Continue without login
        </button>
      </motion.div>
    </div>
  );
};





