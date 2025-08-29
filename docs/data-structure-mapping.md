# 前后端数据结构映射文档

## 概述

本文档描述了前端TypeScript类型与后端Java实体类之间的数据结构映射关系，确保前后端数据格式的一致性。

## 用户数据映射

### 后端Java实体 (User.java)
```java
@Entity
@TableName("user")
public class User extends BaseEntity {
    private String username;      // 账号
    private String password;      // 密码哈希
    private String email;         // 邮箱
    private String realName;      // 真实姓名  
    private String phone;         // 手机号
    private String avatar;        // 头像URL
    private Boolean isBanned;     // 是否被封禁
    private UserTypeEnum role;    // 用户角色
    
    // 继承自BaseEntity
    private Long id;              // 主键ID
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt; 
    private Boolean deleted;
}
```

### 前端TypeScript类型 (types/database.ts)
```typescript
export interface User {
  id: number;           // 对应Java Long id
  userName: string;     // 对应Java String username
  realName: string;     // 对应Java String realName
  phone: string;        // 对应Java String phone
  role: 'admin' | 'user'; // 对应Java UserTypeEnum
  email: string;        // 对应Java String email
  avatar: string;       // 对应Java String avatar
}
```

### 字段映射关系
| 前端字段 | 后端字段 | 类型转换 | 说明 |
|----------|----------|----------|------|
| `id` | `id` | Long → number | 用户唯一标识 |
| `userName` | `username` | String → string | 用户名 |
| `realName` | `realName` | String → string | 真实姓名 |
| `phone` | `phone` | String → string | 手机号码 |
| `email` | `email` | String → string | 邮箱地址 |
| `avatar` | `avatar` | String → string | 头像URL |
| `role` | `role` | UserTypeEnum → 'admin'\|'user' | 用户角色 |

### 注意事项
1. **ID类型**: 后端使用`Long`类型，前端转换为`number`
2. **用户名字段**: 前端使用`userName`，后端使用`username`
3. **角色枚举**: 后端`UserTypeEnum.ADMIN`对应前端`'admin'`

## JWT Token数据映射

### 后端JWT Payload (JwtUtils.java)
```java
public static String generateToken(Long userId, UserTypeEnum role) {
    return Jwts.builder()
        .claim(USER_ID_KEY, userId)        // "user_id"
        .claim(USER_ROLE_KEY, role.getValue()) // "user_role"
        .subject("Authentication")
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + EXPIRE_TIME))
        .signWith(Keys.hmacShaKeyFor(secret.getBytes()))
        .compact();
}
```

### 前端JWT解析 (authStore.ts)
```typescript
const getUserIdFromToken = (token: string): number | null => {
  const payload = parseJwt(token);
  // 后端JWT使用 "user_id" 字段名
  return payload?.user_id ? parseInt(payload.user_id) : null;
};
```

### JWT字段映射
| JWT字段 | 后端常量 | 前端访问 | 类型 |
|---------|----------|----------|------|
| `user_id` | `USER_ID_KEY` | `payload.user_id` | Long → number |
| `user_role` | `USER_ROLE_KEY` | `payload.user_role` | String |

**重要**: 前端必须使用`user_id`字段名获取用户ID，不能使用`userId`、`id`或`sub`。

## 安全资料数据映射

### 后端实体 (SafetyData.java)
```java
@Entity
@TableName("safety_data")
public class SafetyData extends BaseEntity {
    private String title;
    private String description;
    private SafetyLevelEnum safetyLevel;
    private MineTypeEnum mineType;
    private CategoryEnum category;
    private Long createdBy;
    private Integer viewCount;
    private List<String> fileUrls;
}
```

### 前端类型 (types/database.ts)
```typescript
export interface SafetyData {
  id: number;
  title: string;
  description: string;
  safetyLevel: SafetyLevel;
  mineType: MineType;  
  category: SafetyCategory;
  publishDate: string;
  viewCount: number;
  author: string;
  fileUrls?: string[];
}
```

### 枚举映射

#### 安全等级 (SafetyLevel)
| 前端值 | 后端枚举 | 显示文本 |
|--------|----------|----------|
| `'low'` | `SafetyLevelEnum.LOW_RISK` | 低风险 |
| `'medium'` | `SafetyLevelEnum.MEDIUM_RISK` | 中等风险 |
| `'high'` | `SafetyLevelEnum.HIGH_RISK` | 高风险 |

#### 矿山类型 (MineType)
| 前端值 | 后端枚举 | 显示文本 |
|--------|----------|----------|
| `'coal'` | `MineTypeEnum.COAL_MINE` | 煤矿 |
| `'metal'` | `MineTypeEnum.METAL_MINE` | 金属矿 |
| `'nonmetal'` | `MineTypeEnum.NON_METAL_MINE` | 非金属矿 |

