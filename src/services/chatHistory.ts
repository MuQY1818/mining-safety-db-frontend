// 聊天历史管理服务 - 与后端API交互，严格按照后端API文档
import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

// 后端ChatSessionResponse接口 - 完全匹配后端返回格式
export interface ChatSession {
  id: number;
  title: string;
  description: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

// 后端ChatMessageResponse接口 - 完全匹配后端返回格式  
export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelName: string;
  createdAt: string;
}

// 创建会话请求 - 匹配后端CreateChatSessionRequest
export interface CreateSessionRequest {
  title: string;
  description?: string;
}

// 保存消息请求 - 匹配后端SaveMessageRequest
export interface SaveMessageRequest {
  sessionId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelName?: string;
}

// 聊天历史服务类 - 严格按照后端API文档
export class ChatHistoryService {
  /**
   * 创建新的聊天会话
   * POST /api/chat
   */
  async createSession(request: CreateSessionRequest): Promise<{ sessionId: number }> {
    const response = await apiClient.post(API_ENDPOINTS.CHAT.CREATE_SESSION, request);
    return response.data.data;
  }

  /**
   * 获取用户的聊天会话列表
   * GET /api/chat?page=1&pageSize=10&order=desc
   */
  async getSessions(params?: {
    page?: number;
    pageSize?: number;
    order?: 'asc' | 'desc';
  }): Promise<{
    page: number;
    pageSize: number;
    total: number;
    list: ChatSession[];
  }> {
    const response = await apiClient.get(API_ENDPOINTS.CHAT.GET_SESSIONS, { params });
    return response.data.data;
  }

  /**
   * 更新会话信息  
   * PUT /api/chat
   */
  async updateSession(sessionId: number, updates: {
    id: number;
    title: string;
    description: string;
  }): Promise<void> {
    await apiClient.put(API_ENDPOINTS.CHAT.UPDATE_SESSION, updates);
  }

  /**
   * 删除会话
   * DELETE /api/chat?sessionId=123
   */
  async deleteSession(sessionId: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CHAT.DELETE_SESSION, {
      params: { sessionId }
    });
  }

  /**
   * 保存单个消息
   * POST /api/chat/messages
   */
  async saveMessage(request: SaveMessageRequest): Promise<void> {
    await apiClient.post(API_ENDPOINTS.CHAT.SAVE_MESSAGE, request);
  }

  /**
   * 获取会话的消息历史
   * GET /api/chat/messages?page=1&pageSize=10&order=desc&sessionId=123
   */
  async getMessages(sessionId: number, params?: {
    page?: number;
    pageSize?: number;
    order?: 'asc' | 'desc';
  }): Promise<{
    page: number;
    pageSize: number;
    total: number;
    list: ChatMessage[];
  }> {
    const response = await apiClient.get(API_ENDPOINTS.CHAT.GET_MESSAGES, { 
      params: { 
        ...params, 
        sessionId 
      } 
    });
    return response.data.data;
  }

}

// 导出服务实例
export const chatHistoryService = new ChatHistoryService();

// 导出便捷方法
export const {
  createSession,
  getSessions,
  updateSession,
  deleteSession,
  saveMessage,
  getMessages
} = chatHistoryService;
