// API服务层 - 统一管理所有API调用
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { SafetyData, SafetyLevel, MineType, SafetyCategory, UploadSafetyDataRequest } from '../types/safety';

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

// 文件上传响应接口 - 匹配后端UploadFileResponse实际格式
interface UploadResponse {
  url: string;            // MinIO文件访问URL
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
        // 调试日志：显示请求的完整信息
        console.log('🚀 发送API请求:', config.method?.toUpperCase(), config.url);
        console.log('🚀 Base URL:', config.baseURL);
        console.log('🚀 完整URL:', (config.baseURL || '') + (config.url || ''));
        
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          // 🔍 详细JWT调试 - 对比Apifox格式
          console.log('🔐 JWT Token详情:', {
            tokenExists: true,
            tokenLength: token.length,
            tokenPrefix: token.substring(0, 20) + '...',
            authorizationHeader: `Bearer ${token.substring(0, 20)}...`,
            fullAuthHeader: config.headers.Authorization
          });
        } else {
          console.log('❌ 缺少JWT Token');
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
        console.log('📥 收到API响应:', response.config.url);
        console.log('- HTTP状态:', response.status);
        console.log('- 业务代码:', data.code);
        console.log('- 消息:', data.msg);
        console.log('- 数据:', data.data);
        
        // 检查业务逻辑错误 - 兼容两种后端响应格式
        // 成功: code === 0 或 code === 200
        // 失败: code !== 0 && code !== 200
        if (data.code !== 0 && data.code !== 200) {
          console.error('❌ 业务逻辑错误 - 响应拦截器:', {
            url: response.config.url,
            httpStatus: response.status,
            businessCode: data.code,
            message: data.msg,
            data: data.data
          });
          const error = new Error(data.msg || '请求失败');
          return Promise.reject(error);
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // 避免在登录页面重复重定向
          if (window.location.pathname !== '/login') {
            console.log('检测到401错误，触发登出流程');
            // 通过动态导入避免循环依赖
            import('../store/authStore').then(({ useAuthStore }) => {
              const authStore = useAuthStore.getState();
              authStore.logout();
              window.location.href = '/login';
            });
          }
        } else if (error.response?.status >= 500) {
          // 服务器错误，显示友好提示
          console.error('服务器错误:', error.response?.status);
        } else if (!error.response) {
          // 网络错误，不触发登出
          console.error('网络连接错误:', error.message);
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

  async createSafetyData(data: UploadSafetyDataRequest | Omit<SafetyData, 'id'>): Promise<SafetyData> {
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
    console.log(`📁 开始上传文件: ${file.name}, 大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // FormData调试信息
    console.log('📋 FormData信息:', {
      fieldName: 'file',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    try {
      const response = await this.client.post<ApiResponse<UploadResponse>>(
        '/file/upload',
        formData,
        {
          headers: {
            'Content-Type': undefined // 明确移除全局Content-Type，让浏览器自动设置multipart/form-data
          },
          timeout: 30000, // 文件上传使用更长的超时时间
        }
      );
      
      // 验证响应数据完整性
      if (!response.data.data || !response.data.data.url) {
        console.error('❌ 文件上传响应数据不完整:', response.data);
        throw new Error('服务器返回的文件URL为空，上传可能失败');
      }
      
      console.log('✅ 文件上传成功:', {
        fileName: file.name,
        fileSize: file.size,
        url: response.data.data.url,
        responseCode: response.data.code,
        responseMessage: response.data.msg
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('❌ 文件上传失败 - 详细信息:');
      console.error('- 文件名:', file.name);
      console.error('- 文件大小:', file.size);
      console.error('- HTTP状态码:', error.response?.status);
      console.error('- 响应头:', error.response?.headers);
      console.error('- 响应数据:', JSON.stringify(error.response?.data, null, 2));
      console.error('- 原始错误:', error.message);
      
      // 提供更友好的错误信息
      if (error.response?.status === 413) {
        throw new Error('文件太大，请选择10MB以下的文件');
      } else if (error.response?.status === 415) {
        throw new Error('不支持的文件类型');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(`上传失败: ${error.message || '网络错误'}`);
      }
    }
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

  // 下载文件统计
  async downloadFile(objectURL: string): Promise<void> {
    try {
      await this.client.get('/file/download', {
        params: { objectURL }
      });
      console.log('✅ 下载统计成功');
    } catch (error) {
      console.warn('⚠️ 下载统计失败:', error);
      // 统计失败不抛出错误，不影响实际下载
    }
  }

  // 获取反馈详情
  async getFeedbackDetail(feedbackId: number): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/feedback', {
      params: { feedbackId }
    });
    return response.data.data;
  }

  // 处理反馈
  async handleFeedback(feedbackId: number, status: string, reply: string): Promise<void> {
    console.log('🔧 处理反馈请求参数:', { feedbackId, status, reply });
    console.log('🔍 feedbackId详细信息:', {
      '原始值': feedbackId,
      '类型': typeof feedbackId,
      '字符串形式': feedbackId.toString(),
      '是否安全整数': Number.isSafeInteger(feedbackId),
      'JSON序列化后': JSON.stringify(feedbackId)
    });
    
    try {
      const response = await this.client.post<ApiResponse<any>>('/feedback/handle', {
        feedbackId: Number(feedbackId), // 确保为数字类型
        status, // 后端FeedbackStatusEnum会自动映射字符串值
        reply
      });
      
      console.log('✅ 反馈处理成功:', response.data);
      return response.data.data;
    } catch (error: any) {
      // 特殊处理200008错误码 - 反馈已处理过
      if (error.response?.data?.code === 200008) {
        // 抛出特殊的错误对象，包含错误码信息
        const specialError = new Error('该反馈已经被处理过了');
        (specialError as any).code = 200008;
        (specialError as any).isAlreadyHandled = true;
        throw specialError;
      }
      
      // 其他错误照常抛出
      throw error;
    }
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      // 使用profile接口进行健康检查，因为它需要认证且是GET请求
      await this.client.get('/user/profile');
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