#### 安全分类 (SafetyCategory)
| 前端值 | 后端枚举 | 显示文本 |
|--------|----------|----------|
| `'regulation'` | `CategoryEnum.SAFETY_REGULATION` | 安全法规 |
| `'case'` | `CategoryEnum.ACCIDENT_CASE` | 事故案例 |
| `'training'` | `CategoryEnum.TRAINING_MATERIAL` | 培训材料 |

## 反馈数据映射

### 后端实体 (Feedback.java)
```java
@Entity
@TableName("feedback")
public class Feedback extends BaseEntity {
    private Long userId;
    private FeedbackTypeEnum type;
    private String title;
    private String content;
    private FeedbackStatusEnum status;
}
```

### 前端类型 (types/feedback.ts)
```typescript
export interface Feedback {
  id: number;
  userId: number;
  type: FeedbackType;
  title: string;
  content: string;
  status: FeedbackStatus;
  createTime: string;
  updateTime: string;
}
```

### 反馈类型枚举
| 前端值 | 后端枚举 | 显示文本 |
|--------|----------|----------|
| `'bug'` | `FeedbackTypeEnum.BUG_REPORT` | Bug报告 |
| `'feature'` | `FeedbackTypeEnum.FEATURE_REQUEST` | 功能建议 |
| `'improvement'` | `FeedbackTypeEnum.IMPROVEMENT` | 改进建议 |

### 反馈状态枚举  
| 前端值 | 后端枚举 | 显示文本 |
|--------|----------|----------|
| `'pending'` | `FeedbackStatusEnum.PENDING` | 待处理 |
| `'processing'` | `FeedbackStatusEnum.IN_PROGRESS` | 处理中 |
| `'resolved'` | `FeedbackStatusEnum.RESOLVED` | 已解决 |
| `'closed'` | `FeedbackStatusEnum.CLOSED` | 已关闭 |

## 聊天数据映射

### 后端实体 (ChatSession.java)
```java
@Entity
@TableName("chat_session") 
public class ChatSession extends BaseEntity {
    private Long userId;
    private String title;
    private String lastMessage;
    private LocalDateTime lastActiveTime;
}
```

### 前端类型 (types/ai.ts)
```typescript
export interface ChatSession {
  id: string;           // 对应后端Long id
  userId: number;       // 对应后端Long userId  
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
```

## API响应格式映射

### 后端AjaxResult格式
```java
public class AjaxResult<T> {
    private int code;      // 0=成功, 非0=失败
    private String message;
    private T data;
}
```

### 前端ApiResponse类型
```typescript
interface ApiResponse<T> {
  code: number;    // 对应后端int code
  message: string; // 对应后端String message  
  data?: T;        // 对应后端T data
}
```

## 日期时间映射

### 后端格式
- 使用`LocalDateTime`类型
- 数据库存储格式: `YYYY-MM-DD HH:mm:ss`
- API返回格式: ISO 8601字符串 `2025-08-28T10:30:00Z`

### 前端处理
```typescript
// 日期字符串转换为Date对象
const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
};

// 格式化显示
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN');
};
```

## 数据验证规则

### 用户名验证
- 后端: `@NotBlank` + 长度限制
- 前端: 必填 + 3-20字符

### 密码验证  
- 后端: `@NotBlank` + BCrypt哈希
- 前端: 必填 + 6-20字符

### 邮箱验证
- 后端: `@Email` 注解
- 前端: 邮箱格式正则验证

### 文件上传
- 后端: 文件大小限制 + MIME类型检查
- 前端: 文件大小限制 + 扩展名检查

## 常见问题与解决方案

### 1. ID类型不匹配
**问题**: 后端Long类型前端无法直接使用
**解决**: 前端使用`parseInt()`转换为number类型

### 2. 枚举值映射错误
**问题**: 前端枚举值与后端不一致
**解决**: 建立明确的枚举映射表，严格按照映射转换

### 3. 日期格式问题
**问题**: 前后端日期格式不统一
**解决**: 统一使用ISO 8601格式，前端负责格式化显示

### 4. JWT字段名错误
**问题**: 前端使用错误的JWT字段名
**解决**: 严格使用`user_id`字段名，参考后端`USER_ID_KEY`常量

## 更新记录

- **2025-08-28**: 修复JWT token用户ID字段映射，统一使用`user_id`
- **2025-08-28**: 完善枚举类型映射关系，添加显示文本对照