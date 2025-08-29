#!/bin/bash
# 矿区安全数据库前端 - 构建脚本
# 用于自动化构建和部署

set -e

# ================================
# 配置变量
# ================================
PROJECT_NAME="mining-safety-db"
IMAGE_NAME="mining-frontend"
CONTAINER_NAME="mining-frontend-container"
REGISTRY="registry.mining.com"  # 替换为实际镜像仓库
VERSION=${1:-latest}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 命令未找到，请先安装"
        exit 1
    fi
}

# ================================
# 主要函数
# ================================

# 环境检查
check_environment() {
    log_info "检查构建环境..."
    
    # 检查必要命令
    check_command docker
    check_command node
    check_command npm
    
    # 检查Docker服务
    if ! docker info &> /dev/null; then
        log_error "Docker服务未启动"
        exit 1
    fi
    
    # 检查Node版本
    NODE_VERSION=$(node --version)
    log_info "Node版本: $NODE_VERSION"
    
    # 检查项目文件
    if [[ ! -f "package.json" ]]; then
        log_error "未找到package.json文件"
        exit 1
    fi
    
    if [[ ! -f "Dockerfile" ]]; then
        log_error "未找到Dockerfile文件"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 清理函数
cleanup() {
    log_info "清理临时文件和旧容器..."
    
    # 停止并删除旧容器
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        log_info "停止旧容器: $CONTAINER_NAME"
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
    fi
    
    # 清理dangling镜像
    DANGLING_IMAGES=$(docker images -f "dangling=true" -q)
    if [[ ! -z "$DANGLING_IMAGES" ]]; then
        log_info "清理未使用的镜像"
        docker rmi $DANGLING_IMAGES || true
    fi
    
    # 清理build缓存
    if [[ -d "build" ]]; then
        log_info "清理本地build目录"
        rm -rf build
    fi
    
    log_success "清理完成"
}

# 本地构建
build_local() {
    log_info "开始本地构建..."
    
    # 安装依赖
    log_info "安装npm依赖..."
    npm ci --only=production --no-audit --no-fund
    
    # 运行TypeScript检查
    log_info "运行TypeScript类型检查..."
    npx tsc --noEmit
    
    # 运行测试
    log_info "运行单元测试..."
    npm test -- --watchAll=false --coverage
    
    # 构建应用
    log_info "构建React应用..."
    npm run build
    
    log_success "本地构建完成"
}

# Docker镜像构建
build_docker() {
    log_info "开始Docker镜像构建..."
    
    # 读取环境变量
    if [[ -f ".env.docker" ]]; then
        log_info "加载Docker环境变量"
        set -a
        source .env.docker
        set +a
    fi
    
    # 构建参数
    BUILD_ARGS=""
    if [[ ! -z "$REACT_APP_API_BASE_URL" ]]; then
        BUILD_ARGS="$BUILD_ARGS --build-arg REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL"
    fi
    if [[ ! -z "$REACT_APP_SILICONFLOW_API_KEY" ]]; then
        BUILD_ARGS="$BUILD_ARGS --build-arg REACT_APP_SILICONFLOW_API_KEY=$REACT_APP_SILICONFLOW_API_KEY"
    fi
    
    # 构建镜像
    log_info "构建Docker镜像: $IMAGE_NAME:$VERSION"
    docker build $BUILD_ARGS -t $IMAGE_NAME:$VERSION .
    
    # 标记为latest
    if [[ "$VERSION" != "latest" ]]; then
        docker tag $IMAGE_NAME:$VERSION $IMAGE_NAME:latest
    fi
    
    log_success "Docker镜像构建完成"
}

# 测试镜像
test_image() {
    log_info "测试Docker镜像..."
    
    # 运行容器进行测试
    log_info "启动测试容器..."
    docker run --name ${CONTAINER_NAME}-test -d -p 8080:80 $IMAGE_NAME:$VERSION
    
    # 等待容器启动
    sleep 10
    
    # 健康检查
    log_info "执行健康检查..."
    HEALTH_CHECK=$(curl -f http://localhost:8080/health 2>/dev/null || echo "FAILED")
    
    if [[ "$HEALTH_CHECK" == *"healthy"* ]]; then
        log_success "健康检查通过"
    else
        log_error "健康检查失败"
        docker logs ${CONTAINER_NAME}-test
        docker stop ${CONTAINER_NAME}-test
        docker rm ${CONTAINER_NAME}-test
        exit 1
    fi
    
    # 清理测试容器
    docker stop ${CONTAINER_NAME}-test
    docker rm ${CONTAINER_NAME}-test
    
    log_success "镜像测试通过"
}

# 推送镜像到仓库
push_image() {
    if [[ -z "$REGISTRY" ]]; then
        log_warning "未配置镜像仓库，跳过推送"
        return
    fi
    
    log_info "推送镜像到仓库..."
    
    # 标记镜像
    FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$VERSION"
    docker tag $IMAGE_NAME:$VERSION $FULL_IMAGE_NAME
    
    # 登录仓库 (需要预先配置认证)
    log_info "推送镜像: $FULL_IMAGE_NAME"
    docker push $FULL_IMAGE_NAME
    
    # 推送latest标签
    if [[ "$VERSION" != "latest" ]]; then
        LATEST_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:latest"
        docker tag $IMAGE_NAME:latest $LATEST_IMAGE_NAME
        docker push $LATEST_IMAGE_NAME
    fi
    
    log_success "镜像推送完成"
}

# 部署到本地Docker
deploy_local() {
    log_info "部署到本地Docker环境..."
    
    # 使用docker-compose部署
    if [[ -f "docker-compose.yml" ]]; then
        log_info "使用docker-compose部署"
        
        # 停止现有服务
        docker-compose down || true
        
        # 启动服务
        docker-compose up -d
        
        # 等待服务启动
        sleep 15
        
        # 检查服务状态
        docker-compose ps
        
        log_success "本地部署完成"
        log_info "应用访问地址: http://localhost:3000"
    else
        log_warning "未找到docker-compose.yml，使用单容器部署"
        
        # 停止旧容器
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
        
        # 启动新容器
        docker run --name $CONTAINER_NAME -d -p 3000:80 $IMAGE_NAME:$VERSION
        
        log_success "容器部署完成"
        log_info "应用访问地址: http://localhost:3000"
    fi
}

# 显示帮助信息
show_help() {
    echo "矿区安全数据库前端构建脚本"
    echo ""
    echo "用法: $0 [选项] [版本]"
    echo ""
    echo "选项:"
    echo "  --check          检查环境"
    echo "  --clean          清理临时文件"
    echo "  --build          本地构建"
    echo "  --docker         Docker镜像构建"
    echo "  --test           测试镜像"
    echo "  --push           推送镜像到仓库"
    echo "  --deploy         部署到本地"
    echo "  --full           完整构建流程 (默认)"
    echo "  --help           显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                     # 完整构建流程"
    echo "  $0 --docker v1.2.3     # 构建Docker镜像并标记为v1.2.3"
    echo "  $0 --clean --build     # 清理后重新构建"
    echo ""
}

# ================================
# 主流程
# ================================
main() {
    log_info "矿区安全数据库前端构建脚本启动"
    log_info "构建时间: $(date)"
    
    case "${1:---full}" in
        --check)
            check_environment
            ;;
        --clean)
            cleanup
            ;;
        --build)
            check_environment
            cleanup
            build_local
            ;;
        --docker)
            check_environment
            build_docker
            ;;
        --test)
            test_image
            ;;
        --push)
            push_image
            ;;
        --deploy)
            deploy_local
            ;;
        --full)
            check_environment
            cleanup
            build_local
            build_docker
            test_image
            # push_image  # 可选：推送到仓库
            deploy_local
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
    
    log_success "构建脚本执行完成"
}

# 捕获中断信号进行清理
trap 'log_warning "构建被中断"; cleanup; exit 1' INT TERM

# 执行主函数
main "$@"