#!/bin/bash

# 矿区安全数据库前端 - 监控和备份自动化脚本
# 功能包括：健康检查、性能监控、自动备份、告警通知

set -e

# ================================
# 配置变量
# ================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
APP_NAME="mining-frontend"
APP_DIR="/opt/mining-frontend"
BACKUP_DIR="/opt/backups"
LOG_DIR="/var/log/mining"

# 监控配置
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost/health}"
RESPONSE_TIME_THRESHOLD="${RESPONSE_TIME_THRESHOLD:-2000}" # 毫秒
MEMORY_THRESHOLD="${MEMORY_THRESHOLD:-80}" # 百分比
CPU_THRESHOLD="${CPU_THRESHOLD:-80}" # 百分比
DISK_THRESHOLD="${DISK_THRESHOLD:-85}" # 百分比

# 备份配置
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_TO_CLOUD="${BACKUP_TO_CLOUD:-false}"

# 告警配置
ALERT_EMAIL="${ALERT_EMAIL:-}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"
ALERT_ENABLED="${ALERT_ENABLED:-false}"

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
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]${NC} $1" | tee -a "$LOG_DIR/monitor.log"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $1" | tee -a "$LOG_DIR/monitor.log"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING]${NC} $1" | tee -a "$LOG_DIR/monitor.log"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $1" | tee -a "$LOG_DIR/monitor.log"
}

# ================================
# 帮助信息
# ================================

show_help() {
    cat << EOF
矿区安全数据库前端 - 监控和备份自动化脚本

用法: $0 [选项]

选项:
  -h, --help           显示帮助信息
  -m, --monitor        执行监控检查
  -b, --backup         执行备份操作
  -c, --cleanup        清理旧备份文件
  -r, --report         生成监控报告
  --health             仅执行健康检查
  --metrics            仅收集系统指标
  --full               执行完整监控和备份
  --test-alerts        测试告警通知

环境变量:
  HEALTH_CHECK_URL           健康检查URL
  RESPONSE_TIME_THRESHOLD    响应时间阈值(ms)
  MEMORY_THRESHOLD          内存使用阈值(%)
  CPU_THRESHOLD             CPU使用阈值(%)
  DISK_THRESHOLD            磁盘使用阈值(%)
  BACKUP_RETENTION_DAYS     备份保留天数
  ALERT_EMAIL               告警邮箱地址
  ALERT_WEBHOOK             告警Webhook地址

示例:
  $0 --monitor              # 监控检查
  $0 --backup               # 执行备份
  $0 --full                 # 完整监控和备份
  $0 --test-alerts          # 测试告警

EOF
}

# ================================
# 初始化
# ================================

