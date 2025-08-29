#!/bin/bash

# 矿区安全数据库前端 - 云端自动化部署脚本
# 支持阿里云、腾讯云、AWS、Google Cloud等主流云服务商
# 使用方法: ./deploy-cloud.sh [cloud-provider] [environment]

set -e

# ================================
# 配置变量
# ================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CLOUD_PROVIDER="${1:-generic}"
ENVIRONMENT="${2:-production}"
DEPLOY_VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================
# 日志函数
# ================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${BLUE}"
    echo "========================================"
    echo " $1"
    echo "========================================"
    echo -e "${NC}"
}

# ================================
# 帮助信息
# ================================

show_help() {
    cat << EOF
矿区安全数据库前端 - 云端自动化部署脚本

用法: $0 [云服务商] [环境]

云服务商选项:
  aliyun     阿里云 ECS + SLB
  tencent    腾讯云 CVM + CLB  
  aws        AWS EC2 + ALB
  gcp        Google Cloud Compute Engine + LB
  azure      Azure VM + Load Balancer
  generic    通用VPS服务器

环境选项:
  production    生产环境
  staging       预发布环境
  testing       测试环境

环境变量:
  VERSION          部署版本号 (默认: 当前时间戳)
  SERVER_IP        服务器IP地址
  SERVER_USER      服务器用户名 (默认: root)
  SSH_KEY          SSH私钥路径
  DOMAIN           域名 (可选)
  SSL_EMAIL        SSL证书邮箱 (可选)

示例:
  $0 aliyun production
  VERSION=v1.0.0 $0 aws production
  SERVER_IP=1.2.3.4 $0 generic production

EOF
}

# ================================
# 预检查
# ================================

check_requirements() {
    log_header "系统要求检查"
    
    # 检查必要工具
    local required_tools=("docker" "docker-compose" "curl" "ssh" "rsync")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "缺少必要工具: $tool"
            exit 1
        fi
    done
    
    # 检查Docker是否运行
    if ! docker info &> /dev/null; then
        log_error "Docker未运行，请启动Docker服务"
        exit 1
    fi
    
    # 检查环境变量文件
    if [[ ! -f "$PROJECT_DIR/.env.example" ]]; then
        log_error "未找到环境变量模板文件: .env.example"
        exit 1
    fi
    
    log_success "系统要求检查通过"
}

# ================================
# 环境配置
# ================================

setup_environment() {
    log_header "环境配置"
    
    # 设置环境变量文件
    local env_file="$PROJECT_DIR/.env.$ENVIRONMENT"
    if [[ ! -f "$env_file" ]]; then
        log_info "创建环境配置文件: $env_file"
        cp "$PROJECT_DIR/.env.example" "$env_file"
        
        # 根据环境设置默认值
        case $ENVIRONMENT in
            production)
                sed -i.bak 's/NODE_ENV=development/NODE_ENV=production/' "$env_file"
                sed -i.bak 's/DEBUG=true/DEBUG=false/' "$env_file"
                ;;
            staging)
                sed -i.bak 's/NODE_ENV=development/NODE_ENV=staging/' "$env_file"
                ;;
            testing)
                sed -i.bak 's/NODE_ENV=development/NODE_ENV=testing/' "$env_file"
                ;;
        esac
        
        log_warning "请编辑 $env_file 配置环境变量"
    fi
    
    # 加载环境变量
    source "$env_file"
    export $(grep -v '^#' "$env_file" | xargs)
    
    log_success "环境配置完成"
}

# ================================
# 阿里云部署
# ================================

deploy_aliyun() {
    log_header "阿里云 ECS 部署"
    
    # 检查阿里云CLI
    if ! command -v aliyun &> /dev/null; then
        log_info "安装阿里云CLI..."
        curl -fsSL https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz | tar -xzC /usr/local/bin/
    fi
    
    # 创建ECS实例（如果不存在）
    if [[ -z "$SERVER_IP" ]]; then
        log_info "创建ECS实例..."
        
        # 这里应该根据实际需求配置ECS参数
        local instance_id=$(aliyun ecs RunInstances \
            --RegionId cn-hangzhou \
            --ImageId ubuntu_20_04_x64_20G_alibase_20230515.vhd \
            --InstanceType ecs.c6.large \
            --SecurityGroupId "${SECURITY_GROUP_ID}" \
            --VSwitchId "${VSWITCH_ID}" \
            --InstanceName "mining-frontend-${ENVIRONMENT}" \
            --Password "${INSTANCE_PASSWORD}" \
            --InternetMaxBandwidthOut 100 \
            --SystemDiskSize 50 \
            --output text --query 'InstanceIdSets.InstanceIdSet[0]')
        
        log_info "等待实例启动... 实例ID: $instance_id"
        aliyun ecs StartInstance --InstanceId "$instance_id"
        
        # 等待实例运行并获取IP
        sleep 60
        SERVER_IP=$(aliyun ecs DescribeInstances \
            --InstanceIds "[$instance_id]" \
            --output text --query 'Instances.Instance[0].PublicIpAddress.IpAddress[0]')
        
        log_success "ECS实例创建完成，IP: $SERVER_IP"
    fi
    
    # 配置负载均衡器（如果需要）
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "配置负载均衡器..."
        # SLB配置代码...
    fi
    
    deploy_to_server
}

