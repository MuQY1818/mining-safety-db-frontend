# 矿区安全语言资料数据库 API 设计文档

## 基础信息

- **Base URL**: `https://api.mining-safety.com/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8
- **API版本**: v1.0.0
- **文档更新时间**: 2024-01-20

## 前端调用说明

### API服务层位置
- **文件路径**: `src/services/api.ts`
- **主要类**: `ApiService`
- **实例**: `apiService`

### 状态管理调用位置
- **安全数据**: `src/store/safetyDataStore.ts` - `useSafetyDataStore`
- **用户建议**: `src/store/feedbackStore.ts` - `useFeedbackStore` (待创建)
- **用户认证**: `src/store/authStore.ts` - `useAuthStore`

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {}, // 具体数据
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {} // 详细错误信息（可选）
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 分页响应
```json
{
  "success": true,
  "data": {
    "items": [], // 数据列表
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "message": "获取成功"
}
```

## 1. 安全资料管理 API

### 1.1 获取安全资料列表
```
GET /safety-data
```

**查询参数:**
```typescript
interface SafetyDataQuery {
  page?: number;           // 页码，默认1
  pageSize?: number;       // 每页数量，默认20
  search?: string;         // 搜索关键词
  safetyLevel?: 'low' | 'medium' | 'high' | 'critical';
  mineType?: 'coal' | 'metal' | 'nonmetal' | 'openpit';
  category?: 'gas_detection' | 'equipment_safety' | 'emergency_response' | 'safety_training' | 'accident_prevention' | 'environmental_protection';
  sortBy?: 'publishDate' | 'viewCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "sd_001",
        "title": "煤矿瓦斯检测技术规范",
        "description": "详细介绍煤矿瓦斯检测的技术要求和操作规程",
        "safetyLevel": "critical",
        "mineType": "coal",
        "category": "gas_detection",
        "publishDate": "2024-01-01T00:00:00Z",
        "viewCount": 1250,
        "downloadUrl": "https://files.mining-safety.com/documents/sd_001.pdf",
        "fileSize": 2048576,
        "fileType": "pdf",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 1.2 获取单个安全资料详情
```
GET /safety-data/{id}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "sd_001",
    "title": "煤矿瓦斯检测技术规范",
    "description": "详细介绍煤矿瓦斯检测的技术要求和操作规程",
    "safetyLevel": "critical",
    "mineType": "coal",
    "category": "gas_detection",
    "publishDate": "2024-01-01T00:00:00Z",
    "viewCount": 1250,
    "downloadUrl": "https://files.mining-safety.com/documents/sd_001.pdf",
    "fileSize": 2048576,
    "fileType": "pdf",
    "tags": ["瓦斯", "检测", "安全规范"],
    "relatedItems": ["sd_002", "sd_003"],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 1.3 创建安全资料
```
POST /safety-data
```

**请求体:**
```json
{
  "title": "新安全资料标题",
  "description": "资料描述",
  "safetyLevel": "medium",
  "mineType": "coal",
  "category": "safety_training",
  "publishDate": "2024-01-01T00:00:00Z",
  "tags": ["标签1", "标签2"],
  "file": "base64编码的文件内容或文件URL"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "sd_new_001",
    "title": "新安全资料标题",
    // ... 其他字段
  },
  "message": "创建成功"
}
```

### 1.4 更新安全资料
```
PUT /safety-data/{id}
```

**请求体:** 同创建接口，所有字段可选

### 1.5 删除安全资料
```
DELETE /safety-data/{id}
```

**响应示例:**
```json
{
  "success": true,
  "message": "删除成功"
}
```

### 1.6 批量操作
```
POST /safety-data/batch
```

**请求体:**
```json
{
  "action": "delete" | "update",
  "ids": ["sd_001", "sd_002"],
  "data": {} // 批量更新时的数据
}
```

## 2. 文件上传 API

### 2.1 上传文件
```
POST /upload
```

**请求格式:** multipart/form-data

**响应示例:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_001",
    "fileName": "document.pdf",
    "fileSize": 2048576,
    "fileType": "pdf",
    "url": "https://files.mining-safety.com/documents/file_001.pdf",
    "thumbnailUrl": "https://files.mining-safety.com/thumbnails/file_001.jpg"
  }
}
```

## 3. 统计数据 API

### 3.1 获取仪表板统计
```
GET /statistics/dashboard
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "totalItems": 1250,
    "safetyLevelCounts": {
      "low": 300,
      "medium": 450,
      "high": 350,
      "critical": 150
    },
    "mineTypeCounts": {
      "coal": 500,
      "metal": 300,
      "nonmetal": 250,
      "openpit": 200
    },
    "categoryCounts": {
      "gas_detection": 200,
      "equipment_safety": 300,
      "emergency_response": 150,
      "safety_training": 250,
      "accident_prevention": 200,
      "environmental_protection": 150
    },
    "recentActivity": {
      "newItemsThisWeek": 15,
      "totalDownloadsThisMonth": 2500,
      "mostViewedItems": ["sd_001", "sd_002", "sd_003"]
    }
  }
}
```

## 4. AI 问答 API

### 4.1 发送消息
```
POST /ai/chat
```

**请求体:**
```json
{
  "message": "用户问题",
  "sessionId": "session_001",
  "context": {
    "relatedDataId": "sd_001" // 可选，相关的安全资料ID
  }
}
```

**响应示例 (流式):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_001",
    "sessionId": "session_001",
    "response": "AI回答内容",
    "relatedItems": ["sd_001", "sd_002"], // 相关推荐资料
    "confidence": 0.95
  }
}
```

### 4.2 获取会话历史
```
GET /ai/sessions/{sessionId}/messages
```

## 5. 用户建议反馈 API

### 5.1 提交用户建议
```
POST /feedback
```

**前端调用位置**: `src/pages/Feedback/FeedbackPage.tsx` - `handleSubmitFeedback`
**状态管理**: `src/store/feedbackStore.ts` - `submitFeedback`

**请求体:**
```json
{
  "title": "建议标题",
  "description": "详细描述",
  "type": "feature_request",
  "priority": "medium",
  "userName": "用户姓名",
  "userEmail": "user@example.com",
  "userContact": "联系方式",
  "attachments": ["file1.jpg", "file2.pdf"]
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "fb_001",
    "title": "建议标题",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "建议提交成功"
}
```

### 5.2 获取建议列表
```
GET /feedback
```

**前端调用位置**: `src/components/Feedback/FeedbackList.tsx`
**状态管理**: `src/store/feedbackStore.ts` - `fetchFeedbacks`

**查询参数:**
```typescript
interface FeedbackQuery {
  page?: number;
  pageSize?: number;
  type?: 'bug_report' | 'feature_request' | 'content_suggestion' | 'ui_improvement' | 'performance' | 'other';
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'implemented' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
  sortBy?: 'createdAt' | 'upvotes' | 'priority';
  sortOrder?: 'asc' | 'desc';
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "fb_001",
        "title": "建议增加数据导出功能",
        "description": "希望能够将搜索结果导出为Excel或PDF格式",
        "type": "feature_request",
        "priority": "medium",
        "status": "approved",
        "userName": "张工程师",
        "userEmail": "zhang@example.com",
        "upvotes": 15,
        "downvotes": 2,
        "adminReply": "感谢您的建议！已列入开发计划。",
        "adminRepliedAt": "2024-01-16T14:20:00Z",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-16T14:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 5.3 获取单个建议详情
```
GET /feedback/{id}
```

**前端调用位置**: `src/components/Feedback/FeedbackList.tsx` - `handleViewDetail`

### 5.4 建议投票
```
POST /feedback/{id}/vote
```

**前端调用位置**: `src/components/Feedback/FeedbackList.tsx` - `handleVote`

**请求体:**
```json
{
  "type": "up" // 或 "down"
}
```

### 5.5 管理员回复建议 (管理员权限)
```
POST /feedback/{id}/reply
```

**请求体:**
```json
{
  "reply": "回复内容",
  "status": "approved" // 更新状态
}
```

### 5.6 获取建议统计
```
GET /feedback/statistics
```

**前端调用位置**: `src/pages/Feedback/FeedbackPage.tsx`

**响应示例:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byType": {
      "bug_report": 25,
      "feature_request": 60,
      "content_suggestion": 30,
      "ui_improvement": 20,
      "performance": 10,
      "other": 5
    },
    "byStatus": {
      "pending": 40,
      "reviewing": 20,
      "approved": 50,
      "rejected": 15,
      "implemented": 20,
      "closed": 5
    },
    "byPriority": {
      "low": 50,
      "medium": 70,
      "high": 25,
      "urgent": 5
    },
    "recentCount": 12,
    "responseRate": 85.5,
    "averageResponseTime": 24.5
  }
}
```

## 6. 用户认证 API

### 6.1 用户登录
```
POST /auth/login
```

**前端调用位置**: `src/pages/Login/index.tsx`
**状态管理**: `src/store/authStore.ts` - `login`

**请求体:**
```json
{
  "username": "用户名",
  "password": "密码"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "user_001",
      "username": "admin",
      "role": "admin",
      "permissions": ["read", "write", "delete"]
    },
    "expiresIn": 3600
  }
}
```

### 6.2 刷新Token
```
POST /auth/refresh
```

**前端调用位置**: `src/services/api.ts` - 响应拦截器自动调用

### 6.3 用户登出
```
POST /auth/logout
```

**前端调用位置**: `src/store/authStore.ts` - `logout`

## 6. 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| INVALID_REQUEST | 400 | 请求参数无效 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| VALIDATION_ERROR | 422 | 数据验证失败 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |

## 7. 请求头要求

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
Accept: application/json
X-Client-Version: 1.0.0
```

