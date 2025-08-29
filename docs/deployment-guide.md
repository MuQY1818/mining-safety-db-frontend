# 矿区安全数据库前端 - 部署指南

## 概述

本文档提供矿区安全数据库前端应用的完整部署指南，包括Docker容器化部署、环境配置、监控和故障排除。

## 目录
- [快速开始](#快速开始)
- [环境要求](#环境要求)
- [配置说明](#配置说明)
- [Docker部署](#docker部署)
- [生产部署](#生产部署)
- [监控与日志](#监控与日志)
- [故障排除](#故障排除)
- [备份与恢复](#备份与恢复)

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd mining-safety-db
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

### 3. 本地开发部署
```bash
# 使用npm运行开发服务器
npm install
npm start

# 或使用Docker开发环境
docker-compose up -d
```

### 4. 生产部署
```bash
# 构建并部署到生产环境
ENVIRONMENT=production ./scripts/deploy.sh
```

## 环境要求

### 系统要求
- **操作系统**: Linux (推荐 Ubuntu 20.04+)、macOS、Windows
- **CPU**: 2核心以上
- **内存**: 4GB以上 (生产环境推荐8GB)
- **磁盘**: 20GB可用空间
- **网络**: 稳定的互联网连接

### 软件依赖
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (仅开发环境)
- **Git**: 2.30+

### 浏览器支持
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 配置说明

### 环境变量配置

#### 基础配置 (.env)
```bash
# 后端API地址
REACT_APP_API_BASE_URL=https://mining-backend.ziven.site/api

# AI服务API密钥
REACT_APP_SILICONFLOW_API_KEY=your_api_key_here

# 应用环境
NODE_ENV=production

# 服务端口
FRONTEND_PORT=3000
```

#### Docker配置 (.env.docker)
```bash
# Docker特定配置
FRONTEND_PORT=3000
REDIS_PORT=6379
PROXY_PORT=80

# 资源限制
MEMORY_LIMIT=512m
CPU_LIMIT=1.0
```

#### 生产环境配置 (.env.production)
```bash
# 生产环境API
REACT_APP_API_BASE_URL=https://api.mining-production.com/api

# 安全配置
FORCE_HTTPS=true
SECURE_COOKIES=true

# 监控配置
GRAFANA_PASSWORD=secure_password
```

### Nginx配置

#### 基本配置 (docker/nginx.conf)
- 静态资源缓存策略
- API请求代理
- Gzip压缩
- 安全头设置
- React Router支持

#### 自定义配置
```nginx
# 添加自定义域名
server_name your-domain.com;

# SSL配置 (如需要)
listen 443 ssl;
ssl_certificate /etc/ssl/certs/your-cert.crt;
ssl_certificate_key /etc/ssl/private/your-key.key;
```

## Docker部署

### 单容器部署

#### 1. 构建镜像
```bash
# 使用构建脚本
./scripts/build.sh --docker

# 或手动构建
docker build -t mining-frontend:latest .
```

#### 2. 运行容器
```bash
# 基本运行
docker run -d --name mining-frontend -p 3000:80 mining-frontend:latest

# 带环境变量
docker run -d --name mining-frontend \
  -p 3000:80 \
  -e REACT_APP_API_BASE_URL=https://your-api.com/api \
  mining-frontend:latest
```

### Docker Compose部署

#### 1. 开发环境
```bash
# 启动开发环境
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f mining-frontend
```

#### 2. 生产环境
```bash
# 启动生产环境
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 使用部署脚本 (推荐)
ENVIRONMENT=production ./scripts/deploy.sh
```

### 服务编排

#### 基本服务
```yaml
services:
  mining-frontend:    # React应用 + Nginx
  mining-redis:       # 缓存服务 (可选)
  mining-proxy:       # 反向代理 (可选)
```

#### 监控服务 (生产环境)
```yaml
services:
  prometheus:         # 指标收集
  grafana:           # 监控面板
```

## 生产部署

### 1. 服务器准备

#### 系统配置
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 防火墙配置
```bash
# 开启必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. 域名与SSL

#### 域名解析
```bash
# A记录示例
your-domain.com.    IN A    your-server-ip
www.your-domain.com. IN CNAME your-domain.com.
```

#### SSL证书 (Let's Encrypt)
```bash
# 安装Certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 3 * * * certbot renew --quiet
```

### 3. 生产部署流程

#### 使用部署脚本 (推荐)
```bash
# 设置环境变量
export ENVIRONMENT=production
export VERSION=v1.0.0

# 执行部署
./scripts/deploy.sh

# 检查部署状态
./scripts/deploy.sh --status
```

#### 手动部署
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 构建镜像
docker build -t mining-frontend:v1.0.0 .

# 3. 停止旧服务
docker-compose down

# 4. 启动新服务
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. 健康检查
curl -f http://localhost/health
```

### 4. 负载均衡与高可用

#### Nginx反向代理
```nginx
upstream mining_frontend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://mining_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Docker Swarm (多节点)
```bash
# 初始化Swarm
docker swarm init

# 部署Stack
docker stack deploy -c docker-compose.prod.yml mining-stack
```

## 监控与日志

### 1. 应用监控

#### Prometheus配置
```yaml
# docker/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mining-frontend'
    static_configs:
      - targets: ['mining-frontend:80']
    metrics_path: /metrics
```

#### Grafana面板
- 访问地址: `http://localhost:3001`
- 默认账号: admin / admin123
- 导入预设面板: `docker/grafana-dashboard.json`

### 2. 日志管理

#### 日志收集
```bash
# 查看应用日志
docker-compose logs -f mining-frontend

# 导出日志
docker-compose logs --no-color > app.log

# 按时间过滤
docker-compose logs --since="2025-08-28T10:00:00" mining-frontend
```

#### 日志轮转
```bash
# 配置logrotate
sudo vim /etc/logrotate.d/mining-frontend

/var/log/mining/*.log {
    daily
    rotate 30
    compress
    delaycompress
    create 0644 www-data www-data
    postrotate
        docker-compose restart mining-frontend
    endscript
}
```

### 3. 性能监控

#### 关键指标
- **响应时间**: < 2秒
- **可用性**: > 99.9%
- **内存使用**: < 80%
- **CPU使用**: < 70%

#### 报警配置
```yaml
# Prometheus规则示例
groups:
  - name: mining-frontend
    rules:
      - alert: HighResponseTime
        expr: avg_response_time > 2
        for: 5m
        annotations:
          summary: "前端响应时间过长"
```

## 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 检查容器状态
docker-compose ps

# 查看详细日志
docker-compose logs mining-frontend

# 检查资源使用
docker stats

# 常见原因:
# - 端口冲突
# - 内存不足
# - 配置文件错误
# - 镜像缺失
```

#### 2. API连接失败
```bash
# 检查网络连通性
docker-compose exec mining-frontend curl -I https://mining-backend.ziven.site/api/health

# 检查环境变量
docker-compose exec mining-frontend env | grep REACT_APP

# 检查DNS解析
nslookup mining-backend.ziven.site
```

#### 3. 静态资源404
```bash
# 检查Nginx配置
docker-compose exec mining-frontend nginx -t

# 检查文件权限
docker-compose exec mining-frontend ls -la /usr/share/nginx/html/

# 重新构建镜像
docker-compose build --no-cache mining-frontend
```

#### 4. 性能问题
```bash
# 检查资源使用
htop
docker stats

# 检查日志大小
du -sh logs/

# 优化建议:
# - 启用Gzip压缩
# - 配置CDN
# - 增加服务器资源
# - 优化镜像大小
```

### 调试命令

#### 容器调试
```bash
# 进入容器
docker-compose exec mining-frontend sh

# 检查进程
docker-compose exec mining-frontend ps aux

# 检查网络
docker-compose exec mining-frontend netstat -tuln

# 测试服务
docker-compose exec mining-frontend curl localhost/health
```

#### 日志分析
```bash
# 实时日志
docker-compose logs -f --tail=100 mining-frontend

# 错误日志过滤
docker-compose logs mining-frontend | grep ERROR

# 访问日志分析
tail -f logs/nginx/access.log | awk '{print $1}' | sort | uniq -c
```

## 备份与恢复

### 1. 数据备份

#### 配置文件备份
```bash
# 创建备份目录
mkdir -p backups/$(date +%Y%m%d)

# 备份配置文件
cp .env.production backups/$(date +%Y%m%d)/
cp docker-compose.prod.yml backups/$(date +%Y%m%d)/
cp -r docker/ backups/$(date +%Y%m%d)/
```

#### 容器数据备份
```bash
# 备份卷数据
docker run --rm \
  -v mining_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/data_$(date +%Y%m%d).tar.gz -C /data .
```

#### 数据库备份 (如果有)
```bash
# Redis数据备份
docker-compose exec mining-redis redis-cli BGSAVE
docker cp mining-redis:/data/dump.rdb backups/redis_$(date +%Y%m%d).rdb
```

### 2. 自动备份

#### Cron任务
```bash
# 编辑crontab
crontab -e

# 每日备份 (凌晨2点)
0 2 * * * /path/to/mining-safety-db/scripts/backup.sh

# 每周清理旧备份
0 3 * * 0 find /path/to/backups -mtime +30 -delete
```

#### 备份脚本
```bash
#!/bin/bash
# scripts/backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$DATE"

mkdir -p "$BACKUP_DIR"

# 备份配置
cp .env.production "$BACKUP_DIR/"
cp -r docker/ "$BACKUP_DIR/"

# 备份数据
docker run --rm -v mining_data:/data -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine tar czf /backup/data.tar.gz -C /data .

echo "备份完成: $BACKUP_DIR"
```

### 3. 灾难恢复

#### 快速恢复
```bash
# 1. 停止服务
docker-compose down

# 2. 恢复配置
cp backups/latest/.env.production .
cp -r backups/latest/docker/ .

# 3. 恢复数据
docker run --rm -v mining_data:/data -v $(pwd)/backups/latest:/backup \
  alpine tar xzf /backup/data.tar.gz -C /data

# 4. 重启服务
docker-compose up -d
```

#### 回滚部署
```bash
# 使用部署脚本回滚
./scripts/deploy.sh --rollback

# 手动回滚到指定版本
docker tag mining-frontend:v1.0.0 mining-frontend:latest
docker-compose up -d
```

## 最佳实践

### 安全建议
1. **定期更新**: 及时更新基础镜像和依赖
2. **最小权限**: 使用非root用户运行容器
3. **网络隔离**: 使用Docker网络隔离服务
4. **密钥管理**: 使用Docker Secrets或外部密钥管理
5. **日志安全**: 避免在日志中记录敏感信息

### 性能优化
1. **镜像优化**: 使用多阶段构建减小镜像大小
2. **缓存策略**: 合理配置静态资源缓存
3. **压缩传输**: 启用Gzip/Brotli压缩
4. **CDN加速**: 使用CDN加速静态资源访问
5. **资源限制**: 合理设置容器资源限制

### 运维建议
1. **监控告警**: 建立完整的监控告警体系
2. **自动化**: 使用脚本自动化常见运维任务
3. **文档维护**: 及时更新部署和运维文档
4. **测试环境**: 保持测试环境与生产环境一致
5. **变更管理**: 建立规范的变更发布流程

## 联系支持

如遇到部署问题，请：
1. 查看本文档的故障排除章节
2. 检查应用日志和系统日志
3. 在项目Issue中提交问题报告
4. 联系技术支持团队

---

*文档更新时间: 2025-08-28*  
*版本: v1.0.0*