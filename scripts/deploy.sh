#!/bin/bash
# 矿区安全数据库前端 - 部署脚本
# 支持开发、测试、生产环境的自动化部署

set -e

# ================================
# 配置变量
# ================================
PROJECT_NAME="mining-safety-db"
IMAGE_NAME="mining-frontend"
REGISTRY="registry.mining.com"

# 环境配置
ENVIRONMENT=${ENVIRONMENT:-development}
VERSION=${VERSION:-latest}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# ================================
# 工具函数
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 命令未找到，请先安装"
        exit 1
    fi
}

# 等待服务就绪
wait_for_service() {
    local url=$1
    local timeout=${2:-60}
    local interval=${3:-5}
    
    log_info "等待服务就绪: $url"
    
    local count=0
    local max_attempts=$((timeout / interval))
    
    while [ $count -lt $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log_success "服务已就绪: $url"
            return 0
        fi
        
        count=$((count + 1))
        log_info "等待中... ($count/$max_attempts)"
        sleep $interval
    done
    
    log_error "服务启动超时: $url"
    return 1
}

# ================================
# 环境配置函数
# ================================

# 加载环境配置
load_environment() {
    log_step "加载 $ENVIRONMENT 环境配置"
    
    case $ENVIRONMENT in
        development|dev)
            ENV_FILE=".env.development"
            COMPOSE_FILE="docker-compose.yml"
            SERVICE_PORT=3000
            API_URL="https://mining-backend.ziven.site/api"
            ;;
        testing|test)
            ENV_FILE=".env.testing"
            COMPOSE_FILE="docker-compose.yml"
            SERVICE_PORT=3001
            API_URL="https://test-mining-backend.ziven.site/api"
            ;;
        production|prod)
            ENV_FILE=".env.production"
            COMPOSE_FILE="docker-compose.yml -f docker-compose.prod.yml"
            SERVICE_PORT=80
            API_URL="https://api.mining.com/api"
            ;;
        *)
            log_error "未支持的环境: $ENVIRONMENT"
            log_info "支持的环境: development, testing, production"
            exit 1
            ;;
    esac
    
    # 加载环境变量
    if [[ -f "$ENV_FILE" ]]; then
        log_info "加载环境变量文件: $ENV_FILE"
        set -a
        source "$ENV_FILE"
        set +a
    else
        log_warning "环境变量文件不存在: $ENV_FILE"
    fi
    
    # 设置部署相关变量
    export REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL:-$API_URL}
    export FRONTEND_PORT=${FRONTEND_PORT:-$SERVICE_PORT}
    
    log_info "环境: $ENVIRONMENT"
    log_info "API地址: $REACT_APP_API_BASE_URL"
    log_info "服务端口: $FRONTEND_PORT"
}

# ================================
# 部署函数
# ================================

# 预检查
pre_deploy_check() {
    log_step "执行部署前检查"
    
    # 检查必要工具
    check_command docker
    check_command docker-compose
    check_command curl
    
    # 检查Docker服务
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行"
        exit 1
    fi
    
    # 检查镜像是否存在
    if [[ "$ENVIRONMENT" == "production" ]] && [[ ! -z "$REGISTRY" ]]; then
        FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$VERSION"
        log_info "检查生产镜像: $FULL_IMAGE_NAME"
        
        if ! docker pull "$FULL_IMAGE_NAME" 2>/dev/null; then
            log_error "无法拉取生产镜像: $FULL_IMAGE_NAME"
            exit 1
        fi
    fi
    
    # 检查端口可用性
    if netstat -tuln | grep ":$FRONTEND_PORT " > /dev/null; then
        log_warning "端口 $FRONTEND_PORT 已被占用，将停止现有服务"
    fi
    
    log_success "预检查完成"
}

# 停止现有服务
stop_services() {
    log_step "停止现有服务"
    
    # 使用docker-compose停止
    if [[ -f "docker-compose.yml" ]]; then
        log_info "停止docker-compose服务"
        eval "docker-compose -f $COMPOSE_FILE down" || true
    fi
    
    # 强制清理相关容器
    RUNNING_CONTAINERS=$(docker ps -q -f name=mining-)
    if [[ ! -z "$RUNNING_CONTAINERS" ]]; then
        log_info "强制停止相关容器"
        echo "$RUNNING_CONTAINERS" | xargs docker stop || true
        echo "$RUNNING_CONTAINERS" | xargs docker rm || true
    fi
    
    log_success "服务停止完成"
}

