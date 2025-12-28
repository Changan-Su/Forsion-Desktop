#!/bin/sh
# 后端启动脚本 - 等待数据库就绪后启动服务

echo "🚀 Starting Forsion Desktop Backend..."

# 等待数据库就绪（最多等待 60 秒）
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if node -e "
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'mysql',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'forsion_user',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'forsion_desktop',
      waitForConnections: true,
      connectionLimit: 1
    });
    pool.query('SELECT 1')
      .then(() => { console.log('Database ready'); process.exit(0); })
      .catch(() => { process.exit(1); });
  " 2>/dev/null; then
    echo "✅ Database is ready"
    break
  fi
  
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    echo "⚠️  Database connection timeout, starting server anyway..."
  else
    sleep 2
  fi
done

# 启动服务器
echo "🌐 Starting server..."
exec node dist/index.js

