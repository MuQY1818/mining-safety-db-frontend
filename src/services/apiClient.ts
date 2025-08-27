// API客户端配置
import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api';

// 创建API客户端实例
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      // 添加认证token
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 开发环境日志
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 响应拦截器
  client.interceptors.response.use(
    (response) => {
      // 开发环境日志
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ API Response:', response.status, response.config.url);
      }
      return response;
    },
    (error) => {
      // 统一错误处理
      if (error.response?.status === 401) {
        // Token过期，跳转登录
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      
      console.error('❌ API Error:', error.response?.status, error.config?.url);
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// 通用API响应处理
export const handleApiResponse = <T>(response: any): T => {
  if (response.data.code === 200) {
    return response.data.data;
  } else {
    throw new Error(response.data.message || 'API请求失败');
  }
};

// 通用错误处理
export const handleApiError = (error: any): never => {
  if (error.response) {
    // 服务器响应错误
    const message = error.response.data?.message || `请求失败: ${error.response.status}`;
    throw new Error(message);
  } else if (error.request) {
    // 网络错误
    throw new Error('网络连接失败，请检查网络设置');
  } else {
    // 其他错误
    throw new Error(error.message || '未知错误');
  }
};