initialize() {
    # 创建必要目录
    mkdir -p "$LOG_DIR" "$BACKUP_DIR"
    
    # 创建监控日志文件
    touch "$LOG_DIR/monitor.log" "$LOG_DIR/health.log" "$LOG_DIR/performance.log"
    
    # 设置日志文件权限
    chmod 644 "$LOG_DIR"/*.log
}

# ================================
# 健康检查
# ================================

health_check() {
    log_info "开始健康检查..."
    
    local health_status="healthy"
    local issues=()
    
    # HTTP健康检查
    log_info "检查HTTP服务健康状态..."
    local start_time=$(date +%s%3N)
    
    if response=$(curl -s -w "%{http_code}:%{time_total}" "$HEALTH_CHECK_URL" 2>/dev/null); then
        local http_code=$(echo "$response" | cut -d: -f1)
        local response_time_sec=$(echo "$response" | cut -d: -f2)
        local response_time_ms=$(echo "$response_time_sec * 1000" | bc -l | cut -d. -f1)
        
        if [[ "$http_code" == "200" ]]; then
            log_success "HTTP服务健康检查通过 (${response_time_ms}ms)"
            
            # 检查响应时间
            if [[ "$response_time_ms" -gt "$RESPONSE_TIME_THRESHOLD" ]]; then
                issues+=("响应时间过长: ${response_time_ms}ms (阈值: ${RESPONSE_TIME_THRESHOLD}ms)")
                health_status="warning"
            fi
        else
            issues+=("HTTP状态码异常: $http_code")
            health_status="critical"
        fi
    else
        issues+=("HTTP服务无响应")
        health_status="critical"
    fi
    
    # Docker容器检查
    log_info "检查Docker容器状态..."
    if command -v docker &> /dev/null; then
        local containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "mining|frontend" || true)
        if [[ -n "$containers" ]]; then
            local unhealthy_containers=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" | grep -E "mining|frontend" || true)
            if [[ -n "$unhealthy_containers" ]]; then
                issues+=("不健康的容器: $unhealthy_containers")
                health_status="critical"
            fi
            
            local stopped_containers=$(docker ps -a --filter "status=exited" --format "{{.Names}}" | grep -E "mining|frontend" || true)
            if [[ -n "$stopped_containers" ]]; then
                issues+=("已停止的容器: $stopped_containers")
                health_status="critical"
            fi
        else
            issues+=("未找到相关Docker容器")
            health_status="critical"
        fi
    else
        issues+=("Docker未安装或无法访问")
        health_status="critical"
    fi
    
    # 记录健康检查结果
    echo "$(date '+%Y-%m-%d %H:%M:%S') $health_status ${#issues[@]}" >> "$LOG_DIR/health.log"
    
    # 输出结果
    if [[ "$health_status" == "healthy" ]]; then
        log_success "健康检查通过"
    elif [[ "$health_status" == "warning" ]]; then
        log_warning "健康检查发现警告"
        for issue in "${issues[@]}"; do
            log_warning "  - $issue"
        done
    else
        log_error "健康检查失败"
        for issue in "${issues[@]}"; do
            log_error "  - $issue"
        done
        
        # 发送告警
        if [[ "$ALERT_ENABLED" == "true" ]]; then
            send_alert "健康检查失败" "$(printf '%s\n' "${issues[@]}")"
        fi
    fi
    
    return $([ "$health_status" == "critical" ] && echo 1 || echo 0)
}

# ================================
# 系统指标收集
# ================================

collect_metrics() {
    log_info "收集系统性能指标..."
    
    local metrics_file="$LOG_DIR/performance.log"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local alerts=()
    
    # CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    cpu_usage=${cpu_usage%.*} # 取整数部分
    
    if [[ "$cpu_usage" -gt "$CPU_THRESHOLD" ]]; then
        alerts+=("CPU使用率过高: ${cpu_usage}% (阈值: ${CPU_THRESHOLD}%)")
    fi
    
    # 内存使用率
    local memory_info=$(free | grep Mem)
    local total_mem=$(echo $memory_info | awk '{print $2}')
    local used_mem=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$(echo "scale=0; $used_mem * 100 / $total_mem" | bc)
    
    if [[ "$memory_usage" -gt "$MEMORY_THRESHOLD" ]]; then
        alerts+=("内存使用率过高: ${memory_usage}% (阈值: ${MEMORY_THRESHOLD}%)")
    fi
    
    # 磁盘使用率
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ "$disk_usage" -gt "$DISK_THRESHOLD" ]]; then
        alerts+=("磁盘使用率过高: ${disk_usage}% (阈值: ${DISK_THRESHOLD}%)")
    fi
    
    # 负载均衡
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    # Docker容器资源使用
    local docker_stats=""
    if command -v docker &> /dev/null; then
        docker_stats=$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "mining|frontend" | head -5 | tr '\n' ';' || echo "N/A")
    fi
    
    # 网络连接数
    local connections=$(netstat -an | wc -l)
    
    # 记录指标
    echo "$timestamp CPU:${cpu_usage}% MEM:${memory_usage}% DISK:${disk_usage}% LOAD:$load_avg CONN:$connections DOCKER:$docker_stats" >> "$metrics_file"
    
    # 输出当前指标
    log_info "系统性能指标:"
    log_info "  CPU使用率: ${cpu_usage}%"
    log_info "  内存使用率: ${memory_usage}%"
    log_info "  磁盘使用率: ${disk_usage}%"
    log_info "  系统负载: $load_avg"
    log_info "  网络连接: $connections"
    
    # 检查告警
    if [[ ${#alerts[@]} -gt 0 ]]; then
        log_warning "性能告警:"
        for alert in "${alerts[@]}"; do
            log_warning "  - $alert"
        done
        
        if [[ "$ALERT_ENABLED" == "true" ]]; then
            send_alert "系统性能告警" "$(printf '%s\n' "${alerts[@]}")"
        fi
        
        return 1
    else
        log_success "系统性能正常"
        return 0
    fi
}

# ================================
# 应用备份
# ================================

backup_application() {
    log_info "开始应用备份..."
    
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_name="mining-frontend-backup-$timestamp"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    # 创建备份目录
    mkdir -p "$backup_path"
    
    # 备份配置文件
    log_info "备份配置文件..."
    if [[ -d "$APP_DIR" ]]; then
        cp -r "$APP_DIR"/*.yml "$backup_path/" 2>/dev/null || true
        cp -r "$APP_DIR"/.env* "$backup_path/" 2>/dev/null || true
        cp -r "$APP_DIR"/docker/ "$backup_path/" 2>/dev/null || true
        cp -r "$APP_DIR"/nginx.conf "$backup_path/" 2>/dev/null || true
    fi
    
    # 备份Docker镜像
    log_info "备份Docker镜像..."
    if command -v docker &> /dev/null; then
        local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep mining-frontend | head -3)
        for image in $images; do
            local image_file="${image//\//_}.tar"
            docker save "$image" | gzip > "$backup_path/$image_file.gz"
            log_info "已备份镜像: $image"
        done
    fi
    
    # 备份卷数据
    log_info "备份Docker卷数据..."
    if command -v docker &> /dev/null; then
        local volumes=$(docker volume ls --format "{{.Name}}" | grep mining)
        for volume in $volumes; do
            docker run --rm \
                -v "$volume":/data \
                -v "$backup_path":/backup \
                alpine tar czf "/backup/${volume}.tar.gz" -C /data . 2>/dev/null || true
            log_info "已备份卷: $volume"
        done
    fi
    
    # 备份数据库（如果存在）
    if command -v docker &> /dev/null && docker ps | grep -q redis; then
        log_info "备份Redis数据..."
        docker exec mining-redis redis-cli BGSAVE
        sleep 5
        docker cp mining-redis:/data/dump.rdb "$backup_path/redis-dump.rdb" || true
    fi
    
    # 备份日志文件（最近7天）
    log_info "备份日志文件..."
    find "$LOG_DIR" -name "*.log" -mtime -7 -exec cp {} "$backup_path/" \; 2>/dev/null || true
    find "$APP_DIR/logs" -name "*.log" -mtime -7 -exec cp {} "$backup_path/" \; 2>/dev/null || true
    
    # 创建备份清单
    log_info "创建备份清单..."
    cat > "$backup_path/backup-info.txt" << EOF
备份信息
========
备份时间: $(date)
备份名称: $backup_name
应用版本: $(docker images --format "{{.Tag}}" mining-frontend | head -1 || echo "unknown")
系统信息: $(uname -a)
备份大小: $(du -sh "$backup_path" | cut -f1)

备份内容:
$(ls -la "$backup_path")
EOF
    
    # 压缩备份
    log_info "压缩备份文件..."
    cd "$BACKUP_DIR"
    tar czf "$backup_name.tar.gz" "$backup_name"
    rm -rf "$backup_name"
    
    local backup_size=$(du -sh "$backup_name.tar.gz" | cut -f1)
    log_success "备份完成: $backup_name.tar.gz ($backup_size)"
    
    # 上传到云存储（如果启用）
    if [[ "$BACKUP_TO_CLOUD" == "true" ]]; then
        upload_to_cloud "$backup_name.tar.gz"
    fi
    
    # 清理旧备份
    cleanup_old_backups
    
    return 0
}

# ================================
# 清理旧备份
# ================================

cleanup_old_backups() {
    log_info "清理旧备份文件..."
    
    local deleted_count=0
    
    # 删除超过保留天数的备份
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
        log_info "已删除旧备份: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "mining-frontend-backup-*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -print0)
    
    if [[ $deleted_count -gt 0 ]]; then
        log_success "已清理 $deleted_count 个旧备份文件"
    else
        log_info "无需清理旧备份文件"
    fi
    
    # 显示当前备份文件
    local current_backups=$(find "$BACKUP_DIR" -name "mining-frontend-backup-*.tar.gz" | wc -l)
    log_info "当前备份文件数量: $current_backups"
}

# ================================
# 上传到云存储
# ================================

upload_to_cloud() {
    local backup_file="$1"
    local backup_path="$BACKUP_DIR/$backup_file"
    
    log_info "上传备份到云存储..."
    
    # AWS S3
    if [[ -n "${AWS_S3_BUCKET:-}" ]] && command -v aws &> /dev/null; then
        aws s3 cp "$backup_path" "s3://$AWS_S3_BUCKET/mining-frontend/backups/"
        log_success "已上传到AWS S3: $backup_file"
    
    # 阿里云OSS
    elif [[ -n "${ALIYUN_OSS_BUCKET:-}" ]] && command -v ossutil64 &> /dev/null; then
        ossutil64 cp "$backup_path" "oss://$ALIYUN_OSS_BUCKET/mining-frontend/backups/"
        log_success "已上传到阿里云OSS: $backup_file"
    
    # 腾讯云COS
    elif [[ -n "${TENCENT_COS_BUCKET:-}" ]] && command -v coscli &> /dev/null; then
        coscli cp "$backup_path" "cos://$TENCENT_COS_BUCKET/mining-frontend/backups/"
        log_success "已上传到腾讯云COS: $backup_file"
    
    else
        log_warning "未配置云存储或相关工具未安装，跳过上传"
    fi
}

# ================================
# 发送告警通知
# ================================

send_alert() {
    local subject="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    log_info "发送告警通知: $subject"
    
    # 邮件通知
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail &> /dev/null; then
        echo -e "时间: $timestamp\n主机: $(hostname)\n服务: 矿区安全数据库前端\n\n详情:\n$message" | \
            mail -s "【告警】$subject - 矿区安全数据库前端" "$ALERT_EMAIL"
        log_info "已发送邮件告警到: $ALERT_EMAIL"
    fi
    
    # Webhook通知
    if [[ -n "$ALERT_WEBHOOK" ]]; then
        local payload=$(cat << EOF
{
    "timestamp": "$timestamp",
    "hostname": "$(hostname)",
    "service": "矿区安全数据库前端",
    "subject": "$subject",
    "message": "$message",
    "level": "warning"
}
EOF
)
        
        if curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$ALERT_WEBHOOK" &> /dev/null; then
            log_info "已发送Webhook告警"
        else
            log_warning "Webhook告警发送失败"
        fi
    fi
    
    # 系统日志
    logger -t "mining-frontend-monitor" "$subject: $message"
}

# ================================
# 生成监控报告
# ================================

generate_report() {
    log_info "生成监控报告..."
    
    local report_file="$LOG_DIR/monitoring-report-$(date +%Y%m%d).html"
    local uptime_info=$(uptime)
    local disk_info=$(df -h /)
    local memory_info=$(free -h)
    
    # 获取最近的健康检查记录
    local recent_health=$(tail -n 24 "$LOG_DIR/health.log" 2>/dev/null || echo "无数据")
    
    # 获取最近的性能指标
    local recent_metrics=$(tail -n 24 "$LOG_DIR/performance.log" 2>/dev/null || echo "无数据")
    
    # 获取Docker容器状态
    local docker_status=""
    if command -v docker &> /dev/null; then
        docker_status=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}" | grep -E "mining|frontend" || echo "无Docker容器")
    fi
    
    # 生成HTML报告
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>矿区安全数据库前端 - 监控报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; color: #333; }
        .section { margin-bottom: 30px; padding: 15px; border-radius: 8px; background: #f9f9f9; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .metric-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 24px; font-weight: bold; color: #2196F3; }
        .status-ok { color: #4CAF50; }
        .status-warning { color: #FF9800; }
        .status-error { color: #F44336; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>矿区安全数据库前端 - 监控报告</h1>
            <p>生成时间: $(date)</p>
            <p>主机名: $(hostname)</p>
        </div>
        
        <div class="section">
            <h2>系统概览</h2>
            <div class="metrics">
                <div class="metric-card">
                    <h3>系统运行时间</h3>
                    <div class="metric-value">$uptime_info</div>
                </div>
                <div class="metric-card">
                    <h3>磁盘使用情况</h3>
                    <pre>$disk_info</pre>
                </div>
                <div class="metric-card">
                    <h3>内存使用情况</h3>
                    <pre>$memory_info</pre>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Docker容器状态</h2>
            <pre>$docker_status</pre>
        </div>
        
        <div class="section">
            <h2>最近健康检查记录 (24小时)</h2>
            <pre>$recent_health</pre>
        </div>
        
        <div class="section">
            <h2>最近性能指标 (24小时)</h2>
            <pre>$recent_metrics</pre>
        </div>
        
        <div class="section">
            <h2>备份情况</h2>
            <p>备份目录: $BACKUP_DIR</p>
            <p>备份文件:</p>
            <pre>$(ls -lah "$BACKUP_DIR" | grep "mining-frontend-backup" | tail -10)</pre>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "监控报告已生成: $report_file"
    
    # 如果是在桌面环境，尝试打开报告
    if command -v xdg-open &> /dev/null; then
        xdg-open "$report_file" &> /dev/null &
    fi
}

# ================================
# 测试告警
# ================================

test_alerts() {
    log_info "测试告警通知..."
    
    send_alert "告警测试" "这是一个测试告警消息，用于验证告警系统是否正常工作。\n时间: $(date)\n主机: $(hostname)"
    
    log_success "告警测试完成"
}

# ================================
# 主函数
# ================================

main() {
    local action=""
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -m|--monitor)
                action="monitor"
                shift
                ;;
            -b|--backup)
                action="backup"
                shift
                ;;
            -c|--cleanup)
                action="cleanup"
                shift
                ;;
            -r|--report)
                action="report"
                shift
                ;;
            --health)
                action="health"
                shift
                ;;
            --metrics)
                action="metrics"
                shift
                ;;
            --full)
                action="full"
                shift
                ;;
            --test-alerts)
                action="test-alerts"
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 初始化
    initialize
    
    # 如果没有指定操作，默认执行监控
    if [[ -z "$action" ]]; then
        action="monitor"
    fi
    
    # 执行相应操作
    case $action in
        monitor)
            log_info "执行监控检查..."
            health_check
            collect_metrics
            ;;
        backup)
            backup_application
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        report)
            generate_report
            ;;
        health)
            health_check
            ;;
        metrics)
            collect_metrics
            ;;
        full)
            log_info "执行完整监控和备份..."
            health_check
            collect_metrics
            backup_application
            generate_report
            ;;
        test-alerts)
            test_alerts
            ;;
        *)
            log_error "无效操作: $action"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"