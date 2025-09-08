# 1Panel 部署指南

## 部署方式选择

### 方式一：容器编排（推荐）
1. 在1Panel中进入「容器」-「编排」
2. 点击「创建编排」
3. 粘贴以下内容：

```yaml
version: '3.8'
services:
  mining-frontend:
    image: ghcr.io/muqy1818/mining-safety-db-frontend:2025-09-08
    container_name: mining-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - REACT_APP_SILICONFLOW_API_KEY=sk-mtluervosowzcbzqctuxrntymfenpgriigjjkhdmwrorpsby
      - REACT_APP_API_BASE_URL=https://mining-backend.ziven.site/api
```

### 方式二：应用商店
1. 在1Panel中进入「应用商店」
2. 搜索「Nginx」并安装
3. 在网站配置中反向代理到：`http://localhost:3000`

### 方式三：手动部署
1. 在1Panel中进入「容器」-「容器」
2. 点击「创建容器」
3. 镜像名称：`ghcr.io/muqy1818/mining-safety-db-frontend:2025-09-08`
4. 端口映射：`3000:80`
5. 环境变量：
   - `REACT_APP_SILICONFLOW_API_KEY`: `sk-mtluervosowzcbzqctuxrntymfenpgriigjjkhdmwrorpsby`
   - `REACT_APP_API_BASE_URL`: `https://mining-backend.ziven.site/api`

## 访问地址
部署完成后，访问：`http://你的服务器IP:3000`

## 注意事项
- 确保端口3000未被占用
- 如需使用其他端口，修改端口映射即可
- AI功能已配置，无需额外设置