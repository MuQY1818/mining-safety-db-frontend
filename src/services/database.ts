// 数据库API服务
import { apiClient, handleApiResponse, handleApiError } from './apiClient';
import {
  MiningLanguageItem,
  SearchParams,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  User
} from '../types/database';

// 认证相关API
export const authApi = {
  // 用户登录
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post('/auth/login', data);
      return handleApiResponse<LoginResponse>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 用户登出
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('auth_token');
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 获取用户信息
  getUserInfo: async (): Promise<User> => {
    try {
      const response = await apiClient.get('/auth/user');
      return handleApiResponse<User>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// 数据管理API
export const databaseApi = {
  // 获取数据列表
  getItems: async (params: SearchParams): Promise<PaginatedResponse<MiningLanguageItem>> => {
    try {
      const response = await apiClient.get('/items', { params });
      return handleApiResponse<PaginatedResponse<MiningLanguageItem>>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 获取单个数据详情
  getItem: async (id: number): Promise<MiningLanguageItem> => {
    try {
      const response = await apiClient.get(`/items/${id}`);
      return handleApiResponse<MiningLanguageItem>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 添加新数据
  createItem: async (data: Omit<MiningLanguageItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MiningLanguageItem> => {
    try {
      const response = await apiClient.post('/items', data);
      return handleApiResponse<MiningLanguageItem>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 更新数据
  updateItem: async (id: number, data: Partial<MiningLanguageItem>): Promise<MiningLanguageItem> => {
    try {
      const response = await apiClient.put(`/items/${id}`, data);
      return handleApiResponse<MiningLanguageItem>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 删除数据
  deleteItem: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/items/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 批量删除
  batchDelete: async (ids: number[]): Promise<void> => {
    try {
      await apiClient.post('/items/batch-delete', { ids });
    } catch (error) {
      return handleApiError(error);
    }
  },

};

// 搜索和筛选API
export const searchApi = {
  // 获取搜索建议
  getSuggestions: async (keyword: string): Promise<string[]> => {
    try {
      const response = await apiClient.get('/search/suggestions', { 
        params: { keyword } 
      });
      return handleApiResponse<string[]>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 获取筛选选项
  getFilterOptions: async (): Promise<{
    categories: string[];
    miningTypes: string[];
    languageTypes: string[];
  }> => {
    try {
      const response = await apiClient.get('/search/filters');
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }
};
