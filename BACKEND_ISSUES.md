# 后端需要修复的问题清单

## 问题概述

前端在调用后端 API 时遇到以下问题，导致用户信息和积分信息无法正常显示。

---

## 1. `/api/auth/me` 端点问题 ⚠️ **高优先级**

### 问题描述
前端调用 `/api/auth/me` 获取当前用户信息时，收到的响应不是 JSON 格式，而是 HTML（可能是登录页面的重定向）。

### 错误表现
```
[AuthService] Extracted user: {detail: "<!DOCTYPE html>..."}
[AuthService] Invalid user data received
```

### 预期行为
该端点应该：
1. **验证 JWT Token**：从 `Authorization: Bearer <token>` 请求头中获取并验证 token
2. **返回 JSON 格式的用户信息**：
   ```json
   {
     "id": 123,
     "username": "user123",
     "email": "user@example.com",
     "phone": "13800138000",
     "role": "USER",
     "avatar": null,
     "nickname": "昵称",
     "created_at": "2026-01-01T00:00:00.000Z"
   }
   ```
   或者包装格式：
   ```json
   {
     "user": {
       "id": 123,
       "username": "user123",
       ...
     }
   }
   ```

### 可能的原因
- Token 验证失败，被重定向到登录页面（返回 HTML）
- 认证中间件配置错误
- 路由优先级问题，API 路由被静态文件路由覆盖
- CORS 配置导致请求未正确处理

### 检查要点
```typescript
// 检查认证中间件是否正确处理 Bearer Token
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  // 确保返回 JSON 格式
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
    avatar: req.user.avatar,
    nickname: req.user.nickname,
    created_at: req.user.created_at
  });
});
```

---

## 2. `/api/credits/balance` 端点问题 ⚠️ **高优先级**

### 问题描述
积分余额接口返回错误或未实现，导致积分信息无法显示。

### 预期行为
该端点应该：
1. **验证 JWT Token**
2. **返回当前用户的积分信息**：
   ```json
   {
     "userId": 123,
     "balance": 100.50,
     "totalEarned": 500.00,
     "totalSpent": 399.50,
     "updatedAt": "2026-01-13T10:00:00.000Z"
   }
   ```

### 兼容性说明
前端支持以下两种字段格式：
- **驼峰命名**：`userId`, `totalEarned`, `totalSpent`, `updatedAt`
- **下划线命名**：`user_id`, `total_earned`, `total_spent`, `updated_at`

---

## 3. 认证流程问题

### 当前问题
1. **Token 验证失败时返回 HTML 而非 JSON 错误**
2. **没有正确处理 401/403 错误响应**

### 预期行为

#### 成功响应（200）
```json
{
  "id": 123,
  "username": "user123",
  ...
}
```

#### 认证失败响应（401）
```json
{
  "detail": "Invalid token",
  "message": "Authentication failed"
}
```

**重要**：即使认证失败，也应返回 JSON 格式的错误，而不是重定向到登录页（返回 HTML）。

---

## 4. API 路由配置检查

### 确认路由优先级
确保 API 路由在静态文件路由之前注册：

```typescript
// ✅ 正确顺序
app.use('/api', apiRoutes);  // API 路由优先
app.use('/auth', express.static('auth'));  // 静态登录页
app.use('/admin', adminMiddleware, express.static('admin'));  // 管理面板

// ❌ 错误顺序
app.use('/', express.static('public'));  // 会拦截所有请求
app.use('/api', apiRoutes);  // API 路由永远不会被执行
```

---

## 5. CORS 配置检查

### 确认跨域配置
如果前端和后端在不同端口运行（如前端 3000，后端 3001），需要正确配置 CORS：

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',  // 开发环境前端地址
    'http://localhost:5173',  // Vite 默认端口
    // 添加其他允许的源
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Project-Source']
}));
```

---

## 6. JWT Token 验证中间件检查

### 认证中间件示例
```typescript
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // 返回 JSON 格式错误，不要重定向
    return res.status(401).json({ 
      detail: 'No token provided',
      message: 'Authentication required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // 返回 JSON 格式错误，不要重定向
      return res.status(403).json({ 
        detail: 'Invalid token',
        message: 'Token verification failed'
      });
    }
    
    req.user = user;
    next();
  });
}
```

**重要**：认证失败时必须返回 JSON 错误，不要重定向到登录页。

---

## 7. 测试建议

### 使用 curl 测试 API

```bash
# 1. 测试 /api/auth/me（替换 YOUR_TOKEN）
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3001/api/auth/me

# 预期输出：JSON 格式的用户信息
# 如果输出 HTML，说明认证失败或路由配置错误

# 2. 测试 /api/credits/balance
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:3001/api/credits/balance

# 预期输出：JSON 格式的积分信息
```

### 检查后端日志
启动后端时查看日志：
- 请求是否正确到达 API 路由
- Token 验证是否成功
- 是否有错误日志

---

## 8. 快速诊断清单

- [ ] `/api/auth/me` 返回 JSON 格式（不是 HTML）
- [ ] `/api/credits/balance` 返回 JSON 格式
- [ ] Token 验证失败时返回 401/403 JSON 错误（不重定向）
- [ ] API 路由在静态文件路由之前注册
- [ ] CORS 配置正确（如果跨域）
- [ ] 认证中间件正确解析 `Authorization: Bearer <token>`
- [ ] 用户对象包含所有必需字段（id, username, role）
- [ ] 积分对象包含所有必需字段（balance, totalEarned, totalSpent）

---

## 9. 参考文档

前端实现参考了以下后端文档：
- `Documents/登录系统/客户端集成指南.md`
- `Documents/支付系统/客户端集成指南.md`

请确保后端实现与这些文档中描述的 API 规范一致。

---

## 联系前端

修复完成后，请通知前端测试以下功能：
1. 点击"账户设置"能正常显示用户信息
2. 用户信息显示完整（用户名、邮箱、手机、角色）
3. 积分余额能正常显示
4. "充值积分"按钮能跳转到支付页面

---

**最后更新**: 2026-01-13