# ================================
# 腾讯云部署
# ================================

deploy_tencent() {
    log_header "腾讯云 CVM 部署"
    
    # 检查腾讯云CLI
    if ! command -v tccli &> /dev/null; then
        log_info "安装腾讯云CLI..."
        pip3 install tccli
    fi
    
    # 创建CVM实例
    if [[ -z "$SERVER_IP" ]]; then
        log_info "创建CVM实例..."
        
        local instance_id=$(tccli cvm RunInstances \
            --region ap-guangzhou \
            --image-id img-ubuntu20-x86 \
            --instance-type S3.MEDIUM2 \
            --instance-name "mining-frontend-${ENVIRONMENT}" \
            --system-disk-size 50 \
            --internet-max-bandwidth-out 100 \
            --query 'InstanceIdSet[0]' --output text)
        
        log_info "等待实例启动... 实例ID: $instance_id"
        sleep 60
        
        SERVER_IP=$(tccli cvm DescribeInstances \
            --instance-ids "$instance_id" \
            --query 'InstanceSet[0].PublicIpAddresses[0]' --output text)
        
        log_success "CVM实例创建完成，IP: $SERVER_IP"
    fi
    
    deploy_to_server
}

# ================================
# AWS部署
# ================================

deploy_aws() {
    log_header "AWS EC2 部署"
    
    # 检查AWS CLI
    if ! command -v aws &> /dev/null; then
        log_info "安装AWS CLI..."
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        sudo ./aws/install
        rm -rf awscliv2.zip aws/
    fi
    
    # 创建EC2实例
    if [[ -z "$SERVER_IP" ]]; then
        log_info "创建EC2实例..."
        
        local instance_id=$(aws ec2 run-instances \
            --image-id ami-0c02fb55956c7d316 \
            --count 1 \
            --instance-type t3.medium \
            --key-name "${AWS_KEY_PAIR}" \
            --security-group-ids "${AWS_SECURITY_GROUP}" \
            --subnet-id "${AWS_SUBNET_ID}" \
            --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=mining-frontend-${ENVIRONMENT}}]" \
            --query 'Instances[0].InstanceId' --output text)
        
        log_info "等待实例启动... 实例ID: $instance_id"
        aws ec2 wait instance-running --instance-ids "$instance_id"
        
        SERVER_IP=$(aws ec2 describe-instances \
            --instance-ids "$instance_id" \
            --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
        
        log_success "EC2实例创建完成，IP: $SERVER_IP"
    fi
    
    deploy_to_server
}

# ================================
# Google Cloud部署
# ================================

deploy_gcp() {
    log_header "Google Cloud Compute Engine 部署"
    
    # 检查gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        log_error "请安装Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # 创建GCE实例
    if [[ -z "$SERVER_IP" ]]; then
        log_info "创建Compute Engine实例..."
        
        gcloud compute instances create "mining-frontend-${ENVIRONMENT}" \
            --zone="${GCP_ZONE:-asia-east1-a}" \
            --machine-type=e2-medium \
            --subnet=default \
            --image=ubuntu-2004-focal-v20231101 \
            --image-project=ubuntu-os-cloud \
            --boot-disk-size=50GB \
            --boot-disk-type=pd-ssd \
            --tags=mining-frontend
        
        # 获取外部IP
        SERVER_IP=$(gcloud compute instances describe "mining-frontend-${ENVIRONMENT}" \
            --zone="${GCP_ZONE:-asia-east1-a}" \
            --query="networkInterfaces[0].accessConfigs[0].natIP" \
            --format="value()")
        
        log_success "GCE实例创建完成，IP: $SERVER_IP"
    fi
    
    deploy_to_server
}

# ================================
# 通用服务器部署
# ================================

