#!/bin/bash

# 矿区安全数据库前端 - 服务器初始化脚本
# 用于初始化云服务器环境，安装必要的依赖和配置

set -e

# ================================
# 配置变量
# ================================

DOCKER_VERSION="24.0"
DOCKER_COMPOSE_VERSION="2.21.0"
NODE_VERSION="18"

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
# 检查操作系统
# ================================

detect_os() {
    log_header "检测操作系统"
    
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        OS_VERSION=$VERSION_ID
        log_info "操作系统: $OS $OS_VERSION"
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    
    # 设置包管理器
    if command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
        UPDATE_CMD="apt update"
        INSTALL_CMD="apt install -y"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
        UPDATE_CMD="yum update -y"
        INSTALL_CMD="yum install -y"
    elif command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
        UPDATE_CMD="dnf update -y"
        INSTALL_CMD="dnf install -y"
    else
        log_error "不支持的包管理器"
        exit 1
    fi
    
    log_success "操作系统检测完成: $PKG_MANAGER"
}

# ================================
# 系统更新和基础工具
# ================================

update_system() {
    log_header "更新系统和安装基础工具"
    
    log_info "更新系统包..."
    $UPDATE_CMD
    
    # 基础工具
    local basic_tools=(
        "curl"
        "wget" 
        "git"
        "unzip"
        "vim"
        "nano"
        "htop"
        "iotop"
        "tree"
        "jq"
        "build-essential"
        "software-properties-common"
        "apt-transport-https"
        "ca-certificates"
        "gnupg"
        "lsb-release"
    )
    
    # 根据不同的包管理器调整工具名称
    if [[ "$PKG_MANAGER" == "yum" || "$PKG_MANAGER" == "dnf" ]]; then
        basic_tools=("curl" "wget" "git" "unzip" "vim" "nano" "htop" "iotop" "tree" "jq" "gcc" "gcc-c++" "make")
    fi
    
    log_info "安装基础工具..."
    for tool in "${basic_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_info "安装: $tool"
            $INSTALL_CMD "$tool" || log_warning "安装失败: $tool"
        fi
    done
    
    log_success "基础工具安装完成"
}

# ================================
# 配置时区和语言环境
# ================================

configure_locale() {
    log_header "配置时区和语言环境"
    
    # 设置时区
    log_info "设置时区为 Asia/Shanghai..."
    timedatectl set-timezone Asia/Shanghai || {
        log_warning "使用传统方式设置时区"
        ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
    }
    
    # 配置语言环境 (仅限Ubuntu/Debian)
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        log_info "配置中文语言环境..."
        
        # 安装中文语言包
        $INSTALL_CMD locales language-pack-zh-hans
        
        # 生成中文locale
        locale-gen zh_CN.UTF-8
        
        # 更新locale配置
        update-locale LANG=zh_CN.UTF-8 LC_ALL=zh_CN.UTF-8
        
        # 配置控制台字体
        echo 'FONT="LatArCyrHeb-16"' >> /etc/default/console-setup
    fi
    
    log_success "时区和语言环境配置完成"
}

# ================================
# 创建部署用户
# ================================

create_deploy_user() {
    log_header "创建部署用户"
    
    local deploy_user="deploy"
    
    # 检查用户是否已存在
    if id "$deploy_user" &>/dev/null; then
        log_info "用户 $deploy_user 已存在"
    else
        log_info "创建部署用户: $deploy_user"
        
        # 创建用户
        useradd -m -s /bin/bash "$deploy_user"
        
        # 设置密码 (可选)
        if [[ -n "${DEPLOY_USER_PASSWORD:-}" ]]; then
            echo "$deploy_user:$DEPLOY_USER_PASSWORD" | chpasswd
        fi
        
        # 添加到sudo组
        usermod -aG sudo "$deploy_user"
        
        # 免密sudo
        echo "$deploy_user ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
        
        log_success "部署用户创建完成"
    fi
    
    # 配置SSH密钥
    if [[ -f /root/.ssh/authorized_keys ]]; then
        log_info "复制SSH密钥到部署用户..."
        
        mkdir -p "/home/$deploy_user/.ssh"
        cp /root/.ssh/authorized_keys "/home/$deploy_user/.ssh/"
        chown -R "$deploy_user:$deploy_user" "/home/$deploy_user/.ssh"
        chmod 700 "/home/$deploy_user/.ssh"
        chmod 600 "/home/$deploy_user/.ssh/authorized_keys"
    fi
}

# ================================
# 安装Docker
# ================================

