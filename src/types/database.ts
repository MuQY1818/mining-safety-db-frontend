// 矿区安全数据库类型定义

// 安全等级枚举
export enum SafetyLevel {
  LOW = 'LOW',           // 🟢 低风险 - 一般性安全提示
  MEDIUM = 'MEDIUM',     // 🟡 中等风险 - 需要注意的安全事项
  HIGH = 'HIGH',         // 🟠 高风险 - 重要安全警告
  CRITICAL = 'CRITICAL'  // 🔴 极高风险 - 紧急安全措施
}

// 访问权限枚举
export enum AccessLevel {
  PUBLIC = 'PUBLIC',         // 公开访问
  INTERNAL = 'INTERNAL',     // 内部访问
  RESTRICTED = 'RESTRICTED'  // 受限访问
}

// 文件类型枚举
export enum FileType {
  PDF = 'PDF',
  DOC = 'DOC',
  DOCX = 'DOCX',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  OTHER = 'OTHER'
}

// 矿区类型枚举
export enum MiningType {
  COAL = 'COAL',           // 煤矿
  METAL = 'METAL',         // 金属矿
  NON_METAL = 'NON_METAL', // 非金属矿
  OPEN_PIT = 'OPEN_PIT'    // 露天矿
}

// 语言类型枚举
export enum LanguageType {
  CHINESE = 'CHINESE',     // 中文
  ENGLISH = 'ENGLISH',     // 英文
  BILINGUAL = 'BILINGUAL', // 双语
  MULTILINGUAL = 'MULTILINGUAL' // 多语言
}

// 安全类别枚举
export enum SafetyCategory {
  GAS_SAFETY = 'GAS_SAFETY',           // 瓦斯安全
  MECHANICAL_SAFETY = 'MECHANICAL_SAFETY', // 机械安全
  FIRE_SAFETY = 'FIRE_SAFETY',         // 消防安全
  ELECTRICAL_SAFETY = 'ELECTRICAL_SAFETY', // 电气安全
  CHEMICAL_SAFETY = 'CHEMICAL_SAFETY',   // 化学安全
  STRUCTURAL_SAFETY = 'STRUCTURAL_SAFETY', // 结构安全
  PERSONAL_PROTECTION = 'PERSONAL_PROTECTION', // 个人防护
  EMERGENCY_RESPONSE = 'EMERGENCY_RESPONSE', // 应急响应
  ENVIRONMENTAL_SAFETY = 'ENVIRONMENTAL_SAFETY', // 环境安全
  TRAINING_EDUCATION = 'TRAINING_EDUCATION' // 培训教育
}

// 矿区语言安全资料数据模型
export interface MiningLanguageItem {
  id: number;                    // 雪花ID (long类型，前端用number处理)
  title: string;                 // 资料标题
  category: SafetyCategory;      // 安全类别
  downloadUrl: string;           // 资源下载地址
  description?: string;          // 详细描述
  safetyLevel: SafetyLevel;      // 安全等级
  miningType: MiningType;        // 矿区类型
  languageType: LanguageType;    // 语言类型
  standardCode?: string;         // 安全标准编码
  keywords: string[];            // 关键词标签
  createdAt: string;             // 创建时间 (ISO 8601格式)
  updatedAt: string;             // 更新时间 (ISO 8601格式)
  fileSize?: number;             // 文件大小 (字节)
  fileType?: FileType;           // 文件类型
  accessLevel: AccessLevel;      // 访问权限级别
  authorName?: string;           // 作者姓名
  version?: string;              // 版本号
  isActive: boolean;             // 是否启用
}

// 搜索参数类型
export interface SearchParams {
  keyword?: string;              // 关键词搜索
  category?: SafetyCategory;     // 安全类别筛选
  safetyLevel?: SafetyLevel;     // 安全等级筛选
  miningType?: MiningType;       // 矿区类型筛选
  languageType?: LanguageType;   // 语言类型筛选
  accessLevel?: AccessLevel;     // 访问权限筛选
  standardCode?: string;         // 标准编码搜索
  authorName?: string;           // 作者筛选
  page: number;                  // 页码 (从1开始)
  pageSize: number;              // 每页数量
  total?: number;                // 筛选后的总数量
  sortBy?: 'title' | 'createdAt' | 'category' | 'safetyLevel' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// API响应基础类型
export interface ApiResponse<T = any> {
  success: boolean;              // 请求是否成功
  message: string;               // 响应消息
  data?: T;                      // 响应数据
  code?: number;                 // 业务状态码
  timestamp: string;             // 响应时间戳
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];                     // 数据列表
  total: number;                 // 总数量
  page: number;                  // 当前页码
  pageSize: number;              // 每页数量
  totalPages: number;            // 总页数
  hasNext: boolean;              // 是否有下一页
  hasPrev: boolean;              // 是否有上一页
}

// 用户信息类型
export interface User {
  id?: string; // 后端profile接口未返回ID，使用userName作为唯一标识
  userName: string; // 匹配后端字段名
  realName?: string; // 后端返回的真实姓名
  phone?: string; // 后端返回的电话号码
  role: 'admin' | 'user'; // 匹配后端枚举值
  email?: string;
  avatar?: string;
}

// 登录请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应类型 - 匹配后端API格式
export interface LoginResponse {
  token: string;
  userType: 'admin' | 'user'; // 后端返回的用户类型
}

// 数据添加/编辑表单类型
export interface MiningLanguageItemForm {
  title: string;
  category: SafetyCategory;
  description?: string;
  safetyLevel: SafetyLevel;
  miningType: MiningType;
  languageType: LanguageType;
  standardCode?: string;
  keywords: string[];
  accessLevel: AccessLevel;
  authorName?: string;
  version?: string;
  file?: File;                   // 上传的文件
}

// 文件上传响应类型
export interface FileUploadResponse {
  fileUrl: string;               // 文件访问URL
  fileName: string;              // 文件名
  fileSize: number;              // 文件大小
  fileType: FileType;            // 文件类型
  uploadTime: string;            // 上传时间
}

// 统计数据类型
export interface DatabaseStats {
  totalItems: number;            // 总资料数
  categoryCounts: Record<SafetyCategory, number>; // 各类别数量
  safetyLevelCounts: Record<SafetyLevel, number>; // 各安全等级数量
  miningTypeCounts: Record<MiningType, number>;   // 各矿区类型数量
  recentUploads: number;         // 最近上传数量
  lastUpdateTime: string;        // 最后更新时间
}

// 批量操作类型
export interface BatchOperation {
  action: 'delete' | 'updateCategory' | 'updateSafetyLevel' | 'updateAccessLevel';
  itemIds: number[];             // 操作的数据ID列表
  newValue?: string;             // 新值（用于更新操作）
}

// 导出选项类型
export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  filters?: Partial<SearchParams>; // 导出筛选条件
  fields?: string[];             // 导出字段
}
