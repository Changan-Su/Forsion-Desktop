import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, initializeDatabase } from './db/connection.js';
import { createDefaultAdmin } from './db/seed.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import messageRoutes from './routes/messages.js';
import chatRoutes from './routes/chat.js';
import settingsRoutes from './routes/settings.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:2005',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'error'
    });
  }
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api', messageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接并初始化
    let dbStatus = 'Unknown';
    try {
      const connected = await testConnection();
      if (!connected) {
        console.warn('⚠️  Warning: Failed to connect to database.');
        console.warn('   Server will start but database features will be unavailable.');
        console.warn('   Please check your MySQL configuration in server/.env');
        console.warn('   Make sure MySQL is running and database "forsion_desktop" exists.\n');
        dbStatus = 'Disconnected';
      } else {
        dbStatus = 'Connected';
        console.log('ℹ️  Connected to forsion_desktop database');
        
        // 初始化数据库表
        try {
          await initializeDatabase();
          console.log('✅ Database tables initialized');
        } catch (initError: any) {
          console.log('ℹ️  Database tables may already exist:', initError.message);
        }
        
        // 创建默认管理员
        try {
          await createDefaultAdmin();
        } catch (seedError: any) {
          console.log('ℹ️  Admin user may already exist:', seedError.message);
        }
      }
    } catch (dbTestError: any) {
      console.warn('⚠️  Database connection test failed:', dbTestError.message || dbTestError);
      dbStatus = 'Error';
    }

    const finalDbStatus = dbStatus;
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🚀 Forsion Desktop Server                           ║
║                                                          ║
║     Server running on: http://localhost:${PORT}         ║
║     Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                          ║
║     API Endpoints:                                       ║
║     - POST   /api/auth/register                          ║
║     - POST   /api/auth/login                             ║
║     - GET    /api/auth/me                                ║
║     - GET    /api/sessions                               ║
║     - POST   /api/chat                                   ║
║     - GET    /api/chat/models                            ║
║                                                          ║
║     Database: ${finalDbStatus === 'Connected' ? 'Connected ✅' : finalDbStatus === 'Error' ? 'Error ❌' : 'Not Connected ⚠️'}                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

startServer();

