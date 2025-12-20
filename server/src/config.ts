// 服务器配置（Docker MySQL 配置）
export const config = {
  mysql: {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'forsion_ai_studio',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  },
  server: {
    port: parseInt(process.env.PORT || '3002'),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:2012',
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  },
};
