// API服务层 - 统一管理所有API调用
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { SafetyData, SafetyLevel, MineType, SafetyCategory } from '../types/safety';

// API响应基础接口 - 匹配后端AjaxResult格式
interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 分页响应接口 - 匹配后端格式
interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  list: T[];
}

// 错误响应接口 - 匹配后端AjaxResult格式
interface ApiError {
  code: number; // 非0表示错误
  msg: string;
  data?: any;
}

// 查询参数接口
interface SafetyDataQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  safetyLevel?: SafetyLevel;
  mineType?: MineType;
  category?: SafetyCategory;
  sortBy?: 'publishDate' | 'viewCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// 统计数据接口
interface DashboardStats {
  totalItems: number;
  safetyLevelCounts: Record<SafetyLevel, number>;
  mineTypeCounts: Record<MineType, number>;
  categoryCounts: Record<SafetyCategory, number>;
  recentActivity: {
    newItemsThisWeek: number;
    totalDownloadsThisMonth: number;
    mostViewedItems: string[];
  };
}

// 文件上传响应接口 - 匹配后端UploadFileResponse
interface UploadResponse {
  url: string;
}

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Version': '1.0.0'
      }
    });

    this.setupInterceptors();
  }

  // 设置请求和响应拦截器
  private setupInterceptors() {
    // 请求拦截器 - 添加认证token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 统一处理错误
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response;
        // 检查业务逻辑错误 - 兼容两种后端响应格式
        // 成功: code === 0 或 code === 200
        // 失败: code !== 0 && code !== 200
        if (data.code !== 0 && data.code !== 200) {
          const error = new Error(data.msg || '请求失败');
          return Promise.reject(error);
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // 避免在登录页面重复重定向
          if (window.location.pathname !== '/login') {
            console.log('检测到401错误，清除认证信息并重定向到登录页');
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // 安全资料相关API
  async getSafetyData(query?: SafetyDataQuery): Promise<PaginatedResponse<SafetyData>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<SafetyData>>>(
      '/safety-data/list',
      { params: query }
    );
    return response.data.data;
  }

  async getSafetyDataById(id: number): Promise<SafetyData> {
    const response = await this.client.get<ApiResponse<SafetyData>>(
      '/safety-data',
      { params: { safetyDataId: id } }
    );
    return response.data.data;
  }

  async createSafetyData(data: Omit<SafetyData, 'id'>): Promise<SafetyData> {
    const response = await this.client.post<ApiResponse<SafetyData>>('/safety-data', data);
    return response.data.data;
  }

  async updateSafetyData(data: SafetyData): Promise<void> {
    await this.client.put('/safety-data', data);
  }

  async deleteSafetyData(id: number): Promise<void> {
    await this.client.delete('/safety-data', {
      params: { safetyDataId: id }
    });
  }

  // 文件上传API
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<UploadResponse>>(
      '/file/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data.data;
  }

  // 反馈相关API - 直接匹配后端SubmitFeedbackRequest格式
  async submitFeedback(feedback: {
    type: 'bug' | 'feature' | 'improvement' | 'other';
    title: string;
    content: string;
    contactInfo?: string;
  }): Promise<void> {
    await this.client.post('/feedback', feedback);
  }

  async getFeedbackList(query?: {
    page: number;
    pageSize: number;
    status: 'all' | 'pending' | 'resolved' | 'closed';
    order: 'desc' | 'asc';
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<any>>>(
      '/feedback/list',
      { params: query }
    );
    return response.data.data;
  }

  // 用户认证API
  async login(username: string, password: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/user/login', {
      username,
      password
    });
    return response.data.data;
  }

  async signup(username: string, password: string, realName: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/user/signup', {
      username,
      password,
      realName
    });
    return response.data.data;
  }

  async getProfile(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/user/profile');
    return response.data.data;
  }

  async updateProfile(profile: any): Promise<void> {
    await this.client.post('/user/profile', profile);
  }

  async logout(): Promise<void> {
    // 登出API调用（可选）
    // await this.client.post('/user/logout');
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/user/login');
      return true;
    } catch {
      return false;
    }
  }
}

// 创建API服务实例
export const apiService = new ApiService();

// 导出类型
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  SafetyDataQuery,
  DashboardStats,
  UploadResponse
};
