// AI和反馈API服务
import { apiClient, handleApiResponse, handleApiError } from './apiClient';
import { siliconFlowService } from './siliconflow';
import {
  ChatMessage,
  ChatSession,
  UserFeedback,
  FeedbackForm,
  FeedbackQuery,
  FeedbackStats
} from '../types/ai';

// AI问答API
export const aiApi = {
  // 流式聊天 - 使用回调方式
  chatStream: async (
    message: string,
    sessionId: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> => {
    try {
      // 使用硅基流动服务进行流式对话
      await siliconFlowService.chatStream(
        message,
        [], // 历史消息，暂时为空
        onChunk,
        onComplete,
        onError
      );
    } catch (error) {
      console.error('AI流式对话失败:', error);
      onError(error instanceof Error ? error.message : '聊天服务异常');
    }
  },

  // 非流式聊天
  chat: async (messages: ChatMessage[], sessionId?: string): Promise<string> => {
    try {
      return await siliconFlowService.chat(messages);
    } catch (error) {
      console.error('AI对话失败:', error);
      return handleApiError(error);
    }
  },

  // 保存会话到后端（简单实现）
  saveSession: async (sessionId: string, messages: ChatMessage[]): Promise<void> => {
    try {
      // 这里可以调用后端API保存会话
      console.log('保存会话:', sessionId, '消息数量:', messages.length);
      // await apiClient.post('/ai/sessions', { sessionId, messages });
    } catch (error) {
      console.warn('保存会话失败:', error);
    }
  },

  // 获取用户会话列表（简单实现）
  getSessions: async (userId: number): Promise<ChatSession[]> => {
    try {
      // 这里可以从后端API获取会话列表
      console.log('获取用户会话:', userId);
      // const response = await apiClient.get(`/ai/sessions?userId=${userId}`);
      // return handleApiResponse<ChatSession[]>(response);
      return [];
    } catch (error) {
      console.warn('获取会话失败:', error);
      return [];
    }
  },

  // 获取会话详情（简单实现）
  getSession: async (sessionId: string): Promise<ChatSession> => {
    try {
      // 这里可以从后端API获取会话详情
      console.log('获取会话详情:', sessionId);
      // const response = await apiClient.get(`/ai/sessions/${sessionId}`);
      // return handleApiResponse<ChatSession>(response);
      throw new Error('会话不存在');
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 删除会话（简单实现）
  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      // 这里可以调用后端API删除会话
      console.log('删除会话:', sessionId);
      // await apiClient.delete(`/ai/sessions/${sessionId}`);
    } catch (error) {
      console.warn('删除会话失败:', error);
    }
  },

  // 检查AI服务状态
  checkStatus: async (): Promise<boolean> => {
    return await siliconFlowService.checkConnection();
  }
};

// 用户建议反馈API
export const feedbackApi = {
  // 提交建议
  submit: async (feedback: FeedbackForm): Promise<UserFeedback> => {
    try {
      const formData = new FormData();
      formData.append('type', feedback.type);
      formData.append('title', feedback.title);
      formData.append('content', feedback.content);
      formData.append('priority', feedback.priority);
      
      // 添加附件
      if (feedback.attachments) {
        feedback.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
      }
      
      const response = await apiClient.post('/feedback', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return handleApiResponse<UserFeedback>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 获取建议列表
  getList: async (params: FeedbackQuery): Promise<{
    items: UserFeedback[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    try {
      const response = await apiClient.get('/feedback', { params });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 获取单个建议详情
  getItem: async (id: number): Promise<UserFeedback> => {
    try {
      const response = await apiClient.get(`/feedback/${id}`);
      return handleApiResponse<UserFeedback>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 更新建议状态（管理员）
  updateStatus: async (id: number, status: string, reply?: string): Promise<UserFeedback> => {
    try {
      const response = await apiClient.put(`/feedback/${id}`, { 
        status, 
        adminReply: reply 
      });
      return handleApiResponse<UserFeedback>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 删除建议
  delete: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/feedback/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 获取建议统计
  getStats: async (): Promise<FeedbackStats> => {
    try {
      const response = await apiClient.get('/feedback/stats');
      return handleApiResponse<FeedbackStats>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // 批量处理建议
  batchUpdate: async (ids: number[], status: string): Promise<void> => {
    try {
      await apiClient.post('/feedback/batch-update', { ids, status });
    } catch (error) {
      return handleApiError(error);
    }
  }
};
