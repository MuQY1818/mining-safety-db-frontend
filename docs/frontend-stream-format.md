# 前端流式数据格式说明

## 当前前端接收的流式数据格式

### 1. 原始SSE格式
前端当前接收的是SiliconFlow API的标准SSE格式：

```
data: {"id":"chat_123","object":"chat.completion.chunk","created":1640995200,"model":"Qwen/Qwen2.5-7B-Instruct","choices":[{"index":0,"delta":{"content":"你好"},"finish_reason":null}]}

data: {"id":"chat_123","object":"chat.completion.chunk","created":1640995200,"model":"Qwen/Qwen2.5-7B-Instruct","choices":[{"index":0,"delta":{"content":"，"},"finish_reason":null}]}

data: [DONE]
```

### 2. 关键数据结构
```json
{
  "id": "chat_123",
  "object": "chat.completion.chunk", 
  "created": 1640995200,
  "model": "Qwen/Qwen2.5-7B-Instruct",
  "choices": [
    {
      "index": 0,
      "delta": {
        "content": "你好"
      },
      "finish_reason": null
    }
  ]
}
```

### 3. 结束标记
```
data: [DONE]
```

### 4. 前端解析逻辑
前端通过以下方式解析：
1. 按行分割SSE数据
2. 提取 `data: ` 后面的内容
3. 解析JSON获取 `choices[0].delta.content`
4. 遇到 `[DONE]` 时调用完成回调

## 给后端同学的要求

**请保持这个格式完全一致**，前端代码无需修改，只需要：
1. 将API地址从 `https://api.siliconflow.cn/v1/chat/completions` 改为 `/api/ai/chat/stream`
2. 后端代理转发到SiliconFlow API并返回相同格式的SSE响应

## 简化版实现要点

1. **接口路径**：`POST /api/ai/chat/stream`
2. **请求格式**：保持与当前SiliconFlow API相同的请求格式
3. **响应格式**：SSE流，返回完全相同的数据格式
4. **认证**：使用JWT Token验证用户身份
5. **安全**：在后端配置API Key，不在前端暴露

这样前端代码基本不用修改，只需要在 `siliconflow.ts` 中修改API地址即可。