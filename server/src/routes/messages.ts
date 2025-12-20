import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  getSessionMessages,
  createMessage,
  deleteMessage
} from '../services/messageService.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取会话的所有消息
router.get('/sessions/:sessionId/messages', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sessionId = parseInt(req.params.sessionId);
    const messages = await getSessionMessages(sessionId, req.userId);
    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 保存消息
router.post('/sessions/:sessionId/messages', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sessionId = parseInt(req.params.sessionId);
    const { role, content, modelUsed } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'Role and content are required' });
    }

    if (role !== 'user' && role !== 'assistant') {
      return res.status(400).json({ error: 'Role must be "user" or "assistant"' });
    }

    const message = await createMessage(sessionId, req.userId, role, content, modelUsed);
    res.status(201).json({ message });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除消息
router.delete('/messages/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const messageId = parseInt(req.params.id);
    const success = await deleteMessage(messageId, req.userId);

    if (!success) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

