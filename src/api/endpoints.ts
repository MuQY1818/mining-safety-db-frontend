// API接口端点定义

// 基础API配置
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081/api';

// API端点常量
export const API_ENDPOINTS = {
  // 用户相关接口 - 对应后端 UserController
  USER: {
    LOGIN: '/user/login',              // POST - 用户登录
    SIGNUP: '/user/signup',            // POST - 用户注册
    PROFILE: '/user/profile'           // GET/POST - 获取/编辑个人信息
  },

  // 安全资料相关接口 - 对应后端 SafetyDataController
  SAFETY_DATA: {
    CREATE: '/safety-data',            // POST - 上传安全资料（管理员）
    LIST: '/safety-data/list',         // GET - 获取安全资料列表
    DETAIL: '/safety-data',            // GET - 获取安全资料详情（需要safetyDataId参数）
    UPDATE: '/safety-data',            // PUT - 修改安全资料（管理员）
    DELETE: '/safety-data'             // DELETE - 删除安全资料（管理员，需要safetyDataId参数）
  },

  // 反馈相关接口 - 对应后端 FeedbackController
  FEEDBACK: {
    SUBMIT: '/feedback',               // POST - 提交反馈
    LIST: '/feedback/list',            // GET - 获取反馈列表（管理员）
    DETAIL: '/feedback'                // GET - 获取反馈详情（需要feedbackId参数）
  },

  // 文件相关接口 - 对应后端 FileController
  FILE: {
    UPLOAD: '/file/upload',            // POST - 上传文件
    DOWNLOAD: '/file/download'         // GET - 下载文件（需要objectURL参数）
  },

  // AI聊天相关接口 - 对应后端 ChatController
  CHAT: {
    CREATE_SESSION: '/api/chat',       // POST - 创建聊天会话
    GET_SESSIONS: '/api/chat',         // GET - 获取会话列表
    UPDATE_SESSION: '/api/chat',       // PUT - 更新会话信息
    DELETE_SESSION: '/api/chat',       // DELETE - 删除会话
    SAVE_MESSAGE: '/api/chat/messages', // POST - 保存单个消息
    GET_MESSAGES: '/api/chat/messages' // GET - 获取会话消息历史
  }
} as const;

// HTTP方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API请求配置类型
export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  params?: Record<string, any>;      // URL参数
  data?: Record<string, any>;        // 请求体数据
  headers?: Record<string, string>;  // 请求头
  timeout?: number;                  // 超时时间
}

// 分页请求参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 基础列表响应类型
export interface BaseListResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 用户相关请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  password: string;
  realName: string;
}

export interface EditProfileRequest {
  realName?: string;
  // 其他个人信息字段
}

// 安全资料相关请求类型
export interface GetSafetyDataListRequest extends PaginationParams {
  title?: string;
  category?: string;
  safetyLevel?: string;
  miningType?: string;
}

export interface UploadSafetyDataRequest {
  title: string;
  description?: string;
  category: string;
  safetyLevel: string;
  miningType: string;
  fileUrl?: string;
  thumbnailUrl?: string;
}

export interface UpdateSafetyDataRequest {
  safetyDataId: number;
  title: string;
  description?: string;
  category: string;
  safetyLevel: string;
  miningType: string;
  fileUrl?: string;
  thumbnailUrl?: string;
}

// 反馈相关请求类型
export interface SubmitFeedbackRequest {
  type: 'bug' | 'feature' | 'improvement' | 'other';
  content: string;
  contact?: string;
}

export interface GetFeedbackListRequest extends PaginationParams {
  type?: 'bug' | 'feature' | 'improvement' | 'other';
  status?: 'pending' | 'resolved' | 'closed';
}

// 文件上传配置
export interface UploadConfig {
  maxSize: number;                   // 最大文件大小（字节）
  allowedTypes: string[];            // 允许的文件类型
  multiple: boolean;                 // 是否支持多文件
}

// 默认上传配置
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxSize: 50 * 1024 * 1024,         // 50MB（与后端配置一致）
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/avi',
    'audio/mp3',
    'audio/wav',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],
  multiple: false
};

