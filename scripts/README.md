# 矿区安全数据库前端 - 部署脚本使用指南

> 📅 最后更新: 2025-08-29  
> 🎯 版本: v1.0.0  

## 脚本概览

本目录包含了矿区安全数据库前端的完整自动化部署和运维脚本套件，支持多云环境和本地部署。

### 脚本列表

| 脚本文件 | 功能描述 | 使用场景 |
|---------|----------|----------|
| `deploy-cloud.sh` | 云端自动化部署主脚本 | 生产环境云端部署 |
| `init-server.sh` | 服务器初始化脚本 | 新服务器环境搭建 |
| `monitor-and-backup.sh` | 监控和备份自动化脚本 | 日常运维监控 |
| `setup-scripts.sh` | 脚本初始化设置 | 脚本权限配置 |

---

## 快速开始

### 1. 脚本初始化

```bash
# 设置脚本执行权限
chmod +x scripts/*.sh

# 或使用初始化脚本
./scripts/setup-scripts.sh
```

### 2. 一键云端部署

```bash
# 阿里云部署
./scripts/deploy-cloud.sh aliyun production

# AWS部署
./scripts/deploy-cloud.sh aws production

# 通用VPS部署
SERVER_IP=1.2.3.4 ./scripts/deploy-cloud.sh generic production
```

### 3. 监控和维护

```bash
# 执行健康检查和监控
./scripts/monitor-and-backup.sh --monitor

# 执行应用备份
./scripts/monitor-and-backup.sh --backup

# 完整监控、备份和报告
./scripts/monitor-and-backup.sh --full
```

---

## 详细使用说明

### deploy-cloud.sh - 云端部署脚本

#### 功能特性
- 🌩️ 支持多云平台 (阿里云、腾讯云、AWS、GCP)
- 🚀 自动化服务器创建和配置
- 🔒 SSL证书自动申请和配置  
- 📊 负载均衡器配置
- 🐳 Docker容器化部署
- ⚡ 健康检查和回滚机制

#### 使用方法

```bash
./scripts/deploy-cloud.sh [云服务商] [环境]
```

#### 支持的云服务商
- `aliyun` - 阿里云 ECS + SLB
- `tencent` - 腾讯云 CVM + CLB  
- `aws` - AWS EC2 + ALB
- `gcp` - Google Cloud Compute Engine + LB
- `generic` - 通用VPS服务器

#### 环境变量配置

```bash
# 基础配置
export VERSION="v1.0.0"              # 部署版本
export SERVER_IP="1.2.3.4"          # 服务器IP (generic模式必需)
export SERVER_USER="root"           # SSH用户名
export SSH_KEY="/path/to/key.pem"   # SSH私钥路径

# 域名和SSL
export DOMAIN="your-domain.com"      # 域名
export SSL_EMAIL="admin@domain.com"  # SSL证书邮箱

# 云服务商特定配置
export SECURITY_GROUP_ID="sg-xxx"    # 安全组ID
export VSWITCH_ID="vsw-xxx"          # 交换机ID
export INSTANCE_PASSWORD="xxx"       # 实例密码
```

#### 使用示例

```bash
# 阿里云生产环境部署
export SECURITY_GROUP_ID="sg-xxxxxxxxx"
export VSWITCH_ID="vsw-xxxxxxxxx" 
export DOMAIN="mining-frontend.yourcompany.com"
export SSL_EMAIL="ops@yourcompany.com"
./scripts/deploy-cloud.sh aliyun production

# AWS测试环境部署
export AWS_KEY_PAIR="my-keypair"
export AWS_SECURITY_GROUP="sg-xxxxxxxxx"
export AWS_SUBNET_ID="subnet-xxxxxxxxx"
./scripts/deploy-cloud.sh aws testing

# 通用VPS部署
export SERVER_IP="192.168.1.100"
export SERVER_USER="ubuntu"
export SSH_KEY="~/.ssh/id_rsa"
./scripts/deploy-cloud.sh generic production
```

---

