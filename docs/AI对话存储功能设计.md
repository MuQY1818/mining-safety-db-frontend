# AI对话存储功能设计文档

## 概述

本文档描述了矿区安全语言资料数据库中AI对话存储功能的完整设计方案，包括前端组件架构、后端API设计、数据模型以及使用方法。

## 功能特性

### 🎯 核心功能
- **会话管理**: 创建、编辑、删除、归档AI对话会话
- **消息存储**: 持久化保存用户与AI的对话记录
- **历史查询**: 快速检索和浏览历史对话
- **会话导出**: 支持JSON/TXT格式导出对话记录
- **消息反馈**: 用户可对AI回答进行点赞/点踩反馈
- **统计分析**: 提供详细的对话使用统计信息

### 🚀 技术特性
- **流式对话**: 支持实时流式AI响应
- **响应式设计**: 适配桌面端和移动端
- **离线缓存**: 本地状态管理和缓存
- **错误处理**: 完善的错误处理和用户提示
- **性能优化**: 分页加载和虚拟滚动

## 架构设计

### 前端架构

```
src/
├── components/AIChat/
│   ├── ChatInterface.tsx          # 聊天界面组件
│   ├── ChatSessionManager.tsx     # 会话管理组件
│   └── ChatLayout.tsx             # 布局组件
├── store/
│   └── chatStore.ts               # 聊天状态管理
├── services/
│   └── ai.ts                      # AI API服务
├── types/
│   └── ai.ts                      # 类型定义
└── pages/AIChat/
    └── index.tsx                  # AI聊天页面
```

### 数据模型

#### 会话表 (ai_chat_sessions)
```sql
CREATE TABLE ai_chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT '新对话',
    description TEXT,
    status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
    message_count INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 消息表 (ai_chat_messages)
```sql
CREATE TABLE ai_chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    model_name VARCHAR(50),
    response_time DECIMAL(5,3),
    confidence_score DECIMAL(3,2),
    related_documents JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API接口

### 会话管理接口

#### 创建会话
```http
POST /api/ai/sessions
Content-Type: application/json

{
  "title": "关于瓦斯检测的咨询",
  "description": "询问煤矿瓦斯检测相关问题"
}
```

#### 获取会话列表
```http
GET /api/ai/sessions?page=1&pageSize=20&status=active&sortBy=lastMessageAt&sortOrder=desc
```

#### 发送消息
```http
POST /api/ai/sessions/{sessionId}/messages
Content-Type: application/json

{
  "content": "煤矿瓦斯检测的标准浓度是多少？",
  "stream": true
}
```

### 消息管理接口

#### 获取消息历史
```http
GET /api/ai/sessions/{sessionId}/messages?page=1&pageSize=50
```

#### 消息反馈
```http
POST /api/ai/messages/{messageId}/feedback
Content-Type: application/json

{
  "feedbackType": "like",
  "feedbackComment": "回答很详细，对我很有帮助"
}
```

## 前端组件使用

### ChatLayout 组件
主要的聊天布局组件，整合了会话管理和聊天界面：

```tsx
import ChatLayout from '@/components/AIChat/ChatLayout';

// 基本使用
<ChatLayout />

// 带相关资料的使用
<ChatLayout relatedItem={safetyDocument} />
```

### ChatSessionManager 组件
会话管理组件，提供会话列表和操作功能：

```tsx
import ChatSessionManager from '@/components/AIChat/ChatSessionManager';

<ChatSessionManager
  onSessionSelect={handleSessionSelect}
  selectedSessionId={currentSessionId}
/>
```

### ChatInterface 组件
聊天界面组件，处理消息发送和显示：

```tsx
import ChatInterface from '@/components/AIChat/ChatInterface';

<ChatInterface
  sessionId={sessionId}
  relatedItem={relatedDocument}
/>
```

## 状态管理

使用Zustand进行状态管理，主要状态包括：

```typescript
interface ChatState {
  sessions: ChatSession[];           // 会话列表
  currentSession: ChatSession | null; // 当前会话
  isLoading: boolean;               // 加载状态
  isStreaming: boolean;             // 流式响应状态
  error: string | null;             // 错误信息
  statistics: ChatStatistics | null; // 统计信息
}
```

### 主要操作方法

```typescript
// 会话管理
createSession(title, description)    // 创建会话
loadSessions(params)                 // 加载会话列表
updateSession(id, params)            // 更新会话
deleteSession(id)                    // 删除会话
archiveSession(id)                   // 归档会话

// 消息管理
sendMessage(content)                 // 发送消息
loadMessages(sessionId)              // 加载消息
submitMessageFeedback(id, feedback)  // 提交反馈
```

## 部署说明

### 环境变量配置
```bash
# AI服务配置
AI_API_KEY=your-ai-api-key
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL_NAME=qwen-plus

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mining_safety_db
```

### 数据库初始化
1. 执行数据库迁移脚本
2. 创建必要的索引
3. 插入初始配置数据

## 使用示例

### 1. 基本聊天功能
```tsx
import { useChatStore } from '@/store/chatStore';

const ChatExample = () => {
  const { createSession, sendMessage, currentSession } = useChatStore();
  
  const handleStartChat = async () => {
    await createSession('新的安全咨询');
    await sendMessage('请介绍一下煤矿瓦斯检测的基本要求');
  };
  
  return (
    <button onClick={handleStartChat}>
      开始咨询
    </button>
  );
};
```

### 2. 会话管理
```tsx
const SessionManagement = () => {
  const { 
    sessions, 
    loadSessions, 
    deleteSession, 
    archiveSession 
  } = useChatStore();
  
  useEffect(() => {
    loadSessions({ status: 'active', sortBy: 'lastMessageAt' });
  }, []);
  
  return (
    <div>
      {sessions.map(session => (
        <div key={session.id}>
          <h3>{session.title}</h3>
          <button onClick={() => archiveSession(session.id)}>
            归档
          </button>
          <button onClick={() => deleteSession(session.id)}>
            删除
          </button>
        </div>
      ))}
    </div>
  );
};
```

## 最佳实践

### 1. 性能优化
- 使用分页加载历史消息
- 实现消息虚拟滚动
- 合理设置缓存策略

### 2. 用户体验
- 提供流式响应提升交互体验
- 支持快捷问题和模板
- 实现离线状态处理

### 3. 错误处理
- 网络错误重试机制
- 用户友好的错误提示
- 数据一致性保证

### 4. 安全考虑
- 用户权限验证
- 敏感信息过滤
- API访问频率限制

## 后续扩展

### 计划功能
- [ ] 多模态对话支持（图片、文件）
- [ ] 对话分享和协作
- [ ] 智能对话摘要
- [ ] 个性化推荐
- [ ] 语音对话支持

### 技术优化
- [ ] WebSocket实时通信
- [ ] 消息搜索功能
- [ ] 对话数据分析
- [ ] 性能监控和优化
