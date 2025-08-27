// 安全数据状态管理
import { create } from 'zustand';
import { SafetyData, SafetyLevel, MineType, SafetyCategory } from '../types/safety';
import { apiService } from '../services/api';

interface SafetyDataState {
  data: SafetyData[];
  filteredData: SafetyData[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: {
    safetyLevel?: SafetyLevel;
    mineType?: MineType;
    category?: SafetyCategory;
  };
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  
  // 操作方法
  setData: (data: SafetyData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: Partial<SafetyDataState['filters']>) => void;
  setPagination: (pagination: Partial<SafetyDataState['pagination']>) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  
  // 数据管理操作
  fetchData: (params?: any) => Promise<void>;
  fetchDataById: (id: string) => Promise<SafetyData | null>;
  addData: (newData: Omit<SafetyData, 'id'>) => Promise<void>;
  updateData: (id: string, updatedData: Partial<SafetyData>) => Promise<void>;
  deleteData: (id: string) => Promise<void>;
}

export const useSafetyDataStore = create<SafetyDataState>((set, get) => ({
  // 初始状态
  data: [],
  filteredData: [],
  loading: false,
  error: null,
  searchTerm: '',
  filters: {},
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0
  },

  // 操作方法
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchTerm: (searchTerm) => {
    set({ searchTerm });
    get().applyFilters();
  },
  setFilters: (filters) => {
    set(state => ({ filters: { ...state.filters, ...filters } }));
    get().applyFilters();
  },
  setPagination: (pagination) => set(state => ({
    pagination: { ...state.pagination, ...pagination }
  })),

  // 从真实API获取数据
  fetchData: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const { filters, pagination, searchTerm } = get();
      
      const response = await apiService.getSafetyData({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: searchTerm || undefined,
        safetyLevel: filters.safetyLevel,
        mineType: filters.mineType,
        category: filters.category,
        ...params
      });
      
      set({
        data: response.list || [],
        pagination: {
          current: response.page,
          pageSize: response.pageSize,
          total: response.total
        },
        loading: false
      });
      
      // 应用过滤器设置filteredData
      get().applyFilters();
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取安全资料失败',
        loading: false
      });
    }
  },

  // 根据ID获取单个项目
  fetchDataById: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const numericId = parseInt(id, 10);
      const data = await apiService.getSafetyDataById(numericId);
      set({ loading: false });
      return data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取安全资料详情失败',
        loading: false
      });
      return null;
    }
  },

  // 通过API添加新数据
  addData: async (newData) => {
    set({ loading: true, error: null });
    
    try {
      await apiService.createSafetyData(newData);
      
      // 添加后刷新数据
      await get().fetchData();
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '添加安全资料失败',
        loading: false
      });
    }
  },

  // 通过API更新数据
  updateData: async (id: string, updatedData) => {
    set({ loading: true, error: null });
    
    try {
      const numericId = parseInt(id, 10);
      const fullData = { ...updatedData, id: numericId } as SafetyData;
      await apiService.updateSafetyData(fullData);
      
      // 更新后刷新数据
      await get().fetchData();
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新安全资料失败',
        loading: false
      });
    }
  },

  // 通过API删除数据
  deleteData: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const numericId = parseInt(id, 10);
      await apiService.deleteSafetyData(numericId);
      
      // 立即从本地状态中移除
      const { data } = get();
      const updatedData = data.filter(item => item.id !== numericId);
      
      set({
        data: updatedData,
        loading: false
      });
      
      // 应用过滤器更新filteredData
      get().applyFilters();
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除安全资料失败',
        loading: false
      });
    }
  },

  // 应用过滤器和搜索
  applyFilters: () => {
    const { data, filters, searchTerm } = get();
    let filtered = [...data];

    // 应用搜索关键词
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
    }

    // 应用安全等级过滤器
    if (filters.safetyLevel) {
      filtered = filtered.filter(item => item.safetyLevel === filters.safetyLevel);
    }

    // 应用矿区类型过滤器
    if (filters.mineType) {
      filtered = filtered.filter(item => item.mineType === filters.mineType);
    }

    // 应用类别过滤器
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    set({ filteredData: filtered });
  },

  // 清除所有过滤器
  clearFilters: () => {
    set({
      searchTerm: '',
      filters: {}
    });
    get().applyFilters();
  }
}));