// 用户建议状态管理
import { create } from 'zustand';
import { UserFeedback, FeedbackFormData, FeedbackFilters, FeedbackStats } from '../types/feedback';
import { apiService } from '../services/api';

interface FeedbackState {
  feedbacks: UserFeedback[];
  filteredFeedbacks: UserFeedback[];
  loading: boolean;
  error: string | null;
  stats: FeedbackStats | null;
  filters: FeedbackFilters;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  
  // Actions
  setFeedbacks: (feedbacks: UserFeedback[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FeedbackFilters>) => void;
  setPagination: (pagination: Partial<FeedbackState['pagination']>) => void;
  
  // Data operations
  fetchFeedbacks: (params?: any) => Promise<void>;
  submitFeedback: (data: FeedbackFormData) => Promise<void>;
  voteFeedback: (id: string, type: 'up' | 'down') => Promise<void>;
  fetchStats: () => Promise<void>;
  applyFilters: () => void;
  clearFilters: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  // Initial state
  feedbacks: [],
  filteredFeedbacks: [],
  loading: false,
  error: null,
  stats: null,
  filters: {},
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0
  },

  // Actions
  setFeedbacks: (feedbacks) => set({ feedbacks }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set(state => ({ filters: { ...state.filters, ...filters } })),
  setPagination: (pagination) => set(state => ({
    pagination: { ...state.pagination, ...pagination }
  })),

  // Fetch feedbacks from real API
  fetchFeedbacks: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiService.getFeedbackList({
        page: get().pagination.current,
        pageSize: get().pagination.pageSize,
        status: 'all',  // 添加必需的默认status参数
        order: 'desc',  // 添加必需的默认order参数
        ...params
      });
      
      set({ 
        feedbacks: response.list || [],
        pagination: {
          current: response.page,
          pageSize: response.pageSize,
          total: response.total
        },
        loading: false 
      });
      
      // Apply current filters
      get().applyFilters();
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '获取反馈列表失败',
        loading: false 
      });
    }
  },

  // Submit feedback via real API
  submitFeedback: async (data) => {
    set({ loading: true, error: null });
    
    try {
      await apiService.submitFeedback(data);
      
      // Refresh feedbacks after submission
      await get().fetchFeedbacks();
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '提交反馈失败',
        loading: false 
      });
    }
  },

  // Vote feedback (placeholder - implement if backend supports)
  voteFeedback: async (id, type) => {
    // TODO: Implement if backend supports voting
    console.log(`Vote ${type} for feedback ${id}`);
  },

  // Fetch statistics
  fetchStats: async () => {
    try {
      const feedbacks = get().feedbacks;
      
      // Calculate basic stats from current data
      const stats: FeedbackStats = {
        total: feedbacks.length,
        byType: {
          bug: feedbacks.filter(f => f.type === 'bug').length,
          feature: feedbacks.filter(f => f.type === 'feature').length,
          improvement: feedbacks.filter(f => f.type === 'improvement').length,
          other: feedbacks.filter(f => f.type === 'other').length
        },
        byStatus: {
          pending: feedbacks.filter(f => f.status === 'pending').length,
          resolved: feedbacks.filter(f => f.status === 'resolved').length,
          closed: feedbacks.filter(f => f.status === 'closed').length
        },
        byPriority: {
          low: feedbacks.filter(f => f.priority === 'low').length,
          medium: feedbacks.filter(f => f.priority === 'medium').length,
          high: feedbacks.filter(f => f.priority === 'high').length,
          urgent: feedbacks.filter(f => f.priority === 'urgent').length
        },
        recentCount: 0, // TODO: Calculate based on date
        responseRate: 0, // TODO: Calculate response rate
        averageResponseTime: 0 // TODO: Calculate average response time
      };
      
      set({ stats });
      
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取统计数据失败' });
    }
  },

  // Apply filters to feedbacks
  applyFilters: () => {
    const { feedbacks, filters } = get();
    let filtered = [...feedbacks];

    if (filters.type) {
      filtered = filtered.filter(f => f.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(f => f.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(f => f.priority === filters.priority);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(f => 
        f.title.toLowerCase().includes(term) ||
        f.description.toLowerCase().includes(term)
      );
    }

    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(f => {
        const createdAt = new Date(f.createdAt);
        return createdAt >= new Date(start) && createdAt <= new Date(end);
      });
    }

    set({ filteredFeedbacks: filtered });
  },

  // Clear all filters
  clearFilters: () => {
    set({ filters: {} });
    get().applyFilters();
  }
}));