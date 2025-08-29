#!/bin/bash

# 矿区安全数据库前端 - 脚本初始化设置
# 配置部署脚本的执行权限和环境

set -e

# ================================
# 配置变量
# ================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

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
矿区安全数据库前端 - 脚本初始化设置

用法: $0 [选项]

选项:
  -h, --help           显示帮助信息
  -v, --verbose        显示详细信息
  --permissions-only   仅设置文件权限
  --env-only          仅创建环境配置
  --check             检查环境依赖
  --install-deps      自动安装缺失依赖

功能:
  1. 设置脚本执行权限
  2. 创建环境配置模板
  3. 验证系统依赖
  4. 配置日志目录
  5. 创建示例配置文件

EOF
}

# ================================
# 检查系统依赖
# ================================

check_dependencies() {
    log_header "检查系统依赖"
    
    local missing_deps=()
    local optional_deps=()
    
    # 必需依赖
    local required_tools=("curl" "git" "docker" "docker-compose")
    
    # 可选依赖
    local optional_tools=("bc" "jq" "wget" "rsync" "ssh" "tar" "gzip")
    
    log_info "检查必需依赖..."
    for tool in "${required_tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            local version=""
            case $tool in
                docker)
                    version=$(docker --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "未知")
                    ;;
                docker-compose)
                    version=$(docker-compose --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "未知")
                    ;;
                git)
                    version=$(git --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "未知")
                    ;;
                curl)
                    version=$(curl --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "未知")
                    ;;
            esac
            log_success "✓ $tool (版本: $version)"
        else
            missing_deps+=("$tool")
            log_error "✗ $tool - 未安装"
        fi
    done
    
    log_info "检查可选依赖..."
    for tool in "${optional_tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            log_success "✓ $tool"
        else
            optional_deps+=("$tool")
            log_warning "- $tool - 未安装 (可选)"
        fi
    done
    
    # 检查结果
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "缺少必需依赖: ${missing_deps[*]}"
        
        if [[ "$1" == "--install" ]]; then
            install_dependencies "${missing_deps[@]}"
        else
            log_info "运行 $0 --install-deps 自动安装缺失依赖"
            return 1
        fi
    else
        log_success "所有必需依赖已安装"
    fi
    
    if [[ ${#optional_deps[@]} -gt 0 ]]; then
        log_info "可选依赖缺失: ${optional_deps[*]}"
        log_info "这些工具不是必需的，但安装后可提供更好的功能体验"
    fi
    
    return 0
}

# ================================
# 安装依赖
# ================================

install_dependencies() {
    local deps=("$@")
    
    log_header "安装缺失依赖"
    
    # 检测包管理器
    if command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
        INSTALL_CMD="apt-get install -y"
        UPDATE_CMD="apt-get update"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
        INSTALL_CMD="yum install -y"
        UPDATE_CMD="yum update -y"
    elif command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
        INSTALL_CMD="dnf install -y"
        UPDATE_CMD="dnf update -y"
    elif command -v brew &> /dev/null; then
        PKG_MANAGER="brew"
        INSTALL_CMD="brew install"
        UPDATE_CMD="brew update"
    else
        log_error "无法识别包管理器，请手动安装依赖"
        return 1
    fi
    
    log_info "使用 $PKG_MANAGER 包管理器"
    
    # 更新包索引
    if [[ "$PKG_MANAGER" != "brew" ]]; then
        log_info "更新包索引..."
        sudo $UPDATE_CMD
    fi
    
    # 安装依赖
    for dep in "${deps[@]}"; do
        case $dep in
            docker)
                install_docker
                ;;
            docker-compose)
                install_docker_compose
                ;;
            *)
                log_info "安装 $dep..."
                if [[ "$PKG_MANAGER" == "brew" ]]; then
                    $INSTALL_CMD "$dep"
                else
                    sudo $INSTALL_CMD "$dep"
                fi
                ;;
        esac
    done
    
    log_success "依赖安装完成"
}

# ================================
# 安装Docker
# ================================

install_docker() {
    log_info "安装Docker..."
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        # Ubuntu/Debian
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    elif [[ "$PKG_MANAGER" == "yum" || "$PKG_MANAGER" == "dnf" ]]; then
        # CentOS/RHEL/Fedora
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        sudo systemctl start docker
        sudo systemctl enable docker
        rm get-docker.sh
    elif [[ "$PKG_MANAGER" == "brew" ]]; then
        # macOS
        brew install --cask docker
    fi
    
    log_success "Docker安装完成"
}

# ================================
# 安装Docker Compose
# ================================

