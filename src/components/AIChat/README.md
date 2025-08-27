# AI对话组件使用指南

## 组件概述

本目录包含了完整的AI对话功能组件，支持会话管理、消息存储、历史查询等功能。

## 组件结构

```
src/components/AIChat/
├── ChatInterface.tsx          # 聊天界面组件
├── ChatSessionManager.tsx     # 会话管理组件
├── ChatLayout.tsx             # 布局组件（推荐使用）
└── README.md                  # 使用指南
```

## 快速开始

### 1. 基本使用

最简单的方式是直接使用 `ChatLayout` 组件：

```tsx
import React from 'react';
import ChatLayout from '@/components/AIChat/ChatLayout';

const MyAIChatPage = () => {
  return (
    <div style={{ height: '100vh', padding: '24px' }}>
      <ChatLayout />
    </div>
  );
};

export default MyAIChatPage;
```

### 2. 带相关资料的使用

如果要基于特定的安全资料进行咨询：

```tsx
import React from 'react';
import ChatLayout from '@/components/AIChat/ChatLayout';

const SafetyDocumentChat = ({ document }) => {
  return (
    <div style={{ height: '100vh', padding: '24px' }}>
      <ChatLayout relatedItem={document} />
    </div>
  );
};
```

### 3. 独立使用会话管理

如果只需要会话管理功能：

```tsx
import React, { useState } from 'react';
import ChatSessionManager from '@/components/AIChat/ChatSessionManager';
import { ChatSession } from '@/types/ai';

const SessionManagementExample = () => {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  const handleSessionSelect = (session: ChatSession) => {
    setSelectedSession(session);
    console.log('选中会话:', session);
  };

  return (
    <div style={{ height: '600px', width: '400px' }}>
      <ChatSessionManager
        onSessionSelect={handleSessionSelect}
        selectedSessionId={selectedSession?.id}
      />
    </div>
  );
};
```

### 4. 独立使用聊天界面

如果只需要聊天功能：

```tsx
import React from 'react';
import ChatInterface from '@/components/AIChat/ChatInterface';

const SimpleChatExample = () => {
  return (
    <div style={{ height: '600px' }}>
      <ChatInterface sessionId="your-session-id" />
    </div>
  );
};
```

## 状态管理

组件使用 Zustand 进行状态管理，你可以在任何地方访问聊天状态：

```tsx
import { useChatStore } from '@/store/chatStore';

const ChatStatusComponent = () => {
  const { 
    sessions, 
    currentSession, 
    isLoading, 
    isStreaming,
    createSession,
    sendMessage 
  } = useChatStore();

  const handleCreateNewChat = async () => {
    try {
      const sessionId = await createSession('新的安全咨询');
      console.log('创建会话成功:', sessionId);
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  };

  return (
    <div>
      <p>当前会话数: {sessions.length}</p>
      <p>当前会话: {currentSession?.title || '无'}</p>
      <p>加载状态: {isLoading ? '加载中' : '空闲'}</p>
      <p>流式响应: {isStreaming ? '响应中' : '等待'}</p>
      <button onClick={handleCreateNewChat}>创建新会话</button>
    </div>
  );
};
```

## 自定义样式

### 1. 主题定制

组件使用了项目的主题配置，你可以通过修改 `src/config/theme.ts` 来自定义样式：

```tsx
// 在你的组件中覆盖样式
<ChatLayout 
  style={{ 
    background: '#f0f0f0',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }} 
/>
```

### 2. 响应式设计

组件已经内置了响应式设计，会根据屏幕尺寸自动调整布局：

- 桌面端：左右分栏布局（会话列表 + 聊天界面）
- 移动端：单栏布局 + 抽屉式会话列表

## API集成

确保后端API已经实现了相应的接口。主要接口包括：

```typescript
// 会话管理
POST   /api/ai/sessions              // 创建会话
GET    /api/ai/sessions              // 获取会话列表
GET    /api/ai/sessions/{id}         // 获取会话详情
PUT    /api/ai/sessions/{id}         // 更新会话
DELETE /api/ai/sessions/{id}         // 删除会话

// 消息管理
POST   /api/ai/sessions/{id}/messages    // 发送消息
GET    /api/ai/sessions/{id}/messages    // 获取消息历史
POST   /api/ai/messages/{id}/feedback    // 提交反馈
```

## 错误处理

组件内置了完善的错误处理机制：

```tsx
import { useChatStore } from '@/store/chatStore';
import { useEffect } from 'react';
import { message } from 'antd';

const ErrorHandlingExample = () => {
  const { error, clearError } = useChatStore();

  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  return <ChatLayout />;
};
```

## 性能优化

### 1. 分页加载

消息历史支持分页加载，避免一次性加载大量数据：

```tsx
const { loadMessages } = useChatStore();

// 加载更多消息
const loadMoreMessages = async (sessionId: string, page: number) => {
  const messages = await loadMessages(sessionId, page, 20);
  return messages;
};
```

### 2. 虚拟滚动

对于大量消息的会话，建议实现虚拟滚动来提升性能。

## 常见问题

### Q: 如何自定义快捷问题？

A: 修改 `ChatInterface.tsx` 中的 `quickQuestions` 数组：

```tsx
const quickQuestions = [
  '你的自定义问题1',
  '你的自定义问题2',
  // ...
];
```

### Q: 如何禁用某些功能？

A: 通过props控制功能的显示：

```tsx
// 可以扩展组件props来控制功能
<ChatInterface 
  sessionId="xxx"
  showFeedback={false}      // 隐藏反馈按钮
  showQuickQuestions={false} // 隐藏快捷问题
/>
```

### Q: 如何集成到现有路由？

A: 在路由配置中添加AI聊天页面：

```tsx
// 在你的路由配置中
import AIChatPage from '@/pages/AIChat';

const routes = [
  // ... 其他路由
  {
    path: '/ai-chat',
    component: AIChatPage,
    name: 'AI助手'
  }
];
```

## 更新日志

- v1.0.0: 初始版本，包含基本的聊天和会话管理功能
- 支持流式响应、消息反馈、会话导出等功能
- 响应式设计，支持桌面端和移动端
