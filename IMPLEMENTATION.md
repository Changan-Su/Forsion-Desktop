# Forsion Desktop - API 文档

本文档详细说明了 Forsion Desktop 的后端 API 接口。

## 🔌 API 端点

### 认证 API

所有认证端点不需要 JWT token。

#### POST /api/auth/register

用户注册

**请求体:**
```json
{
  "username": "string",
  "password": "string",
  "email": "string"
}
```

**响应:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "role": "user"
  }
}
```

#### POST /api/auth/login

用户登录

**请求体:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "role": "user"
  }
}
```

#### GET /api/auth/me

获取当前用户信息（需要认证）

**Headers:**
```
Authorization: Bearer <token>
```

**响应:**
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "role": "user"
  }
}
```

### 聊天 API

#### POST /api/chat

发送消息（支持流式响应）

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体:**
```json
{
  "message": "string",
  "sessionId": 1,  // 可选，如果不存在则创建新会话
  "model": "string",  // 可选，模型ID
  "stream": true  // 是否使用流式响应
}
```

**流式响应 (SSE):**
```
data: {"chunk": "Hello"}

data: {"chunk": " world"}

data: {"done": true, "sessionId": 1, "messageId": 1}
```

**非流式响应:**
```json
{
  "content": "完整的响应内容",
  "model": "model_id",
  "sessionId": 1,
  "messageId": 1
}
```

#### GET /api/chat/models

获取可用模型列表（需要认证）

**Headers:**
```
Authorization: Bearer <token>
```

**查询参数:**
- `refresh` (boolean, 可选): 强制刷新模型列表

**响应:**
```json
{
  "models": [
    {
      "id": "string",
      "name": "string",
      "provider": "gemini|openai|deepseek|claude|external",
      "description": "string",
      "enabled": true,
      "icon": "string",
      "avatar": "string|null",
      "apiModelId": "string|null",
      "defaultBaseUrl": "string|null"
    }
  ]
}
```

### 会话 API

所有会话端点需要认证。

#### GET /api/sessions

获取当前用户的所有会话

**响应:**
```json
{
  "sessions": [
    {
      "id": 1,
      "user_id": 1,
      "title": "string",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/sessions

创建新会话

**请求体:**
```json
{
  "title": "string"  // 可选
}
```

**响应:**
```json
{
  "session": {
    "id": 1,
    "user_id": 1,
    "title": "string",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/sessions/:id

获取会话详情

**响应:**
```json
{
  "session": {
    "id": 1,
    "user_id": 1,
    "title": "string",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/sessions/:id

更新会话（主要是标题）

**请求体:**
```json
{
  "title": "新的标题"
}
```

**响应:**
```json
{
  "session": {
    "id": 1,
    "user_id": 1,
    "title": "新的标题",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE /api/sessions/:id

删除会话

**响应:**
```json
{
  "message": "Session deleted"
}
```

### 消息 API

所有消息端点需要认证。

#### GET /api/sessions/:sessionId/messages

获取会话的所有消息

**响应:**
```json
{
  "messages": [
    {
      "id": 1,
      "session_id": 1,
      "role": "user|assistant",
      "content": "string",
      "model_used": "string",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/sessions/:sessionId/messages

保存消息

**请求体:**
```json
{
  "role": "user|assistant",
  "content": "string",
  "modelUsed": "string"  // 可选
}
```

**响应:**
```json
{
  "message": {
    "id": 1,
    "session_id": 1,
    "role": "user",
    "content": "string",
    "model_used": "string",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE /api/messages/:id

删除消息

**响应:**
```json
{
  "message": "Message deleted"
}
```

### 设置 API

所有设置端点需要认证。

#### GET /api/settings

获取用户设置

**响应:**
```json
{
  "settings": {
    "id": 1,
    "user_id": 1,
    "preferred_model": "model_id",
    "theme_preferences": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/settings

更新用户设置

**请求体:**
```json
{
  "preferred_model": "model_id",  // 可选
  "theme_preferences": {}  // 可选
}
```

**响应:**
```json
{
  "settings": {
    "id": 1,
    "user_id": 1,
    "preferred_model": "model_id",
    "theme_preferences": {},
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 健康检查

#### GET /health

检查服务器和数据库状态

**响应:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": "connected|disconnected|error"
}
```

## 📝 数据库架构

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR(50) | 用户名（唯一） |
| email | VARCHAR(100) | 邮箱（唯一） |
| password_hash | VARCHAR(255) | 加密密码 |
| role | ENUM('user', 'admin') | 角色 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### sessions 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID（外键） |
| title | VARCHAR(255) | 会话标题 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### messages 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| session_id | INT | 会话ID（外键） |
| role | ENUM('user', 'assistant') | 消息角色 |
| content | TEXT | 消息内容 |
| model_used | VARCHAR(100) | 使用的模型 |
| created_at | TIMESTAMP | 创建时间 |

### user_settings 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID（外键） |
| preferred_model | VARCHAR(100) | 偏好模型 |
| theme_preferences | JSON | 主题偏好 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### global_models 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(100) | 主键（模型ID） |
| name | VARCHAR(255) | 模型名称 |
| provider | ENUM('gemini', 'openai', 'deepseek', 'claude', 'external') | 提供商 |
| description | TEXT | 描述 |
| enabled | BOOLEAN | 是否启用 |
| icon | VARCHAR(255) | 图标URL |
| avatar | VARCHAR(255) | 头像URL |
| api_model_id | VARCHAR(255) | API模型ID |
| default_base_url | VARCHAR(255) | 默认API URL |

## 🔒 安全性

- 密码使用 bcrypt 加密存储（10 rounds）
- JWT token 用于用户认证（HS256 算法）
- API 密钥存储在环境变量中，不暴露给前端
- CORS 配置限制跨域访问
- SQL 注入防护（使用参数化查询）
- 所有 API 请求（除了认证端点）需要 JWT token

## 📚 相关文档

- [README.md](./README.md) - 快速开始和项目概述
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 系统架构设计
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 部署检查清单
