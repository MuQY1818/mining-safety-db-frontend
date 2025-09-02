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
    console.log('📡 [chatHistoryService] 开始获取会话列表');
    console.log('📡 [chatHistoryService] API端点:', API_ENDPOINTS.CHAT.GET_SESSIONS);
    console.log('📡 [chatHistoryService] 请求参数:', params);
    
    try {
      const response = await apiClient.get(API_ENDPOINTS.CHAT.GET_SESSIONS, { params });
      
      console.log('✅ [chatHistoryService] getSessions API响应成功');
      console.log('📡 [chatHistoryService] 响应状态:', response.status);
      console.log('📡 [chatHistoryService] 响应数据概要:', {
        code: response.data.code,
        msg: response.data.msg,
        hasData: !!response.data.data,
        itemCount: response.data.data?.list?.length || response.data.data?.total || 0
      });
      
      const result = response.data.data;
      console.log('🔍 [chatHistoryService] 解析结果分析:', {
        hasResult: !!result,
        hasListField: !!result?.list,
        sessionCount: result?.list?.length || 0,
        totalCount: result?.total || 0,
        resultFields: Object.keys(result || {})
      });
      
      return result;
    } catch (error) {
      console.error('❌ [chatHistoryService] getSessions API调用失败:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        console.error('❌ [chatHistoryService] API错误状态:', apiError.response?.status);
        console.error('❌ [chatHistoryService] API错误数据:', apiError.response?.data);
      }
      throw error;
    }
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
    console.log('📡 [chatHistoryService] 开始保存消息到后端');
    console.log('📡 [chatHistoryService] API端点:', API_ENDPOINTS.CHAT.SAVE_MESSAGE);
    console.log('📡 [chatHistoryService] 请求参数:', request);
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.CHAT.SAVE_MESSAGE, request);
      console.log('✅ [chatHistoryService] 消息保存成功，响应:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [chatHistoryService] 保存消息失败:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        console.error('❌ [chatHistoryService] API错误状态:', apiError.response?.status);
        console.error('❌ [chatHistoryService] API错误数据:', apiError.response?.data);
      }
      throw error;
    }
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
    console.log('📡 [chatHistoryService] 开始获取消息，sessionId:', sessionId);
    console.log('📡 [chatHistoryService] API端点:', API_ENDPOINTS.CHAT.GET_MESSAGES);
    console.log('📡 [chatHistoryService] 请求参数:', { ...params, sessionId });
    
    try {
      const response = await apiClient.get(API_ENDPOINTS.CHAT.GET_MESSAGES, { 
        params: { 
          ...params, 
          sessionId 
        } 
      });
      
      console.log('✅ [chatHistoryService] getMessages API响应成功');
      console.log('📡 [chatHistoryService] 响应状态:', response.status);
      console.log('📡 [chatHistoryService] 响应数据概要:', {
        code: response.data.code,
        msg: response.data.msg,
        hasData: !!response.data.data,
        itemCount: response.data.data?.list?.length || response.data.data?.total || 0
      });
      
      const result = response.data.data;
      console.log('🔍 [chatHistoryService] 解析结果分析:', {
        hasResult: !!result,
        resultIsNull: result === null,
        hasListField: !!result?.list,
        messageCount: result?.list?.length || 0,
        totalCount: result?.total || 0,
        resultFields: Object.keys(result || {}),
        backendCode: response.data.code,
        backendMessage: response.data.msg
      });
      
      // 特别处理data为null的情况
      if (result === null) {
        console.warn('⚠️ [chatHistoryService] 后端返回data为null，可能原因:');
        console.warn('  1. 该会话没有任何消息记录');
        console.warn('  2. sessionId在数据库中不存在');  
        console.warn('  3. 用户权限问题，无法查看该会话消息');
        console.warn('  4. 后端查询SQL出错');
        console.warn('  sessionId:', sessionId, '类型:', typeof sessionId);
        
        return { list: [], total: 0, page: 1, pageSize: 100 };
      }
      
      return result;
    } catch (error) {
      console.error('❌ [chatHistoryService] getMessages API调用失败:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        console.error('❌ [chatHistoryService] API错误状态:', apiError.response?.status);
        console.error('❌ [chatHistoryService] API错误数据:', apiError.response?.data);
      }
      throw error;
    }
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
