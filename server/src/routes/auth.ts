import express, { Response } from 'express';
import { registerUser, loginUser, getUserById } from '../services/authService.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// 注册
router.post('/register', async (req, res: Response) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 登录
router.post('/login', async (req, res: Response) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await getUserById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 登出（客户端清除token）
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;

