# 矿区安全数据库后端API文档

## 概览

本文档详细描述了矿区安全数据库后端API的接口规范、数据结构和集成方式。

### 基础信息
- **API版本**: v1
- **基础URL**: `https://mining-backend.ziven.site/api`
- **认证方式**: JWT Token (Bearer Authentication)
- **响应格式**: JSON (AjaxResult<T> 包装)

### 全局响应格式
```typescript
interface AjaxResult<T> {
  code: number;    // 0=成功, 非0=失败  
  message: string; // 响应消息
  data?: T;        // 响应数据
}
```

## 认证系统

### JWT Token规范

后端使用标准JWT token，包含以下payload字段：
```json
{
  "user_id": 31046732128325,        // 用户ID (Long类型)
  "user_role": "admin",             // 用户角色 ("admin" | "user")
  "sub": "Authentication",          // 主题
  "iat": 1640995200,               // 签发时间
  "exp": 1641600000,               // 过期时间
  "jti": "unique-token-id"         // Token ID
}
```

**重要**: 前端需从JWT payload的`user_id`字段获取用户ID，不是`userId`或`id`。

### 1. 用户登录
```http
POST /user/login
Content-Type: application/json

{
  "username": "test1",
  "password": "123456"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "userType": "ADMIN",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误响应**:
```json
{
  "code": 1,
  "message": "用户名或密码错误"
}
```

### 2. 用户注册
```http
POST /user/signup
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "realName": "真实姓名"
}
```

### 3. 获取用户信息
```http
GET /user/profile
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "userName": "test1",
    "email": "test1@mining.com",
    "realName": "XiaoMing", 
    "phone": "",
    "avatar": "",
    "role": "ADMIN"
  }
}
```

### 4. 编辑用户信息
```http
POST /user/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "realName": "新的真实姓名",
  "email": "new@email.com",
  "phone": "13800138000"
}
```

## 安全资料管理

### 1. 获取安全资料列表
```http
GET /safety-data/list?page=1&pageSize=10&search=关键词
Authorization: Bearer {token}
```

**查询参数**:
- `page`: 页码 (从1开始)
- `pageSize`: 每页条数 (默认10)
- `search`: 搜索关键词 (可选)
- `safetyLevel`: 安全等级筛选 (可选)
- `mineType`: 矿类型筛选 (可选)
- `category`: 分类筛选 (可选)

**响应**:
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 2. 获取安全资料详情
```http
GET /safety-data/{id}
Authorization: Bearer {token}
```

### 3. 上传安全资料
```http
POST /safety-data
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "资料标题",
  "description": "资料描述",
  "safetyLevel": "LOW_RISK",
  "mineType": "COAL_MINE",
  "category": "SAFETY_REGULATION"
}
```

### 4. 更新安全资料
```http
PUT /safety-data/{id}
Authorization: Bearer {token}
```

## 文件管理

### 1. 文件上传
```http
POST /file/upload  
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [文件二进制数据]
```

**响应**:
```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "url": "http://minio-server:9000/bucket-name/20250828_143022_a1b2c3d4_document.pdf"
  }
}
```

### 2. 文件下载计数
```http
GET /file/download?objectURL={fileUrl}
Authorization: Bearer {token}
```

**说明**: 此接口用于统计文件下载次数，不返回文件内容。实际文件访问通过MinIO的直接URL。

## 反馈系统

### 1. 提交反馈
```http
POST /feedback
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "BUG_REPORT",
  "title": "反馈标题",
  "content": "反馈内容详情"
}
```

### 2. 获取反馈列表
```http
GET /feedback/list?page=1&pageSize=10
Authorization: Bearer {token}
```

### 3. 获取反馈详情
```http
GET /feedback/{id}
Authorization: Bearer {token}
```

## 聊天系统

### 1. 创建聊天会话
```http
POST /chat/session
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "会话标题"
}
```

### 2. 获取聊天会话列表
```http
GET /chat/sessions?page=1&pageSize=20
Authorization: Bearer {token}
```

### 3. 发送消息
```http
POST /chat/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": 123,
  "content": "用户消息内容",
  "role": "USER"
}
```

### 4. 获取会话消息
```http
GET /chat/messages?sessionId=123&page=1&pageSize=50
Authorization: Bearer {token}
```

## 数据模型

### User (用户)
```typescript
interface User {
  id: number;           // 用户ID (Long类型，从JWT token获取)
  userName: string;     // 用户名
  realName: string;     // 真实姓名
  email: string;        // 邮箱
  phone: string;        // 手机号
  avatar: string;       // 头像URL
  role: 'ADMIN' | 'USER';  // 用户角色
}
```

### SafetyData (安全资料)
```typescript
interface SafetyData {
  id: number;
  title: string;
  description: string;
  safetyLevel: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  mineType: 'COAL_MINE' | 'METAL_MINE' | 'NON_METAL_MINE';
  category: 'SAFETY_REGULATION' | 'ACCIDENT_CASE' | 'TRAINING_MATERIAL';
  createdAt: string;    // ISO 8601格式
  updatedAt: string;
  createdBy: number;    // 创建者用户ID
  viewCount: number;    // 浏览次数
  fileUrls: string[];   // 关联文件URL列表
}
```

### Feedback (反馈)
```typescript
interface Feedback {
  id: number;
  userId: number;       // 反馈用户ID
  type: 'BUG_REPORT' | 'FEATURE_REQUEST' | 'IMPROVEMENT';
  title: string;
  content: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}
```

## 错误代码

| Code | 含义 | 处理建议 |
|------|------|----------|
| 0 | 成功 | 正常处理 |
| 1 | 业务错误 | 显示错误消息给用户 |
| 401 | 未认证 | 跳转到登录页面 |
| 403 | 权限不足 | 显示权限错误提示 |
| 404 | 资源不存在 | 显示404页面 |
| 500 | 服务器错误 | 显示系统错误提示 |

## 前端集成注意事项

### 1. JWT Token处理
```typescript
// 正确的JWT解析方式
const getUserIdFromToken = (token: string): number | null => {
  const payload = parseJwt(token);
  // 使用 "user_id" 字段，不是 "userId" 或 "id"
  return payload?.user_id ? parseInt(payload.user_id) : null;
};
```

### 2. API请求拦截器
```typescript
// 请求拦截器：自动添加Authorization头
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理401错误
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 清除token并跳转登录
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. 用户数据隔离
不同用户的数据完全隔离：
- JWT token中的`user_id`用于API权限控制
- 前端localStorage使用用户特定的key: `chat-store-user-{userId}`
- 切换用户时清理上一用户的本地数据

## 测试账号

**开发测试账号**: 
- 用户名: `test1`  
- 密码: `123456`
- 角色: 管理员 (ADMIN)

## API变更记录

- **2025-08-28**: 修复前端JWT解析字段名问题，确保使用`user_id`字段
- **2025-08-28**: 优化登录流程，登录后自动调用`/user/profile`获取用户详细信息