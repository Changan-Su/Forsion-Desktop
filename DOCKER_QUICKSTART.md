# Docker 快速开始指南

这是 Forsion Desktop 的 Docker 快速部署指南。详细文档请参考 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)。

## 🚀 5 分钟快速部署

### 1. 准备环境变量

创建 `.env` 文件：

```bash
# 复制示例文件（如果存在）
cp .env.example .env

# 或手动创建 .env 文件，至少配置以下内容：
cat > .env << EOF
MYSQL_ROOT_PASSWORD=RootPass123!@#
MYSQL_DATABASE=forsion_desktop
MYSQL_USER=forsion_user
MYSQL_PASSWORD=UserPass123!@#
JWT_SECRET=your_super_secret_jwt_key_change_this_min_32_characters
GEMINI_API_KEY=your_gemini_api_key_here
# 使用相对路径（通过 nginx 代理，推荐）
VITE_API_URL=
EOF
```

### 2. 启动服务

```bash
# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f
```

### 3. 访问应用

- **前端**: http://localhost
- **后端 API**: http://localhost:3001/health

### 4. 默认管理员账户

- **用户名**: `admin`
- **密码**: `Admin123!@#`

⚠️ **首次登录后请立即修改密码！**

---

## 📝 常用命令

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

# 停止并删除（保留数据）
docker compose down

# 完全清理（包括数据，⚠️ 危险！）
docker compose down -v
```

---

## 🔄 更新应用

```bash
# 1. 停止服务
docker compose down

# 2. 拉取最新代码
git pull

# 3. 重新构建
docker compose build --no-cache

# 4. 启动
docker compose up -d
```

---

## ❓ 遇到问题？

1. **端口被占用**: 修改 `.env` 文件中的端口配置
2. **数据库连接失败**: 检查 MySQL 容器是否运行 `docker compose ps mysql`
3. **查看详细日志**: `docker compose logs <service-name>`
4. **查看完整文档**: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

---

## 📚 更多信息

- 详细部署文档: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
- 部署检查清单: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- 项目 README: [README.md](./README.md)

