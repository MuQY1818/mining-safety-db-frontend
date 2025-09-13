// AI和反馈API服务
import { apiClient, handleApiResponse, handleApiError } from './apiClient';
// import { siliconFlowService } from './siliconflow';  // 已禁用，AI服务迁移到后端
import {
  ChatMessage,
  ChatSession,
  UserFeedback,
  FeedbackForm,
  FeedbackQuery,
  FeedbackStats
} from '../types/ai';
import { API_CONFIG } from '../config/api';

// AI问答API
export const aiApi = {
  // 流式聊天 - 使用后端SSE接口
  chatStream: async (
    message: string,
    sessionId: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void | Promise<void>,
    onError: (error: string) => void
  ): Promise<void> => {
    try {
      console.log('🔗 [aiApi] 准备调用后端SSE聊天接口');
      console.log('🔗 [aiApi] 参数:', { message: message.substring(0, 50) + '...', sessionId });
      
      // 发送POST请求到后端AI接口
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          sessionId: parseInt(sessionId),
          content: message
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [aiApi] 后端API请求失败:', response.status, response.statusText);
        onError(`后端服务错误: ${response.status} ${response.statusText}\n${errorText}`);
        return;
      }

      // 检查响应是否为SSE流
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/plain')) {
        console.warn('⚠️ [aiApi] 响应Content-Type不是text/plain，可能不是SSE格式');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('无法读取响应流');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let completed = false;

      console.log('✅ [aiApi] 开始处理SSE流式响应');

      // 包装onComplete以确保只调用一次
      const wrappedOnComplete = async () => {
        if (completed) return;
        completed = true;
        
        console.log('🔗 [aiApi] 流式响应完成，调用onComplete');
        try {
          const result = onComplete();
          if (result && typeof result.then === 'function') {
            await result;
          }
          console.log('✅ [aiApi] onComplete执行完成');
        } catch (error) {
          console.error('❌ [aiApi] onComplete回调执行失败:', error);
          throw error;
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('📥 [aiApi] 流式响应自然结束');
            await wrappedOnComplete();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一行不完整的内容

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            console.log('🔍 [aiApi] SSE原始行:', trimmedLine);

            // 解析SSE格式: id:xxx event:xxx data:xxx
            try {
              // 简化的SSE解析，假设每行都是完整的事件
              if (trimmedLine.startsWith('id:')) {
                // id行，跳过
                continue;
              } else if (trimmedLine.startsWith('event:')) {
                const event = trimmedLine.substring(6).trim();
                console.log('📧 [aiApi] SSE事件类型:', event);
                
                if (event === 'done') {
                  console.log('🎯 [aiApi] 收到done事件，结束流式响应');
                  await wrappedOnComplete();
                  return;
                }
              } else if (trimmedLine.startsWith('data:')) {
                const data = trimmedLine.substring(5).trim();
                
                if (data === 'done') {
                  console.log('🎯 [aiApi] 收到done数据，结束流式响应');
                  await wrappedOnComplete();
                  return;
                }
                
                if (data && data.length > 0) {
                  console.log('📝 [aiApi] 收到数据块:', data.length, '字符');
                  onChunk(data);
                }
              } else {
                // 可能是没有前缀的纯数据
                console.log('📝 [aiApi] 收到纯数据:', trimmedLine.length, '字符');
                onChunk(trimmedLine);
              }
            } catch (parseError) {
              console.warn('⚠️ [aiApi] SSE行解析失败:', trimmedLine, parseError);
            }
          }
        }
      } catch (streamError) {
        console.error('❌ [aiApi] 流处理异常:', streamError);
        await wrappedOnComplete(); // 确保即使出错也调用完成回调
        throw streamError;
      }
    } catch (error) {
      console.error('❌ [aiApi] AI流式对话失败:', error);
      onError(error instanceof Error ? error.message : '聊天服务异常');
    }
  },

  // 非流式聊天 - 已禁用，只支持流式聊天
  chat: async (messages: ChatMessage[], sessionId?: string): Promise<string> => {
    try {
      // 后端只支持流式响应，非流式聊天已废弃
      throw new Error('非流式聊天已废弃，请使用chatStream方法');
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

  // 检查AI服务状态 - 通过后端健康检查
  checkStatus: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.warn('AI服务状态检查失败:', error);
      return false;
    }
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
