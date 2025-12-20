# Forsion Desktop - Full Stack Implementation

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

一个现代化、全栈的 AI 桌面应用，集成 MySQL 数据库、用户认证、多模型 AI 对话功能。

## ✨ 主要特性

### 前端
- 🎨 精美的 macOS 风格桌面界面
- 💬 AI 聊天助手，支持流式响应
- 🔄 会话管理（创建、删除、切换）
- 🤖 多 AI 模型选择（Gemini, OpenAI, DeepSeek, Claude）
- 👤 用户认证系统（登录/注册）
- 🎭 主题切换功能
- 📱 响应式设计

### 后端
- 🗄️ MySQL 数据库集成
- 🔐 JWT 认证
- 📝 完整的 RESTful API
- 💾 聊天历史持久化
- 🌊 SSE 流式响应
- 🛡️ 密码加密（bcrypt）

## 🚀 快速开始

### 前置要求

- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 1. 数据库设置

```sql
-- 登录 MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE forsion_desktop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE forsion_desktop;
```

数据库表将在首次启动后端服务时自动创建。

### 2. 后端设置

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库连接和 API 密钥

# 启动开发服务器
npm run dev
```

后端服务器将在 `http://localhost:3001` 运行。

### 3. 前端设置

```bash
# 在项目根目录
npm install

# 创建 .env.local 文件
echo "GEMINI_API_KEY=your_gemini_api_key" > .env.local
echo "VITE_API_URL=http://localhost:3001" >> .env.local

# 启动开发服务器
npm run dev
```

前端应用将在 `http://localhost:3000` 运行。

## 📖 环境变量配置

### 后端 (server/.env)

```env
# 数据库配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=forsion_desktop

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3001
NODE_ENV=development

# CORS 配置
CORS_ORIGIN=http://localhost:3000

# AI 模型 API 密钥
GEMINI_API_KEY=your_gemini_api_key

# 可选：其他 AI 模型
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 前端 (.env.local)

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_API_URL=http://localhost:3001
```

## 🏗️ 项目结构

```
Forsion-Desktop/
├── components/              # React 组件
│   ├── AIChat.tsx          # AI 聊天组件
│   ├── LoginModal.tsx      # 登录模态框
│   ├── Dock.tsx            # 底部 Dock
│   └── ...
├── services/               # 前端服务层
│   ├── apiService.ts       # API 基础服务
│   ├── authService.ts      # 认证服务
│   ├── chatService.ts      # 聊天服务
│   └── modelService.ts     # 模型服务
├── server/                 # 后端服务
│   ├── src/
│   │   ├── index.ts        # 服务器入口
│   │   ├── routes/         # API 路由
│   │   │   ├── auth.ts     # 认证路由
│   │   │   ├── chat.ts     # 聊天路由
│   │   │   ├── sessions.ts # 会话路由
│   │   │   ├── messages.ts # 消息路由
│   │   │   └── settings.ts # 设置路由
│   │   ├── services/       # 业务逻辑
│   │   │   ├── authService.ts
│   │   │   ├── aiService.ts
│   │   │   ├── sessionService.ts
│   │   │   ├── messageService.ts
│   │   │   └── modelService.ts
│   │   ├── middleware/     # 中间件
│   │   │   └── auth.ts
│   │   └── db/             # 数据库
│   │       ├── connection.ts
│   │       └── schema.sql
│   ├── package.json
│   └── tsconfig.json
├── App.tsx                 # 主应用组件
├── types.ts                # TypeScript 类型
└── package.json
```

## 🔌 API 端点

### 认证 API

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/logout` - 登出

### 聊天 API

- `POST /api/chat` - 发送消息（支持流式响应）
- `GET /api/chat/models` - 获取可用模型列表

### 会话 API

- `GET /api/sessions` - 获取所有会话
- `POST /api/sessions` - 创建新会话
- `GET /api/sessions/:id` - 获取会话详情
- `PUT /api/sessions/:id` - 更新会话
- `DELETE /api/sessions/:id` - 删除会话

### 消息 API

- `GET /api/sessions/:sessionId/messages` - 获取会话消息
- `POST /api/sessions/:sessionId/messages` - 保存消息
- `DELETE /api/messages/:id` - 删除消息

### 设置 API

- `GET /api/settings` - 获取用户设置
- `PUT /api/settings` - 更新用户设置

## 🎯 使用说明

### 1. 首次使用

1. 启动后端和前端服务
2. 打开浏览器访问 `http://localhost:3000`
3. 点击右上角的账户设置按钮
4. 注册新账户或登录

### 2. 使用 AI 聊天

- 按 `Ctrl+K` (Windows) 或 `⌘K` (Mac) 打开 AI 聊天
- 选择想要使用的 AI 模型
- 输入消息并发送
- 查看流式响应

### 3. 会话管理

- 点击聊天窗口右上角的消息图标查看所有会话
- 点击 + 按钮创建新会话
- 点击会话切换对话
- 悬停在会话上并点击垃圾桶图标删除会话

### 4. 游客模式

- 未登录用户可以继续使用基础功能
- 使用本地 Gemini API（不保存历史）
- 登录后可享受完整功能（会话持久化、多模型等）

## 🔒 安全性

- 密码使用 bcrypt 加密存储
- JWT token 用于用户认证
- API 密钥不存储在数据库中
- CORS 配置限制跨域访问
- SQL 注入防护（参数化查询）

## 🛠️ 开发

### 后端开发

```bash
cd server
npm run dev  # 使用 tsx watch 热重载
```

### 前端开发

```bash
npm run dev  # Vite 热重载
```

### 构建生产版本

```bash
# 前端
npm run build

# 后端
cd server
npm run build
```

## 📝 数据库架构

### users 表
- 用户信息
- 加密密码
- 角色管理

### sessions 表
- 聊天会话
- 关联用户
- 创建/更新时间

### messages 表
- 聊天消息
- 关联会话
- 使用的模型

### user_settings 表
- 用户偏好
- 默认模型
- 主题设置

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- 参考项目: [Forsion-AI-Studio](https://github.com/Changan-Su/Forsion-AI-Studio)
- AI 模型: Google Gemini, OpenAI, DeepSeek, Anthropic Claude

