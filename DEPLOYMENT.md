# 🚀 Docker镜像部署指南

## 快速开始

### 方式一：GitHub Actions自动部署（推荐）

1. **配置仓库Secrets**
   ```
   SILICONFLOW_API_KEY=你的API密钥
   GITHUB_TOKEN=自动提供（无需手动设置）
   ```

2. **推送代码触发部署**
   ```bash
   git add .
   git commit -m "feat: 更新功能"
   git push origin main
   ```

3. **服务器拉取更新**
   ```bash
   # 一键更新
   curl -sL https://raw.githubusercontent.com/your-org/mining-safety-db-frontend/main/scripts/server-update.sh | bash -s -- latest
   
   # 或手动执行
   ./scripts/server-update.sh latest
   ```

### 方式二：本地构建推送

1. **本地构建镜像**
   ```bash
   ./scripts/build-and-push.sh v1.0.0
   ```

2. **服务器部署**
   ```bash
   ./scripts/server-update.sh v1.0.0
   ```

## 详细部署流程

### 1. 服务器准备

**最低配置要求**
- CPU: 2核
- 内存: 4GB  
- 存储: 20GB
- 系统: Ubuntu 20.04+ / CentOS 8+

**安装Docker环境**
```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 项目部署

**克隆项目**
```bash
git clone https://github.com/your-org/mining-safety-db-frontend.git
cd mining-safety-db-frontend
```

**配置生产环境**
```bash
# 复制环境配置模板
cp .env.production.example .env.production

# 编辑配置（必须修改以下项）
nano .env.production
```

**关键配置项**
```bash
# 修改为你的GitHub组织名
GITHUB_REPOSITORY_OWNER=your-org

# 如果是私有仓库，需要设置访问令牌
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your-username

# 域名配置（可选）
FRONTEND_DOMAIN=mining-frontend.yourdomain.com

# Grafana密码（建议修改）
GRAFANA_PASSWORD=your-secure-password
```

**启动服务**
```bash
# 拉取并启动最新镜像
./scripts/server-update.sh latest

# 或使用Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### 3. 验证部署

```bash
# 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 健康检查
curl http://localhost/health

# 访问应用
curl http://localhost/
```

## 高级功能

### 蓝绿部署
```bash
./scripts/server-update.sh --blue-green latest
```

### 回滚操作
```bash
./scripts/server-update.sh --rollback
```

### 查看部署状态
```bash
./scripts/server-update.sh --status
```

### 监控和日志
```bash
# 访问Grafana仪表板（如果启用）
http://localhost:3001
# 用户名: admin, 密码: 见.env.production

# 访问Prometheus（如果启用）
http://localhost:9090

# 查看应用日志
docker-compose -f docker-compose.prod.yml logs -f mining-frontend
```

## 常见问题

### 1. 镜像拉取失败
```bash
# 检查网络连接
curl -I https://ghcr.io

# 手动登录GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# 检查镜像是否存在
docker pull ghcr.io/your-org/mining-safety-db-frontend:latest
```

### 2. 健康检查失败
```bash
# 检查容器日志
docker-compose -f docker-compose.prod.yml logs mining-frontend

# 检查端口占用
netstat -tulpn | grep :80

# 手动测试健康检查端点
curl -v http://localhost/health
```

### 3. 权限问题
```bash
# 给脚本添加执行权限
chmod +x scripts/*.sh

# 检查Docker权限
sudo usermod -aG docker $USER
newgrp docker
```

### 4. 环境变量问题
```bash
# 检查环境变量是否正确加载
docker-compose -f docker-compose.prod.yml config

# 验证镜像标签
echo $DOCKER_IMAGE
```

## 更新策略

### 自动更新（推荐）
1. 推送代码到main分支
2. GitHub Actions自动构建镜像
3. 服务器定时拉取最新镜像
4. 健康检查通过后完成更新

### 手动更新
1. 本地构建: `./scripts/build-and-push.sh v1.0.1`
2. 服务器更新: `./scripts/server-update.sh v1.0.1`

### 紧急回滚
```bash
# 立即回滚到上一个版本
./scripts/server-update.sh --rollback

# 或指定版本回滚
./scripts/server-update.sh v1.0.0
```

## 安全建议

1. **定期更新基础镜像**
   ```bash
   # 重新构建镜像以获取安全更新
   ./scripts/build-and-push.sh latest
   ```

2. **配置SSL证书**
   ```bash
   # 使用Let's Encrypt
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

3. **限制网络访问**
   ```bash
   # 使用防火墙限制访问
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp  
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

4. **监控和日志**
   - 启用日志收集和分析
   - 设置监控告警
   - 定期检查安全更新

## 支持

如有问题，请查看：
- [项目文档](./CLAUDE.md)
- [GitHub Issues](https://github.com/your-org/mining-safety-db-frontend/issues)
- [部署日志分析](./logs/)