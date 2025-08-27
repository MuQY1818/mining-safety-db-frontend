// 聊天历史管理服务 - 与后端API交互
import { apiClient } from './apiClient';

// 聊天会话接口
export interface ChatSession {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'archived' | 'deleted';
  messageCount: number;
  totalTokens: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  };
}

// 聊天消息接口
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokensUsed?: number;
  modelName?: string;
  responseTime?: number;
  createdAt: string;
}

// 创建会话请求
export interface CreateSessionRequest {
  title: string;
  description?: string;
}

// 保存消息请求
export interface SaveMessagesRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    tokensUsed?: number;
    modelName?: string;
    responseTime?: number;
  }>;
}

// 聊天历史服务类
export class ChatHistoryService {
  private baseUrl = '/api/chat';

  /**
   * 创建新的聊天会话
   */
  async createSession(request: CreateSessionRequest): Promise<ChatSession> {
    const response = await apiClient.post(`${this.baseUrl}/sessions`, request);
    return response.data.data;
  }

  /**
   * 获取用户的聊天会话列表
   */
  async getSessions(params?: {
    page?: number;
    pageSize?: number;
    status?: 'active' | 'archived';
    sortBy?: 'lastMessageAt' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    items: ChatSession[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const response = await apiClient.get(`${this.baseUrl}/sessions`, { params });
    return response.data.data;
  }

  /**
   * 获取会话详情
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    const response = await apiClient.get(`${this.baseUrl}/sessions/${sessionId}`);
    return response.data.data;
  }

  /**
   * 更新会话信息
   */
  async updateSession(sessionId: string, updates: {
    title?: string;
    description?: string;
  }): Promise<ChatSession> {
    const response = await apiClient.put(`${this.baseUrl}/sessions/${sessionId}`, updates);
    return response.data.data;
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/sessions/${sessionId}`);
  }

  /**
   * 归档会话
   */
  async archiveSession(sessionId: string): Promise<ChatSession> {
    const response = await apiClient.put(`${this.baseUrl}/sessions/${sessionId}/archive`);
    return response.data.data;
  }

  /**
   * 保存聊天消息到会话
   */
  async saveMessages(sessionId: string, request: SaveMessagesRequest): Promise<{
    savedMessages: ChatMessage[];
    sessionUpdated: {
      messageCount: number;
      totalTokens: number;
      lastMessageAt: string;
    };
  }> {
    const response = await apiClient.post(`${this.baseUrl}/sessions/${sessionId}/messages`, request);
    return response.data.data;
  }

  /**
   * 获取会话的消息历史
   */
  async getMessages(sessionId: string, params?: {
    page?: number;
    pageSize?: number;
    role?: 'all' | 'user' | 'assistant';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    items: ChatMessage[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    sessionInfo: {
      id: string;
      title: string;
      messageCount: number;
      totalTokens: number;
    };
  }> {
    const response = await apiClient.get(`${this.baseUrl}/sessions/${sessionId}/messages`, { params });
    return response.data.data;
  }

  /**
   * 删除单个消息
   */
  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/messages/${messageId}`);
  }

  /**
   * 批量删除消息
   */
  async deleteMessages(sessionId: string, messageIds: string[]): Promise<{
    deletedCount: number;
    sessionUpdated: {
      messageCount: number;
      totalTokens: number;
      lastMessageAt?: string;
    };
  }> {
    const response = await apiClient.delete(`${this.baseUrl}/sessions/${sessionId}/messages`, {
      data: { messageIds }
    });
    return response.data.data;
  }

  /**
   * 清空会话所有消息
   */
  async clearSession(sessionId: string): Promise<{
    deletedCount: number;
    sessionUpdated: {
      messageCount: number;
      totalTokens: number;
      lastMessageAt: null;
    };
  }> {
    const response = await apiClient.delete(`${this.baseUrl}/sessions/${sessionId}/messages/all`);
    return response.data.data;
  }

  /**
   * 对消息进行反馈
   */
  async submitFeedback(messageId: string, feedback: {
    feedbackType: 'like' | 'dislike' | 'report';
    feedbackReason?: string;
    feedbackComment?: string;
  }): Promise<{
    id: string;
    messageId: string;
    feedbackType: string;
    feedbackReason?: string;
    feedbackComment?: string;
    createdAt: string;
  }> {
    const response = await apiClient.post(`${this.baseUrl}/messages/${messageId}/feedback`, feedback);
    return response.data.data;
  }
}

// 导出服务实例
export const chatHistoryService = new ChatHistoryService();

// 导出便捷方法
export const {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
  archiveSession,
  saveMessages,
  getMessages,
  deleteMessage,
  deleteMessages,
  clearSession,
  submitFeedback
} = chatHistoryService;
