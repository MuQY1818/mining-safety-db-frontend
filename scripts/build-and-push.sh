#!/bin/bash

# 矿区安全数据库前端 - 本地构建和推送Docker镜像脚本
# 用于开发者本地测试和紧急发布
# 
# 使用方法:
#   ./scripts/build-and-push.sh [tag]
#   ./scripts/build-and-push.sh latest
#   ./scripts/build-and-push.sh v1.2.3

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
DEFAULT_GITHUB_OWNER="muqy1818"

# 解析命令行参数
TAG=${1:-$DEFAULT_TAG}
REGISTRY=${DOCKER_REGISTRY:-$DEFAULT_REGISTRY}
IMAGE_NAME=${DOCKER_IMAGE_NAME:-$DEFAULT_IMAGE_NAME}
GITHUB_OWNER=${GITHUB_REPOSITORY_OWNER:-$DEFAULT_GITHUB_OWNER}

# 获取Git信息
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 检查必需工具
check_requirements() {
    log_info "检查必需工具..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装或不在PATH中"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_warning "Git 未安装，将使用默认值"
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装或不在PATH中"
        exit 1
    fi
    
    log_success "工具检查完成"
}

# 检查工作目录
check_workspace() {
    log_info "检查工作目录..."
    
    if [ ! -f "package.json" ]; then
        log_error "请在项目根目录下运行此脚本"
        exit 1
    fi
    
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile 不存在"
        exit 1
    fi
    
    log_success "工作目录检查完成"
}

# 检查Docker守护进程
check_docker_daemon() {
    log_info "检查Docker守护进程..."
    
    if ! docker info &> /dev/null; then
        log_error "Docker守护进程未运行，请启动Docker Desktop或dockerd服务"
        exit 1
    fi
    
    log_success "Docker守护进程运行正常"
}

# 读取环境变量
load_env_vars() {
    log_info "加载环境变量..."
    
    # 尝试从.env.production加载
    if [ -f ".env.production" ]; then
        log_info "找到 .env.production 文件，正在加载..."
        set -a
        source .env.production
        set +a
    elif [ -f ".env" ]; then
        log_warning "使用 .env 文件（建议创建 .env.production 用于生产构建）"
        set -a
        source .env
        set +a
    else
        log_warning "未找到环境变量文件，使用默认配置"
    fi
    
    # 设置默认值
    export REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL:-"https://mining-backend.ziven.site/api"}
    export REACT_APP_SILICONFLOW_API_KEY=${REACT_APP_SILICONFLOW_API_KEY:-""}
    
    # 检查关键环境变量
    if [ -z "$REACT_APP_SILICONFLOW_API_KEY" ]; then
        log_warning "REACT_APP_SILICONFLOW_API_KEY 未设置，AI功能将不可用"
        log_info "请在 .env.production 中设置 REACT_APP_SILICONFLOW_API_KEY"
    fi
    
    log_success "环境变量加载完成"
}

