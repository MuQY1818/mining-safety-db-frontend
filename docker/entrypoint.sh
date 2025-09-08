#!/bin/sh

# 矿区安全数据库前端 - 环境变量注入脚本
# 在容器启动时动态注入环境变量到HTML中

# 设置环境变量
export API_BASE_URL="${REACT_APP_API_BASE_URL:-https://mining-backend.ziven.site/api}"
export SILICONFLOW_API_KEY="${REACT_APP_SILICONFLOW_API_KEY}"
export ENABLE_AI_CHAT="${REACT_APP_ENABLE_AI_CHAT:-true}"
export ENABLE_FEEDBACK="${REACT_APP_ENABLE_FEEDBACK:-true}"
export AI_STREAM_ENABLED="${REACT_APP_AI_STREAM_ENABLED:-true}"

# 创建运行时配置JSON
RUNTIME_CONFIG_JSON="{\"REACT_APP_API_BASE_URL\":\"$API_BASE_URL\",\"REACT_APP_SILICONFLOW_API_KEY\":\"$SILICONFLOW_API_KEY\",\"REACT_APP_ENABLE_AI_CHAT\":\"$ENABLE_AI_CHAT\",\"REACT_APP_ENABLE_FEEDBACK\":\"$ENABLE_FEEDBACK\",\"REACT_APP_AI_STREAM_ENABLED\":\"$AI_STREAM_ENABLED\"}"

# 检查是否为空API key
if [ -z "$SILICONFLOW_API_KEY" ]; then
    echo "警告: REACT_APP_SILICONFLOW_API_KEY 未设置，AI功能将不可用"
    echo "请在环境变量中设置有效的SiliconFlow API密钥"
fi

# 注入配置到HTML文件
echo "注入运行时配置到HTML文件..."
sed -i "s|<meta name=\"runtime-config\" content=\"\">|<meta name=\"runtime-config\" content='$RUNTIME_CONFIG_JSON'>|g" /usr/share/nginx/html/index.html

# 验证配置是否注入成功
if grep -q "runtime-config" /usr/share/nginx/html/index.html; then
    echo "运行时配置注入成功"
else
    echo "警告: 运行时配置注入失败"
fi

echo "API基础URL: $API_BASE_URL"
echo "AI功能状态: $ENABLE_AI_CHAT"
echo "反馈功能状态: $ENABLE_FEEDBACK"
echo "流式响应状态: $AI_STREAM_ENABLED"

# 启动nginx
exec nginx -g "daemon off;"