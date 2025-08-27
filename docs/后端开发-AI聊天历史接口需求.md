# 后端开发 - AI聊天历史接口需求

## 概述

前端AI聊天功能需要后端提供聊天历史存储和管理的API接口。**注意：AI对话请求直接从前端发送到第三方AI服务，后端只负责存储聊天历史记录。**

## 数据库表结构

### 1. 聊天会话表 (chat_sessions)
```sql
CREATE TABLE chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT '新对话',
    description TEXT,
    status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
    message_count INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_last_message (last_message_at),
    INDEX idx_user_status (user_id, status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. 聊天消息表 (chat_messages)
```sql
CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    model_name VARCHAR(50),
    response_time DECIMAL(5,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_session_created (session_id, created_at),
    INDEX idx_role (role),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
```

### 3. 消息反馈表 (chat_message_feedback) - 可选
```sql
CREATE TABLE chat_message_feedback (
    id VARCHAR(36) PRIMARY KEY,
    message_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    feedback_type ENUM('like', 'dislike', 'report') NOT NULL,
    feedback_reason VARCHAR(100),
    feedback_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_message_id (message_id),
    INDEX idx_user_id (user_id),
    INDEX idx_feedback_type (feedback_type),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_message (user_id, message_id)
);
```

## 必需的API接口

### 1. 会话管理接口

#### 1.1 创建会话
```
POST /api/chat/sessions
Authorization: Bearer <token>
Content-Type: application/json

请求体:
{
  "title": "关于瓦斯检测的咨询",
  "description": "询问煤矿瓦斯检测相关问题"  // 可选
}

响应:
{
  "success": true,
  "data": {
    "id": "session_001",
    "title": "关于瓦斯检测的咨询",
    "description": "询问煤矿瓦斯检测相关问题",
    "status": "active",
    "messageCount": 0,
    "totalTokens": 0,
    "createdAt": "2025-02-06T10:30:00Z",
    "updatedAt": "2025-02-06T10:30:00Z"
  },
  "message": "会话创建成功"
}
```

#### 1.2 获取会话列表
```
GET /api/chat/sessions?page=1&pageSize=20&status=active&sortBy=lastMessageAt&sortOrder=desc
Authorization: Bearer <token>

响应:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "session_001",
        "title": "关于瓦斯检测的咨询",
        "description": "询问煤矿瓦斯检测相关问题",
        "status": "active",
        "messageCount": 15,
        "totalTokens": 2048,
        "lastMessageAt": "2025-02-06T15:45:00Z",
        "createdAt": "2025-02-06T10:30:00Z",
        "updatedAt": "2025-02-06T15:45:00Z",
        "lastMessage": {  // 可选，最后一条消息预览
          "role": "assistant",
          "content": "根据《煤矿安全规程》规定...",
          "createdAt": "2025-02-06T15:45:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 25,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "查询成功"
}
```

#### 1.3 获取会话详情
```
GET /api/chat/sessions/{sessionId}
Authorization: Bearer <token>

响应:
{
  "success": true,
  "data": {
    "id": "session_001",
    "title": "关于瓦斯检测的咨询",
    "description": "询问煤矿瓦斯检测相关问题",
    "status": "active",
    "messageCount": 15,
    "totalTokens": 2048,
    "lastMessageAt": "2025-02-06T15:45:00Z",
    "createdAt": "2025-02-06T10:30:00Z",
    "updatedAt": "2025-02-06T15:45:00Z"
  },
  "message": "查询成功"
}
```

#### 1.4 更新会话
```
PUT /api/chat/sessions/{sessionId}
Authorization: Bearer <token>
Content-Type: application/json

请求体:
{
  "title": "煤矿瓦斯检测技术咨询",
  "description": "深入了解煤矿瓦斯检测的技术要求和操作规程"
}

响应:
{
  "success": true,
  "data": {
    "id": "session_001",
    "title": "煤矿瓦斯检测技术咨询",
    "description": "深入了解煤矿瓦斯检测的技术要求和操作规程",
    "updatedAt": "2025-02-06T16:00:00Z"
  },
  "message": "会话更新成功"
}
```

#### 1.5 删除会话
```
DELETE /api/chat/sessions/{sessionId}
Authorization: Bearer <token>

响应:
{
  "success": true,
  "message": "会话删除成功"
}
```

### 2. 消息管理接口

#### 2.1 保存消息 (重要)
```
POST /api/chat/sessions/{sessionId}/messages
Authorization: Bearer <token>
Content-Type: application/json

请求体:
{
  "messages": [
    {
      "role": "user",
      "content": "煤矿瓦斯检测的标准浓度是多少？",
      "timestamp": "2025-02-06T10:30:00Z"
    },
    {
      "role": "assistant", 
      "content": "根据《煤矿安全规程》规定，煤矿井下瓦斯浓度检测标准如下...",
      "timestamp": "2025-02-06T10:30:15Z",
      "tokensUsed": 256,
      "modelName": "qwen-plus",
      "responseTime": 2.3
    }
  ]
}

响应:
{
  "success": true,
  "data": {
    "savedMessages": [
      {
        "id": "msg_user_001",
        "sessionId": "session_001",
        "role": "user",
        "content": "煤矿瓦斯检测的标准浓度是多少？",
        "createdAt": "2025-02-06T10:30:00Z"
      },
      {
        "id": "msg_assistant_001",
        "sessionId": "session_001",
        "role": "assistant",
        "content": "根据《煤矿安全规程》规定...",
        "tokensUsed": 256,
        "modelName": "qwen-plus",
        "responseTime": 2.3,
        "createdAt": "2025-02-06T10:30:15Z"
      }
    ],
    "sessionUpdated": {
      "messageCount": 15,
      "totalTokens": 2048,
      "lastMessageAt": "2025-02-06T10:30:15Z"
    }
  },
  "message": "消息保存成功"
}
```

#### 2.2 获取消息历史
```
GET /api/chat/sessions/{sessionId}/messages?page=1&pageSize=50&sortOrder=asc
Authorization: Bearer <token>

响应:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "msg_user_001",
        "sessionId": "session_001",
        "role": "user",
        "content": "煤矿瓦斯检测的标准浓度是多少？",
        "createdAt": "2025-02-06T10:30:00Z"
      },
      {
        "id": "msg_assistant_001",
        "sessionId": "session_001",
        "role": "assistant",
        "content": "根据《煤矿安全规程》规定...",
        "tokensUsed": 256,
        "modelName": "qwen-plus",
        "responseTime": 2.3,
        "createdAt": "2025-02-06T10:30:15Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 2,
      "totalPages": 1
    }
  },
  "message": "查询成功"
}
```

## 权限和安全要求

### 1. 用户隔离
- 每个用户只能访问自己的聊天会话和消息
- 基于JWT token中的user_id进行权限控制
- 所有接口都需要验证用户身份

### 2. 数据验证
- 会话标题长度限制：1-200字符
- 消息内容长度限制：1-10000字符
- 参数类型和格式验证

### 3. 错误处理
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "field": "title",
      "reason": "标题不能为空"
    }
  },
  "timestamp": "2025-02-06T10:30:00Z"
}
```

## 性能要求

- 查询接口响应时间 < 500ms
- 创建/更新接口响应时间 < 1s
- 支持分页查询，默认每页20条
- 消息内容支持大文本存储

## 前端调用示例

前端会通过以下服务调用这些接口：

```typescript
// 创建会话
const session = await chatHistoryService.createSession({
  title: '新的安全咨询'
});

// 保存消息
await chatHistoryService.saveMessages(sessionId, {
  messages: [userMessage, aiMessage]
});

// 获取会话列表
const sessions = await chatHistoryService.getSessions({
  pageSize: 20,
  sortBy: 'lastMessageAt',
  sortOrder: 'desc'
});
```

## 开发优先级

1. **高优先级**（必须实现）
   - 创建会话
   - 获取会话列表
   - 保存消息
   - 获取消息历史

2. **中优先级**（建议实现）
   - 更新会话
   - 删除会话
   - 会话详情

3. **低优先级**（后续版本）
   - 消息反馈
   - 会话归档
   - 批量操作

请按照这个优先级顺序开发，确保核心功能先上线。