# 构建镜像
build_image() {
    local full_image_name="${REGISTRY}/${GITHUB_OWNER}/${IMAGE_NAME}:${TAG}"
    
    log_info "开始构建Docker镜像..."
    log_info "镜像名称: ${full_image_name}"
    log_info "Git提交: ${GIT_COMMIT}"
    log_info "Git分支: ${GIT_BRANCH}"
    log_info "构建时间: ${BUILD_DATE}"
    
    # 构建镜像（使用占位符API key，安全由运行时环境变量保证）
    docker build \
        --tag "${full_image_name}" \
        --build-arg REACT_APP_API_BASE_URL="${REACT_APP_API_BASE_URL}" \
        --build-arg REACT_APP_SILICONFLOW_API_KEY="build_time_placeholder" \
        --build-arg BUILD_VERSION="${TAG}" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg VCS_REF="${GIT_COMMIT}" \
        --label "org.opencontainers.image.title=Mining Safety DB Frontend" \
        --label "org.opencontainers.image.description=矿区语言安全数据库前端应用" \
        --label "org.opencontainers.image.version=${TAG}" \
        --label "org.opencontainers.image.revision=${GIT_COMMIT}" \
        --label "org.opencontainers.image.created=${BUILD_DATE}" \
        --label "org.opencontainers.image.source=https://github.com/${GITHUB_OWNER}/mining-safety-db-frontend" \
        --progress=plain \
        .
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建成功: ${full_image_name}"
        echo "$full_image_name" > .last-built-image
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 推送镜像
push_image() {
    local full_image_name="${REGISTRY}/${GITHUB_OWNER}/${IMAGE_NAME}:${TAG}"
    
    log_info "推送镜像到仓库..."
    
    # 检查是否已登录
    if ! docker info | grep -q "Username"; then
        log_warning "未检测到Docker仓库登录状态"
        log_info "请先登录到Docker仓库:"
        
        if [[ "$REGISTRY" == "ghcr.io" ]]; then
            log_info "GitHub Container Registry登录命令:"
            echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u \$GITHUB_USERNAME --password-stdin"
        else
            log_info "Docker Hub登录命令:"
            echo "  docker login"
        fi
        
        read -p "是否继续推送？ (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "跳过镜像推送"
            return 0
        fi
    fi
    
    # 推送镜像
    docker push "$full_image_name"
    
    if [ $? -eq 0 ]; then
        log_success "镜像推送成功: ${full_image_name}"
        
        # 如果是latest标签，同时推送时间戳标签
        if [ "$TAG" = "latest" ]; then
            local timestamp_tag=$(date +"%Y%m%d-%H%M%S")
            local timestamp_image="${REGISTRY}/${GITHUB_OWNER}/${IMAGE_NAME}:${timestamp_tag}"
            
            docker tag "$full_image_name" "$timestamp_image"
            docker push "$timestamp_image"
            
            log_success "时间戳镜像推送成功: ${timestamp_image}"
        fi
    else
        log_error "镜像推送失败"
        exit 1
    fi
}

# 清理本地镜像
cleanup_local_images() {
    log_info "清理本地镜像..."
    
    # 删除构建过程中的中间镜像
    docker system prune -f --filter "label=stage=builder" 2>/dev/null || true
    
    # 可选：删除刚构建的镜像（节省空间）
    read -p "是否删除本地构建的镜像以节省空间？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        local full_image_name="${REGISTRY}/${GITHUB_OWNER}/${IMAGE_NAME}:${TAG}"
        docker rmi "$full_image_name" 2>/dev/null || true
        log_info "本地镜像已删除"
    fi
    
    log_success "清理完成"
}

# 显示使用帮助
show_help() {
    echo "用法: $0 [TAG] [OPTIONS]"
    echo ""
    echo "参数:"
    echo "  TAG                   镜像标签 (默认: latest)"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示此帮助信息"
    echo "  --no-push            仅构建不推送"
    echo "  --no-cleanup         不清理本地镜像"
    echo ""
    echo "环境变量:"
    echo "  DOCKER_REGISTRY      镜像仓库地址 (默认: ghcr.io)"
    echo "  DOCKER_IMAGE_NAME    镜像名称 (默认: mining-safety-db-frontend)"
    echo "  GITHUB_REPOSITORY_OWNER  GitHub用户名 (默认: muqy1818)"
    echo "  GITHUB_TOKEN         GitHub Personal Access Token"
    echo ""
    echo "示例:"
    echo "  $0                   # 构建并推送latest标签"
    echo "  $0 v1.0.0           # 构建并推送v1.0.0标签"
    echo "  $0 --no-push        # 仅构建不推送"
    echo ""
}

# 解析命令行选项
PUSH_IMAGE=true
CLEANUP_IMAGE=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --no-push)
            PUSH_IMAGE=false
            shift
            ;;
        --no-cleanup)
            CLEANUP_IMAGE=false
            shift
            ;;
        *)
            # 如果不是选项，当作TAG处理
            if [[ ! $1 =~ ^-- ]]; then
                TAG="$1"
            fi
            shift
            ;;
    esac
done

# 主执行流程
main() {
    local start_time=$(date +%s)
    
    log_info "开始构建和推送流程..."
    log_info "镜像标签: ${TAG}"
    
    # 执行检查
    check_requirements
    check_workspace  
    check_docker_daemon
    
    # 加载配置
    load_env_vars
    
    # 构建镜像
    build_image
    
    # 推送镜像
    if [ "$PUSH_IMAGE" = true ]; then
        push_image
    else
        log_info "跳过镜像推送 (--no-push)"
    fi
    
    # 清理
    if [ "$CLEANUP_IMAGE" = true ]; then
        cleanup_local_images
    else
        log_info "跳过清理 (--no-cleanup)"
    fi
    
    # 计算耗时
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "========================================"
    echo "           构建推送完成"
    echo "========================================"
    echo "总耗时: ${duration} 秒"
    echo "镜像标签: ${TAG}"
    echo "Git提交: ${GIT_COMMIT}"
    echo "========================================"
    
    log_success "所有操作完成！"
}

# 运行主函数
main