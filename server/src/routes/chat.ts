import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { generateAIResponse, generateAIResponseStream } from '../services/aiService.js';
import { createSession, getSessionById } from '../services/sessionService.js';
import { createMessage, getSessionMessages } from '../services/messageService.js';
import { getUserSettings } from '../services/settingsService.js';
import { getModelById } from '../services/modelService.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 发送消息并获取AI响应
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { message, sessionId, model, stream = false } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 确定使用的模型
    let modelToUse = model;
    if (!modelToUse) {
      const settings = await getUserSettings(req.userId);
      modelToUse = settings?.preferred_model || 'gemini-3-flash-preview';
    }

    // 验证模型是否可用
    const { getModelById } = await import('../services/modelService.js');
    const modelInfo = await getModelById(modelToUse);
    if (!modelInfo) {
      return res.status(400).json({ error: 'Invalid or unavailable model' });
    }

    // 获取或创建会话
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await createSession(req.userId, 'New Conversation');
      currentSessionId = newSession.id;
    } else {
      // 验证会话所有权
      const session = await getSessionById(currentSessionId, req.userId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
    }

    // 保存用户消息
    const userMessage = await createMessage(
      currentSessionId,
      req.userId,
      'user',
      message
    );

    // 获取会话历史
    const messages = await getSessionMessages(currentSessionId, req.userId);
    const history = messages
      .filter(m => m.id !== userMessage.id)
      .map(m => ({ role: m.role, content: m.content }));

    // 如果请求流式响应
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';

      try {
        for await (const chunk of generateAIResponseStream(modelToUse, message, history)) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        }

        // 保存AI响应
        const assistantMessage = await createMessage(
          currentSessionId,
          req.userId,
          'assistant',
          fullResponse,
          modelToUse
        );

        res.write(`data: ${JSON.stringify({ 
          done: true, 
          sessionId: currentSessionId,
          messageId: assistantMessage.id 
        })}\n\n`);
        res.end();
      } catch (error: any) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    } else {
      // 非流式响应
      const aiResponse = await generateAIResponse(modelToUse, message, history);

      // 保存AI响应
      const assistantMessage = await createMessage(
        currentSessionId,
        req.userId,
        'assistant',
        aiResponse,
        modelToUse
      );

      res.json({
        content: aiResponse,
        model: modelToUse,
        sessionId: currentSessionId,
        messageId: assistantMessage.id
      });
    }
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取可用模型列表
router.get('/models', async (req: AuthRequest, res: Response) => {
  try {
    // 检查是否有强制刷新参数
    const forceRefresh = req.query.refresh === 'true';
    const { getAvailableModels, clearModelCache } = await import('../services/modelService.js');
    
    // 如果强制刷新，清除缓存
    if (forceRefresh) {
      clearModelCache();
      console.log('[ChatRoute] /models - Cache cleared, fetching fresh models from database');
    }
    
    const models = await getAvailableModels();
    console.log(`[ChatRoute] /models - Successfully loaded ${models.length} models from database`);
    
    // 记录所有模型的ID，用于验证
    if (models.length > 0) {
      console.log('[ChatRoute] /models - Model IDs:', models.map(m => m.id).join(', '));
    } else {
      console.warn('[ChatRoute] /models - WARNING: No models returned from database!');
    }
    
    // 移除敏感信息（apiKey）后再返回给前端
    const safeModels = models.map(({ apiKey, ...model }) => model);
    res.json({ models: safeModels });
  } catch (error: any) {
    console.error('[ChatRoute] /models - CRITICAL ERROR:', error);
    console.error('[ChatRoute] /models - Error details:', {
      message: error.message,
      stack: error.stack
    });
    // 返回空数组而不是错误，让前端知道数据库连接失败
    // 前端可以根据空数组显示适当的错误信息
    res.status(500).json({ 
      error: error.message || 'Failed to load models from database',
      models: [] // 明确返回空数组
    });
  }
});

export default router;

