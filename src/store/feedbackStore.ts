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
  
  // 操作方法
  setFeedbacks: (feedbacks: UserFeedback[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FeedbackFilters>) => void;
  setPagination: (pagination: Partial<FeedbackState['pagination']>) => void;
  
  // 数据操作
  fetchFeedbacks: (params?: any) => Promise<void>;
  submitFeedback: (data: FeedbackFormData) => Promise<void>;
  voteFeedback: (id: number, type: 'up' | 'down') => Promise<void>;
  fetchStats: () => Promise<void>;
  applyFilters: () => void;
  clearFilters: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  // 初始状态
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

  // 操作方法
  setFeedbacks: (feedbacks) => set({ feedbacks }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set(state => ({ filters: { ...state.filters, ...filters } })),
  setPagination: (pagination) => set(state => ({
    pagination: { ...state.pagination, ...pagination }
  })),

  // 从真实API获取反馈数据
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
      
      // 应用当前过滤器
      get().applyFilters();
      
      // 获取数据后更新统计信息
      get().fetchStats();
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '获取反馈列表失败',
        loading: false 
      });
    }
  },

  // 通过真实API提交反馈
  submitFeedback: async (data) => {
    set({ loading: true, error: null });
    
    try {
      // 转换数据以匹配后端API格式
      const apiData = {
        type: data.type,
        title: data.title,
        content: data.content || data.description || '',
        contactInfo: data.contactInfo || 
          [data.userName, data.userEmail, data.userContact]
            .filter(Boolean)
            .join(' | ')
      };
      
      await apiService.submitFeedback(apiData);
      
      // 提交后刷新反馈列表
      await get().fetchFeedbacks();
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '提交反馈失败',
        loading: false 
      });
    }
  },

  // 反馈投票（占位符 - 如果后端支持则实现）
  voteFeedback: async (id, type) => {
    // TODO: 如果后端支持投票则实现
    console.log(`Vote ${type} for feedback ${id}`);
  },

  // 获取统计数据
  fetchStats: async () => {
    try {
      const feedbacks = get().feedbacks;
      
      // 根据当前数据计算基础统计
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
        recentCount: 0, // TODO: 根据日期计算
        responseRate: 0, // TODO: 计算响应率
        averageResponseTime: 0 // TODO: 计算平均响应时间
      };
      
      set({ stats });
      
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取统计数据失败' });
    }
  },

  // 对反馈应用过滤器
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
        f.content.toLowerCase().includes(term)
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

  // 清除所有过滤器
  clearFilters: () => {
    set({ filters: {} });
    get().applyFilters();
  }
}));