// API错误码定义（与后端ExceptionEnum和AjaxResult响应格式匹配）
export const API_ERROR_CODES = {
  // HTTP状态码
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,

  // 业务错误码（与后端ExceptionEnum匹配）
  INVALID_PARAMETER: 200000,         // 参数错误
  RESOURCE_NOT_FOUND: 200001,        // 资源不存在
  NOT_LOGIN: 200002,                 // 当前未登录或登录过期
  WRONG_USERNAME_OR_PASSWORD: 200003, // 用户名或密码错误
  PERMISSION_NOT_ALLOWED: 200004,    // 权限不足
  FILE_CAN_NOT_BE_EMPTY: 200005,     // 文件不能为空
  FILE_UPLOAD_ERROR: 200006,         // 文件上传失败
  USERNAME_ALREADY_EXISTS: 200007,   // 用户名已存在
  FEEDBACK_ALREADY_HANDLED: 200008,  // 反馈已处理过
  NOT_FOUND_ERROR: 200404,           // 404错误
  SERVER_ERROR: 200500               // 系统错误
} as const;

// API错误消息映射（与后端ExceptionEnum消息匹配）
export const API_ERROR_MESSAGES: Record<number, string> = {
  [API_ERROR_CODES.SUCCESS]: '请求成功',
  [API_ERROR_CODES.BAD_REQUEST]: '请求参数错误',
  [API_ERROR_CODES.UNAUTHORIZED]: '未授权访问',
  [API_ERROR_CODES.FORBIDDEN]: '访问被禁止',
  [API_ERROR_CODES.NOT_FOUND]: '资源不存在',
  [API_ERROR_CODES.INTERNAL_ERROR]: '服务器内部错误',
  [API_ERROR_CODES.INVALID_PARAMETER]: '参数错误',
  [API_ERROR_CODES.RESOURCE_NOT_FOUND]: '资源不存在',
  [API_ERROR_CODES.NOT_LOGIN]: '当前未登录或登录过期, 请重新登录',
  [API_ERROR_CODES.WRONG_USERNAME_OR_PASSWORD]: '用户名或密码错误',
  [API_ERROR_CODES.PERMISSION_NOT_ALLOWED]: '权限不足',
  [API_ERROR_CODES.FILE_CAN_NOT_BE_EMPTY]: '文件不能为空',
  [API_ERROR_CODES.FILE_UPLOAD_ERROR]: '文件上传失败',
  [API_ERROR_CODES.USERNAME_ALREADY_EXISTS]: '用户名已存在',
  [API_ERROR_CODES.FEEDBACK_ALREADY_HANDLED]: '该反馈已经被处理过了',
  [API_ERROR_CODES.NOT_FOUND_ERROR]: 'Not Found',
  [API_ERROR_CODES.SERVER_ERROR]: '系统错误, 请稍后重试'
};

// 请求超时配置
export const REQUEST_TIMEOUT = {
  DEFAULT: 10000,                    // 默认10秒
  UPLOAD: 60000,                     // 上传60秒
  DOWNLOAD: 30000                    // 下载30秒
};

// 分页默认配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// 安全类别枚举（与后端CategoryEnum对应）
export const SAFETY_CATEGORIES = {
  GAS_DETECTION: 'gas_detection',                // 气体检测
  EQUIPMENT_SAFETY: 'equipment_safety',          // 设备安全
  EMERGENCY_RESPONSE: 'emergency_response',      // 应急响应
  SAFETY_TRAINING: 'safety_training',            // 安全培训
  ACCIDENT_PREVENTION: 'accident_prevention',    // 事故预防
  ENVIRONMENTAL_PROTECTION: 'environmental_protection' // 环境保护
} as const;

// 安全等级枚举（与后端SafetyLevelEnum对应）
export const SAFETY_LEVELS = {
  LOW: 'low',                        // 低风险
  MEDIUM: 'medium',                  // 中等风险
  HIGH: 'high',                      // 高风险
  CRITICAL: 'critical'               // 危急风险
} as const;

// 矿区类型枚举（与后端MineTypeEnum对应）
export const MINING_TYPES = {
  COAL: 'coal',                      // 煤矿
  METAL: 'metal',                    // 金属矿
  NONMETAL: 'nonmetal',             // 非金属矿
  OPENPIT: 'openpit'                // 露天矿
} as const;

// 反馈类型枚举（与后端FeedbackTypeEnum对应）
export const FEEDBACK_TYPES = {
  BUG: 'bug',                       // Bug反馈
  FEATURE: 'feature',               // 功能建议
  IMPROVEMENT: 'improvement',       // 改进建议
  OTHER: 'other'                    // 其他
} as const;

// 反馈状态枚举（与后端FeedbackStatusEnum对应）
export const FEEDBACK_STATUS = {
  PENDING: 'pending',               // 待处理
  RESOLVED: 'resolved',             // 已解决
  CLOSED: 'closed'                  // 已关闭
} as const;

// API辅助函数
export const createApiUrl = (endpoint: string, params?: Record<string, any>): string => {
  const url = `${API_BASE_URL}${endpoint}`;
  if (!params) return url;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
};
