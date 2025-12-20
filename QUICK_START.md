## 🚀 快速启动指南

### 重要提醒
本次功能已完整实现，包括：
1. ✅ AI聊天界面从数据库加载模型列表
2. ✅ TopBar个人头像点击打开设置面板
3. ✅ 个人设置面板显示积分信息

### 🔧 配置步骤

#### 1. 创建数据库配置文件

在 `server` 目录下手动创建 `.env` 文件（注意：以点开头），内容如下：

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=你的MySQL密码
MYSQL_DATABASE=forsion_ai_studio
JWT_SECRET=your_jwt_secret_key_change_this
PORT=3002
CORS_ORIGIN=http://localhost:2005
NODE_ENV=development
```

**重要：** `.env` 文件必须在 `server` 目录下，不是项目根目录！

#### 2. 检查数据库

确保以下内容已完成：
- MySQL服务运行中
- 数据库 `forsion_ai_studio` 已创建
- 数据库表已存在（与AI Studio共享）

#### 3. 安装依赖

```bash
# 在项目根目录
npm install

# 进入server目录安装后端依赖
cd server
npm install
cd ..
```

#### 4. 启动项目

**推荐：使用两个终端分别启动**

终端1 - 后端：
```bash
cd server
npm run dev
```

终端2 - 前端：
```bash
npm run dev
```

#### 5. 访问应用

打开浏览器：http://localhost:2005

### 🎯 使用功能

#### AI聊天模型选择
1. 登录账号（如果未登录，点击右上角登录）
2. 打开AI聊天（Cmd/Ctrl + K）
3. 点击顶部的模型选择按钮
4. 系统会显示数据库中所有启用的模型

#### 查看积分
1. 点击顶部栏右上角的紫色头像图标（在时间右侧）
2. 查看个人设置面板：
   - 积分概览：当前余额、累计获得、累计使用
   - 交易记录：详细的积分变动历史

### 📝 已实现的文件

#### 后端新增/修改
- `server/src/services/modelService.ts` - 从数据库加载模型
- `server/src/services/creditService.ts` - 积分管理服务
- `server/src/routes/credits.ts` - 积分API路由
- `server/src/config.ts` - 配置管理
- `server/src/index.ts` - 添加积分路由

#### 前端新增/修改
- `components/UserSettingsModal.tsx` - 个人设置面板（新建）
- `components/TopBar.tsx` - 添加头像点击功能
- `services/creditService.ts` - 前端积分服务（新建）
- `App.tsx` - 导入TopBar组件

### ❓ 故障排查

#### 问题1: 后端启动失败
- 检查 `server/.env` 文件是否存在
- 检查MySQL连接信息是否正确

#### 问题2: 模型列表为空
- 确认数据库 `global_models` 表有数据
- 确认 `is_enabled = TRUE`
- 检查后端控制台日志

#### 问题3: 积分显示错误
- 确认用户已登录
- 检查 `user_credits` 表是否存在
- 查看浏览器控制台是否有API错误

#### 问题4: TopBar看不到
- 检查 `App.tsx` 是否导入了 TopBar
- 刷新浏览器页面
- 清除浏览器缓存

### 📊 API接口说明

#### 模型相关
- `GET /api/chat/models` - 获取可用模型列表

#### 积分相关
- `GET /api/credits/balance` - 获取积分余额
- `GET /api/credits/account` - 获取积分账户详情
- `GET /api/credits/transactions` - 获取交易记录

所有积分API需要认证（Bearer Token）。