install_docker_compose() {
    log_info "安装Docker Compose..."
    
    local compose_version="2.21.0"
    local os_arch="$(uname -s)-$(uname -m)"
    
    if [[ "$PKG_MANAGER" == "brew" ]]; then
        brew install docker-compose
    else
        sudo curl -L "https://github.com/docker/compose/releases/download/v${compose_version}/docker-compose-${os_arch}" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    log_success "Docker Compose安装完成"
}

# ================================
# 设置脚本权限
# ================================

setup_permissions() {
    log_header "设置脚本执行权限"
    
    # 获取所有shell脚本
    local scripts=(
        "deploy-cloud.sh"
        "init-server.sh" 
        "monitor-and-backup.sh"
        "setup-scripts.sh"
    )
    
    for script in "${scripts[@]}"; do
        local script_path="$SCRIPT_DIR/$script"
        if [[ -f "$script_path" ]]; then
            chmod +x "$script_path"
            log_success "✓ $script - 已设置执行权限"
        else
            log_warning "- $script - 文件不存在"
        fi
    done
    
    # 检查权限设置
    log_info "验证权限设置..."
    for script in "${scripts[@]}"; do
        local script_path="$SCRIPT_DIR/$script"
        if [[ -f "$script_path" && -x "$script_path" ]]; then
            log_success "✓ $script 可执行"
        elif [[ -f "$script_path" ]]; then
            log_error "✗ $script 无执行权限"
        fi
    done
}

# ================================
# 创建环境配置
# ================================

create_environment_config() {
    log_header "创建环境配置文件"
    
    # 创建生产环境配置
    local prod_env="$PROJECT_DIR/.env.production"
    if [[ ! -f "$prod_env" ]]; then
        log_info "创建生产环境配置: .env.production"
        cat > "$prod_env" << EOF
# 矿区安全数据库前端 - 生产环境配置
# 生成时间: $(date)

# 应用配置
NODE_ENV=production
REACT_APP_API_BASE_URL=https://mining-backend.ziven.site/api
REACT_APP_SILICONFLOW_API_KEY=your_production_api_key

# 服务端口
FRONTEND_PORT=80
HTTPS_PORT=443

# SSL配置
FORCE_HTTPS=true
SSL_REDIRECT=true

# 监控配置
GRAFANA_PASSWORD=change_this_password
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# 备份配置
BACKUP_RETENTION_DAYS=30
BACKUP_TO_CLOUD=true

# 告警配置
ALERT_ENABLED=true
ALERT_EMAIL=ops@yourcompany.com
ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# 云存储配置 (可选)
# AWS_S3_BUCKET=your-backup-bucket
# ALIYUN_OSS_BUCKET=your-oss-bucket
# TENCENT_COS_BUCKET=your-cos-bucket
EOF
        log_success "✓ 生产环境配置创建完成"
    else
        log_info "- 生产环境配置已存在"
    fi
    
    # 创建测试环境配置
    local test_env="$PROJECT_DIR/.env.testing"
    if [[ ! -f "$test_env" ]]; then
        log_info "创建测试环境配置: .env.testing"
        cat > "$test_env" << EOF
# 矿区安全数据库前端 - 测试环境配置
# 生成时间: $(date)

# 应用配置
NODE_ENV=testing
REACT_APP_API_BASE_URL=http://localhost:8080/api
REACT_APP_SILICONFLOW_API_KEY=your_testing_api_key

# 服务端口
FRONTEND_PORT=3001
DEV_PORT=3001

# 监控配置 (简化)
ALERT_ENABLED=false
BACKUP_TO_CLOUD=false
BACKUP_RETENTION_DAYS=7

# 测试配置
CI=true
HEADLESS=true
EOF
        log_success "✓ 测试环境配置创建完成"
    else
        log_info "- 测试环境配置已存在"
    fi
    
    # 创建部署配置模板
    local deploy_config="$PROJECT_DIR/deploy.conf"
    if [[ ! -f "$deploy_config" ]]; then
        log_info "创建部署配置模板: deploy.conf"
        cat > "$deploy_config" << EOF
# 矿区安全数据库前端 - 部署配置模板
# 复制此文件并根据实际情况修改配置

# ================================
# 云服务商配置
# ================================

# 阿里云配置
ALIYUN_REGION="cn-hangzhou"
ALIYUN_ACCESS_KEY_ID="your_access_key"
ALIYUN_ACCESS_KEY_SECRET="your_secret_key"
SECURITY_GROUP_ID="sg-xxxxxxxxx"
VSWITCH_ID="vsw-xxxxxxxxx"

# AWS配置
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_KEY_PAIR="my-keypair"
AWS_SECURITY_GROUP="sg-xxxxxxxxx"
AWS_SUBNET_ID="subnet-xxxxxxxxx"

# 腾讯云配置
TENCENT_REGION="ap-guangzhou"
TENCENT_SECRET_ID="your_secret_id"
TENCENT_SECRET_KEY="your_secret_key"

# Google Cloud配置
GCP_PROJECT_ID="your-project-id"
GCP_ZONE="asia-east1-a"
GCP_SERVICE_ACCOUNT="path/to/service-account.json"

# ================================
# 服务器配置
# ================================

# 通用VPS配置
SERVER_IP="1.2.3.4"
SERVER_USER="root"
SSH_KEY="~/.ssh/id_rsa"
SSH_PORT="22"

# 域名和SSL
DOMAIN="mining-frontend.yourcompany.com"
SSL_EMAIL="ops@yourcompany.com"

# 实例规格
INSTANCE_TYPE="ecs.c6.large"  # 阿里云
# INSTANCE_TYPE="t3.medium"    # AWS
# INSTANCE_TYPE="e2-medium"    # GCP

# ================================
# 应用配置
# ================================

# 版本控制
VERSION="latest"
GIT_BRANCH="main"
DOCKER_REGISTRY="your-registry.com"

# 资源限制
MEMORY_LIMIT="512m"
CPU_LIMIT="1.0"
REPLICAS="2"

# 数据持久化
DATA_VOLUME_SIZE="20Gi"
BACKUP_VOLUME_SIZE="100Gi"

# 监控和告警
MONITORING_ENABLED="true"
ALERTING_ENABLED="true"
LOG_RETENTION_DAYS="30"
EOF
        log_success "✓ 部署配置模板创建完成"
        log_warning "请根据实际情况修改 deploy.conf 文件"
    else
        log_info "- 部署配置模板已存在"
    fi
}

