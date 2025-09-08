#!/bin/bash

# 矿区安全数据库前端 - 服务器更新部署脚本
# 用于服务器端拉取最新镜像并更新服务
# 
# 使用方法:
#   ./scripts/server-update.sh [image_tag]
#   curl -sL https://raw.githubusercontent.com/your-org/mining-safety-db-frontend/main/scripts/server-update.sh | bash -s -- latest

set -e  # 如果任何命令失败则退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数定义
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

# 默认配置
DEFAULT_REGISTRY="ghcr.io"
DEFAULT_IMAGE_NAME="mining-safety-db-frontend"
DEFAULT_TAG="latest"
DEFAULT_COMPOSE_FILE="docker-compose.prod.yml"
DEFAULT_SERVICE_NAME="mining-frontend"

# 解析参数
IMAGE_TAG=${1:-$DEFAULT_TAG}
COMPOSE_FILE=${DOCKER_COMPOSE_FILE:-$DEFAULT_COMPOSE_FILE}
SERVICE_NAME=${DOCKER_SERVICE_NAME:-$DEFAULT_SERVICE_NAME}
REGISTRY=${DOCKER_REGISTRY:-$DEFAULT_REGISTRY}
IMAGE_NAME=${DOCKER_IMAGE_NAME:-$DEFAULT_IMAGE_NAME}

# 检查系统要求
check_system_requirements() {
    log_info "检查系统要求..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            log_error "Docker Compose 未安装，请先安装Docker Compose"
            exit 1
        else
            DOCKER_COMPOSE_CMD="docker compose"
        fi
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
    
    # 检查Docker守护进程
    if ! docker info &> /dev/null; then
        log_error "Docker守护进程未运行，请启动Docker服务"
        exit 1
    fi
    
    log_success "系统要求检查完成"
}

# 检查项目文件
check_project_files() {
    log_info "检查项目文件..."
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose文件不存在: $COMPOSE_FILE"
        log_info "请确保在正确的项目目录下运行此脚本"
        exit 1
    fi
    
    log_success "项目文件检查完成"
}

# 备份当前状态
backup_current_state() {
    log_info "备份当前部署状态..."
    
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份环境变量文件
    if [ -f ".env" ]; then
        cp .env "$backup_dir/"
    fi
    
    if [ -f ".env.production" ]; then
        cp .env.production "$backup_dir/"
    fi
    
    # 备份compose文件
    cp "$COMPOSE_FILE" "$backup_dir/"
    
    # 记录当前运行的镜像信息
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Image}}\t{{.Status}}" > "$backup_dir/current_services.txt" || true
    
    echo "$backup_dir" > .last-backup
    log_success "状态备份完成: $backup_dir"
}

# 设置镜像环境变量
setup_image_environment() {
    log_info "配置镜像信息..."
    
    local full_image_name="${REGISTRY}/${GITHUB_REPOSITORY_OWNER:-your-org}/${IMAGE_NAME}:${IMAGE_TAG}"
    
    # 更新或创建.env.production文件
    if [ -f ".env.production" ]; then
        # 更新现有文件
        if grep -q "DOCKER_IMAGE=" .env.production; then
            sed -i "s|DOCKER_IMAGE=.*|DOCKER_IMAGE=$full_image_name|" .env.production
        else
            echo "DOCKER_IMAGE=$full_image_name" >> .env.production
        fi
    else
        # 创建新文件
        cat > .env.production << EOF
# 生产环境配置
DOCKER_IMAGE=$full_image_name
COMPOSE_PROJECT_NAME=mining-safety-db
TZ=Asia/Shanghai

# 服务端口配置
FRONTEND_PORT=80
HTTP_PORT=80
HTTPS_PORT=443

# 监控配置
METRICS_PORT=9113
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# 构建信息
BUILD_VERSION=$IMAGE_TAG
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
    fi
    
    log_success "镜像环境变量配置完成: $full_image_name"
}

