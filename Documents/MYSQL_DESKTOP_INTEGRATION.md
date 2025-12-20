# MySQL 数据库集成指南 - Forsion Desktop 项目

## 📋 概述

本文档说明如何在 Forsion Desktop 项目中配置和连接 MySQL 数据库，实现与 Forsion AI Studio 共享数据库（用户、积分、模型等数据）。

## 🎯 架构说明

### 共享数据库架构

```
┌─────────────────────┐
│   MySQL 数据库       │
│  (forsion_ai_studio)│
│                     │
│  - users            │
│  - user_credits     │
│  - global_models    │
│  - credit_transactions│
│  - invite_codes     │
└─────────────────────┘
         ▲        ▲
         │        │
    ┌────┘        └────┐
    │                 │
┌─────────┐    ┌──────────────┐
│Desktop   │    │ AI Studio    │
│后端      │    │ 后端         │
└─────────┘    └──────────────┘
```

**核心优势：**
- ✅ 数据实时同步，无需 HTTP 调用
- ✅ 性能更好，直接数据库访问
- ✅ 架构简单，易于维护
- ✅ 支持多个 Forsion 项目共享数据

---

## 📦 依赖安装

### 1. 安装 MySQL 驱动

在 Desktop 项目的后端目录中安装 `mysql2`：

```bash
npm install mysql2
npm install --save-dev @types/node
```

### 2. 安装 TypeScript（如果使用）

```bash
npm install --save-dev typescript @types/node tsx
```

---

## ⚙️ 环境变量配置

### 创建 `.env` 文件

在 Desktop 项目后端根目录创建 `.env` 文件：

```env
# MySQL 数据库配置（与 AI Studio 使用相同的数据库）
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=forsion_ai_studio

# 可选：连接池配置
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0
```

**重要提示：**
- `DB_NAME` 必须与 AI Studio 使用相同的数据库名
- `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD` 必须与 AI Studio 配置一致

---

## 🔧 数据库连接配置

### 创建数据库配置文件

创建 `src/config/database.ts`：

```typescript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'forsion_ai_studio',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * 执行 SQL 查询
 * @param sql SQL 语句
 * @param params 参数数组
 * @returns 查询结果
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

/**
 * 获取数据库连接（用于事务）
 * @returns 数据库连接
 */
export async function getConnection() {
  return pool.getConnection();
}

/**
 * 测试数据库连接
 * @returns 连接是否成功
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export default pool;
```

---

## 📊 数据库表结构

### 核心表说明

#### 1. `users` - 用户表

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'USER',  -- 'ADMIN' 或 'USER'
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  permissions TEXT,
  max_requests_per_day INT DEFAULT 1000,
  notes TEXT,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**常用查询：**
```typescript
// 根据用户名查询用户
const user = await query<any[]>(
  'SELECT * FROM users WHERE username = ?',
  [username]
);

// 根据 ID 查询用户
const user = await query<any[]>(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);
```

#### 2. `user_credits` - 用户积分表

```sql
CREATE TABLE user_credits (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  total_spent DECIMAL(10, 2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**常用查询：**
```typescript
// 查询用户积分余额
const credits = await query<any[]>(
  'SELECT * FROM user_credits WHERE user_id = ?',
  [userId]
);

// 如果不存在，创建积分账户
if (credits.length === 0) {
  const id = uuidv4();
  await query(
    'INSERT INTO user_credits (id, user_id, balance, total_earned, total_spent) VALUES (?, ?, 0.00, 0.00, 0.00)',
    [id, userId]
  );
}
```

#### 3. `credit_transactions` - 积分交易记录表

```sql
CREATE TABLE credit_transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('initial', 'usage', 'refund', 'bonus', 'adjustment') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_id VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**常用查询：**
```typescript
// 查询用户交易记录
const transactions = await query<any[]>(
  'SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
  [userId, limit || 50]
);
```

#### 4. `global_models` - 全局模型表