### init-server.sh - 服务器初始化脚本

#### 功能特性
- 🔧 系统更新和基础工具安装
- 🐳 Docker和Docker Compose自动安装
- 👤 部署用户创建和权限配置
- 🔥 防火墙规则配置
- ⚡ 系统性能优化
- 📊 监控工具安装
- 🔒 SSH安全加固

#### 使用方法

```bash
# 在目标服务器上执行
curl -fsSL https://raw.githubusercontent.com/your-org/mining-frontend/main/scripts/init-server.sh | sudo bash

# 或本地执行
sudo ./scripts/init-server.sh
```

#### 环境变量

```bash
export DEPLOY_USER_PASSWORD="secure_password"  # 部署用户密码
export INSTALL_NODEJS="true"                  # 是否安装Node.js
export AUTO_REBOOT="false"                    # 完成后是否自动重启
```

---

### monitor-and-backup.sh - 监控备份脚本

#### 功能特性
- 🏥 应用健康检查
- 📈 系统性能监控
- 💾 自动化备份
- 📧 告警通知
- 📊 监控报告生成
- ☁️ 云存储上传

#### 使用方法

```bash
# 基础监控
./scripts/monitor-and-backup.sh --monitor

# 执行备份
./scripts/monitor-and-backup.sh --backup

# 生成报告
./scripts/monitor-and-backup.sh --report

# 完整操作
./scripts/monitor-and-backup.sh --full
```

#### 配置选项

```bash
# 健康检查配置
export HEALTH_CHECK_URL="http://localhost/health"
export RESPONSE_TIME_THRESHOLD="2000"  # 响应时间阈值(ms)

# 资源监控阈值
export MEMORY_THRESHOLD="80"           # 内存使用率阈值(%)
export CPU_THRESHOLD="80"              # CPU使用率阈值(%)  
export DISK_THRESHOLD="85"             # 磁盘使用率阈值(%)

# 备份配置
export BACKUP_RETENTION_DAYS="30"      # 备份保留天数
export BACKUP_TO_CLOUD="true"          # 是否上传到云存储

# 告警配置
export ALERT_ENABLED="true"
export ALERT_EMAIL="ops@yourcompany.com"
export ALERT_WEBHOOK="https://hooks.slack.com/xxx"
```

#### 云存储配置

```bash
# AWS S3
export AWS_S3_BUCKET="your-backup-bucket"

# 阿里云OSS  
export ALIYUN_OSS_BUCKET="your-oss-bucket"

# 腾讯云COS
export TENCENT_COS_BUCKET="your-cos-bucket"
```

---

## 自动化部署流程

### Cron定时任务配置

```bash
# 编辑crontab
crontab -e

# 添加以下任务
# 每5分钟执行健康检查
*/5 * * * * /opt/mining-frontend/scripts/monitor-and-backup.sh --health >/dev/null 2>&1

# 每小时收集性能指标
0 * * * * /opt/mining-frontend/scripts/monitor-and-backup.sh --metrics >/dev/null 2>&1

# 每天凌晨2点执行备份
0 2 * * * /opt/mining-frontend/scripts/monitor-and-backup.sh --backup >/dev/null 2>&1

# 每周日生成监控报告  
0 8 * * 0 /opt/mining-frontend/scripts/monitor-and-backup.sh --report >/dev/null 2>&1

# 每周清理旧备份
0 4 * * 0 /opt/mining-frontend/scripts/monitor-and-backup.sh --cleanup >/dev/null 2>&1
```

### Systemd服务配置

创建监控服务：

```bash
# 创建服务文件
sudo tee /etc/systemd/system/mining-frontend-monitor.service << EOF
[Unit]
Description=Mining Frontend Monitor Service
After=docker.service

[Service]
Type=oneshot
User=deploy
WorkingDirectory=/opt/mining-frontend
ExecStart=/opt/mining-frontend/scripts/monitor-and-backup.sh --monitor
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 创建定时器
sudo tee /etc/systemd/system/mining-frontend-monitor.timer << EOF
[Unit]
Description=Run Mining Frontend Monitor every 5 minutes
Requires=mining-frontend-monitor.service

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
EOF

# 启用服务
sudo systemctl enable mining-frontend-monitor.timer
sudo systemctl start mining-frontend-monitor.timer
```

