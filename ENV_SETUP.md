# 环境配置说明

## 后端配置 (server/.env)

请在 `server` 目录下创建 `.env` 文件，内容如下：

```env
# MySQL 数据库配置（与 AI Studio 使用相同的数据库）
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=forsion_ai_studio

# JWT 密钥（请设置一个强密码）
JWT_SECRET=your_jwt_secret_key_here_please_change_this

# 服务器端口
PORT=3002

# CORS 配置
CORS_ORIGIN=http://localhost:2005

# 环境
NODE_ENV=development

# AI 服务 API 密钥（可选，如需使用对应AI服务则配置）
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
ANTHROPIC_API_KEY=
```

## 快速启动步骤

### 1. 确保 MySQL 数据库运行
确保 MySQL 服务正在运行，并且 `forsion_ai_studio` 数据库已创建。

### 2. 创建 server/.env 文件
复制上面的内容，修改为你的实际配置。

### 3. 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
```

### 4. 启动服务

#### 方式一：使用启动脚本（推荐）
```bash
# Windows
.\start-dev.ps1

# Linux/Mac
./start-dev.sh
```

#### 方式二：手动启动
```bash
# 终端1 - 启动后端
cd server
npm run dev

# 终端2 - 启动前端
npm run dev
```

### 5. 访问应用
打开浏览器访问: http://localhost:2005

## 功能说明

### 1. AI聊天模型选择
- 登录后，在AI聊天界面点击模型选择按钮
- 系统会自动从数据库 `global_models` 表加载可用模型
- 支持多种AI模型（Gemini、OpenAI、DeepSeek、Claude等）

### 2. 个人设置与积分查看
- 点击顶部栏右上角的用户头像图标
- 打开个人设置面板，查看：
  - 当前积分余额
  - 累计获得积分
  - 累计使用积分
  - 积分交易记录

## 数据库表说明

系统需要以下数据库表（应该已在 Forsion AI Studio 项目中创建）：

- `users` - 用户表
- `user_credits` - 用户积分账户
- `credit_transactions` - 积分交易记录
- `global_models` - AI模型配置
- `user_sessions` - 用户会话
- `messages` - 聊天消息
- `user_settings` - 用户设置

如果表不存在，请运行 Forsion AI Studio 项目的数据库迁移脚本。

## 故障排查

### 后端无法连接数据库
1. 检查 MySQL 服务是否运行
2. 检查 `server/.env` 中的数据库配置是否正确
3. 确认数据库 `forsion_ai_studio` 已创建
4. 检查数据库用户权限

### 模型列表为空
1. 确认 `global_models` 表中有数据且 `is_enabled = TRUE`
2. 检查后端日志是否有错误信息
3. 在浏览器开发者工具中检查API请求是否成功

### 积分显示错误
1. 确认 `user_credits` 表存在
2. 检查用户是否有积分账户记录
3. 查看后端日志的错误信息
