#!/bin/sh

# 矿区安全数据库前端 - Docker健康检查脚本
# 检查nginx服务状态和应用可访问性

# 设置脚本错误时退出
set -e

# 颜色输出定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[HEALTH]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[HEALTH]${NC} $1"
}

log_error() {
    echo -e "${RED}[HEALTH]${NC} $1"
}

# 检查nginx进程是否运行
check_nginx_process() {
    log_info "检查nginx进程状态..."
    
    if pgrep nginx > /dev/null 2>&1; then
        log_info "✅ Nginx进程运行正常"
        return 0
    else
        log_error "❌ Nginx进程未运行"
        return 1
    fi
}

# 检查HTTP服务响应
check_http_response() {
    log_info "检查HTTP服务响应..."
    
    # 检查主页面
    if curl -f -s -o /dev/null --max-time 3 http://localhost:80/ ; then
        log_info "✅ 主页面响应正常"
    else
        log_error "❌ 主页面响应异常"
        return 1
    fi
    
    # 检查健康检查端点
    if curl -f -s --max-time 3 http://localhost:80/health | grep -q "healthy" ; then
        log_info "✅ 健康检查端点响应正常"
    else
        log_error "❌ 健康检查端点响应异常"
        return 1
    fi
    
    return 0
}

# 检查关键静态文件
check_static_files() {
    log_info "检查关键静态文件..."
    
    # 检查index.html是否存在
    if [ -f "/usr/share/nginx/html/index.html" ]; then
        log_info "✅ index.html文件存在"
    else
        log_error "❌ index.html文件不存在"
        return 1
    fi
    
    # 检查static目录
    if [ -d "/usr/share/nginx/html/static" ]; then
        log_info "✅ static目录存在"
    else
        log_warn "⚠️  static目录不存在，可能是开发构建"
    fi
    
    return 0
}

# 检查nginx配置文件
check_nginx_config() {
    log_info "检查nginx配置文件语法..."
    
    if nginx -t > /dev/null 2>&1; then
        log_info "✅ Nginx配置文件语法正确"
        return 0
    else
        log_error "❌ Nginx配置文件语法错误"
        nginx -t  # 显示详细错误信息
        return 1
    fi
}

# 检查内存使用情况
check_memory_usage() {
    log_info "检查内存使用情况..."
    
    # 获取内存使用情况（MB）
    MEMORY_USAGE=$(ps -o pid,vsz,rss,comm -C nginx | awk 'NR>1 {sum_rss+=$3} END {print sum_rss/1024}')
    MEMORY_LIMIT=100  # MB限制
    
    if [ $(echo "$MEMORY_USAGE < $MEMORY_LIMIT" | bc -l 2>/dev/null || echo 1) -eq 1 ]; then
        log_info "✅ 内存使用正常: ${MEMORY_USAGE}MB"
        return 0
    else
        log_warn "⚠️  内存使用较高: ${MEMORY_USAGE}MB"
        return 0  # 不作为致命错误
    fi
}

# 检查磁盘空间
check_disk_space() {
    log_info "检查磁盘空间..."
    
    DISK_USAGE=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')
    DISK_LIMIT=90  # 磁盘使用率限制90%
    
    if [ "$DISK_USAGE" -lt "$DISK_LIMIT" ]; then
        log_info "✅ 磁盘空间充足: ${DISK_USAGE}%已使用"
        return 0
    else
        log_warn "⚠️  磁盘空间不足: ${DISK_USAGE}%已使用"
        return 0  # 不作为致命错误
    fi
}

# 主健康检查函数
main_health_check() {
    log_info "==================================="
    log_info "开始健康检查 $(date)"
    log_info "==================================="
    
    local exit_code=0
    
    # 执行所有检查
    check_nginx_config || exit_code=1
    check_nginx_process || exit_code=1
    check_static_files || exit_code=1
    check_http_response || exit_code=1
    check_memory_usage || true  # 内存检查不影响整体状态
    check_disk_space || true    # 磁盘检查不影响整体状态
    
    log_info "==================================="
    if [ $exit_code -eq 0 ]; then
        log_info "🎉 所有健康检查通过！"
        log_info "==================================="
        exit 0
    else
        log_error "💥 健康检查失败！"
        log_info "==================================="
        exit 1
    fi
}

# 支持不同的检查模式
case "${1:-full}" in
    "quick")
        log_info "快速健康检查模式"
        check_nginx_process && check_http_response
        ;;
    "config")
        log_info "配置检查模式"
        check_nginx_config
        ;;
    "full")
        log_info "完整健康检查模式"
        main_health_check
        ;;
    *)
        echo "用法: $0 [quick|config|full]"
        echo "  quick - 快速检查(进程+HTTP)"
        echo "  config - 仅检查配置文件"
        echo "  full - 完整检查(默认)"
        exit 1
        ;;
esac