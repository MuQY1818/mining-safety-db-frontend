// 安全数据相关类型定义

// 安全等级
export type SafetyLevel = 'low' | 'medium' | 'high' | 'critical';

// 矿区类型
export type MineType = 'coal' | 'metal' | 'nonmetal' | 'openpit';

// 安全类别
export type SafetyCategory = 
  | 'gas_detection'
  | 'equipment_safety'
  | 'emergency_response'
  | 'safety_training'
  | 'accident_prevention'
  | 'environmental_protection';

// 地理位置信息
export interface LocationInfo {
  province: string;     // 省份
  city: string;         // 城市
  district?: string;    // 区县
  address?: string;     // 详细地址
  coordinates?: {       // 坐标信息
    latitude: number;   // 纬度
    longitude: number;  // 经度
  };
}

// 安全数据接口
export interface SafetyData {
  id: string;
  title: string;
  description: string;
  safetyLevel: SafetyLevel;
  mineType: MineType;
  category: SafetyCategory;
  publishDate: string;
  viewCount: number;
  location: LocationInfo;  // 地理位置信息
  downloadUrl?: string;
  fileSize?: number;
  fileType?: string;
  tags?: string[];
  relatedItems?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// 统计数据接口
export interface SafetyStats {
  totalItems: number;
  safetyLevelCounts: Record<SafetyLevel, number>;
  mineTypeCounts: Record<MineType, number>;
  categoryCounts: Record<SafetyCategory, number>;
  recentActivity?: {
    newItemsThisWeek: number;
    totalDownloadsThisMonth: number;
    mostViewedItems: string[];
  };
}

// 搜索和筛选参数
export interface SafetyDataFilters {
  searchTerm?: string;
  safetyLevel?: SafetyLevel;
  mineType?: MineType;
  category?: SafetyCategory;
  dateRange?: [string, string];
}

// 表单数据接口
export interface SafetyDataFormData {
  title: string;
  description: string;
  safetyLevel: SafetyLevel;
  mineType: MineType;
  category: SafetyCategory;
  publishDate: string;
  tags?: string[];
  file?: File;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 错误响应接口
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