## 8. 前端调用示例

### 8.1 安全数据管理调用示例

```typescript
// 文件位置: src/store/safetyDataStore.ts
import { apiService } from '../services/api';

// 获取数据列表
const fetchData = async () => {
  try {
    const response = await apiService.getSafetyData({
      page: 1,
      pageSize: 20,
      search: '瓦斯检测'
    });
    setData(response.items);
  } catch (error) {
    setError('获取数据失败');
  }
};

// 添加新数据
const addData = async (newData: Omit<SafetyData, 'id'>) => {
  try {
    const created = await apiService.createSafetyData(newData);
    setData(prev => [created, ...prev]);
  } catch (error) {
    throw new Error('添加数据失败');
  }
};
```

### 8.2 用户建议调用示例

```typescript
// 文件位置: src/pages/Feedback/FeedbackPage.tsx
import { apiService } from '../../services/api';

// 提交建议
const handleSubmitFeedback = async (data: FeedbackFormData) => {
  try {
    setLoading(true);
    const result = await apiService.submitFeedback(data);
    message.success('建议提交成功！');
    // 刷新列表
    await fetchFeedbacks();
  } catch (error) {
    message.error('提交失败，请重试');
  } finally {
    setLoading(false);
  }
};

// 获取建议列表
const fetchFeedbacks = async () => {
  try {
    const response = await apiService.getFeedbacks({
      page: currentPage,
      pageSize: 10
    });
    setFeedbacks(response.items);
    setTotal(response.pagination.total);
  } catch (error) {
    message.error('获取建议列表失败');
  }
};
```

