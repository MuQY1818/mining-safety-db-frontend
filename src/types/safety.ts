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

// 安全数据接口 - 完全匹配后端GetSafetyDataDetailResponse
export interface SafetyData {
  id: number;              // 后端返回number类型ID
  title: string;
  description: string;
  safetyLevel: SafetyLevel;
  mineType: MineType;
  category: SafetyCategory;
  viewCount: number;
  province: string;         // 省份
  city: string;             // 城市
  district: string;         // 区县
  address: string;          // 详细地址
  latitude: string;         // 纬度 - 后端为string类型
  longitude: string;        // 经度 - 后端为string类型
  downloadUrl: string;      // 下载链接
  fileSize: string;         // 文件大小 - 后端为string类型
  fileType: string;         // 文件类型
  relatedItems: number[];   // 相关项目ID - 后端为number[]类型
  createdBy: string;        // 创建者姓名
  tags: string[];           // 标签
  createdAt: string;        // 创建时间
  downloadCount?: number;   // 文件下载次数 (仅在详情接口中有)
  
  // 为了向后兼容前端代码，添加这些字段
  publishDate?: string;     // 兼容字段，映射到createdAt
  updatedAt?: string;       // 更新时间
  location?: {              // 兼容字段，映射到province/city等
    province: string;
    city: string;
    district?: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
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

// API响应接口 - 匹配后端AjaxResult格式
export interface ApiResponse<T = any> {
  code: number;    // 0表示成功
  msg: string;
  data: T;
}

// 分页响应接口 - 匹配后端BaseListResponse格式  
export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  list: T[];
}
