import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  getUserSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession
} from '../services/sessionService.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用户所有会话
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sessions = await getUserSessions(req.userId);
    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个会话
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sessionId = parseInt(req.params.id);
    const session = await getSessionById(sessionId, req.userId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建新会话
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title } = req.body;
    const session = await createSession(req.userId, title);
    res.status(201).json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新会话
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sessionId = parseInt(req.params.id);
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const session = await updateSession(sessionId, req.userId, title);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除会话
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sessionId = parseInt(req.params.id);
    const success = await deleteSession(sessionId, req.userId);

    if (!success) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;





