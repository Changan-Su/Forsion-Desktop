# Forsion Desktop Docker 部署文档

本文档详细说明如何使用 Docker 部署 Forsion Desktop 项目。

## 📋 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [环境变量配置](#环境变量配置)
- [部署步骤](#部署步骤)
- [更新应用](#更新应用)
- [维护和监控](#维护和监控)
- [常见问题](#常见问题)
- [故障排查](#故障排查)

---

## 前置要求

### 系统要求

- **Docker**: 20.10 或更高版本
- **Docker Compose**: 2.0 或更高版本
- **操作系统**: Linux、macOS 或 Windows（支持 WSL2）
- **内存**: 至少 2GB RAM（推荐 4GB+）
- **磁盘空间**: 至少 5GB 可用空间

### 检查安装

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version
```

如果未安装，请参考 [Docker 官方文档](https://docs.docker.com/get-docker/) 进行安装。

---

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd Forsion-Desktop-main
```

### 2. 配置环境变量

创建 `.env` 文件（在项目根目录）：

```bash
cp .env.example .env  # 如果有示例文件
# 或直接创建 .env 文件
```

编辑 `.env` 文件，配置必要的环境变量（详见下方 [环境变量配置](#环境变量配置) 章节）。

### 3. 启动服务

```bash
# 构建并启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f
```

### 4. 访问应用

- **前端**: http://localhost
- **后端 API**: http://localhost:3001
- **健康检查**: http://localhost:3001/health

---

## 环境变量配置

在项目根目录创建 `.env` 文件，配置以下环境变量：

### 数据库配置

```env
# MySQL 配置
MYSQL_ROOT_PASSWORD=your_strong_root_password
MYSQL_DATABASE=forsion_desktop
MYSQL_USER=forsion_user
MYSQL_PASSWORD=your_strong_password
MYSQL_PORT=3306
```

### 后端服务配置

```env
# 后端端口
BACKEND_PORT=3001

# JWT 密钥（生产环境必须修改！）
JWT_SECRET=your_very_strong_jwt_secret_key_min_32_chars

# CORS 允许的源（前端地址）
CORS_ORIGIN=http://localhost

# AI API 密钥
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key  # 可选
DEEPSEEK_API_KEY=your_deepseek_api_key  # 可选
ANTHROPIC_API_KEY=your_anthropic_api_key  # 可选
```

### 前端配置

```env
# 前端端口
FRONTEND_PORT=80

# 前端 API 地址
# 方式1: 使用相对路径（推荐，通过 nginx 代理）
VITE_API_URL=

# 方式2: 直接访问后端（需要配置 CORS）
# VITE_API_URL=http://localhost:3001
```

**注意**: 
- 如果使用相对路径（空值或 `/`），前端会通过 nginx 代理访问后端，避免 CORS 问题
- 如果直接访问后端，需要确保 `CORS_ORIGIN` 配置正确

### 完整示例

```env
# ============================================
# Forsion Desktop Docker 环境变量配置
# ============================================

# MySQL 数据库
MYSQL_ROOT_PASSWORD=RootPass123!@#
MYSQL_DATABASE=forsion_desktop
MYSQL_USER=forsion_user
MYSQL_PASSWORD=UserPass123!@#
MYSQL_PORT=3306

# 后端服务
BACKEND_PORT=3001
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_characters
CORS_ORIGIN=http://localhost

# AI API 密钥
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
DEEPSEEK_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
ANTHROPIC_API_KEY=sk-ant-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# 前端服务
FRONTEND_PORT=80
# 使用相对路径（通过 nginx 代理，推荐）
VITE_API_URL=
```

⚠️ **安全提示**:
- 生产环境必须修改所有默认密码和密钥
- 不要将 `.env` 文件提交到版本控制系统
- 使用强密码（至少 16 个字符，包含大小写字母、数字和特殊字符）

---

## 部署步骤

### 方式一：使用 Docker Compose（推荐）

#### 1. 准备环境变量

创建并编辑 `.env` 文件（见上方配置说明）。

#### 2. 构建镜像

```bash
# 构建所有服务镜像
docker compose build

# 或仅构建特定服务
docker compose build frontend
docker compose build backend
```

#### 3. 启动服务

```bash
# 启动所有服务（后台运行）
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

#### 4. 验证部署

```bash
# 检查后端健康状态
curl http://localhost:3001/health

# 检查前端
curl http://localhost

# 检查数据库连接
docker compose exec backend node -e "console.log('Backend running')"
```

#### 5. 初始化数据库

数据库会在首次启动时自动初始化（通过 `schema.sql` 和 `add_avatar_field.sql`）。

如果需要手动初始化：

```bash
# 进入 MySQL 容器
docker compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE}

# 或执行 SQL 文件
docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < server/src/db/schema.sql
```

### 方式二：单独构建和运行

#### 构建镜像

```bash
# 构建前端镜像（使用相对路径，通过 nginx 代理）
docker build -f Dockerfile.frontend -t forsion-frontend:latest --build-arg VITE_API_URL= .

# 构建后端镜像
docker build -f Dockerfile.backend -t forsion-backend:latest .
```

#### 运行容器

```bash
# 1. 启动 MySQL
docker run -d \
  --name forsion-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=forsion_desktop \
  -e MYSQL_USER=forsion_user \
  -e MYSQL_PASSWORD=forsion_password \
  -p 3306:3306 \
  -v mysql_data:/var/lib/mysql \
  mysql:8.0

# 2. 启动后端
docker run -d \
  --name forsion-backend \
  --link forsion-mysql:mysql \
  -e DB_HOST=mysql \
  -e DB_USER=forsion_user \
  -e DB_PASSWORD=forsion_password \
  -e DB_NAME=forsion_desktop \
  -e JWT_SECRET=your_jwt_secret \
  -e CORS_ORIGIN=http://localhost \
  -p 3001:3001 \
  forsion-backend:latest

# 3. 启动前端
docker run -d \
  --name forsion-frontend \
  --link forsion-backend:backend \
  -p 80:80 \
  forsion-frontend:latest
```

---

## 更新应用

### 方法一：使用 Docker Compose（推荐）

这是最简单和推荐的更新方式。

#### 1. 停止当前服务

```bash
docker compose down
```

⚠️ **注意**: 如果只想更新应用而不删除数据，使用 `docker compose stop` 而不是 `down`。

#### 2. 拉取最新代码

```bash
# 如果使用 Git
git pull origin main

# 或重新克隆
git clone <repository-url>
cd Forsion-Desktop-main
```

#### 3. 重新构建镜像

```bash
# 构建所有服务（不使用缓存，确保获取最新依赖）
docker compose build --no-cache

# 或仅构建特定服务
docker compose build --no-cache frontend
docker compose build --no-cache backend
```

#### 4. 启动更新后的服务

```bash
# 启动服务
docker compose up -d

# 查看日志确认启动成功
docker compose logs -f
```

#### 5. 验证更新

```bash
# 检查服务状态
docker compose ps

# 检查健康状态
curl http://localhost:3001/health

# 访问前端确认功能正常
# http://localhost
```

### 方法二：滚动更新（零停机）

对于生产环境，可以使用滚动更新策略：

#### 1. 更新代码并构建新镜像

```bash
git pull origin main
docker compose build --no-cache
```

#### 2. 逐个服务更新

```bash
# 更新后端（先更新后端，因为前端依赖后端）
docker compose up -d --no-deps backend

# 等待后端就绪
sleep 10
curl http://localhost:3001/health

# 更新前端
docker compose up -d --no-deps frontend
```

#### 3. 清理旧镜像

```bash
# 删除未使用的镜像
docker image prune -f
```

### 方法三：使用版本标签

为镜像打标签，便于版本管理：

#### 1. 构建带版本标签的镜像

```bash
VERSION=1.0.0

docker compose build
docker tag forsion-frontend:latest forsion-frontend:${VERSION}
docker tag forsion-backend:latest forsion-backend:${VERSION}
```

#### 2. 更新时切换到新版本

```bash
# 修改 docker-compose.yml 中的镜像标签
# 然后执行
docker compose up -d
```

### 数据库迁移

如果更新包含数据库结构变更：

#### 1. 备份数据库

```bash
# 导出数据库
docker compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. 执行迁移脚本

```bash
# 如果有新的 SQL 迁移文件，复制到容器并执行
docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < migration.sql
```

#### 3. 验证迁移

```bash
# 检查数据库结构
docker compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "SHOW TABLES;"
```

### 更新检查清单

- [ ] 备份数据库
- [ ] 检查 `.env` 文件是否需要更新
- [ ] 拉取最新代码
- [ ] 重新构建镜像
- [ ] 停止旧服务
- [ ] 启动新服务
- [ ] 验证健康检查
- [ ] 测试主要功能
- [ ] 检查日志是否有错误
- [ ] 清理未使用的镜像和容器

---

## 维护和监控

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql

# 查看最近 100 行日志
docker compose logs --tail=100

# 查看特定时间段的日志
docker compose logs --since 30m
```

### 服务管理

```bash
# 启动服务
docker compose start

# 停止服务
docker compose stop

# 重启服务
docker compose restart

# 重启特定服务
docker compose restart backend

# 停止并删除容器（保留数据卷）
docker compose down

# 停止并删除容器和数据卷（⚠️ 危险！会删除数据库数据）
docker compose down -v
```

### 进入容器

```bash
# 进入后端容器
docker compose exec backend sh

# 进入 MySQL 容器
docker compose exec mysql bash

# 进入前端容器
docker compose exec frontend sh
```

### 数据库管理

```bash
# 连接 MySQL
docker compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE}

# 备份数据库
docker compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > backup.sql

# 恢复数据库
docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < backup.sql

# 查看数据库大小
docker compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema='${MYSQL_DATABASE}' GROUP BY table_schema;"
```

### 资源监控

```bash
# 查看容器资源使用情况
docker stats

# 查看特定容器
docker stats forsion-backend forsion-frontend forsion-mysql

# 查看磁盘使用
docker system df

# 查看数据卷使用
docker volume ls
docker volume inspect forsion-desktop-main_mysql_data
```

### 健康检查

```bash
# 检查后端健康状态
curl http://localhost:3001/health

# 检查所有服务健康状态
docker compose ps

# 手动执行健康检查
docker compose exec backend wget -q -O - http://localhost:3001/health
```

---

## 常见问题

### 1. 端口已被占用

**问题**: 启动时提示端口已被占用

**解决方案**:

```bash
# 检查端口占用
# Linux/macOS
lsof -i :3001
lsof -i :80
lsof -i :3306

# Windows
netstat -ano | findstr :3001

# 修改 .env 文件中的端口配置
FRONTEND_PORT=8080
BACKEND_PORT=3002
MYSQL_PORT=3307
```

### 2. 数据库连接失败

**问题**: 后端无法连接到 MySQL

**解决方案**:

```bash
# 检查 MySQL 容器是否运行
docker compose ps mysql

# 检查 MySQL 日志
docker compose logs mysql

# 验证环境变量
docker compose exec backend env | grep DB_

# 测试数据库连接
docker compose exec mysql mysql -u ${MYSQL_USER} -p${MYSQL_PASSWORD} -h localhost ${MYSQL_DATABASE} -e "SELECT 1;"
```

### 3. 前端无法访问后端 API

**问题**: 前端页面显示 API 请求失败

**解决方案**:

```bash
# 检查 VITE_API_URL 配置
docker compose exec frontend env | grep VITE_API_URL

# 检查后端是否运行
docker compose ps backend
curl http://localhost:3001/health

# 检查 CORS 配置
# 确保 .env 中的 CORS_ORIGIN 与前端地址匹配
```

### 4. 构建失败

**问题**: `docker compose build` 失败

**解决方案**:

```bash
# 清理构建缓存
docker builder prune

# 不使用缓存重新构建
docker compose build --no-cache

# 检查 Dockerfile 语法
docker build --dry-run -f Dockerfile.frontend .

# 查看详细错误信息
docker compose build --progress=plain
```

### 5. 容器启动后立即退出

**问题**: 容器启动后状态变为 `Exited`

**解决方案**:

```bash
# 查看容器日志
docker compose logs <service-name>

# 检查容器退出代码
docker compose ps -a

# 进入容器调试
docker compose run --rm <service-name> sh
```

### 6. 数据库数据丢失

**问题**: 重启后数据不见了

**解决方案**:

- 确保使用了数据卷（`docker-compose.yml` 中已配置）
- 不要使用 `docker compose down -v`（会删除数据卷）
- 定期备份数据库（见上方维护章节）

### 7. 内存不足

**问题**: 容器因内存不足被杀死

**解决方案**:

```bash
# 限制容器内存使用（在 docker-compose.yml 中添加）
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## 故障排查

### 步骤 1: 检查服务状态

```bash
docker compose ps
```

所有服务应该显示 `Up` 状态。

### 步骤 2: 查看日志

```bash
# 查看所有日志
docker compose logs --tail=50

# 查看错误日志
docker compose logs | grep -i error
```

### 步骤 3: 验证网络连接

```bash
# 检查容器间网络
docker compose exec backend ping mysql
docker compose exec frontend ping backend
```

### 步骤 4: 检查环境变量

```bash
# 检查后端环境变量
docker compose exec backend env

# 检查前端环境变量
docker compose exec frontend env
```

### 步骤 5: 重启服务

```bash
# 重启所有服务
docker compose restart

# 或逐个重启
docker compose restart mysql
docker compose restart backend
docker compose restart frontend
```

### 步骤 6: 完全重建

如果以上步骤都无效，尝试完全重建：

```bash
# 停止并删除容器
docker compose down

# 清理未使用的镜像
docker image prune -f

# 重新构建并启动
docker compose build --no-cache
docker compose up -d
```

### 获取帮助

如果问题仍然存在：

1. 查看项目文档：`README.md`、`DEPLOYMENT_CHECKLIST.md`
2. 检查 GitHub Issues
3. 查看 Docker 日志：`docker compose logs > debug.log`
4. 联系技术支持

---

## 生产环境建议

### 安全配置

1. **使用强密码**: 修改所有默认密码
2. **HTTPS**: 配置反向代理（Nginx）启用 HTTPS
3. **防火墙**: 限制数据库端口（3306）仅允许内部访问
4. **定期更新**: 定期更新 Docker 镜像和依赖
5. **备份策略**: 设置自动数据库备份

### 性能优化

1. **资源限制**: 为容器设置 CPU 和内存限制
2. **数据库优化**: 配置 MySQL 连接池和查询缓存
3. **CDN**: 使用 CDN 加速静态资源
4. **监控**: 集成监控系统（如 Prometheus + Grafana）

### 高可用性

1. **负载均衡**: 使用多个后端实例
2. **数据库主从**: 配置 MySQL 主从复制
3. **健康检查**: 配置自动重启和故障转移

---

## 附录

### 常用命令速查

```bash
# 启动
docker compose up -d

# 停止
docker compose stop

# 重启
docker compose restart

# 查看日志
docker compose logs -f

# 查看状态
docker compose ps

# 进入容器
docker compose exec <service> sh

# 备份数据库
docker compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} > backup.sql

# 更新应用
docker compose down
git pull
docker compose build --no-cache
docker compose up -d
```

### 文件结构

```
Forsion-Desktop-main/
├── Dockerfile.frontend      # 前端 Dockerfile
├── Dockerfile.backend       # 后端 Dockerfile
├── docker-compose.yml       # Docker Compose 配置
├── nginx.conf              # Nginx 配置
├── .dockerignore           # Docker 忽略文件
├── .env                    # 环境变量（需创建）
└── DOCKER_DEPLOYMENT.md    # 本文档
```

---

**最后更新**: 2024年

**维护者**: Forsion Desktop Team