# ================================
# 创建目录结构
# ================================

setup_directories() {
    log_header "创建项目目录结构"
    
    # 基础目录
    local directories=(
        "logs"
        "logs/nginx"
        "logs/app"  
        "logs/monitor"
        "backups"
        "docker/ssl"
        "docker/grafana"
        "docker/prometheus"
        "scripts/templates"
        "config"
    )
    
    for dir in "${directories[@]}"; do
        local dir_path="$PROJECT_DIR/$dir"
        if [[ ! -d "$dir_path" ]]; then
            mkdir -p "$dir_path"
            log_success "✓ 创建目录: $dir"
        else
            log_info "- 目录已存在: $dir"
        fi
    done
    
    # 设置日志目录权限
    chmod 755 "$PROJECT_DIR/logs"
    chmod 755 "$PROJECT_DIR/backups"
    
    # 创建gitkeep文件保持目录结构
    for dir in "${directories[@]}"; do
        local gitkeep="$PROJECT_DIR/$dir/.gitkeep"
        if [[ ! -f "$gitkeep" ]]; then
            touch "$gitkeep"
        fi
    done
    
    log_success "目录结构创建完成"
}

# ================================
# 创建快速启动脚本
# ================================

create_quick_start_scripts() {
    log_header "创建快速启动脚本"
    
    # 快速部署脚本
    local quick_deploy="$PROJECT_DIR/quick-deploy.sh"
    cat > "$quick_deploy" << 'EOF'
#!/bin/bash
# 快速部署脚本 - 一键启动开发环境

set -e

echo "🚀 快速部署矿区安全数据库前端"
echo "================================"

# 检查Docker
if ! docker info &> /dev/null; then
    echo "❌ Docker未运行，请启动Docker服务"
    exit 1
fi

# 检查环境文件
if [[ ! -f .env ]]; then
    echo "📄 创建环境配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置必要参数"
fi

# 构建并启动服务
echo "🏗️  构建应用镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ 部署成功！"
    echo ""
    echo "🌐 访问地址:"
    echo "   前端应用: http://localhost:3000"
    echo "   健康检查: http://localhost:3000/health"
    echo ""
    echo "📊 管理命令:"
    echo "   查看状态: docker-compose ps"
    echo "   查看日志: docker-compose logs -f"
    echo "   停止服务: docker-compose down"
else
    echo "❌ 部署可能存在问题，请检查日志："
    docker-compose logs --tail=20
fi
EOF
    chmod +x "$quick_deploy"
    log_success "✓ 创建快速部署脚本: quick-deploy.sh"
    
    # 快速监控脚本
    local quick_monitor="$PROJECT_DIR/quick-monitor.sh"
    cat > "$quick_monitor" << 'EOF'
#!/bin/bash
# 快速监控脚本 - 一键查看系统状态

set -e

echo "📊 矿区安全数据库前端 - 系统监控"
echo "================================"

# 检查服务状态
echo "🐳 Docker容器状态:"
docker-compose ps

echo ""
echo "🏥 健康检查:"
if curl -s http://localhost/health | jq . &> /dev/null; then
    curl -s http://localhost/health | jq .
    echo "✅ 应用健康"
else
    echo "❌ 应用异常"
fi

echo ""
echo "💾 系统资源:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "内存: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "磁盘: $(df -h / | awk 'NR==2{print $5}')"

echo ""
echo "🔗 网络连接:"
netstat -tuln | grep :80 || echo "无HTTP连接"

echo ""
echo "📝 最近日志:"
docker-compose logs --tail=10 mining-frontend 2>/dev/null || echo "无日志可显示"
EOF
    chmod +x "$quick_monitor"
    log_success "✓ 创建快速监控脚本: quick-monitor.sh"
}