install_docker() {
    log_header "安装Docker"
    
    # 检查是否已安装
    if command -v docker &> /dev/null; then
        local installed_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
        log_info "Docker已安装: $installed_version"
        
        # 检查版本是否符合要求
        if [[ "$(printf '%s\n' "$DOCKER_VERSION" "$installed_version" | sort -V | head -n1)" == "$DOCKER_VERSION" ]]; then
            log_success "Docker版本符合要求"
        else
            log_warning "Docker版本过低，建议升级"
        fi
    else
        log_info "安装Docker..."
        
        if [[ "$PKG_MANAGER" == "apt" ]]; then
            # Ubuntu/Debian安装方式
            
            # 添加Docker官方GPG密钥
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            
            # 添加Docker APT仓库
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # 更新包索引
            apt update
            
            # 安装Docker
            $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            
        elif [[ "$PKG_MANAGER" == "yum" ]]; then
            # CentOS/RHEL安装方式
            
            # 添加Docker仓库
            yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            
            # 安装Docker
            $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            
        elif [[ "$PKG_MANAGER" == "dnf" ]]; then
            # Fedora安装方式
            
            # 添加Docker仓库
            dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            
            # 安装Docker
            $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        fi
        
        log_success "Docker安装完成"
    fi
    
    # 启动Docker服务
    log_info "启动Docker服务..."
    systemctl start docker
    systemctl enable docker
    
    # 添加用户到docker组
    usermod -aG docker root
    if id "deploy" &>/dev/null; then
        usermod -aG docker deploy
    fi
    
    # 配置Docker daemon
    log_info "配置Docker daemon..."
    
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "registry-mirrors": [
        "https://mirror.ccs.tencentyun.com",
        "https://registry.docker-cn.com"
    ]
}
EOF
    
    # 重启Docker以应用配置
    systemctl restart docker
    
    # 验证安装
    log_info "验证Docker安装..."
    docker --version
    docker compose version
    
    log_success "Docker配置完成"
}

# ================================
# 安装Node.js (可选)
# ================================

install_nodejs() {
    log_header "安装Node.js (可选)"
    
    # 检查是否已安装
    if command -v node &> /dev/null; then
        local installed_version=$(node --version | grep -oE '[0-9]+' | head -1)
        log_info "Node.js已安装: v$installed_version"
        
        if [[ "$installed_version" -ge "$NODE_VERSION" ]]; then
            log_success "Node.js版本符合要求"
            return
        fi
    fi
    
    log_info "安装Node.js $NODE_VERSION..."
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        # Ubuntu/Debian安装方式
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        $INSTALL_CMD nodejs
        
    elif [[ "$PKG_MANAGER" == "yum" || "$PKG_MANAGER" == "dnf" ]]; then
        # CentOS/RHEL/Fedora安装方式
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
        $INSTALL_CMD nodejs
    fi
    
    # 验证安装
    node --version
    npm --version
    
    log_success "Node.js安装完成"
}

# ================================
# 配置防火墙
# ================================

configure_firewall() {
    log_header "配置防火墙"
    
    # Ubuntu/Debian使用ufw
    if command -v ufw &> /dev/null; then
        log_info "配置ufw防火墙..."
        
        # 重置防火墙规则
        ufw --force reset
        
        # 默认策略
        ufw default deny incoming
        ufw default allow outgoing
        
        # 允许SSH
        ufw allow ssh
        ufw allow 22/tcp
        
        # 允许HTTP/HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # 允许应用端口
        ufw allow 3000/tcp
        
        # 启用防火墙
        ufw --force enable
        
        log_success "ufw防火墙配置完成"
        
    # CentOS/RHEL使用firewalld
    elif command -v firewall-cmd &> /dev/null; then
        log_info "配置firewalld防火墙..."
        
        # 启动firewalld
        systemctl start firewalld
        systemctl enable firewalld
        
        # 添加服务
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        
        # 添加端口
        firewall-cmd --permanent --add-port=3000/tcp
        
        # 重新加载配置
        firewall-cmd --reload
        
        log_success "firewalld防火墙配置完成"
        
    else
        log_warning "未找到防火墙管理工具，请手动配置"
    fi
}

# ================================
# 系统优化
# ================================

optimize_system() {
    log_header "系统优化"
    
    # 内核参数优化
    log_info "优化内核参数..."
    
    cat >> /etc/sysctl.conf << EOF

# 矿区安全数据库前端 - 系统优化参数
# 网络优化
net.core.somaxconn = 32768
net.core.netdev_max_backlog = 32768
net.ipv4.tcp_max_syn_backlog = 65536
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 6000
net.ipv4.ip_local_port_range = 10000 65535

# 文件系统优化
fs.file-max = 65535
fs.inotify.max_user_watches = 524288

# 虚拟内存优化
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF
    
    # 应用内核参数
    sysctl -p
    
    # 用户限制优化
    log_info "优化用户限制..."
    
    cat >> /etc/security/limits.conf << EOF

# 矿区安全数据库前端 - 用户限制优化
* soft nofile 65535
* hard nofile 65535
* soft nproc 32768
* hard nproc 32768
root soft nofile 65535
root hard nofile 65535
EOF
    
    # 优化systemd限制
    mkdir -p /etc/systemd/system.conf.d
    cat > /etc/systemd/system.conf.d/limits.conf << EOF
[Manager]
DefaultLimitNOFILE=65535
DefaultLimitNPROC=32768
EOF
    
    log_success "系统优化完成"
}

# ================================
# 创建应用目录
# ================================

