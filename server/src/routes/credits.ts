import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  getCreditBalance,
  getCreditAccount,
  getTransactionHistory,
  checkSufficientCredits
} from '../services/creditService.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * 获取用户积分余额
 */
router.get('/balance', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const balance = await getCreditBalance(req.userId);
    res.json({ balance });
  } catch (error: any) {
    console.error('Failed to get credit balance:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取用户积分账户详情
 */
router.get('/account', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const account = await getCreditAccount(req.userId);
    res.json({ account });
  } catch (error: any) {
    console.error('Failed to get credit account:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取积分交易记录
 */
router.get('/transactions', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await getTransactionHistory(req.userId, limit);
    res.json({ transactions });
  } catch (error: any) {
    console.error('Failed to get transaction history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 检查积分是否充足
 */
router.post('/check', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const sufficient = await checkSufficientCredits(req.userId, amount);
    res.json({ sufficient, required: amount });
  } catch (error: any) {
    console.error('Failed to check credits:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
