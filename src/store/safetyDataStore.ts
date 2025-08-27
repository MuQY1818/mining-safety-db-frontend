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
  
  // Actions
  setData: (data: SafetyData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: Partial<SafetyDataState['filters']>) => void;
  setPagination: (pagination: Partial<SafetyDataState['pagination']>) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  
  // Data management actions
  fetchData: (params?: any) => Promise<void>;
  fetchDataById: (id: string) => Promise<SafetyData | null>;
  addData: (newData: Omit<SafetyData, 'id'>) => Promise<void>;
  updateData: (id: string, updatedData: Partial<SafetyData>) => Promise<void>;
  deleteData: (id: string) => Promise<void>;
}

export const useSafetyDataStore = create<SafetyDataState>((set, get) => ({
  // Initial state
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

  // Actions
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

  // Fetch data from real API
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
      
      // Apply filters to set filteredData
      get().applyFilters();
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取安全资料失败',
        loading: false
      });
    }
  },

  // Fetch single item by ID
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

  // Add new data via API
  addData: async (newData) => {
    set({ loading: true, error: null });
    
    try {
      await apiService.createSafetyData(newData);
      
      // Refresh data after adding
      await get().fetchData();
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '添加安全资料失败',
        loading: false
      });
    }
  },

  // Update data via API
  updateData: async (id: string, updatedData) => {
    set({ loading: true, error: null });
    
    try {
      const numericId = parseInt(id, 10);
      const fullData = { ...updatedData, id: numericId } as SafetyData;
      await apiService.updateSafetyData(fullData);
      
      // Refresh data after updating
      await get().fetchData();
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新安全资料失败',
        loading: false
      });
    }
  },

  // Delete data via API
  deleteData: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const numericId = parseInt(id, 10);
      await apiService.deleteSafetyData(numericId);
      
      // Remove from local state immediately
      const { data } = get();
      const updatedData = data.filter(item => item.id !== numericId);
      
      set({
        data: updatedData,
        loading: false
      });
      
      // Apply filters to update filteredData
      get().applyFilters();
      
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除安全资料失败',
        loading: false
      });
    }
  },

  // Apply filters and search
  applyFilters: () => {
    const { data, filters, searchTerm } = get();
    let filtered = [...data];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
    }

    // Apply safety level filter
    if (filters.safetyLevel) {
      filtered = filtered.filter(item => item.safetyLevel === filters.safetyLevel);
    }

    // Apply mine type filter
    if (filters.mineType) {
      filtered = filtered.filter(item => item.mineType === filters.mineType);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    set({ filteredData: filtered });
  },

  // Clear all filters
  clearFilters: () => {
    set({
      searchTerm: '',
      filters: {}
    });
    get().applyFilters();
  }
}));