setup_app_directory() {
    log_header "创建应用目录"
    
    local app_dir="/opt/mining-frontend"
    local backup_dir="/opt/backups"
    local log_dir="/var/log/mining"
    
    # 创建目录
    mkdir -p "$app_dir" "$backup_dir" "$log_dir"
    mkdir -p "$app_dir/logs" "$app_dir/docker" "$app_dir/data"
    
    # 设置权限
    if id "deploy" &>/dev/null; then
        chown -R deploy:deploy "$app_dir" "$backup_dir"
    fi
    chown -R root:root "$log_dir"
    
    # 设置目录权限
    chmod 755 "$app_dir" "$backup_dir" "$log_dir"
    
    log_success "应用目录创建完成: $app_dir"
}

# ================================
# 安装监控工具
# ================================

install_monitoring_tools() {
    log_header "安装监控工具"
    
    # 安装系统监控工具
    local monitoring_tools=("htop" "iotop" "nethogs" "ncdu" "glances")
    
    for tool in "${monitoring_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_info "安装监控工具: $tool"
            $INSTALL_CMD "$tool" || log_warning "安装失败: $tool"
        fi
    done
    
    # 安装日志分析工具
    if ! command -v logrotate &> /dev/null; then
        log_info "安装日志轮转工具..."
        $INSTALL_CMD logrotate
    fi
    
    log_success "监控工具安装完成"
}

# ================================
# 配置SSH安全
# ================================

configure_ssh_security() {
    log_header "配置SSH安全"
    
    # 备份原始配置
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # SSH安全配置
    log_info "优化SSH配置..."
    
    # 禁用root密码登录（如果有密钥认证）
    if [[ -f /root/.ssh/authorized_keys && -s /root/.ssh/authorized_keys ]]; then
        sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        log_info "已禁用密码认证"
    else
        log_warning "未找到SSH密钥，保持密码认证"
    fi
    
    # 其他安全设置
    cat >> /etc/ssh/sshd_config << EOF

# 矿区安全数据库前端 - SSH安全配置
Protocol 2
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
MaxSessions 10
LoginGraceTime 60
PermitEmptyPasswords no
X11Forwarding no
EOF
    
    # 验证配置
    sshd -t
    
    # 重启SSH服务
    systemctl restart sshd
    
    log_success "SSH安全配置完成"
}

# ================================
# 安装故障诊断工具
# ================================

install_diagnostic_tools() {
    log_header "安装故障诊断工具"
    
    local diagnostic_tools=("strace" "tcpdump" "telnet" "nmap" "lsof")
    
    if [[ "$PKG_MANAGER" == "yum" || "$PKG_MANAGER" == "dnf" ]]; then
        diagnostic_tools=("strace" "tcpdump" "telnet" "nmap" "lsof" "net-tools")
    fi
    
    for tool in "${diagnostic_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_info "安装诊断工具: $tool"
            $INSTALL_CMD "$tool" || log_warning "安装失败: $tool"
        fi
    done
    
    log_success "故障诊断工具安装完成"
}

# ================================
# 主函数
# ================================

main() {
    log_header "开始服务器初始化"
    
    # 检查是否以root用户运行
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要以root用户权限运行"
        exit 1
    fi
    
    # 执行初始化步骤
    detect_os
    update_system
    configure_locale
    create_deploy_user
    install_docker
    
    # 可选组件
    if [[ "${INSTALL_NODEJS:-}" == "true" ]]; then
        install_nodejs
    fi
    
    configure_firewall
    optimize_system
    setup_app_directory
    install_monitoring_tools
    install_diagnostic_tools
    configure_ssh_security
    
    # 显示完成信息
    log_header "服务器初始化完成"
    
    echo -e "${GREEN}🎉 服务器初始化成功！${NC}"
    echo ""
    echo "📋 初始化摘要："
    echo "  操作系统: $OS $OS_VERSION"
    echo "  包管理器: $PKG_MANAGER"
    echo "  Docker版本: $(docker --version 2>/dev/null || echo '未安装')"
    echo "  应用目录: /opt/mining-frontend"
    echo "  备份目录: /opt/backups"
    echo "  日志目录: /var/log/mining"
    echo ""
    echo "👤 用户信息："
    echo "  部署用户: deploy (已创建)"
    echo "  sudo权限: 已配置"
    echo ""
    echo "🔒 安全配置："
    echo "  防火墙: 已启用 (80, 443, 22, 3000端口开放)"
    echo "  SSH安全: 已优化"
    echo "  系统优化: 已完成"
    echo ""
    echo "🔄 下一步："
    echo "  1. 重新登录以应用用户组变更"
    echo "  2. 使用deploy用户进行应用部署"
    echo "  3. 根据需要调整防火墙规则"
    echo ""
    echo "📝 重要提醒："
    echo "  - 请保存好SSH密钥"
    echo "  - 定期更新系统和Docker"
    echo "  - 监控系统资源使用情况"
    echo ""
    
    # 重启提示
    if [[ "${AUTO_REBOOT:-}" == "true" ]]; then
        log_warning "系统将在30秒后重启以应用所有更改..."
        sleep 30
        reboot
    else
        log_info "建议重启系统以应用所有更改"
        log_info "运行: sudo reboot"
    fi
}

# 执行主函数
main "$@"