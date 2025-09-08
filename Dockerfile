# 矿区安全数据库前端 - 多阶段Docker构建文件
# 
# 阶段1: Node.js构建阶段
# 阶段2: Nginx静态服务阶段

# ================================
# 阶段1: 构建阶段 (Build Stage)
# ================================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置npm镜像源 (可选，提升国内构建速度)
RUN npm config set registry https://registry.npmmirror.com/

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production --no-audit --no-fund

# 复制源代码
COPY . .

# 设置构建时环境变量
ARG REACT_APP_SILICONFLOW_API_KEY
ENV REACT_APP_SILICONFLOW_API_KEY=$REACT_APP_SILICONFLOW_API_KEY
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# 构建应用
RUN npm run build

# ================================  
# 阶段2: 生产阶段 (Production Stage)
# ================================
FROM nginx:1.25-alpine

# 安装必要工具
RUN apk add --no-cache \
    curl \
    tzdata

# 设置时区为中国标准时间
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建nginx用户和组(如果不存在)
RUN addgroup -g 101 -S nginx || true
RUN adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# 移除默认nginx配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义nginx配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制静态文件到nginx目录
COPY --from=builder /app/build /usr/share/nginx/html

# 创建日志目录
RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/access.log && \
    touch /var/log/nginx/error.log && \
    chown -R nginx:nginx /var/log/nginx

# 设置文件权限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]

# 容器标签信息
LABEL maintainer="矿区安全数据库团队"
LABEL version="1.0.0"
LABEL description="矿区语言安全数据库前端应用"
LABEL build_date="2025-08-28"