# 备份当前部署 (生产环境)
backup_deployment() {
    if [[ "$ENVIRONMENT" != "production" ]]; then
        return
    fi
    
    log_step "备份当前部署"
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份配置文件
    if [[ -f ".env.production" ]]; then
        cp .env.production "$BACKUP_DIR/"
    fi
    
    if [[ -f "docker-compose.prod.yml" ]]; then
        cp docker-compose.prod.yml "$BACKUP_DIR/"
    fi
    
    # 备份数据库 (如果有本地数据)
    if docker volume ls | grep -q mining_data; then
        log_info "备份应用数据"
        docker run --rm -v mining_data:/data -v "$PWD/$BACKUP_DIR":/backup \
            alpine tar czf /backup/data.tar.gz -C /data .
    fi
    
    log_success "备份完成: $BACKUP_DIR"
    
    # 保留最近10个备份
    ls -t backups/ | tail -n +11 | xargs -r rm -rf
}

# 部署服务
deploy_services() {
    log_step "部署服务"
    
    # 创建必要目录
    mkdir -p logs/nginx
    
    # 设置权限
    chmod -R 755 logs/
    
    # 启动服务
    log_info "启动服务 (环境: $ENVIRONMENT)"
    eval "docker-compose -f $COMPOSE_FILE up -d"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 15
    
    # 检查服务状态
    eval "docker-compose -f $COMPOSE_FILE ps"
    
    log_success "服务部署完成"
}

# 健康检查
health_check() {
    log_step "执行健康检查"
    
    local service_url="http://localhost:$FRONTEND_PORT"
    local health_url="$service_url/health"
    
    # 等待服务就绪
    if ! wait_for_service "$health_url" 120 5; then
        log_error "健康检查失败"
        show_service_logs
        exit 1
    fi
    
    # 检查主页
    if curl -f -s "$service_url" > /dev/null; then
        log_success "主页访问正常"
    else
        log_error "主页访问失败"
        exit 1
    fi
    
    # 检查API代理 (如果配置了)
    if curl -f -s "$service_url/api/health" > /dev/null 2>&1; then
        log_success "API代理正常"
    else
        log_warning "API代理检查失败或未配置"
    fi
    
    log_success "健康检查通过"
}

# 性能测试 (简单)
performance_test() {
    if [[ "$ENVIRONMENT" != "production" ]]; then
        return
    fi
    
    log_step "执行性能测试"
    
    local service_url="http://localhost:$FRONTEND_PORT"
    
    # 简单的响应时间测试
    log_info "测试响应时间..."
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$service_url")
    log_info "响应时间: ${response_time}s"
    
    # 检查响应时间阈值
    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        log_warning "响应时间较长: ${response_time}s"
    fi
    
    # 简单的并发测试 (需要安装ab)
    if command -v ab &> /dev/null; then
        log_info "执行并发测试 (10并发，100请求)"
        ab -n 100 -c 10 "$service_url/" > /tmp/ab_result.txt 2>&1
        
        local rps=$(grep "Requests per second" /tmp/ab_result.txt | awk '{print $4}')
        log_info "处理能力: ${rps} requests/sec"
    fi
    
    log_success "性能测试完成"
}

# 显示服务日志
show_service_logs() {
    log_info "显示服务日志 (最近50行)"
    eval "docker-compose -f $COMPOSE_FILE logs --tail=50"
}

# 部署后清理
post_deploy_cleanup() {
    log_step "部署后清理"
    
    # 清理未使用的镜像
    DANGLING_IMAGES=$(docker images -f "dangling=true" -q)
    if [[ ! -z "$DANGLING_IMAGES" ]]; then
        log_info "清理未使用的镜像"
        echo "$DANGLING_IMAGES" | xargs docker rmi || true
    fi
    
    # 清理未使用的网络
    docker network prune -f > /dev/null 2>&1 || true
    
    log_success "清理完成"
}