### 8.3 文件上传调用示例

```typescript
// 文件位置: src/components/DataManagement/DataForm.tsx
import { apiService } from '../../services/api';

// 文件上传处理
const uploadProps = {
  customRequest: async ({ file, onSuccess, onError }) => {
    try {
      const result = await apiService.uploadFile(file as File);
      onSuccess(result);
    } catch (error) {
      onError(error);
    }
  }
};
```

## 9. 错误处理

### 9.1 前端错误处理位置

**统一错误处理**: `src/services/api.ts` - 响应拦截器
```typescript
// 响应拦截器处理
this.client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，跳转登录
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**组件级错误处理**: 各个页面组件中的 try-catch 块
**状态管理错误**: Store 中的 error 状态

### 9.2 错误代码映射

| 错误代码 | HTTP状态码 | 前端处理位置 | 处理方式 |
|---------|-----------|-------------|----------|
| INVALID_REQUEST | 400 | 表单验证 | 显示字段错误信息 |
| UNAUTHORIZED | 401 | API拦截器 | 自动跳转登录页 |
| FORBIDDEN | 403 | 页面组件 | 显示权限不足提示 |
| NOT_FOUND | 404 | 页面组件 | 显示资源不存在 |
| VALIDATION_ERROR | 422 | 表单组件 | 显示验证错误 |
| INTERNAL_ERROR | 500 | 全局处理 | 显示系统错误提示 |

## 10. 状态管理调用关系

### 10.1 数据流向图

```
用户操作 → 页面组件 → Store Action → API Service → 后端API
                ↓
            UI更新 ← Store State ← API Response ← 后端响应
```

### 10.2 主要Store文件

1. **安全数据管理**: `src/store/safetyDataStore.ts`
   - 调用页面: `src/pages/Dashboard/Dashboard.tsx`, `src/pages/DataManagement/DataManagementPage.tsx`
   - 主要方法: `fetchData`, `addData`, `updateData`, `deleteData`

2. **用户建议管理**: `src/store/feedbackStore.ts` (待创建)
   - 调用页面: `src/pages/Feedback/FeedbackPage.tsx`
   - 主要方法: `submitFeedback`, `fetchFeedbacks`, `voteFeedback`

3. **用户认证**: `src/store/authStore.ts`
   - 调用页面: `src/pages/Login/index.tsx`, `src/App.tsx`
   - 主要方法: `login`, `logout`, `checkAuth`

## 11. 限流规则

- 普通用户：100 请求/分钟
- 管理员用户：500 请求/分钟
- 文件上传：10 请求/分钟，单文件最大 50MB
- 建议提交：5 请求/分钟（防止垃圾建议）