# 拉取最新镜像
pull_latest_image() {
    log_info "拉取最新Docker镜像..."
    
    local full_image_name="${REGISTRY}/${GITHUB_REPOSITORY_OWNER:-your-org}/${IMAGE_NAME}:${IMAGE_TAG}"
    
    # 登录Docker仓库（如果需要）
    if [[ "$REGISTRY" == "ghcr.io" ]] && [ ! -z "${GITHUB_TOKEN:-}" ]; then
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u "${GITHUB_USERNAME:-$USER}" --password-stdin
    fi
    
    # 拉取镜像
    if docker pull "$full_image_name"; then
        log_success "镜像拉取成功: $full_image_name"
    else
        log_error "镜像拉取失败: $full_image_name"
        log_info "请检查:"
        log_info "1. 镜像标签是否正确"
        log_info "2. 是否有仓库访问权限"
        log_info "3. 网络连接是否正常"
        exit 1
    fi
}

# 健康检查
health_check() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    log_info "开始健康检查..."
    
    while [ $attempt -le $max_attempts ]; do
        log_info "健康检查 (${attempt}/${max_attempts})..."
        
        # 检查容器状态
        if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps "$service_name" | grep -q "Up"; then
            # 检查HTTP响应
            if curl -f -s --max-time 5 http://localhost/health >/dev/null 2>&1; then
                log_success "健康检查通过！"
                return 0
            fi
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "健康检查失败，服务可能未正常启动"
    return 1
}

# 滚动更新部署
rolling_update() {
    log_info "开始滚动更新部署..."
    
    # 停止服务（但不删除容器）
    log_info "停止现有服务..."
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" stop "$SERVICE_NAME" || true
    
    # 创建新容器
    log_info "启动更新后的服务..."
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
    
    # 健康检查
    if health_check "$SERVICE_NAME"; then
        log_success "滚动更新成功完成"
        
        # 清理旧容器和镜像
        log_info "清理旧资源..."
        docker container prune -f || true
        docker image prune -f || true
        
    else
        log_error "健康检查失败，准备回滚..."
        rollback
        exit 1
    fi
}

# 蓝绿部署（可选）
blue_green_deploy() {
    log_info "开始蓝绿部署..."
    
    local current_container=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$SERVICE_NAME" | head -n1 | cut -f1)
    
    if [ ! -z "$current_container" ]; then
        log_info "当前运行容器: $current_container"
        
        # 启动新容器（绿色环境）
        local green_service="${SERVICE_NAME}-green"
        
        # 修改compose配置启动绿色环境
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d --scale "$SERVICE_NAME=2" "$SERVICE_NAME"
        
        # 健康检查新容器
        sleep 10
        if health_check "$SERVICE_NAME"; then
            # 停止旧容器（蓝色环境）
            log_info "停止旧容器..."
            docker stop "$current_container" || true
            docker rm "$current_container" || true
            
            log_success "蓝绿部署完成"
        else
            log_error "绿色环境健康检查失败，保持蓝色环境运行"
            exit 1
        fi
    else
        log_warning "未找到运行中的容器，执行常规部署"
        rolling_update
    fi
}

# 回滚到上一个版本
rollback() {
    log_error "开始回滚操作..."
    
    if [ -f ".last-backup" ]; then
        local backup_dir=$(cat .last-backup)
        
        if [ -d "$backup_dir" ]; then
            log_info "恢复备份: $backup_dir"
            
            # 恢复配置文件
            if [ -f "$backup_dir/.env.production" ]; then
                cp "$backup_dir/.env.production" .
            fi
            
            if [ -f "$backup_dir/$COMPOSE_FILE" ]; then
                cp "$backup_dir/$COMPOSE_FILE" .
            fi
            
            # 重启服务
            $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
            
            log_success "回滚完成"
        else
            log_error "备份目录不存在: $backup_dir"
        fi
    else
        log_error "未找到备份信息，无法自动回滚"
        log_info "请手动检查服务状态: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps"
    fi
}