# 回滚部署
rollback_deployment() {
    log_step "回滚部署"
    
    if [[ ! -d "backups" ]] || [[ -z "$(ls -A backups)" ]]; then
        log_error "没有可用的备份进行回滚"
        exit 1
    fi
    
    # 获取最新备份
    LATEST_BACKUP=$(ls -t backups/ | head -n1)
    log_info "回滚到备份: $LATEST_BACKUP"
    
    # 停止当前服务
    stop_services
    
    # 恢复配置文件
    if [[ -f "backups/$LATEST_BACKUP/.env.production" ]]; then
        cp "backups/$LATEST_BACKUP/.env.production" .env.production
    fi
    
    if [[ -f "backups/$LATEST_BACKUP/docker-compose.prod.yml" ]]; then
        cp "backups/$LATEST_BACKUP/docker-compose.prod.yml" .
    fi
    
    # 恢复数据
    if [[ -f "backups/$LATEST_BACKUP/data.tar.gz" ]]; then
        log_info "恢复应用数据"
        docker run --rm -v mining_data:/data -v "$PWD/backups/$LATEST_BACKUP":/backup \
            alpine tar xzf /backup/data.tar.gz -C /data
    fi
    
    # 重新部署
    deploy_services
    health_check
    
    log_success "回滚完成"
}

# 显示部署状态
show_deployment_status() {
    log_step "部署状态"
    
    echo "=================================================="
    echo "环境: $ENVIRONMENT"
    echo "版本: $VERSION"
    echo "服务端口: $FRONTEND_PORT"
    echo "API地址: $REACT_APP_API_BASE_URL"
    echo "=================================================="
    
    # 显示容器状态
    eval "docker-compose -f $COMPOSE_FILE ps"
    
    # 显示访问地址
    echo ""
    echo "应用访问地址:"
    echo "  - 本地: http://localhost:$FRONTEND_PORT"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "  - 生产: https://mining.yourdomain.com"
    fi
    
    echo ""
    echo "管理命令:"
    echo "  - 查看日志: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  - 停止服务: docker-compose -f $COMPOSE_FILE down"
    echo "  - 重启服务: docker-compose -f $COMPOSE_FILE restart"
    echo "=================================================="
}

# 显示帮助信息
show_help() {
    echo "矿区安全数据库前端部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "环境变量:"
    echo "  ENVIRONMENT=development|testing|production  部署环境"
    echo "  VERSION=latest                              镜像版本"
    echo ""
    echo "选项:"
    echo "  --deploy         执行部署 (默认)"
    echo "  --stop           停止服务"
    echo "  --restart        重启服务"
    echo "  --status         显示部署状态"
    echo "  --logs           显示服务日志"
    echo "  --rollback       回滚到上一版本"
    echo "  --health         执行健康检查"
    echo "  --backup         创建备份"
    echo "  --cleanup        清理资源"
    echo "  --help           显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                                    # 部署到开发环境"
    echo "  ENVIRONMENT=production $0             # 部署到生产环境"
    echo "  VERSION=v1.2.3 $0 --deploy           # 部署特定版本"
    echo "  $0 --rollback                         # 回滚部署"
    echo ""
}

# ================================
# 主流程
# ================================
main() {
    log_info "矿区安全数据库前端部署脚本启动"
    log_info "部署时间: $(date)"
    
    # 加载环境配置
    load_environment
    
    case "${1:---deploy}" in
        --deploy)
            pre_deploy_check
            backup_deployment
            stop_services
            deploy_services
            health_check
            performance_test
            post_deploy_cleanup
            show_deployment_status
            ;;
        --stop)
            stop_services
            ;;
        --restart)
            stop_services
            deploy_services
            health_check
            ;;
        --status)
            show_deployment_status
            ;;
        --logs)
            show_service_logs
            ;;
        --rollback)
            rollback_deployment
            ;;
        --health)
            health_check
            ;;
        --backup)
            backup_deployment
            ;;
        --cleanup)
            post_deploy_cleanup
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
    
    log_success "部署脚本执行完成"
}

# 捕获中断信号
trap 'log_warning "部署被中断"; exit 1' INT TERM

# 执行主函数
main "$@"