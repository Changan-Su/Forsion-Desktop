import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getUserSettings, updateUserSettings } from '../services/settingsService.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用户设置
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const settings = await getUserSettings(req.userId);
    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户设置
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { preferred_model, theme_preferences } = req.body;
    
    const updates: any = {};
    if (preferred_model !== undefined) updates.preferred_model = preferred_model;
    if (theme_preferences !== undefined) updates.theme_preferences = theme_preferences;

    const settings = await updateUserSettings(req.userId, updates);
    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;