```sql
CREATE TABLE global_models (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'Box',
  avatar MEDIUMTEXT,
  api_model_id VARCHAR(200),
  config_key VARCHAR(100),
  default_base_url VARCHAR(500),
  api_key TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  prompt_caching_enabled BOOLEAN DEFAULT FALSE,
  system_prompt TEXT,
  cacheable_content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**常用查询：**
```typescript
// 查询所有启用的模型
const models = await query<any[]>(
  'SELECT id, name, provider, description, icon, avatar, is_enabled FROM global_models WHERE is_enabled = TRUE'
);

// 根据 ID 查询模型（不包含 API Key）
const model = await query<any[]>(
  'SELECT id, name, provider, description, icon, avatar, api_model_id, default_base_url, is_enabled FROM global_models WHERE id = ?',
  [modelId]
);
```

#### 5. `credit_pricing` - 积分定价表

```sql
CREATE TABLE credit_pricing (
  id VARCHAR(36) PRIMARY KEY,
  model_id VARCHAR(100) NOT NULL,
  provider VARCHAR(50),
  tokens_per_credit DECIMAL(10, 4) NOT NULL DEFAULT 100.0,
  input_multiplier DECIMAL(10, 4) DEFAULT 1.0,
  output_multiplier DECIMAL(10, 4) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**常用查询：**
```typescript
// 查询模型的积分定价
const pricing = await query<any[]>(
  'SELECT * FROM credit_pricing WHERE model_id = ? AND is_active = TRUE',
  [modelId]
);
```

---

## 💻 代码示例

### 示例 1：用户服务

创建 `src/services/userService.ts`：

```typescript
import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  status: string;
  created_at: Date;
}

/**
 * 根据用户名获取用户
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const rows = await query<any[]>(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * 根据 ID 获取用户
 */
export async function getUserById(userId: string): Promise<User | null> {
  const rows = await query<any[]>(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * 验证密码
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

### 示例 2：积分服务

创建 `src/services/creditService.ts`：

```typescript
import { query, getConnection } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 确保用户有积分账户
 */
export async function ensureCreditAccount(userId: string) {
  const existing = await query<any[]>(
    'SELECT * FROM user_credits WHERE user_id = ?',
    [userId]
  );

  if (existing.length > 0) {
    return existing[0];
  }

  // 创建新账户
  const id = uuidv4();
  await query(
    'INSERT INTO user_credits (id, user_id, balance, total_earned, total_spent) VALUES (?, ?, 0.00, 0.00, 0.00)',
    [id, userId]
  );

  return { id, userId, balance: 0, totalEarned: 0, totalSpent: 0 };
}

/**
 * 获取积分余额
 */
export async function getCreditBalance(userId: string): Promise<number> {
  await ensureCreditAccount(userId);
  const rows = await query<any[]>(
    'SELECT balance FROM user_credits WHERE user_id = ?',
    [userId]
  );
  return rows.length > 0 ? parseFloat(rows[0].balance) : 0;
}

/**
 * 检查积分是否充足
 */
export async function checkSufficientCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  return balance >= amount;
}

