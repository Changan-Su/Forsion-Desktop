# Forsion Desktop Docker 部署成功经验总结

本文档总结了 Forsion Desktop 项目 Docker 部署过程中遇到的问题、解决方案和最佳实践。

**归档日期**: 2025-12-28  
**适用版本**: uniform-main 分支  
**项目类型**: 前端应用（使用外部 Forsion Backend Service）

---

## 📋 目录

1. [项目架构说明](#项目架构说明)
2. [问题演进过程](#问题演进过程)
3. [核心解决方案](#核心解决方案)
4. [关键配置要点](#关键配置要点)
5. [最佳实践](#最佳实践)
6. [常见问题与解决方案](#常见问题与解决方案)
7. [部署检查清单](#部署检查清单)

---

## 项目架构说明

### 架构特点

Forsion Desktop 是一个**纯前端应用**，使用外部的 **Forsion Backend Service** 提供 API 服务。

**重要说明**：
- ❌ **不再包含本地后端代码**：`server/` 目录已删除
- ✅ **前端使用 IndexedDB**：会话和消息存储在浏览器本地
- ✅ **通过 Nginx 代理访问后端**：避免 CORS 问题
- ✅ **后端服务独立部署**：在服务器其他位置运行（通常是 `forsion-backend` 容器）

### 数据流

```
浏览器 (客户端)
    ↓ HTTP 请求
前端容器 (Nginx:2005)
    ↓ 代理转发 /api/*
宿主机后端服务 (3001端口)
    ↓
Forsion Backend Service
```

---

## 问题演进过程

### 阶段一：清理不必要的后端代码

**问题**: 项目包含 `server/` 目录和 `Dockerfile.backend`，但项目实际使用外部后端服务

**发现**: 
- 启动脚本明确说明：`The local server/ directory is no longer used.`
- 前端代码通过 `VITE_API_URL` 环境变量连接外部后端
- 会话和消息数据使用 IndexedDB 存储在浏览器本地

**解决方案**:
- 删除 `server/` 目录
- 删除 `Dockerfile.backend`
- 清理 `docker-compose.yml` 中的 backend 服务配置
- 清理 `package.json` 中的后端相关脚本
- 更新文档，移除本地后端相关说明

**经验**: 在清理代码前，应该先了解项目的实际架构，确认哪些代码是必需的。

---

### 阶段二：Docker 配置问题

**问题 1**: 容器端口配置错误

**错误信息**:
```
invalid hostPort: $2005
```

**原因**: 在 `docker-compose.yml` 中误写为 `"$2005:80"`，`$` 符号导致解析失败

**解决方案**: 修改为 `"2005:80"`（直接写端口号）

---

**问题 2**: Docker Compose 版本警告

**错误信息**:
```
WARN[0000] the attribute `version` is obsolete
```

**解决方案**: 移除 `docker-compose.yml` 中的 `version: '3.8'` 字段（新版本不再需要）

---

**问题 3**: 不必要的 volumes 配置

**解决方案**: 删除空的 `volumes` 字段（当前不需要挂载卷）

---

### 阶段三：Nginx 代理配置问题

**问题**: Nginx 启动失败 - "host not found in upstream"

**错误信息**:
```
nginx: [emerg] host not found in upstream "backend" in /etc/nginx/conf.d/default.conf:26
```

**根本原因**:
1. `nginx.conf` 中 `proxy_pass` 使用了 `backend:3001`，但后端容器不在同一网络中
2. Nginx 启动时会尝试验证 `proxy_pass` 中的主机名，导致启动失败
3. 尝试使用 `host.docker.internal`，但在 Linux 上可能不可用
4. 尝试使用容器 IP `172.20.0.2:3001`，但网络隔离导致无法访问

**解决方案**: 参考其他项目的成功经验，采用以下两个关键修改

---

### 阶段四：504 Gateway Timeout 错误

**问题**: Nginx 能启动，但请求返回 504 超时

**错误信息**:
```
504 Gateway Time-out
POST http://38.147.187.49:2005/api/auth/login 504 (Gateway Time-out)
```

**根本原因**: 
- 后端地址配置错误（使用了容器 IP `172.20.0.2:3001`）
- 前端容器和后端容器不在同一 Docker 网络中
- 应该使用 Docker 默认网桥 IP `172.17.0.1:3001` 访问宿主机上的服务

**解决方案**: 参考其他项目的成功经验，使用 `172.17.0.1:3001` 访问宿主机上的后端服务

---

## 核心解决方案

### 解决方案一：使用 Nginx resolver 和变量延迟解析

**关键文件**: `nginx.conf`

```nginx
server {
    # 添加 resolver（关键修改 1）- 使用 Docker 内部 DNS
    resolver 127.0.0.11 valid=30s;

    location /api {
        # 使用变量延迟解析（关键修改 2）- 避免启动时验证失败
        set $backend http://172.17.0.1:3001;
        proxy_pass $backend;  # 使用变量而不是直接地址
        
        # ... 其他 proxy 配置
    }
}
```

**作用**:
- `resolver 127.0.0.11`: 使用 Docker 内部 DNS，支持运行时解析
- `set $backend`: 延迟解析，避免启动时验证失败

**原理**: 
- Nginx 启动时会尝试验证 `proxy_pass` 中的主机名
- 使用变量可以延迟解析，在请求时再解析主机名
- `resolver` 指令让 Nginx 在运行时解析主机名

---

### 解决方案二：使用正确的后端地址

**关键配置**: `nginx.conf` 中的后端地址

**选择原则**（根据后端实际位置）：

1. **后端在宿主机上（端口映射）**（推荐）:
   ```nginx
   set $backend http://172.17.0.1:3001;  # Linux Docker 默认网桥
   ```
   - **适用场景**: 后端容器映射到宿主机端口（如 `0.0.0.0:3001->3001/tcp`）
   - **优势**: 最可靠，不依赖容器网络

2. **后端在同一 Docker 网络**:
   ```nginx
   set $backend http://forsion-backend:3001;  # 容器名
   ```
   - **适用场景**: 前端和后端在同一个 `docker-compose.yml` 中定义
   - **要求**: 确保它们使用相同的网络

3. **后端在其他服务器**:
   ```nginx
   set $backend http://192.168.x.x:3001;  # 或公网 IP
   ```
   - **适用场景**: 后端部署在独立的服务器上

4. **Docker Desktop (Windows/Mac)**:
   ```nginx
   set $backend http://host.docker.internal:3001;
   ```
   - **适用场景**: 在 Docker Desktop 环境下开发

**本项目最终选择**: `http://172.17.0.1:3001`（后端映射到宿主机端口）

---

### 解决方案三：前端使用相对路径

**关键配置**: `docker-compose.yml` 和前端代码

```yaml
build:
  args:
    VITE_API_URL: ${VITE_API_URL:-}  # 设置为空，使用相对路径
```

**前端代码逻辑** (`services/apiService.ts`):
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '' 
  ? import.meta.env.VITE_API_URL 
  : (import.meta.env.DEV ? 'http://localhost:3001' : '');  // 生产环境为空字符串
```

**优势**:
- 避免 CORS 问题（同源策略）
- 不需要在构建时知道后端地址
- 通过 Nginx 代理访问后端，配置更灵活

---

## 关键配置要点

### 1. Nginx 配置 (`nginx.conf`)

**完整配置示例**:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # 关键配置 1: 添加 resolver
    resolver 127.0.0.11 valid=30s;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 关键配置 2: API 代理 - 使用变量延迟解析
    location /api {
        # 使用变量，延迟解析（避免启动时验证失败）
        set $backend http://172.17.0.1:3001;
        proxy_pass $backend;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查端点
    location /health {
        set $backend_health http://172.17.0.1:3001;
        proxy_pass $backend_health/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 404 /index.html;
}
```

**关键点**:
- ✅ **必须添加 `resolver`**: 让 Nginx 在运行时解析主机名
- ✅ **必须使用变量**: `set $backend` 然后 `proxy_pass $backend`，避免启动时验证
- ✅ **正确的后端地址**: 根据后端位置选择合适的地址

---

### 2. Docker Compose 配置 (`docker-compose.yml`)

**完整配置示例**:

```yaml
services:
  # 前端服务
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        # 关键：设置为空，让前端使用相对路径
        VITE_API_URL: ${VITE_API_URL:-}
    container_name: forsion-desk
    restart: unless-stopped
    ports:
      - "2005:80"
    networks:
      - forsion-network

networks:
  forsion-network:
    driver: bridge
```

**关键点**:
- ✅ **`VITE_API_URL` 设置为空**: 前端使用相对路径 `/api`
- ✅ **端口映射**: `2005:80`（外部端口:容器内部端口）
- ✅ **网络配置**: 使用独立的网络（虽然当前不依赖容器间通信，但保留以便未来扩展）

---

### 3. Dockerfile 配置 (`Dockerfile.frontend`)

**完整配置示例**:

```dockerfile
# 前端 Dockerfile
# 多阶段构建：构建阶段 + 生产阶段

# 阶段1: 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（构建阶段需要 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建参数：API URL（设置为空时，前端使用相对路径）
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

# 构建应用
RUN npm run build

# 阶段2: 生产阶段 - 使用 Nginx 服务静态文件
FROM nginx:alpine

# 复制构建产物到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
```

**关键点**:
- ✅ **多阶段构建**: 减小最终镜像大小
- ✅ **`VITE_API_URL` 默认空值**: 确保生产环境使用相对路径

---

### 4. 环境变量配置 (`.env`)

**推荐配置**:

```env
# 前端 API URL（留空，使用相对路径通过 Nginx 代理）
VITE_API_URL=

# 项目标识
VITE_PROJECT_SOURCE=desktop
```

**说明**:
- 如果 `.env` 文件中设置了 `VITE_API_URL=http://localhost:3001`，会导致前端直接请求 localhost，导致 CORS 错误
- **必须留空**，让前端代码使用相对路径

---

## 最佳实践

### 1. 使用 Nginx 代理避免 CORS

**优势**:
- 前端和后端在同一域名下（通过代理），避免跨域问题
- 不需要在后端配置复杂的 CORS 规则
- 前端代码不需要知道后端的实际地址

**实现**:
- 前端使用相对路径（`/api/*`）
- Nginx 将 `/api/*` 请求代理到后端服务

---

### 2. 延迟解析避免启动失败

**问题**: Nginx 启动时会尝试验证 `proxy_pass` 中的主机名，如果后端暂时不可达，会导致启动失败

**解决方案**: 使用变量延迟解析
```nginx
resolver 127.0.0.11 valid=30s;
set $backend http://172.17.0.1:3001;
proxy_pass $backend;
```

**原理**: 
- 变量在请求时才解析，而不是启动时验证
- `resolver` 让 Nginx 在运行时解析主机名

---

### 3. 根据环境选择正确的后端地址

**选择原则**:

| 后端位置 | 推荐地址 | 说明 |
|---------|---------|------|
| 宿主机端口映射 | `http://172.17.0.1:3001` | Linux Docker 默认网桥 |
| 同一 Docker 网络 | `http://容器名:3001` | 需要确保网络配置正确 |
| Docker Desktop | `http://host.docker.internal:3001` | Windows/Mac 环境 |
| 其他服务器 | `http://IP:3001` | 跨服务器访问 |

**验证方法**:
```bash
# 进入前端容器测试连接
docker exec -it forsion-desk sh
wget -O- http://172.17.0.1:3001/health
```

---

### 4. 强制重新构建避免缓存问题

**问题**: Docker 构建时会使用缓存，导致配置修改未生效

**解决方案**: 使用 `--no-cache` 强制重新构建
```bash
docker compose build --no-cache
docker compose up -d
```

**何时使用**:
- 修改了 `nginx.conf`
- 修改了环境变量
- 修改了 `Dockerfile`
- 前端代码更新后

---

### 5. 清理浏览器缓存

**问题**: 浏览器缓存了旧的 JavaScript 文件，导致前端代码未更新

**解决方案**: 
1. 硬性重新加载：`Ctrl + F5` 或 `Cmd + Shift + R`
2. 开发者工具：右键刷新按钮 → "清空缓存并硬性重新加载"

**何时需要**:
- 修改了前端构建配置（如 `VITE_API_URL`）
- 前端代码更新后

---

## 常见问题与解决方案

### 问题 1: Nginx 启动失败 - "host not found in upstream"

**错误信息**:
```
nginx: [emerg] host not found in upstream "backend" in /etc/nginx/conf.d/default.conf:26
```

**原因**: 
- Nginx 启动时尝试验证 `proxy_pass` 中的主机名
- 后端容器不在同一网络中，无法解析
- 使用了 `host.docker.internal`，但在 Linux 上不可用

**解决方案**:
1. 添加 resolver：`resolver 127.0.0.11 valid=30s;`
2. 使用变量延迟解析：`set $backend http://172.17.0.1:3001;`
3. 使用变量：`proxy_pass $backend;` 而不是直接使用地址

**验证**:
```bash
# 检查 Nginx 是否能启动
docker compose logs frontend | grep "ready for start up"
```

---

### 问题 2: 504 Gateway Timeout

**错误信息**:
```
504 Gateway Time-out
POST http://38.147.187.49:2005/api/auth/login 504 (Gateway Time-out)
```

**可能原因**:
1. 后端地址配置错误（使用了错误的 IP 或端口）
2. 后端服务未运行
3. 网络连接问题（防火墙、网络隔离）

**排查步骤**:
```bash
# 1. 检查后端服务状态
docker ps | grep forsion-backend
# 或
curl http://localhost:3001/health

# 2. 从容器内测试连接
docker exec -it forsion-desk sh
wget -O- http://172.17.0.1:3001/health
exit

# 3. 查看 Nginx 错误日志
docker exec forsion-desk tail -f /var/log/nginx/error.log

# 4. 检查后端实际 IP（如果使用容器 IP）
docker inspect forsion-backend | grep IPAddress
```

**解决方案**:
- 根据后端实际位置修改 `nginx.conf` 中的 `set $backend` 地址
- 推荐使用 `http://172.17.0.1:3001`（如果后端映射到宿主机端口）

---

### 问题 3: CORS 错误

**错误信息**:
```
Access to fetch at 'http://localhost:3001/api/auth/login' 
from origin 'http://38.147.187.49:2005' has been blocked by CORS policy
```

**原因**: 
- 前端代码中硬编码了 `http://localhost:3001`
- 浏览器尝试从客户端机器访问 localhost，导致跨域

**解决方案**:
1. 确保 `VITE_API_URL` 环境变量为空
2. 重新构建前端：`docker compose build --no-cache`
3. 清理浏览器缓存

**验证**:
- 检查构建后的代码：请求地址应该是 `/api/*` 而不是 `http://localhost:3001/api/*`
- 浏览器开发者工具 Network 标签：请求 URL 应该是 `http://38.147.187.49:2005/api/*`

---

### 问题 4: 前端代码未更新

**症状**: 修改了配置，但浏览器中还是旧的行为

**可能原因**:
1. Docker 构建使用了缓存
2. 浏览器缓存了旧的 JavaScript 文件

**解决方案**:
```bash
# 1. 强制重新构建
docker compose build --no-cache
docker compose up -d

# 2. 清理浏览器缓存
# Ctrl + F5 或开发者工具中硬性重新加载
```

**验证**:
- 检查 JavaScript 文件名（hash 值应该变化）
- 查看浏览器开发者工具 Network 标签中的请求地址

---

### 问题 5: Git 合并冲突

**错误信息**:
```
error: Your local changes to the following files would be overwritten by merge:
        nginx.conf
```

**解决方案**:
```bash
# 1. 保存本地修改
git stash

# 2. 拉取远程更新
git pull

# 3. 查看远程内容，如果已包含修复，直接使用
# 如果远程没有，恢复本地修改
git stash pop
```

---

## 部署检查清单

### 部署前检查

- [ ] Docker 和 Docker Compose 已安装
- [ ] 后端服务已启动并可访问（`curl http://localhost:3001/health`）
- [ ] 确认后端服务的实际地址和端口
- [ ] 检查防火墙规则（如需要）

### 配置文件检查

- [ ] `nginx.conf` 包含 `resolver 127.0.0.11 valid=30s;`
- [ ] `nginx.conf` 中使用变量延迟解析（`set $backend` + `proxy_pass $backend`）
- [ ] `nginx.conf` 中的后端地址正确（根据后端位置选择）
- [ ] `docker-compose.yml` 中 `VITE_API_URL` 设置为空
- [ ] `.env` 文件中 `VITE_API_URL` 为空（如果存在）
- [ ] `Dockerfile.frontend` 配置正确

### 构建检查

- [ ] 镜像构建成功：`docker compose build --no-cache`
- [ ] 没有构建错误或警告
- [ ] 镜像大小合理（前端镜像约 50-100MB）

### 运行检查

- [ ] 容器启动成功：`docker compose ps`
- [ ] Nginx 启动成功（日志中没有 `[emerg]` 错误）
- [ ] 前端页面可以访问：`http://<服务器IP>:2005`
- [ ] 从容器内可以访问后端：`docker exec forsion-desk wget -O- http://172.17.0.1:3001/health`

### 功能检查

- [ ] 前端页面加载正常
- [ ] API 请求返回正确状态码（401 表示网络正常，需要认证）
- [ ] 登录功能正常（如果返回 401 或 200，说明网络连接正常）
- [ ] 没有 CORS 错误（浏览器控制台）
- [ ] 没有 504 超时错误

---

## 关键经验总结

### 1. 延迟解析是关键

**经验**: 使用 Nginx 变量和 resolver 实现延迟解析，避免启动时验证失败

**实现**:
```nginx
resolver 127.0.0.11 valid=30s;
set $backend http://172.17.0.1:3001;
proxy_pass $backend;
```

---

### 2. 使用相对路径避免 CORS

**经验**: 前端使用相对路径（空字符串作为 baseURL），通过 Nginx 代理访问后端

**优势**: 
- 避免 CORS 问题
- 不需要在构建时知道后端地址
- 配置更灵活

---

### 3. 根据环境选择正确的后端地址

**经验**: 不同环境需要使用不同的后端地址配置

**选择**:
- **后端映射到宿主机端口**（推荐）: `172.17.0.1:3001`
- **同一 Docker 网络**: `容器名:3001`
- **Docker Desktop**: `host.docker.internal:3001`
- **其他服务器**: 实际 IP 地址

---

### 4. 清理不必要代码

**经验**: 在项目架构变更后（如从本地后端改为外部后端），应该及时清理不再需要的代码和配置

**清理内容**:
- 删除不再使用的目录（如 `server/`）
- 删除不再使用的文件（如 `Dockerfile.backend`）
- 清理配置文件中的相关引用
- 更新文档说明

---

### 5. 强制重新构建和清理缓存

**经验**: 配置修改后必须强制重新构建，浏览器也必须清理缓存

**操作**:
```bash
docker compose build --no-cache  # 强制重新构建
docker compose up -d              # 启动
# 浏览器中: Ctrl + F5             # 清理缓存
```

---

## 相关文件

- `Dockerfile.frontend` - 前端 Docker 镜像构建配置
- `docker-compose.yml` - Docker Compose 编排配置
- `nginx.conf` - Nginx 配置（关键文件）
- `.dockerignore` - Docker 构建忽略文件
- `package.json` - 前端项目配置
- `services/apiService.ts` - 前端 API 服务（使用相对路径）

---

## 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 配置文档](https://nginx.org/en/docs/)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Forsion Backend Service 文档](./backend_overview.md)

---

## 故障排查命令速查

```bash
# 检查容器状态
docker compose ps

# 查看日志
docker compose logs -f frontend

# 进入容器检查配置
docker exec -it forsion-desk sh
cat /etc/nginx/conf.d/default.conf | grep -A 5 "location /api"

# 测试后端连接
docker exec forsion-desk wget -O- http://172.17.0.1:3001/health

# 检查环境变量
docker exec forsion-desk env | grep VITE_API_URL

# 查看 Nginx 错误日志
docker exec forsion-desk tail -f /var/log/nginx/error.log

# 强制重新构建
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

**最后更新**: 2025-12-28  
**维护者**: Cursor AI Assistant  
**项目**: Forsion Desktop

