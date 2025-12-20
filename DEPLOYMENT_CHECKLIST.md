# 部署前检查清单

## 数据库配置

- [ ] MySQL 8.0+ 已安装并运行
- [ ] 创建数据库 `forsion_desktop`
- [ ] 数据库字符集为 `utf8mb4`
- [ ] 数据库用户有适当权限

## 环境配置

### 后端 (server/.env)

- [ ] `MYSQL_HOST` - MySQL 服务器地址
- [ ] `MYSQL_PORT` - MySQL 端口 (默认 3306)
- [ ] `MYSQL_USER` - 数据库用户名
- [ ] `MYSQL_PASSWORD` - 数据库密码
- [ ] `MYSQL_DATABASE` - 数据库名称
- [ ] `JWT_SECRET` - JWT 密钥（建议使用随机生成的强密钥）
- [ ] `JWT_EXPIRES_IN` - Token 过期时间
- [ ] `PORT` - 后端服务端口 (默认 3001)
- [ ] `CORS_ORIGIN` - 允许的前端地址
- [ ] `GEMINI_API_KEY` - Gemini API 密钥（必需）
- [ ] `OPENAI_API_KEY` - OpenAI API 密钥（可选）
- [ ] `DEEPSEEK_API_KEY` - DeepSeek API 密钥（可选）
- [ ] `ANTHROPIC_API_KEY` - Anthropic API 密钥（可选）

### 前端 (.env.local)

- [ ] `GEMINI_API_KEY` - Gemini API 密钥
- [ ] `VITE_API_URL` - 后端 API 地址

## 依赖安装

- [ ] 前端依赖已安装 (`npm install`)
- [ ] 后端依赖已安装 (`cd server && npm install`)

## 功能测试

### 后端测试

- [ ] 后端服务器可以启动
- [ ] 数据库连接成功
- [ ] 数据库表自动创建
- [ ] 默认管理员账户创建成功
- [ ] API 健康检查响应正常 (GET /health)

### 前端测试

- [ ] 前端开发服务器可以启动
- [ ] 页面加载正常
- [ ] 桌面界面显示正常

### 认证测试

- [ ] 用户可以注册新账户
- [ ] 用户可以登录
- [ ] 登录后可以看到用户名
- [ ] 可以正常登出
- [ ] Token 认证工作正常

### AI 对话测试

- [ ] 可以打开 AI 聊天 (Ctrl+K 或 ⌘K)
- [ ] 游客模式可以发送消息
- [ ] 登录后可以发送消息
- [ ] 流式响应正常显示
- [ ] AI 模型列表加载正常
- [ ] 可以切换不同的 AI 模型

### 会话管理测试

- [ ] 可以创建新会话
- [ ] 可以查看会话列表
- [ ] 可以切换会话
- [ ] 可以删除会话
- [ ] 会话标题显示正常

### 数据持久化测试

- [ ] 消息保存到数据库
- [ ] 会话保存到数据库
- [ ] 刷新页面后数据不丢失
- [ ] 用户设置保存正常

## 安全检查

- [ ] JWT_SECRET 已修改为强密码
- [ ] 数据库密码足够强
- [ ] API Key 未提交到版本控制
- [ ] CORS 配置正确
- [ ] 生产环境 NODE_ENV 设置为 production

## 文档检查

- [ ] README.md 已更新
- [ ] QUICKSTART.md 可用
- [ ] IMPLEMENTATION.md 完整
- [ ] API 文档完整

## 性能检查

- [ ] 数据库连接池配置合理
- [ ] API 响应时间可接受
- [ ] 流式响应无延迟
- [ ] 前端加载速度正常

## 错误处理

- [ ] 数据库连接失败有提示
- [ ] API 错误有友好提示
- [ ] 认证失败有提示
- [ ] 网络错误处理正常

## 生产环境额外检查

- [ ] 使用 HTTPS
- [ ] 配置反向代理 (Nginx)
- [ ] 设置日志记录
- [ ] 配置自动重启 (PM2)
- [ ] 数据库定期备份
- [ ] 监控系统配置
- [ ] 限流配置
- [ ] 压缩静态资源

## 常见问题排查

### 数据库连接失败
1. 检查 MySQL 服务是否运行
2. 验证 .env 中的数据库配置
3. 确认数据库已创建
4. 检查防火墙设置

### API 请求失败
1. 检查后端服务是否运行
2. 验证 VITE_API_URL 配置
3. 检查 CORS 配置
4. 查看浏览器开发者工具错误

### AI 模型无响应
1. 验证 API Key 是否正确
2. 检查 API Key 配额
3. 查看后端日志错误
4. 确认网络连接正常

### 认证问题
1. 清除浏览器 localStorage
2. 重新登录
3. 检查 JWT_SECRET 配置
4. 验证 Token 过期时间

---

## 快速启动命令

```bash
# 方式一：使用启动脚本
./start-dev.sh  # Linux/Mac
.\start-dev.ps1  # Windows

# 方式二：手动启动
# 终端 1: 启动后端
cd server && npm run dev

# 终端 2: 启动前端
npm run dev
```

## 默认账户

首次启动后会自动创建管理员账户：
- 用户名: `admin`
- 密码: `Admin123!@#`
- ⚠️ 请在首次登录后立即修改密码！

## 支持

遇到问题？
1. 查看终端日志
2. 检查浏览器控制台
3. 参考 QUICKSTART.md
4. 查看 IMPLEMENTATION.md