/**
 * 扣除积分（使用事务和锁）
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string
): Promise<boolean> {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    // 使用 FOR UPDATE 锁防止并发问题
    const [accountRows] = await connection.query<any[]>(
      'SELECT * FROM user_credits WHERE user_id = ? FOR UPDATE',
      [userId]
    );

    if (accountRows.length === 0) {
      await connection.rollback();
      return false;
    }

    const currentBalance = parseFloat(accountRows[0].balance);
    if (currentBalance < amount) {
      await connection.rollback();
      return false;
    }

    const newBalance = currentBalance - amount;
    const totalSpent = parseFloat(accountRows[0].total_spent) + amount;

    // 更新余额
    await connection.query(
      'UPDATE user_credits SET balance = ?, total_spent = ?, updated_at = NOW() WHERE user_id = ?',
      [newBalance, totalSpent, userId]
    );

    // 记录交易
    const transactionId = uuidv4();
    await connection.query(
      'INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, description, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [transactionId, userId, 'usage', amount, currentBalance, newBalance, description || null, referenceId || null]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 添加积分
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'initial' | 'bonus' | 'refund' = 'bonus',
  description?: string,
  referenceId?: string
): Promise<void> {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const [accountRows] = await connection.query<any[]>(
      'SELECT * FROM user_credits WHERE user_id = ? FOR UPDATE',
      [userId]
    );

    let account = accountRows;
    if (account.length === 0) {
      await connection.commit();
      await ensureCreditAccount(userId);
      await connection.beginTransaction();
      const [newAccountRows] = await connection.query<any[]>(
        'SELECT * FROM user_credits WHERE user_id = ? FOR UPDATE',
        [userId]
      );
      account = newAccountRows;
    }

    const currentBalance = parseFloat(account[0].balance);
    const newBalance = currentBalance + amount;
    const totalEarned = parseFloat(account[0].total_earned) + amount;

    await connection.query(
      'UPDATE user_credits SET balance = ?, total_earned = ?, updated_at = NOW() WHERE user_id = ?',
      [newBalance, totalEarned, userId]
    );

    const transactionId = uuidv4();
    await connection.query(
      'INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, description, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [transactionId, userId, type, amount, currentBalance, newBalance, description || null, referenceId || null]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 获取交易记录
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const limitInt = Math.max(1, Math.min(1000, Math.floor(limit)));
  const rows = await query<any[]>(
    `SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ${limitInt}`,
    [userId]
  );

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: parseFloat(row.amount),
    balanceBefore: parseFloat(row.balance_before),
    balanceAfter: parseFloat(row.balance_after),
    description: row.description,
    referenceId: row.reference_id,
    createdAt: row.created_at,
  }));
}
```

### 示例 3：模型服务

创建 `src/services/modelService.ts`：

```typescript
import { query } from '../config/database.js';

export interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
  icon: string;
  avatar?: string;
  apiModelId?: string;
  defaultBaseUrl?: string;
  isEnabled: boolean;
}

/**
 * 获取所有启用的模型（不包含 API Key）
 */
export async function listEnabledModels(): Promise<Model[]> {
  const rows = await query<any[]>(
    `SELECT 
      id, name, provider, description, icon, avatar,
      api_model_id, default_base_url, is_enabled
    FROM global_models 
    WHERE is_enabled = TRUE 
    ORDER BY name`
  );

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    provider: row.provider,
    description: row.description,
    icon: row.icon,
    avatar: row.avatar,
    apiModelId: row.api_model_id,
    defaultBaseUrl: row.default_base_url,
    isEnabled: row.is_enabled === 1,
  }));
}

/**
 * 根据 ID 获取模型（不包含 API Key）
 */
export async function getModelById(modelId: string): Promise<Model | null> {
  const rows = await query<any[]>(
    `SELECT 
      id, name, provider, description, icon, avatar,
      api_model_id, default_base_url, is_enabled
    FROM global_models 
    WHERE id = ? AND is_enabled = TRUE`,
    [modelId]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    description: row.description,
    icon: row.icon,
    avatar: row.avatar,
    apiModelId: row.api_model_id,
    defaultBaseUrl: row.default_base_url,
    isEnabled: row.is_enabled === 1,
  };
}
```

---

## 🔒 安全注意事项

### 1. 密码处理

**永远不要：**
- ❌ 在日志中输出密码
- ❌ 将密码存储在客户端
- ❌ 使用明文密码比较

**应该：**
- ✅ 使用 `bcryptjs` 进行密码哈希
- ✅ 使用参数化查询防止 SQL 注入
- ✅ 验证用户输入

### 2. SQL 注入防护

**错误示例：**
```typescript
// ❌ 危险：SQL 注入风险
const sql = `SELECT * FROM users WHERE username = '${username}'`;
```

**正确示例：**
```typescript
// ✅ 安全：使用参数化查询
const rows = await query(
  'SELECT * FROM users WHERE username = ?',
  [username]
);
```

### 3. 并发控制

对于积分扣除等操作，**必须使用事务和锁**：

```typescript
// ✅ 正确：使用 FOR UPDATE 锁
const [rows] = await connection.query(
  'SELECT * FROM user_credits WHERE user_id = ? FOR UPDATE',
  [userId]
);
```

### 4. API Key 保护

**重要：** `global_models` 表中的 `api_key` 字段包含敏感信息，在 Desktop 项目中：

- ✅ 只读取模型配置（id, name, provider 等）
- ❌ 不要读取 `api_key` 字段
- ✅ 如果需要调用 AI API，应该通过 AI Studio 后端代理

---

## 🚀 启动和测试

### 1. 测试数据库连接

创建测试脚本 `test-db.ts`：

```typescript
import { testConnection, query } from './src/config/database.js';