# ================================
# 验证安装
# ================================

verify_setup() {
    log_header "验证安装配置"
    
    local issues=0
    
    # 检查脚本权限
    log_info "检查脚本权限..."
    local scripts=("deploy-cloud.sh" "init-server.sh" "monitor-and-backup.sh" "setup-scripts.sh")
    for script in "${scripts[@]}"; do
        if [[ -f "$SCRIPT_DIR/$script" && -x "$SCRIPT_DIR/$script" ]]; then
            log_success "✓ $script 权限正确"
        else
            log_error "✗ $script 权限错误"
            ((issues++))
        fi
    done
    
    # 检查配置文件
    log_info "检查配置文件..."
    local configs=(".env.production" ".env.testing" "deploy.conf")
    for config in "${configs[@]}"; do
        if [[ -f "$PROJECT_DIR/$config" ]]; then
            log_success "✓ $config 存在"
        else
            log_warning "- $config 不存在"
        fi
    done
    
    # 检查目录结构
    log_info "检查目录结构..."
    local dirs=("logs" "backups" "docker" "scripts")
    for dir in "${dirs[@]}"; do
        if [[ -d "$PROJECT_DIR/$dir" ]]; then
            log_success "✓ $dir/ 存在"
        else
            log_error "✗ $dir/ 不存在"
            ((issues++))
        fi
    done
    
    # 输出结果
    echo ""
    if [[ $issues -eq 0 ]]; then
        log_success "🎉 安装配置验证通过！"
        echo ""
        echo "📋 下一步操作:"
        echo "  1. 编辑 .env.production 配置生产环境变量"
        echo "  2. 根据需要修改 deploy.conf 部署配置"
        echo "  3. 使用 ./quick-deploy.sh 快速启动开发环境"
        echo "  4. 使用 ./scripts/deploy-cloud.sh 部署到云端"
        echo ""
        echo "📚 查看详细文档: scripts/README.md"
        return 0
    else
        log_error "❌ 发现 $issues 个配置问题，请检查上述错误"
        return 1
    fi
}

# ================================
# 主函数
# ================================

main() {
    local verbose=false
    local permissions_only=false
    local env_only=false
    local check_only=false
    local install_deps=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            --permissions-only)
                permissions_only=true
                shift
                ;;
            --env-only)
                env_only=true
                shift
                ;;
            --check)
                check_only=true
                shift
                ;;
            --install-deps)
                install_deps=true
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_header "矿区安全数据库前端 - 脚本初始化设置"
    
    # 执行相应操作
    if [[ "$check_only" == "true" ]]; then
        check_dependencies
        exit $?
    elif [[ "$install_deps" == "true" ]]; then
        check_dependencies --install
        exit $?
    elif [[ "$permissions_only" == "true" ]]; then
        setup_permissions
        exit $?
    elif [[ "$env_only" == "true" ]]; then
        create_environment_config
        exit $?
    fi
    
    # 完整初始化流程
    log_info "开始完整初始化流程..."
    
    # 检查依赖（不强制安装）
    if ! check_dependencies; then
        log_warning "部分依赖缺失，但将继续初始化"
        log_info "稍后可运行 $0 --install-deps 安装缺失依赖"
    fi
    
    # 设置权限
    setup_permissions
    
    # 创建配置
    create_environment_config
    
    # 创建目录
    setup_directories
    
    # 创建快速启动脚本
    create_quick_start_scripts
    
    # 验证安装
    if verify_setup; then
        log_header "🎉 初始化完成！"
        echo ""
        echo "🚀 快速开始:"
        echo "   开发环境: ./quick-deploy.sh"
        echo "   云端部署: ./scripts/deploy-cloud.sh generic production"
        echo "   系统监控: ./scripts/monitor-and-backup.sh --monitor"
        echo ""
        echo "📖 详细文档:"
        echo "   部署指南: docs/deployment-guide.md"
        echo "   脚本说明: scripts/README.md"
        echo ""
    else
        log_error "初始化过程中发现问题，请检查上述错误"
        exit 1
    fi
}

# 执行主函数
main "$@"