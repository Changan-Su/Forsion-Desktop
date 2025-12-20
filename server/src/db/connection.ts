import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { config as serverConfig } from '../config.js';

dotenv.config();

const config = {
  host: serverConfig.mysql.host,
  port: serverConfig.mysql.port,
  user: serverConfig.mysql.user,
  password: serverConfig.mysql.password,
  database: serverConfig.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 创建连接池
export const pool = mysql.createPool(config);

// 添加错误处理，避免连接池错误导致应用崩溃
pool.on('error', (err) => {
  console.error('Unexpected error on idle MySQL client', err);
});

// 测试数据库连接
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    // 执行一个简单的查询来验证连接
    await connection.query('SELECT 1');
    console.log('✅ MySQL database connected successfully');
    connection.release();
    return true;
  } catch (error: any) {
    console.error('❌ MySQL connection failed:', error.message || error);
    return false;
  }
}

// 初始化数据库表
export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 读取并执行schema.sql
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    const schema = await fs.readFile(schemaPath, 'utf-8');
    
    // 分割SQL语句并执行
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await connection.query(statement);
    }
    
    console.log('✅ Database tables initialized successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

export default pool;

