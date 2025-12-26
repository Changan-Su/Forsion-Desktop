# Forsion Backend Service - 后端服务与 API 使用文档

版本：v2.0.0 | 最后更新：2025年12月

## 📋 目录

- [服务简介](#服务简介)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [环境变量配置](#环境变量配置)
- [数据库准备](#数据库准备)
- [启动服务](#启动服务)
- [API 接口使用](#api-接口使用)
- [客户端集成](#客户端集成)
- [常见问题](#常见问题)

---

## 服务简介

### 服务定位

**Forsion Backend Service** 是一个统一的、企业级的后端 API 服务，为 Forsion 系列项目（AI Studio、Desktop 等）提供：

- ✅ **多项目共用**：AI Studio、Desktop 等项目可以共享同一个后端
- ✅ **用户体系统一**：用户可以跨项目登录，积分和数据共享
- ✅ **完全独立**：包含管理面板，可以单独复制、部署和运行，无需依赖其他目录
- ✅ **Docker 容器化**：支持 Docker 部署，包含所有必要文件
- ✅ **可扩展性强**：易于添加新功能模块和集成新项目

### 核心功能模块

1. **用户认证系统 (JWT)**
   - 用户注册/登录
   - 邀请码机制
   - 角色权限管理（管理员/普通用户）

2. **AI 模型管理**
   - 支持多种 AI 模型（Gemini、OpenAI、DeepSeek、Claude 等）
   - 自定义模型配置
   - API Key 安全管理

3. **AI 对话接口**
   - OpenAI 兼容的聊天接口
   - 流式响应（SSE）
   - 图片、PDF、Word 文档处理

4. **积分系统**
   - 基于 Token 使用的动态计费
   - 积分余额查询和交易历史
   - 自定义定价配置

5. **使用统计**
   - 详细的 API 调用日志
   - 按模型、日期、用户、项目聚合统计
   - 项目来源识别

6. **管理面板（内置）**
   - 已内置在后端服务中，通过 `/admin` 路径访问
   - 用户管理、模型管理、使用统计查看
   - 邀请码管理、系统监控
   - 无需额外部署，随后端服务自动提供

---

## 环境要求

### 必需环境

- **Node.js**: 18.0 或更高版本
- **MySQL**: 8.0 或更高版本
- **npm**: 随 Node.js 安装，或使用 yarn

### 验证环境

```bash
# 检查 Node.js 版本
node --version  # 应该 >= 18.0.0

# 检查 MySQL 版本
mysql --version  # 应该 >= 8.0.0

# 检查 npm 版本
npm --version
```

---

## 快速开始

### 1. 安装依赖

```bash
cd server-node
npm install
```

### 2. 配置环境变量

```bash
# 复制示例文件
cp env.example .env

# 编辑 .env 文件，设置数据库连接信息
# 详见下方"环境变量配置"章节
```

### 3. 初始化数据库

```bash
# 创建数据库（在 MySQL 中执行）
mysql -u root -p
CREATE DATABASE forsion_shared_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 运行数据库迁移
npm run db:migrate

# 可选：填充示例数据
npm run db:seed
```

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

服务默认运行在 `http://localhost:3001`

---

## 环境变量配置

### 配置文件位置

- 开发环境：`server-node/.env`
- 生产环境：通过环境变量或 `.env` 文件配置

### 必需配置项

#### 服务配置

```env
# 服务名称
SERVICE_NAME=forsion-backend-service

# 服务端口
PORT=3001

# 运行环境
NODE_ENV=development  # 或 production
```

#### 数据库配置

```env
# MySQL 数据库连接
DB_HOST=localhost          # 本地开发使用 localhost，Docker 使用 mysql
DB_PORT=3306
DB_USER=root              # 数据库用户名
DB_PASSWORD=your_password # 数据库密码（必填）
DB_NAME=forsion_shared_db # 数据库名称
```

#### JWT 配置

```env
# JWT 密钥（生产环境务必使用强密码，至少 32 字符）
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Token 过期时间
JWT_EXPIRES_IN=7d  # 7 天
```

#### 管理员凭据

```env
# 首次启动时自动创建管理员账户
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123!@#  # 生产环境务必修改
```

### 可选配置项

#### CORS 配置（多项目支持）

```env
# 允许的前端项目来源（逗号分隔）
# 开发环境示例
ALLOWED_ORIGINS=http://localhost:50173,http://localhost:3000,http://localhost:6006

# 生产环境示例
ALLOWED_ORIGINS=https://studio.example.com,https://desktop.example.com
```

#### 功能开关

```env
# 启用邀请码功能
ENABLE_INVITE_CODES=true

# 启用积分系统
ENABLE_CREDIT_SYSTEM=true
```

### 完整配置示例

```env
# Service Configuration
SERVICE_NAME=forsion-backend-service
PORT=3001
NODE_ENV=development

# CORS Configuration (Multi-project support)
ALLOWED_ORIGINS=http://localhost:50173,http://localhost:3000,http://localhost:6006

# Database Configuration (MySQL - Shared across projects)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=forsion_shared_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Admin Default Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin123!@#

# Feature Toggles (Optional)
ENABLE_INVITE_CODES=true
ENABLE_CREDIT_SYSTEM=true
```

---

## 数据库准备

### 创建数据库

```sql
-- 登录 MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE forsion_shared_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（可选，推荐用于生产环境）
CREATE USER 'forsion'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON forsion_shared_db.* TO 'forsion'@'localhost';
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

### 运行数据库迁移

```bash
cd server-node
npm run db:migrate
```

迁移脚本会自动创建以下数据表：

- `users` - 用户基本信息
- `user_settings` - 用户个性化设置
- `user_credits` - 用户积分账户
- `credit_transactions` - 积分交易记录
- `global_models` - AI 模型配置
- `api_usage_logs` - API 使用日志（包含 `project_source` 字段）
- `invite_codes` - 邀请码管理
- `credit_pricing` - 模型定价配置
- `global_settings` - 全局设置

### 填充示例数据（可选）

```bash
npm run db:seed
```

这会创建：
- 默认管理员账户（如果不存在）
- 内置 AI 模型配置
- 示例邀请码

---

## 启动服务

### 开发模式

```bash
cd server-node
npm run dev
```

特点：
- ✅ 自动热重载（代码修改后自动重启）
- ✅ 详细的错误信息
- ✅ TypeScript 直接运行（无需编译）

### 生产模式

```bash
# 1. 编译 TypeScript
npm run build

# 2. 启动服务
npm start
```

### 使用 PM2（推荐生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start dist/index.js --name forsion-backend

# 查看状态
pm2 status

# 查看日志
pm2 logs forsion-backend

# 设置开机自启
pm2 startup
pm2 save
```

### 验证服务运行

```bash
# 健康检查
curl http://localhost:3001/api/health

# 服务信息
curl http://localhost:3001/api/info
```

---

## API 接口使用

### 基础信息

- **Base URL**: `http://localhost:3001` (开发环境)
- **认证方式**: JWT Bearer Token
- **Content-Type**: `application/json`
- **项目来源标识**: 通过 `X-Project-Source` 请求头传递

### 认证流程

所有需要认证的接口都需要在请求头中携带 JWT Token：

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### 核心 API 端点速查

| 端点 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/health` | GET | 健康检查 | ❌ |
| `/api/info` | GET | 服务元信息 | ❌ |
| `/api/auth/login` | POST | 用户登录 | ❌ |
| `/api/auth/register` | POST | 用户注册 | ❌ |
| `/api/auth/me` | GET | 获取当前用户信息 | ✅ |
| `/api/users/settings` | GET | 获取用户设置（头像、昵称等） | ✅ |
| `/api/users/settings` | PUT | 更新用户设置（头像、昵称等） | ✅ |
| `/api/models` | GET | 获取可用模型列表 | ✅ |
| `/api/chat/completions` | POST | AI 对话接口 | ✅ |
| `/api/credits/balance` | GET | 查询积分余额 | ✅ |
| `/api/credits/transactions` | GET | 积分交易历史 | ✅ |
| `/api/usage/logs` | GET | 获取使用日志 | ✅ |
| `/api/usage/stats` | GET | 获取统计数据 | ✅ |
| `/api/desk/apps` | GET | 获取所有可用应用 | ✅ |
| `/api/desk/user-apps` | GET | 获取用户已安装应用 | ✅ |
| `/api/desk/apps/:appId/install` | POST | 安装应用 | ✅ |
| `/api/desk/apps/:appId/uninstall` | DELETE | 卸载应用 | ✅ |
| `/api/desk/apps` | POST | 创建应用 | ✅ |
| `/api/desk/apps/:appId` | PUT | 更新应用 | ✅ |
| `/api/desk/apps/:appId` | DELETE | 删除应用 | ✅ |
| `/api/desk/admin/apps` | GET | 获取所有应用（管理员） | ✅ |

---

### 1. 系统信息接口

#### 健康检查

```http
GET /api/health
```

**响应示例：**

```json
{
  "status": "healthy",
  "service": "forsion-backend-service",
  "version": "2.0.0",
  "timestamp": "2025-12-25T10:00:00.000Z",
  "database": "connected"
}
```

#### 服务信息

```http
GET /api/info
```

**响应示例：**

```json
{
  "name": "Forsion Backend Service",
  "version": "2.0.0",
  "description": "Unified Backend Service for Forsion Projects",
  "supportedProjects": ["ai-studio", "desktop", "forsion-desk"],
  "features": ["auth", "ai-models", "chat", "credits", "usage-stats", "forsion-desk"],
  "endpoints": {
    "auth": "/api/auth",
    "models": "/api/models",
    "chat": "/api/chat",
    "credits": "/api/credits",
    "usage": "/api/usage",
    "desk": "/api/desk",
    "health": "/api/health"
  }
}
```

---

### 2. 认证接口

#### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin123!@#"
}
```

**响应：**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "role": "ADMIN",
    "status": "active",
    "avatar": "data:image/png;base64,...",
    "nickname": "管理员"
  }
}
```

**字段说明：**
- `avatar`: 用户头像（Base64 编码的图片数据或 URL），可能为 `null`
- `nickname`: 用户昵称，可能为 `null`

**使用示例（curl）：**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!@#"}'
```

#### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "SecurePassword123!",
  "email": "newuser@example.com",
  "inviteCode": "INVITE-CODE-123"
}
```

**响应：**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "USER",
    "status": "active",
    "avatar": null,
    "nickname": null
  }
}
```

**字段说明：**
- `avatar`: 用户头像（Base64 编码的图片数据或 URL），新用户默认为 `null`
- `nickname`: 用户昵称，新用户默认为 `null`

#### 获取当前用户信息

```http
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

**响应：**

```json
{
  "id": "uuid",
  "username": "admin",
  "role": "ADMIN",
  "email": "admin@example.com",
  "status": "active",
  "avatar": "data:image/png;base64,...",
  "nickname": "管理员"
}
```

**字段说明：**
- `avatar`: 用户头像（Base64 编码的图片数据或 URL），从 `user_settings` 表读取，可能为 `null`
- `nickname`: 用户昵称，从 `user_settings` 表读取，可能为 `null`

**使用示例（curl）：**

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. 用户设置接口

#### 获取用户设置

```http
GET /api/users/settings
Authorization: Bearer YOUR_JWT_TOKEN
```

**响应：**

```json
{
  "nickname": "管理员",
  "avatar": "data:image/png;base64,...",
  "theme": "dark",
  "themePreset": "default",
  "customModels": [],
  "externalApiConfigs": {},
  "developerMode": false,
  "defaultModelId": "gemini-2.0-flash-exp"
}
```

**字段说明：**
- `nickname`: 用户昵称，可能为 `null`
- `avatar`: 用户头像（Base64 编码的图片数据），可能为 `null`
- `theme`: 主题设置（`light` 或 `dark`）
- `themePreset`: 主题预设
- `customModels`: 自定义模型列表
- `externalApiConfigs`: 外部 API 配置
- `developerMode`: 开发者模式开关
- `defaultModelId`: 默认模型 ID

**使用示例（curl）：**

```bash
curl -X GET http://localhost:3001/api/users/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 更新用户设置

```http
PUT /api/users/settings
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "nickname": "新昵称",
  "avatar": "data:image/png;base64,...",
  "theme": "dark",
  "themePreset": "default"
}
```

**请求字段说明：**
- `nickname`: 用户昵称（可选，字符串，最大 100 字符）
- `avatar`: 用户头像（可选，Base64 编码的图片数据，最大 16MB）
- `theme`: 主题设置（可选，`light` 或 `dark`）
- `themePreset`: 主题预设（可选）
- `customModels`: 自定义模型列表（可选）
- `externalApiConfigs`: 外部 API 配置（可选）
- `developerMode`: 开发者模式（可选，布尔值）

**响应：**

返回更新后的完整用户设置对象（格式与 GET 请求相同）。

**使用示例（curl）：**

```bash
curl -X PUT http://localhost:3001/api/users/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "新昵称",
    "avatar": "data:image/png;base64,..."
  }'
```

**重要提示：**
- 头像数据支持 Base64 编码的图片（格式：`data:image/png;base64,...`）
- 头像大小限制：最大 16MB
- 所有字段都是可选的，只需传递需要更新的字段
- 头像和昵称数据存储在 `user_settings` 表中

---

### 4. 模型管理接口

#### 获取可用模型列表

```http
GET /api/models
Authorization: Bearer YOUR_JWT_TOKEN
```

**响应示例：**

```json
[
  {
    "id": "gemini-2.0-flash-exp",
    "name": "Gemini 2.0 Flash",
    "provider": "gemini",
    "description": "Google's latest fast model",
    "icon": "Sparkles",
    "isEnabled": true,
    "apiModelId": "gemini-2.0-flash-exp",
    "defaultBaseUrl": "https://generativelanguage.googleapis.com/v1beta"
  },
  {
    "id": "gpt-4",
    "name": "GPT-4",
    "provider": "openai",
    "description": "OpenAI's most capable model",
    "icon": "Brain",
    "isEnabled": true
  }
]
```

---

### 5. AI 对话接口

#### 聊天补全（兼容 OpenAI 格式）

**请求：**

```http
POST /api/chat/completions
Authorization: Bearer YOUR_JWT_TOKEN
X-Project-Source: ai-studio
Content-Type: application/json

{
  "model_id": "gemini-2.0-flash-exp",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000,
  "stream": true
}
```

**重要提示：**
- 必须添加 `X-Project-Source` 请求头标识项目来源（`ai-studio`、`desktop` 或 `calendar`）
- `stream: true` 启用流式响应（SSE）
- `stream: false` 返回完整响应

**流式响应（SSE）示例：**

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":"!"}}]}

data: {"choices":[{"delta":{"content":" I'm"}}]}

data: [DONE]
```

**非流式响应示例：**

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1703520000,
  "model": "gemini-2.0-flash-exp",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

**使用示例（curl - 非流式）：**

```bash
curl -X POST http://localhost:3001/api/chat/completions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Project-Source: ai-studio" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "gemini-2.0-flash-exp",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

**使用示例（JavaScript - 流式响应）：**

```javascript
const response = await fetch('http://localhost:3001/api/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Project-Source': 'ai-studio',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model_id: 'gemini-2.0-flash-exp',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split('\n').filter(line => line.trim());

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      
      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content || '';
      console.log(content); // 实时输出内容
    }
  }
}
```

---

### 6. 积分系统接口

#### 查询积分余额

```http
GET /api/credits/balance
Authorization: Bearer YOUR_JWT_TOKEN
```

**响应：**

```json
{
  "userId": "uuid",
  "balance": 98.50,
  "totalEarned": 100.00,
  "totalSpent": 1.50,
  "updatedAt": "2025-12-25T10:00:00.000Z"
}
```

#### 积分交易历史

```http
GET /api/credits/transactions?limit=20&offset=0
Authorization: Bearer YOUR_JWT_TOKEN
```

**查询参数：**
- `limit`: 返回记录数（默认 20）
- `offset`: 偏移量（用于分页）

**响应：**

```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "usage",
      "amount": -0.50,
      "balanceBefore": 99.00,
      "balanceAfter": 98.50,
      "description": "AI chat completion",
      "createdAt": "2025-12-25T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 7. 使用统计接口

#### 获取使用日志

```http
GET /api/usage/logs?limit=50&offset=0
Authorization: Bearer YOUR_JWT_TOKEN
```

**查询参数：**
- `limit`: 返回记录数（默认 50，最大 1000）
- `offset`: 偏移量
- `username`: 过滤特定用户（可选）
- `modelId`: 过滤特定模型（可选）
- `projectSource`: 过滤特定项目（可选，如 `ai-studio`、`desktop`）

**响应：**

```json
{
  "logs": [
    {
      "id": 12345,
      "username": "admin",
      "modelId": "gpt-4",
      "modelName": "GPT-4",
      "provider": "openai",
      "projectSource": "ai-studio",
      "tokensInput": 100,
      "tokensOutput": 50,
      "success": true,
      "createdAt": "2025-12-25T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### 获取统计数据

```http
GET /api/usage/stats?days=7
Authorization: Bearer YOUR_JWT_TOKEN
```

**查询参数：**
- `days`: 统计天数（默认 7）
- `username`: 过滤特定用户（可选）

**响应：**

```json
{
  "totalRequests": 1250,
  "totalTokensInput": 125000,
  "totalTokensOutput": 62500,
  "successRate": 99.2,
  "successful": 1240,
  "failed": 10,
  "byModel": [
    {
      "modelId": "gpt-4",
      "modelName": "GPT-4",
      "count": 500,
      "tokens": 75000
    }
  ],
  "byDay": [
    {
      "date": "2025-12-25",
      "count": 200,
      "tokens": 30000
    }
  ],
  "byUser": [
    {
      "username": "admin",
      "count": 800,
      "tokens": 120000
    }
  ],
  "byProject": [
    {
      "projectSource": "ai-studio",
      "count": 900,
      "tokens": 135000
    },
    {
      "projectSource": "desktop",
      "count": 350,
      "tokens": 52500
    }
  ]
}
```

---

### 8. Forsion Desk 应用市场接口

Forsion Desk 应用市场允许管理员管理全局应用，用户创建私有应用，以及用户安装/卸载应用。

#### 获取所有可用应用

```http
GET /api/desk/apps
Authorization: Bearer YOUR_JWT_TOKEN
```

**响应：**

返回当前用户可见的所有应用列表（全局应用 + 用户创建的私有应用）。

```json
[
  {
    "id": "app-uuid-1",
    "name": "My App",
    "description": "App description",
    "icon": "data:image/png;base64,...",
    "url": "https://example.com",
    "isGlobal": true,
    "createdBy": "user-uuid",
    "isActive": true,
    "sortOrder": 0,
    "category": "Productivity",
    "createdAt": "2025-12-25T10:00:00.000Z",
    "updatedAt": "2025-12-25T10:00:00.000Z"
  }
]
```

**字段说明：**
- `icon`: 应用图标，支持 Base64 编码（`data:image/png;base64,...`）或 URL 链接
- `isGlobal`: 是否为全局应用（管理员创建）
- `createdBy`: 创建者用户 ID
- `isActive`: 应用是否启用
- `sortOrder`: 排序顺序（数字越小越靠前）
- `category`: 应用分类

**使用示例（curl）：**

```bash
curl -X GET http://localhost:3001/api/desk/apps \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 获取用户已安装的应用

```http
GET /api/desk/user-apps
Authorization: Bearer YOUR_JWT_TOKEN
```

**响应：**

返回用户已安装的应用详情列表。

```json
[
  {
    "id": "app-uuid-1",
    "name": "My App",
    "description": "App description",
    "icon": "data:image/png;base64,...",
    "url": "https://example.com",
    "isGlobal": true,
    "isActive": true,
    "sortOrder": 0,
    "category": "Productivity"
  }
]
```

**使用示例（curl）：**

```bash
curl -X GET http://localhost:3001/api/desk/user-apps \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 安装应用

```http
POST /api/desk/apps/:appId/install
Authorization: Bearer YOUR_JWT_TOKEN
```

**路径参数：**
- `appId`: 应用 ID

**响应：**

```json
{
  "success": true
}
```

**使用示例（curl）：**

```bash
curl -X POST http://localhost:3001/api/desk/apps/app-uuid-1/install \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 卸载应用

```http
DELETE /api/desk/apps/:appId/uninstall
Authorization: Bearer YOUR_JWT_TOKEN
```

**路径参数：**
- `appId`: 应用 ID

**响应：**

```json
{
  "success": true
}
```

**使用示例（curl）：**

```bash
curl -X DELETE http://localhost:3001/api/desk/apps/app-uuid-1/uninstall \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 获取应用详情

```http
GET /api/desk/apps/:appId
Authorization: Bearer YOUR_JWT_TOKEN
```

**路径参数：**
- `appId`: 应用 ID

**响应：**

返回应用的完整信息（格式与获取所有应用中的单个应用对象相同）。

#### 创建应用

```http
POST /api/desk/apps
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "My App",
  "description": "App description",
  "icon": "data:image/png;base64,...",
  "url": "https://example.com",
  "isGlobal": false,
  "isActive": true,
  "sortOrder": 0,
  "category": "Productivity"
}
```

**请求字段说明：**
- `name` (必需): 应用名称
- `url` (必需): 应用链接
- `description` (可选): 应用介绍
- `icon` (可选): 应用图标（Base64 或 URL）
- `isGlobal` (可选): 是否为全局应用，默认为 `false`（仅管理员可创建全局应用）
- `isActive` (可选): 是否启用，默认为 `true`
- `sortOrder` (可选): 排序顺序，默认为 `0`
- `category` (可选): 应用分类

**权限说明：**
- 管理员可以创建全局应用（`isGlobal: true`）
- 所有认证用户可以创建私有应用（`isGlobal: false`）

**响应：**

返回创建的应用对象。

**使用示例（curl）：**

```bash
curl -X POST http://localhost:3001/api/desk/apps \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "description": "A great app",
    "url": "https://example.com",
    "icon": "https://example.com/icon.png",
    "category": "Productivity"
  }'
```

#### 更新应用

```http
PUT /api/desk/apps/:appId
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Updated App Name",
  "description": "Updated description",
  "icon": "data:image/png;base64,...",
  "url": "https://new-url.com",
  "isActive": true,
  "sortOrder": 1,
  "category": "Entertainment"
}
```

**路径参数：**
- `appId`: 应用 ID

**请求字段说明：**
所有字段都是可选的，只需传递需要更新的字段。

**权限说明：**
- 管理员可以编辑所有应用（包括全局应用）
- 用户只能编辑自己创建的私有应用
- 只有管理员可以修改 `isGlobal` 字段

**响应：**

返回更新后的应用对象。

**使用示例（curl）：**

```bash
curl -X PUT http://localhost:3001/api/desk/apps/app-uuid-1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "description": "Updated description"
  }'
```

#### 删除应用

```http
DELETE /api/desk/apps/:appId
Authorization: Bearer YOUR_JWT_TOKEN
```

**路径参数：**
- `appId`: 应用 ID

**权限说明：**
- 管理员可以删除所有应用（包括全局应用）
- 用户只能删除自己创建的私有应用

**响应：**

```json
{
  "success": true
}
```

**使用示例（curl）：**

```bash
curl -X DELETE http://localhost:3001/api/desk/apps/app-uuid-1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**注意：** 删除应用时，会自动从所有用户的已安装应用列表中移除该应用。

#### 管理员获取所有应用（包含禁用应用）

```http
GET /api/desk/admin/apps
Authorization: Bearer YOUR_JWT_TOKEN
```

**权限：** 仅管理员

**响应：**

返回所有应用列表（包括禁用和未禁用的应用）。

**使用示例（curl）：**

```bash
curl -X GET http://localhost:3001/api/desk/admin/apps \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### 图标处理最佳实践

应用图标支持两种格式：

1. **Base64 编码图片**
   ```json
   {
     "icon": "data:image/png;base64,iVBORw0KGgoAAAANS..."
   }
   ```

2. **URL 链接**
   ```json
   {
     "icon": "https://example.com/icon.png"
   }
   ```

**推荐做法：**
- 图标大小限制：最大 16MB
- 建议图标尺寸：64x64 到 512x512 像素
- 支持的图片格式：PNG、JPEG、SVG、WebP
- 对于小图标（< 100KB），推荐使用 Base64 编码
- 对于大图标，推荐使用 URL 链接

---

#### 客户端集成示例（TypeScript）

```typescript
// src/services/deskService.ts
import { apiClient } from './api';

export interface ForsionApp {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  url: string;
  isGlobal: boolean;
  createdBy?: string;
  isActive: boolean;
  sortOrder: number;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 获取所有可用应用
export async function getAllApps(): Promise<ForsionApp[]> {
  const response = await apiClient.get('/api/desk/apps');
  return response.data;
}

// 获取用户已安装的应用
export async function getUserInstalledApps(): Promise<ForsionApp[]> {
  const response = await apiClient.get('/api/desk/user-apps');
  return response.data;
}

// 安装应用
export async function installApp(appId: string): Promise<void> {
  await apiClient.post(`/api/desk/apps/${appId}/install`);
}

// 卸载应用
export async function uninstallApp(appId: string): Promise<void> {
  await apiClient.delete(`/api/desk/apps/${appId}/uninstall`);
}

// 获取应用详情
export async function getAppById(appId: string): Promise<ForsionApp> {
  const response = await apiClient.get(`/api/desk/apps/${appId}`);
  return response.data;
}

// 创建应用
export async function createApp(appData: {
  name: string;
  url: string;
  description?: string;
  icon?: string;
  isGlobal?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  category?: string;
}): Promise<ForsionApp> {
  const response = await apiClient.post('/api/desk/apps', appData);
  return response.data;
}

// 更新应用
export async function updateApp(
  appId: string,
  appData: Partial<{
    name: string;
    description: string;
    icon: string;
    url: string;
    isGlobal: boolean;
    isActive: boolean;
    sortOrder: number;
    category: string;
  }>
): Promise<ForsionApp> {
  const response = await apiClient.put(`/api/desk/apps/${appId}`, appData);
  return response.data;
}

// 删除应用
export async function deleteApp(appId: string): Promise<void> {
  await apiClient.delete(`/api/desk/apps/${appId}`);
}

// 将图片文件转换为 Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 上传图标（从文件）
export async function uploadAppIcon(file: File): Promise<string> {
  // 检查文件大小（最大 16MB）
  if (file.size > 16 * 1024 * 1024) {
    throw new Error('图标文件大小不能超过 16MB');
  }
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    throw new Error('只能上传图片文件');
  }
  
  // 转换为 Base64
  return await fileToBase64(file);
}
```

---

### 项目来源标识

所有 API 请求建议添加 `X-Project-Source` 请求头，用于统计不同项目的使用情况：

```http
X-Project-Source: ai-studio
```

**支持的值：**
- `ai-studio` - Forsion AI Studio
- `desktop` - Forsion Desktop
- `calendar` - Forsion Calendar

**使用示例：**

```javascript
// 在 axios 中配置
axios.defaults.headers.common['X-Project-Source'] = 'ai-studio';

// 或在 fetch 中
fetch('/api/chat/completions', {
  headers: {
    'X-Project-Source': 'ai-studio',
    'Authorization': `Bearer ${token}`
  }
});
```

---

### 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "detail": "Error message description"
}
```

**常见状态码：**
- `200` - 成功
- `400` - 请求参数错误
- `401` - 未认证或 Token 无效
- `402` - 积分不足
- `403` - 权限不足
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 客户端集成

### 前端项目配置

#### 1. 环境变量配置

在前端项目根目录创建 `.env.local` 文件：

```env
# API 服务地址
VITE_API_URL=http://localhost:3001

# 项目标识
VITE_PROJECT_SOURCE=ai-studio
```

#### 2. API 客户端配置

```typescript
// src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PROJECT_SOURCE = import.meta.env.VITE_PROJECT_SOURCE || 'ai-studio';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Project-Source': PROJECT_SOURCE,
  },
});

// 请求拦截器：添加认证 Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除本地存储并跳转登录
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 3. 使用示例

```typescript
import { apiClient } from './services/api';

// 登录
export async function login(username: string, password: string) {
  const response = await apiClient.post('/api/auth/login', {
    username,
    password,
  });
  return response.data;
}

// 获取模型列表
export async function getModels() {
  const response = await apiClient.get('/api/models');
  return response.data;
}

// 发送聊天消息
export async function sendChatMessage(modelId: string, messages: any[]) {
  const response = await apiClient.post('/api/chat/completions', {
    model_id: modelId,
    messages,
    stream: true,
  });
  return response.data;
}

// 获取用户设置（包括头像和昵称）
export async function getUserSettings() {
  const response = await apiClient.get('/api/users/settings');
  return response.data;
}

// 更新用户设置
export async function updateUserSettings(settings: {
  nickname?: string;
  avatar?: string;
  theme?: 'light' | 'dark';
  themePreset?: string;
  customModels?: any[];
  externalApiConfigs?: any;
  developerMode?: boolean;
}) {
  const response = await apiClient.put('/api/users/settings', settings);
  return response.data;
}

// 更新用户昵称
export async function updateNickname(nickname: string) {
  return updateUserSettings({ nickname });
}

// 更新用户头像
export async function updateAvatar(avatar: string) {
  return updateUserSettings({ avatar });
}

// 将图片文件转换为 Base64 格式
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 上传头像（从文件）
export async function uploadAvatar(file: File) {
  // 检查文件大小（最大 16MB）
  if (file.size > 16 * 1024 * 1024) {
    throw new Error('头像文件大小不能超过 16MB');
  }
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    throw new Error('只能上传图片文件');
  }
  
  // 转换为 Base64
  const base64 = await fileToBase64(file);
  
  // 更新头像
  return updateAvatar(base64);
}
```

---

## 常见问题

### 1. 数据库连接失败

**错误信息：** `Access denied for user 'root'@'localhost' (using password: NO)`

**解决方法：**
- 检查 `.env` 文件中的 `DB_PASSWORD` 是否已设置
- 确认 MySQL 服务正在运行
- 验证数据库用户权限

```bash
# 检查 MySQL 服务
# Windows
net start MySQL80

# Linux/Mac
sudo systemctl status mysql

# 测试连接
mysql -h localhost -P 3306 -u root -p
```

### 2. 数据库不存在

**错误信息：** `Unknown database 'forsion_shared_db'`

**解决方法：**

```sql
-- 创建数据库
mysql -u root -p
CREATE DATABASE forsion_shared_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

然后运行迁移：

```bash
npm run db:migrate
```

### 3. 端口被占用

**错误信息：** `Port 3001 is already in use`

**解决方法：**

```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001

# 使用不同的端口
# 在 .env 中修改 PORT=3002
```

### 4. CORS 错误

**错误信息：** `Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:50173' has been blocked by CORS policy`

**解决方法：**
- 检查 `.env` 文件中的 `ALLOWED_ORIGINS` 配置
- 确保前端地址已添加到允许列表

```env
ALLOWED_ORIGINS=http://localhost:50173,http://localhost:3000,http://localhost:6006
```

### 5. Token 过期

**错误信息：** `401 Unauthorized` 或 `Invalid or expired token`

**解决方法：**
- 重新登录获取新 Token
- 检查 `JWT_EXPIRES_IN` 配置
- 清除浏览器缓存和 localStorage

### 6. 积分不足

**错误信息：** `402 Payment Required` 或 `Insufficient credits`

**解决方法：**
- 查询积分余额：`GET /api/credits/balance`
- 通过邀请码注册获取初始积分
- 管理员可以通过管理面板调整用户积分

---

## 相关文档

- [后端服务完整文档](../server-node/README.md)
- [详细 API 文档](../server-node/docs/API.md)
- [客户端集成指南](../server-node/docs/CLIENT_INTEGRATION.md)
- [部署指南](../server-node/DEPLOYMENT.md)

---

## 技术支持

如有问题，请：

1. 查看本文档的"常见问题"章节
2. 查看 [API 文档](../server-node/docs/API.md) 获取详细接口说明
3. 查看后端服务日志排查问题
4. 提交 Issue 到项目仓库

---

**最后更新**：2025年12月  
**文档版本**：v2.0.0

