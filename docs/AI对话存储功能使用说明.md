# AI对话存储功能使用说明

## 概述

在现有AI对话功能基础上，我们添加了简单的对话记录存储功能，让用户可以保存和查看历史对话。

## 功能特性

### ✅ 已实现的功能
- **会话创建**: 自动创建和管理对话会话
- **消息存储**: 在内存中保存对话消息
- **历史查看**: 查看历史对话列表
- **会话切换**: 在不同对话间切换
- **会话删除**: 删除不需要的对话
- **响应式设计**: 支持桌面端和移动端

### 🔄 可扩展的功能
- **后端存储**: 可以轻松接入后端API进行持久化存储
- **会话搜索**: 可以添加搜索历史对话功能
- **导出功能**: 可以添加对话导出功能
- **分类管理**: 可以添加对话分类功能

## 组件使用

### 1. 基本使用（保持原有功能）

如果你不需要历史记录功能，原有的 `ChatInterface` 组件完全不变：

```tsx
import ChatInterface from '@/components/AIChat/ChatInterface';

// 原有使用方式完全不变
<ChatInterface relatedItem={safetyDocument} />
```

### 2. 带历史记录的使用

如果需要历史记录功能，使用新的 `ChatWithHistory` 组件：

```tsx
import ChatWithHistory from '@/components/AIChat/ChatWithHistory';

// 带历史记录的聊天界面
<ChatWithHistory 
  relatedItem={safetyDocument}
  showHistory={true}  // 是否显示历史面板
/>
```

### 3. 只使用历史面板

如果只需要历史记录面板：

```tsx
import ChatHistoryPanel from '@/components/AIChat/ChatHistoryPanel';

<ChatHistoryPanel
  onSessionSelect={handleSessionSelect}
  selectedSessionId={currentSessionId}
/>
```

## 数据存储

### 当前实现
- 数据存储在浏览器内存中（Zustand store）
- 刷新页面后数据会丢失
- 适合演示和开发阶段

### 扩展到后端存储

要接入后端API，只需要修改 `src/services/ai.ts` 中的相关方法：

```typescript
// 保存会话到后端
saveSession: async (sessionId: string, messages: ChatMessage[]): Promise<void> => {
  try {
    await apiClient.post('/ai/sessions', { sessionId, messages });
  } catch (error) {
    console.warn('保存会话失败:', error);
  }
},

// 获取用户会话列表
getSessions: async (userId: number): Promise<ChatSession[]> => {
  try {
    const response = await apiClient.get(`/ai/sessions?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.warn('获取会话失败:', error);
    return [];
  }
},
```

## 后端API设计

如果要实现完整的后端存储，建议实现以下API：

### 会话管理
```
POST   /api/ai/sessions              # 创建会话
GET    /api/ai/sessions              # 获取会话列表
GET    /api/ai/sessions/{id}         # 获取会话详情
PUT    /api/ai/sessions/{id}         # 更新会话
DELETE /api/ai/sessions/{id}         # 删除会话
```

### 消息管理
```
POST   /api/ai/sessions/{id}/messages    # 发送消息
GET    /api/ai/sessions/{id}/messages    # 获取消息历史
```

## 数据库设计

### 会话表 (ai_chat_sessions)
```sql
CREATE TABLE ai_chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT '新对话',
    status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
    message_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 消息表 (ai_chat_messages)
```sql
CREATE TABLE ai_chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
);
```

## 使用示例

### 在现有页面中集成

```tsx
// 在你的页面组件中
import React from 'react';
import ChatWithHistory from '@/components/AIChat/ChatWithHistory';

const SafetyConsultationPage = () => {
  return (
    <div style={{ height: '100vh', padding: '24px' }}>
      <h1>矿区安全AI咨询</h1>
      
      {/* 带历史记录的AI聊天 */}
      <div style={{ height: 'calc(100% - 80px)' }}>
        <ChatWithHistory showHistory={true} />
      </div>
    </div>
  );
};
```

### 在安全资料详情页中使用

```tsx
// 在安全资料详情页中添加AI咨询功能
import ChatWithHistory from '@/components/AIChat/ChatWithHistory';

const SafetyDocumentDetail = ({ document }) => {
  return (
    <div>
      {/* 文档内容 */}
      <div>{document.content}</div>
      
      {/* AI咨询区域 */}
      <div style={{ marginTop: 24, height: '500px' }}>
        <h3>AI安全咨询</h3>
        <ChatWithHistory 
          relatedItem={document}
          showHistory={true}
        />
      </div>
    </div>
  );
};
```

## 自定义配置

### 隐藏历史面板

```tsx
<ChatWithHistory showHistory={false} />
```

### 自定义样式

```tsx
<ChatWithHistory 
  style={{ 
    border: '1px solid #d9d9d9',
    borderRadius: '8px',
    backgroundColor: '#fafafa'
  }}
/>
```

## 注意事项

1. **数据持久化**: 当前实现数据只存储在内存中，刷新页面会丢失
2. **用户认证**: 需要集成用户认证系统来区分不同用户的对话
3. **性能优化**: 大量历史对话时建议实现分页加载
4. **错误处理**: 建议添加更完善的错误处理和用户提示

## 升级路径

1. **第一阶段**: 使用当前的内存存储实现（已完成）
2. **第二阶段**: 接入后端API实现持久化存储
3. **第三阶段**: 添加搜索、分类、导出等高级功能
4. **第四阶段**: 添加协作、分享等社交功能

这样的设计让你可以逐步升级，不会影响现有功能的使用。
