<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Forsion Desktop - Full Stack AI Application

一个现代化、全栈的 AI 桌面应用，集成 MySQL 数据库、用户认证、多模型 AI 对话功能。

## ✨ 特性

- 🎨 精美的 macOS 风格桌面界面
- 💬 AI 聊天助手，支持流式响应
- 🔄 完整的会话管理系统
- 🤖 支持多种 AI 模型（Gemini, OpenAI, DeepSeek, Claude）
- 👤 用户认证系统（JWT）
- 🗄️ MySQL 数据库持久化
- 🌊 Server-Sent Events 流式响应
- 📱 响应式设计

## 🚀 快速开始

### 前置要求

- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 1. 克隆项目

```bash
git clone <repository-url>
cd Forsion-Desktop-main
```

### 2. 数据库设置

```sql
CREATE DATABASE forsion_desktop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置环境变量

**后端配置** (`server/.env`):

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=forsion_desktop

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

PORT=3001
NODE_ENV=development

CORS_ORIGIN=http://localhost:3000

GEMINI_API_KEY=your_gemini_api_key
```

**前端配置** (`.env.local`):

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_API_URL=http://localhost:3001
```

### 4. 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖
cd server
npm install
cd ..
```

### 5. 启动应用

**Windows:**
```powershell
.\start-dev.ps1
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### 6. 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001

## 📖 文档

- [📚 完整实施文档](./IMPLEMENTATION.md) - 详细的架构和 API 说明
- [⚡ 快速开始指南](./QUICKSTART.md) - 一步步设置指南
- [✅ 完成总结](./COMPLETION_SUMMARY.md) - 已实现功能列表

## 🏗️ 技术栈

### 后端
- Node.js + Express + TypeScript
- MySQL 8.0 + mysql2
- JWT 认证 (jsonwebtoken)
- bcrypt 密码加密
- Google Generative AI, OpenAI SDK

### 前端
- React 19 + TypeScript
- Vite
- Framer Motion
- Lucide React

## 🎯 主要功能

### 认证系统
- ✅ 用户注册/登录
- ✅ JWT Token 认证
- ✅ 密码加密存储
- ✅ 角色权限管理

### AI 对话
- ✅ 多模型支持
- ✅ 流式响应
- ✅ 会话管理
- ✅ 历史记录持久化

### 数据持久化
- ✅ MySQL 数据库
- ✅ 用户数据
- ✅ 聊天历史
- ✅ 用户设置

## 📁 项目结构

```
Forsion-Desktop/
├── server/                 # 后端服务
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑
│   │   ├── middleware/    # 认证中间件
│   │   └── db/            # 数据库配置
│   └── package.json
├── services/              # 前端服务层
├── components/            # React 组件
├── start-dev.sh          # 启动脚本 (Linux/Mac)
├── start-dev.ps1         # 启动脚本 (Windows)
└── package.json
```

## 🔐 安全性

- 密码使用 bcrypt 加密
- JWT Token 认证
- CORS 保护
- SQL 注入防护
- API Key 环境变量管理

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

参考项目：[Forsion-AI-Studio](https://github.com/Changan-Su/Forsion-AI-Studio)
