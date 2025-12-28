<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Forsion Desktop - AI Desktop Application

一个现代化的 AI 桌面应用，使用共享的 Forsion Backend Service，提供用户认证、多模型 AI 对话功能。

## ✨ 特性

- 🎨 精美的 macOS 风格桌面界面
- 💬 AI 聊天助手，支持流式响应
- 🔄 完整的会话管理系统（本地 IndexedDB 存储）
- 🤖 支持多种 AI 模型（Gemini, OpenAI, DeepSeek, Claude）
- 👤 用户认证系统（通过 Forsion Backend Service）
- 💾 本地数据持久化（IndexedDB）
- 🌊 Server-Sent Events 流式响应
- 📱 响应式设计

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- Forsion Backend Service 运行中（或配置了 `VITE_API_URL` 指向后端服务）

### 1. 克隆项目

```bash
git clone <repository-url>
cd Forsion-Desktop-main
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
VITE_API_URL=http://localhost:3001
VITE_PROJECT_SOURCE=desktop
```

**注意**：`VITE_API_URL` 应该指向运行中的 Forsion Backend Service。如果使用共享后端服务，请配置正确的后端服务地址。

### 3. 安装依赖

```bash
npm install
```

### 4. 启动应用

**Windows:**
```powershell
.\start-dev.ps1
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### 5. 访问应用

- 前端：http://localhost:3000

**注意**：确保 Forsion Backend Service 在 `VITE_API_URL` 指定的地址运行。

### 6. 首次使用

1. 打开 http://localhost:3000
2. 点击右上角的"账户设置"按钮
3. 选择"Sign up"注册新账户并登录

### 7. 使用 AI 聊天

1. 按 `Ctrl+K` (Windows) 或 `⌘K` (Mac) 打开 AI 聊天
2. 选择想要使用的 AI 模型
3. 查看和管理聊天会话
4. 所有对话会自动保存

## ❓ 常见问题

### 后端服务连接失败

- 确保 Forsion Backend Service 正在运行
- 检查 `.env.local` 中的 `VITE_API_URL` 配置是否正确
- 访问后端服务的 `/api/health` 端点检查服务状态

### API Key 无效

- 确认 Gemini API Key 正确
- 检查 API Key 是否有效且未过期
- 在 Google AI Studio 获取密钥：https://makersuite.google.com/app/apikey

### 端口被占用

如果 3000 端口被占用，可以在 `vite.config.ts` 中修改端口，或使用环境变量：

```bash
# 使用自定义端口启动
npm run dev -- --port 3005
```

### 依赖安装失败

```bash
# 清除缓存重试
npm cache clean --force
npm install
```

## 📖 文档

- [📚 API 文档](./IMPLEMENTATION.md) - 详细的 API 接口说明
- [🏗️ 系统架构](./ARCHITECTURE.md) - 架构设计和数据流
- [🚀 部署指南](./DEPLOYMENT_CHECKLIST.md) - 生产环境部署检查清单

## 🏗️ 技术栈

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
- ✅ IndexedDB（本地存储会话和消息）
- ✅ 用户数据（通过 Forsion Backend Service）
- ✅ 聊天历史（本地 IndexedDB）
- ✅ 用户设置（通过 Forsion Backend Service）

## 📁 项目结构

```
Forsion-Desktop/
├── services/              # 前端服务层
│   ├── apiService.ts      # API 客户端
│   ├── authService.ts     # 认证服务
│   ├── chatService.ts     # 聊天服务
│   └── sessionStorageService.ts  # IndexedDB 存储
├── components/            # React 组件
├── start-dev.sh          # 启动脚本 (Linux/Mac)
├── start-dev.ps1         # 启动脚本 (Windows)
└── package.json
```

## 🔐 安全性

- JWT Token 认证（由 Forsion Backend Service 提供）
- CORS 保护
- API Key 由后端服务管理
- 本地数据存储在 IndexedDB 中

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

参考项目：[Forsion-AI-Studio](https://github.com/Changan-Su/Forsion-AI-Studio)