deploy_to_server() {
    log_header "部署到服务器: $SERVER_IP"
    
    # 检查服务器连通性
    log_info "检查服务器连通性..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "${SERVER_USER:-root}@$SERVER_IP" 'echo "连接成功"'; then
        log_error "无法连接到服务器: $SERVER_IP"
        exit 1
    fi
    
    # 服务器初始化
    log_info "初始化服务器环境..."
    ssh "${SERVER_USER:-root}@$SERVER_IP" 'bash -s' < "$SCRIPT_DIR/init-server.sh"
    
    # 同步项目文件
    log_info "同步项目文件..."
    rsync -avz --delete \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='logs' \
        --exclude='test-results' \
        "$PROJECT_DIR/" "${SERVER_USER:-root}@$SERVER_IP:/opt/mining-frontend/"
    
    # 远程构建和部署
    log_info "远程构建和部署..."
    ssh "${SERVER_USER:-root}@$SERVER_IP" << EOF
        cd /opt/mining-frontend
        
        # 设置环境变量
        export VERSION="$DEPLOY_VERSION"
        export ENVIRONMENT="$ENVIRONMENT"
        
        # 构建Docker镜像
        docker build -t mining-frontend:$DEPLOY_VERSION .
        docker tag mining-frontend:$DEPLOY_VERSION mining-frontend:latest
        
        # 停止旧服务
        docker-compose down || true
        
        # 启动新服务
        if [[ "$ENVIRONMENT" == "production" ]]; then
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        else
            docker-compose up -d
        fi
        
        # 清理旧镜像
        docker image prune -f
        
        echo "部署完成"
EOF
    
    # 健康检查
    log_info "执行健康检查..."
    sleep 30
    
    local health_check_url="http://$SERVER_IP/health"
    if [[ -n "$DOMAIN" ]]; then
        health_check_url="http://$DOMAIN/health"
    fi
    
    if curl -f "$health_check_url" &> /dev/null; then
        log_success "健康检查通过"
    else
        log_error "健康检查失败"
        ssh "${SERVER_USER:-root}@$SERVER_IP" 'cd /opt/mining-frontend && docker-compose logs --tail=50'
        exit 1
    fi
}

# ================================
# SSL证书配置
# ================================

setup_ssl() {
    if [[ -n "$DOMAIN" && -n "$SSL_EMAIL" ]]; then
        log_header "配置SSL证书"
        
        ssh "${SERVER_USER:-root}@$SERVER_IP" << EOF
            # 安装Certbot
            apt update
            apt install -y certbot nginx
            
            # 获取SSL证书
            certbot certonly \
                --standalone \
                --email $SSL_EMAIL \
                --agree-tos \
                --no-eff-email \
                --domains $DOMAIN
            
            # 配置自动续期
            echo "0 3 * * * certbot renew --quiet" | crontab -
            
            # 重启服务
            cd /opt/mining-frontend
            docker-compose restart nginx-proxy || docker-compose restart mining-frontend
EOF
        
        log_success "SSL证书配置完成"
    fi
}

# ================================
# 主函数
# ================================

main() {
    # 解析命令行参数
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        --version)
            echo "矿区安全数据库前端部署脚本 v1.0.0"
            exit 0
            ;;
    esac
    
    log_header "开始云端部署 - $CLOUD_PROVIDER ($ENVIRONMENT)"
    
    # 预检查
    check_requirements
    setup_environment
    
    # 根据云服务商执行不同的部署流程
    case $CLOUD_PROVIDER in
        aliyun|alibaba)
            deploy_aliyun
            ;;
        tencent|qcloud)
            deploy_tencent
            ;;
        aws|amazon)
            deploy_aws
            ;;
        gcp|google)
            deploy_gcp
            ;;
        azure|microsoft)
            log_error "Azure部署暂未实现"
            exit 1
            ;;
        generic|vps)
            if [[ -z "$SERVER_IP" ]]; then
                log_error "通用部署需要指定SERVER_IP环境变量"
                exit 1
            fi
            deploy_to_server
            ;;
        *)
            log_error "不支持的云服务商: $CLOUD_PROVIDER"
            show_help
            exit 1
            ;;
    esac
    
    # SSL证书配置
    setup_ssl
    
    # 部署成功信息
    log_success "🎉 部署完成！"
    echo ""
    echo "📊 部署信息："
    echo "  云服务商: $CLOUD_PROVIDER"
    echo "  环境: $ENVIRONMENT"
    echo "  版本: $DEPLOY_VERSION"
    echo "  服务器IP: $SERVER_IP"
    [[ -n "$DOMAIN" ]] && echo "  域名: $DOMAIN"
    echo ""
    echo "🔗 访问地址："
    if [[ -n "$DOMAIN" ]]; then
        echo "  前端: https://$DOMAIN"
        echo "  健康检查: https://$DOMAIN/health"
    else
        echo "  前端: http://$SERVER_IP"
        echo "  健康检查: http://$SERVER_IP/health"
    fi
    echo ""
    echo "📖 管理命令："
    echo "  查看状态: ssh ${SERVER_USER:-root}@$SERVER_IP 'cd /opt/mining-frontend && docker-compose ps'"
    echo "  查看日志: ssh ${SERVER_USER:-root}@$SERVER_IP 'cd /opt/mining-frontend && docker-compose logs -f'"
    echo "  重启服务: ssh ${SERVER_USER:-root}@$SERVER_IP 'cd /opt/mining-frontend && docker-compose restart'"
}

# 执行主函数
main "$@"