---

## CI/CD集成

### GitHub Actions集成

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud

on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Production
        env:
          SERVER_IP: ${{ secrets.SERVER_IP }}
          SSH_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          DOMAIN: ${{ secrets.DOMAIN }}
          SSL_EMAIL: ${{ secrets.SSL_EMAIL }}
        run: |
          echo "$SSH_KEY" > /tmp/deploy_key
          chmod 600 /tmp/deploy_key
          export SSH_KEY="/tmp/deploy_key"
          ./scripts/deploy-cloud.sh generic production
```

### GitLab CI集成

```yaml
# .gitlab-ci.yml
stages:
  - deploy

deploy_production:
  stage: deploy
  script:
    - chmod +x scripts/*.sh
    - export VERSION=$CI_COMMIT_TAG
    - ./scripts/deploy-cloud.sh aliyun production
  only:
    - tags
  when: manual
```

---

## 故障排除

### 常见问题

#### 1. 脚本权限问题

```bash
# 解决方法
chmod +x scripts/*.sh
```

#### 2. Docker服务未启动

```bash
# 检查Docker状态
sudo systemctl status docker

# 启动Docker服务
sudo systemctl start docker
```

#### 3. SSH连接失败

```bash
# 检查SSH密钥权限
chmod 600 ~/.ssh/id_rsa

# 测试SSH连接
ssh -i ~/.ssh/id_rsa user@server_ip
```

#### 4. 健康检查失败

```bash
# 检查应用状态
docker compose ps

# 查看应用日志
docker compose logs mining-frontend

# 手动测试健康检查
curl -v http://localhost/health
```

### 调试模式

启用详细日志输出：

```bash
# 启用调试模式
export DEBUG=true

# 执行脚本
./scripts/deploy-cloud.sh generic production
```

---

## 安全最佳实践

### 1. 密钥管理
- 使用强密码和SSH密钥认证
- 定期轮换访问密钥
- 使用密钥管理服务(如AWS Secrets Manager)

### 2. 网络安全
- 配置适当的安全组规则
- 使用VPN或堡垒机访问
- 启用DDoS防护

### 3. 监控告警
- 设置适当的告警阈值
- 配置多种通知渠道
- 建立事件响应流程

### 4. 备份策略
- 定期测试备份恢复
- 异地备份存储
- 加密敏感备份数据

---

## 性能优化

### 1. 服务器配置
- 根据负载选择适当的实例规格
- 使用SSD存储提升I/O性能
- 配置CDN加速静态资源

### 2. 应用优化
- 启用Gzip压缩
- 配置合适的缓存策略
- 优化Docker镜像大小

### 3. 监控优化
- 调整监控频率避免过载
- 使用采样降低监控成本
- 设置合理的数据保留期

---

## 支持与反馈

### 获取帮助

1. **查看文档**: `docs/deployment-guide.md`
2. **查看日志**: `/var/log/mining/monitor.log`
3. **健康检查**: `./scripts/monitor-and-backup.sh --health`
4. **生成报告**: `./scripts/monitor-and-backup.sh --report`

### 问题反馈

如遇到问题，请提供以下信息：
- 操作系统版本
- Docker版本
- 错误日志
- 执行的命令
- 环境变量配置

### 贡献指南

欢迎提交Pull Request改进部署脚本：
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发送Pull Request

---

## 更新日志

### v1.0.0 (2025-08-29)
- 初始版本发布
- 支持多云平台部署
- 完整监控和备份功能
- 自动化运维脚本

---

**📞 技术支持**: 如需帮助请联系运维团队或提交Issue  
**🔗 项目地址**: [GitHub Repository]  
**📚 完整文档**: `docs/deployment-guide.md`