# 显示部署状态
show_deployment_status() {
    log_info "当前部署状态:"
    echo ""
    
    # 显示服务状态
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps
    echo ""
    
    # 显示镜像信息
    local full_image_name="${REGISTRY}/${GITHUB_REPOSITORY_OWNER:-your-org}/${IMAGE_NAME}:${IMAGE_TAG}"
    if docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | grep -q "$IMAGE_NAME:$IMAGE_TAG"; then
        log_info "当前镜像:"
        docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | grep "$IMAGE_NAME:$IMAGE_TAG"
        echo ""
    fi
    
    # 显示访问地址
    log_info "服务访问地址:"
    echo "  主页: http://localhost/"
    echo "  健康检查: http://localhost/health"
    echo ""
}

# 显示帮助
show_help() {
    echo "用法: $0 [IMAGE_TAG] [OPTIONS]"
    echo ""
    echo "参数:"
    echo "  IMAGE_TAG            Docker镜像标签 (默认: latest)"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  --blue-green        使用蓝绿部署模式"
    echo "  --rollback          回滚到上一个版本"
    echo "  --status            仅显示当前状态"
    echo "  --no-backup         跳过状态备份"
    echo ""
    echo "环境变量:"
    echo "  DOCKER_REGISTRY              Docker仓库地址"
    echo "  DOCKER_IMAGE_NAME            镜像名称"
    echo "  DOCKER_COMPOSE_FILE          Compose文件路径"
    echo "  DOCKER_SERVICE_NAME          服务名称"
    echo "  GITHUB_REPOSITORY_OWNER      GitHub仓库所有者"
    echo "  GITHUB_TOKEN                 GitHub访问令牌"
    echo ""
    echo "示例:"
    echo "  $0                     # 更新到latest版本"
    echo "  $0 v1.0.0             # 更新到v1.0.0版本"
    echo "  $0 --status           # 显示当前状态"
    echo "  $0 --rollback         # 回滚到上一版本"
    echo ""
}

# 解析命令行选项
DEPLOY_MODE="rolling"
BACKUP_STATE=true
SHOW_STATUS_ONLY=false
ROLLBACK_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --blue-green)
            DEPLOY_MODE="blue-green"
            shift
            ;;
        --rollback)
            ROLLBACK_ONLY=true
            shift
            ;;
        --status)
            SHOW_STATUS_ONLY=true
            shift
            ;;
        --no-backup)
            BACKUP_STATE=false
            shift
            ;;
        *)
            if [[ ! $1 =~ ^-- ]]; then
                IMAGE_TAG="$1"
            fi
            shift
            ;;
    esac
done

# 主执行流程
main() {
    local start_time=$(date +%s)
    
    log_info "开始服务器更新流程..."
    
    # 系统检查
    check_system_requirements
    check_project_files
    
    # 仅显示状态
    if [ "$SHOW_STATUS_ONLY" = true ]; then
        show_deployment_status
        exit 0
    fi
    
    # 仅回滚
    if [ "$ROLLBACK_ONLY" = true ]; then
        rollback
        exit 0
    fi
    
    # 备份当前状态
    if [ "$BACKUP_STATE" = true ]; then
        backup_current_state
    fi
    
    # 配置镜像信息
    setup_image_environment
    
    # 拉取最新镜像
    pull_latest_image
    
    # 执行部署
    case $DEPLOY_MODE in
        "blue-green")
            blue_green_deploy
            ;;
        "rolling"|*)
            rolling_update
            ;;
    esac
    
    # 显示最终状态
    show_deployment_status
    
    # 计算耗时
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "========================================"
    echo "           服务器更新完成"
    echo "========================================"
    echo "更新模式: $DEPLOY_MODE"
    echo "镜像标签: $IMAGE_TAG"
    echo "总耗时: ${duration} 秒"
    echo "========================================"
    
    # API Key配置说明
    echo ""
    echo "🔑 重要提醒：API Key配置"
    echo "========================================"
    echo "1. 如果需要使用AI功能，请在.env.production文件中设置："
    echo "   REACT_APP_SILICONFLOW_API_KEY=your_actual_api_key"
    echo ""
    echo "2. 获取API Key地址：https://siliconflow.cn/account/ak"
    echo ""
    echo "3. 设置完成后请重启服务："
    echo "   $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE restart mining-frontend"
    echo ""
    echo "4. 验证AI功能：访问应用并测试聊天功能"
    echo "========================================"
    
    log_success "所有操作完成！"
}

# 运行主函数
main