async function test() {
  console.log('Testing database connection...');
  
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }

  // 测试查询
  const users = await query<any[]>(
    'SELECT COUNT(*) as count FROM users'
  );
  console.log('✅ Total users:', users[0].count);

  const models = await query<any[]>(
    'SELECT COUNT(*) as count FROM global_models WHERE is_enabled = TRUE'
  );
  console.log('✅ Enabled models:', models[0].count);

  console.log('✅ All tests passed!');
  process.exit(0);
}

test().catch(console.error);
```

运行测试：

```bash
tsx test-db.ts
```

### 2. 在应用启动时测试连接

```typescript
// src/index.ts
import { testConnection } from './config/database.js';

async function startServer() {
  // 测试数据库连接
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }

  // 启动服务器...
  console.log('✅ Server started successfully');
}

startServer();
```

---

## 📝 最佳实践

### 1. 连接池配置

- 根据应用负载调整 `connectionLimit`
- 生产环境建议设置为 10-20
- 监控连接池使用情况

### 2. 错误处理

```typescript
try {
  const balance = await getCreditBalance(userId);
} catch (error) {
  console.error('Failed to get credit balance:', error);
  // 返回默认值或抛出友好的错误
  throw new Error('Unable to retrieve credit balance');
}
```

### 3. 查询优化

- 使用索引字段进行查询（如 `user_id`, `username`）
- 避免 `SELECT *`，只查询需要的字段
- 使用 `LIMIT` 限制结果集大小

### 4. 事务使用

对于需要原子性的操作（如积分扣除），必须使用事务：

```typescript
const connection = await getConnection();
try {
  await connection.beginTransaction();
  // ... 执行多个操作 ...
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

---

## 🔧 故障排除

### 问题 1：连接失败

**错误信息：**
```
❌ Database connection failed: Error: connect ECONNREFUSED
```

**解决方案：**
1. 检查 MySQL 服务是否运行
2. 检查 `DB_HOST` 和 `DB_PORT` 配置
3. 检查防火墙设置
4. 验证数据库用户权限

### 问题 2：认证失败

**错误信息：**
```
❌ Database connection failed: Error: Access denied for user
```

**解决方案：**
1. 检查 `DB_USER` 和 `DB_PASSWORD`
2. 验证用户是否有访问数据库的权限
3. 检查用户是否被允许从当前主机连接

### 问题 3：表不存在

**错误信息：**
```
❌ Table 'forsion_ai_studio.users' doesn't exist
```

**解决方案：**
1. 确保数据库已创建
2. 运行 AI Studio 的数据库迁移脚本：
   ```bash
   cd forsion-ai-studio/server-node
   npm run db:migrate
   ```

### 问题 4：并发问题

**症状：** 积分扣除不准确

**解决方案：**
- 确保使用 `FOR UPDATE` 锁
- 使用事务包装相关操作
- 检查是否有其他地方直接修改数据库

---

## 📚 相关资源

- [mysql2 官方文档](https://github.com/sidorares/node-mysql2)
- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [Forsion AI Studio 数据库迁移脚本](../server-node/src/db/migrate.ts)

---

## 🎯 总结

通过共享 MySQL 数据库，Forsion Desktop 可以：

1. ✅ 直接访问用户、积分、模型数据
2. ✅ 实现数据实时同步
3. ✅ 避免 HTTP API 调用的网络开销
4. ✅ 简化架构，易于维护

**关键要点：**
- 使用相同的数据库配置
- 使用参数化查询防止 SQL 注入
- 对关键操作使用事务和锁
- 不要读取敏感信息（如 API Key）

---

**文档版本：** 1.0.0  
**最后更新：** 2024年

