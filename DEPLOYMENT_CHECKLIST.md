# 部署前检查清单

## 环境配置

### 前端 (.env.local)

- [ ] `VITE_API_URL` - Forsion Backend Service API 地址（例如：http://localhost:3001）
- [ ] `VITE_PROJECT_SOURCE` - 项目标识（默认：desktop）

## 依赖安装

- [ ] 前端依赖已安装 (`npm install`)

## 功能测试

### 后端服务测试

- [ ] Forsion Backend Service 正在运行
- [ ] API 健康检查响应正常 (GET /api/health)
- [ ] 后端服务地址配置正确 (VITE_API_URL)

### 前端测试

- [ ] 前端开发服务器可以启动
- [ ] 页面加载正常
- [ ] 桌面界面显示正常
- [ ] 可以连接到后端服务

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

- [ ] 消息保存到 IndexedDB
- [ ] 会话保存到 IndexedDB
- [ ] 刷新页面后数据不丢失
- [ ] 用户设置保存正常（通过后端服务）

## 安全检查

- [ ] API Key 由后端服务管理（不在前端暴露）
- [ ] VITE_API_URL 配置正确
- [ ] 生产环境使用 HTTPS
- [ ] CORS 配置正确（由后端服务管理）

## 文档检查

- [ ] README.md 已更新
- [ ] QUICKSTART.md 可用
- [ ] IMPLEMENTATION.md 完整
- [ ] API 文档完整

## 性能检查

- [ ] API 响应时间可接受
- [ ] 流式响应无延迟
- [ ] 前端加载速度正常
- [ ] IndexedDB 读写性能正常

## 错误处理

- [ ] 后端服务连接失败有提示
- [ ] API 错误有友好提示
- [ ] 认证失败有提示
- [ ] 网络错误处理正常

## 生产环境额外检查

- [ ] 使用 HTTPS
- [ ] 配置反向代理 (Nginx) - 仅前端需要
- [ ] 前端静态资源压缩
- [ ] 监控系统配置
- [ ] 前端错误日志记录

## 常见问题排查

### 后端服务连接失败
1. 检查 Forsion Backend Service 是否运行
2. 验证 VITE_API_URL 配置是否正确
3. 访问后端服务的 /api/health 端点检查状态
4. 检查防火墙和网络设置

### API 请求失败
1. 检查后端服务是否运行
2. 验证 VITE_API_URL 配置
3. 检查 CORS 配置（由后端服务管理）
4. 查看浏览器开发者工具错误
5. 检查网络连接

### AI 模型无响应
1. 检查后端服务的 API Key 配置
2. 查看后端服务日志
3. 确认网络连接正常
4. 验证积分/配额是否充足

### 认证问题
1. 清除浏览器 localStorage
2. 重新登录
3. 检查 Token 是否过期
4. 验证后端服务的 JWT 配置

---

## 快速启动命令

```bash
# 方式一：使用启动脚本（推荐）
./start-dev.sh  # Linux/Mac
.\start-dev.ps1  # Windows

# 方式二：手动启动
npm run dev
```

**注意**：启动前请确保 Forsion Backend Service 已在 VITE_API_URL 指定的地址运行。

## 支持

遇到问题？
1. 查看终端日志
2. 检查浏览器控制台
3. 参考 QUICKSTART.md
4. 查看 IMPLEMENTATION.md





