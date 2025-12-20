# 快速开始指南

## 1. 数据库准备

### 方法一：使用命令行

```bash
# 登录 MySQL
mysql -u root -p

# 执行以下 SQL 命令
CREATE DATABASE forsion_desktop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 方法二：使用 MySQL Workbench

1. 打开 MySQL Workbench
2. 连接到本地 MySQL 服务器
3. 创建新数据库：`forsion_desktop`
4. 字符集选择：`utf8mb4`

## 2. 配置环境变量

### 后端配置

创建 `server/.env` 文件：

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=你的MySQL密码
MYSQL_DATABASE=forsion_desktop

JWT_SECRET=random-secret-key-change-this
JWT_EXPIRES_IN=7d

PORT=3001
NODE_ENV=development

CORS_ORIGIN=http://localhost:3000

# 至少需要一个 AI 模型的 API Key
GEMINI_API_KEY=你的Gemini_API密钥

# 可选：其他模型
# OPENAI_API_KEY=你的OpenAI密钥
# DEEPSEEK_API_KEY=你的DeepSeek密钥
# ANTHROPIC_API_KEY=你的Claude密钥
```

### 前端配置

创建 `.env.local` 文件（项目根目录）：

```env
GEMINI_API_KEY=你的Gemini_API密钥
VITE_API_URL=http://localhost:3001
```

## 3. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

## 4. 启动服务

### Windows 用户

```powershell
# 使用启动脚本（推荐）
.\start-dev.ps1

# 或手动启动
# 终端 1: 启动后端
cd server
npm run dev

# 终端 2: 启动前端
npm run dev
```

### Linux/Mac 用户

```bash
# 使用启动脚本（推荐）
chmod +x start-dev.sh
./start-dev.sh

# 或手动启动
# 终端 1: 启动后端
cd server
npm run dev

# 终端 2: 启动前端
npm run dev
```

## 5. 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001

## 6. 首次使用

1. 打开 http://localhost:3000
2. 点击右上角的"账户设置"按钮
3. 选择"Sign up"注册新账户
4. 或选择"Continue without login"以游客身份使用

## 7. 使用 AI 聊天

1. 按 `Ctrl+K` (Windows) 或 `⌘K` (Mac) 打开 AI 聊天
2. 如果已登录：
   - 选择想要使用的 AI 模型
   - 查看和管理聊天会话
   - 所有对话会自动保存
3. 如果是游客：
   - 直接使用 Gemini 模型
   - 对话不会保存

## 常见问题

### 1. 数据库连接失败

- 检查 MySQL 服务是否启动
- 确认 `server/.env` 中的数据库配置正确
- 确认数据库 `forsion_desktop` 已创建

### 2. API Key 无效

- 确认 Gemini API Key 正确
- 检查 API Key 是否有效且未过期
- 在 Google AI Studio 获取密钥：https://makersuite.google.com/app/apikey

### 3. 端口被占用

如果 3000 或 3001 端口被占用：

**修改前端端口**（vite.config.ts）：
```ts
server: {
  port: 3002,  // 改为其他端口
}
```

**修改后端端口**（server/.env）：
```env
PORT=3005  # 改为其他端口
```

别忘了更新 `.env.local` 中的 `VITE_API_URL`

### 4. 依赖安装失败

```bash
# 清除缓存重试
npm cache clean --force
npm install

# 后端
cd server
npm cache clean --force
npm install
```

## 下一步

- 📖 查看 [IMPLEMENTATION.md](./IMPLEMENTATION.md) 了解完整功能
- 🔧 查看 [API 文档](#) 了解后端接口
- 🎨 自定义主题和外观

## 技术支持

遇到问题？
1. 检查终端输出的错误信息
2. 查看浏览器开发者工具控制台
3. 参考 [IMPLEMENTATION.md](./IMPLEMENTATION.md)

