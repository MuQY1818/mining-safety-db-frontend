// AI聊天状态管理 - 集成后端存储
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, ChatSession } from '../types/ai';
import { aiApi } from '../services/ai';
import { chatHistoryService, ChatSession as BackendChatSession, ChatMessage as BackendChatMessage } from '../services/chatHistory';
import { useAuthStore } from './authStore';

interface ChatState {
  // 状态
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  isInitialized: boolean;

  // 操作
  createSession: (title?: string) => Promise<string>;
  setCurrentSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
  switchUser: (userId: number) => void;
}

// 获取当前用户ID的辅助函数
const getCurrentUserId = (): number => {
  const authState = useAuthStore.getState();
  if (!authState.user?.id) {
    throw new Error('用户未登录或用户ID不可用');
  }
  return authState.user.id;
};

// 辅助函数：转换后端会话数据到前端格式
const convertBackendSession = (backendSession: BackendChatSession): ChatSession => ({
  id: backendSession.id.toString(),  // 前端使用string ID
  userId: getCurrentUserId(), // 从认证状态获取真实用户ID
  title: backendSession.title,
  status: 'active',  // 后端没有status字段，默认为active
  messageCount: backendSession.messageCount,
  totalTokens: 0,  // 后端没有totalTokens字段，默认为0
  createdAt: new Date(backendSession.createdAt),
  updatedAt: new Date(backendSession.updatedAt),
  lastMessageAt: undefined,  // 后端没有lastMessageAt字段
  messages: [] // 消息单独加载
});

// 辅助函数：转换后端消息数据到前端格式
const convertBackendMessage = (backendMessage: BackendChatMessage): ChatMessage => ({
  id: backendMessage.id.toString(),  // 前端使用string ID
  sessionId: backendMessage.id.toString(),  // 统一转换为string
  role: backendMessage.role,
  content: backendMessage.content,
  timestamp: new Date(backendMessage.createdAt),
  tokensUsed: undefined,  // 后端没有tokensUsed字段
  modelName: backendMessage.modelName,
  responseTime: undefined  // 后端没有responseTime字段
});

// 用户数据隔离工具函数
const loadUserData = (userId: number): Partial<ChatState> => {
  try {
    const key = `chat-store-user-${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        sessions: data.sessions || [],
        currentSession: data.currentSession || null
      };
    }
  } catch (error) {
    console.error('加载用户聊天数据失败:', error);
  }
  return { sessions: [], currentSession: null };
};

const saveUserData = (userId: number, data: { sessions: ChatSession[]; currentSession: ChatSession | null }) => {
  try {
    const key = `chat-store-user-${userId}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('保存用户聊天数据失败:', error);
  }
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // 初始状态
      sessions: [],
      currentSession: null,
      isLoading: false,
      isStreaming: false,
      error: null,
      isInitialized: false,

      // 初始化 - 从后端加载会话列表
      initialize: async () => {
        if (get().isInitialized) return;

        try {
          set({ isLoading: true, error: null });
          await get().loadSessions();
          set({ isInitialized: true });
        } catch (error) {
          console.error('初始化聊天存储失败:', error);
          set({ error: '初始化失败' });
        } finally {
          set({ isLoading: false });
        }
      },

      // 创建新会话
      createSession: async (title = '新对话') => {
        try {
          set({ isLoading: true, error: null });

          const result = await chatHistoryService.createSession({ title });
          const sessionId = result.sessionId.toString();
          
          // 创建新会话对象
          const newSession: ChatSession = {
            id: sessionId,
            userId: getCurrentUserId(), // 从认证状态获取真实用户ID
            title,
            status: 'active',
            messageCount: 0,
            totalTokens: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: []
          };

          set(state => ({
            sessions: [newSession, ...state.sessions],
            currentSession: newSession,
            isLoading: false
          }));

          // 保存用户数据
          saveUserData(getCurrentUserId(), {
            sessions: [newSession, ...get().sessions.slice(1)], // 新会话 + 其他会话
            currentSession: newSession
          });

          return sessionId;
        } catch (error) {
          console.error('创建会话失败:', error);
          set({ error: '创建会话失败', isLoading: false });
          throw error;
        }
      },

      // 设置当前会话并加载消息
      setCurrentSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });

          let session = get().sessions.find(s => s.id === sessionId);
          if (!session) {
            // 如果本地没有会话，先从会话列表重新加载
            await get().loadSessions();
            session = get().sessions.find(s => s.id === sessionId);
            if (!session) {
              throw new Error('会话不存在');
            }
          }

          // 加载会话消息
          const messagesData = await chatHistoryService.getMessages(parseInt(sessionId), {
            pageSize: 100,
            order: 'asc'
          });

          const messages = messagesData.list.map(convertBackendMessage);
          const updatedSession = { ...session, messages };

          set(state => ({
            currentSession: updatedSession,
            sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
            isLoading: false
          }));
        } catch (error) {
          console.error('设置当前会话失败:', error);
          set({ error: '加载会话失败', isLoading: false });
        }
      },

  // 发送消息
  sendMessage: async (content: string) => {
    const { currentSession } = get();
    
    if (!currentSession) {
      set({ error: '请先创建或选择一个会话' });
      return;
    }

    // 创建用户消息
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: currentSession.id,
      role: 'user',
      content,
      timestamp: new Date()
    };

    // 添加用户消息到会话
    set(state => ({
      sessions: state.sessions.map(session =>
        session.id === currentSession.id
          ? {
              ...session,
              messages: [...session.messages, userMessage],
              updatedAt: new Date()
            }
          : session
      ),
      currentSession: {
        ...currentSession,
        messages: [...currentSession.messages, userMessage],
        updatedAt: new Date()
      },
      isStreaming: true,
      error: null
    }));

    try {
      // 创建AI消息占位符
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: currentSession.id,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      // 添加AI消息占位符
      set(state => ({
        sessions: state.sessions.map(session =>
          session.id === currentSession.id
            ? {
                ...session,
                messages: [...session.messages, aiMessage]
              }
            : session
        ),
        currentSession: {
          ...state.currentSession!,
          messages: [...state.currentSession!.messages, aiMessage]
        }
      }));

      // 获取所有消息用于AI对话
      const allMessages = [...currentSession.messages, userMessage];
      
      // 使用流式响应
      await aiApi.chatStream(
        content, // 用户消息内容
        currentSession.id,
        // onChunk - 处理流式数据
        (chunk: string) => {
          set(state => ({
            sessions: state.sessions.map(session =>
              session.id === currentSession.id
                ? {
                    ...session,
                    messages: session.messages.map(msg =>
                      msg.id === aiMessage.id
                        ? { ...msg, content: msg.content + chunk }
                        : msg
                    )
                  }
                : session
            ),
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  messages: state.currentSession.messages.map(msg =>
                    msg.id === aiMessage.id
                      ? { ...msg, content: msg.content + chunk }
                      : msg
                  )
                }
              : null
          }));
        },
        // onComplete - 完成回调
        async () => {
          console.log('AI响应完成');

          // 保存消息到后端
          const finalAiMessage = get().currentSession?.messages.find(m => m.id === aiMessage.id);
          if (finalAiMessage) {
            try {
              // 保存用户消息
              await chatHistoryService.saveMessage({
                sessionId: parseInt(currentSession.id),
                role: 'user',
                content: userMessage.content,
                modelName: 'user'
              });
              
              // 保存AI消息
              await chatHistoryService.saveMessage({
                sessionId: parseInt(currentSession.id),
                role: 'assistant',
                content: finalAiMessage.content,
                modelName: 'Qwen/Qwen2.5-7B-Instruct'
              });
            } catch (saveError) {
              console.error('保存消息到后端失败:', saveError);
            }
          }

          set({ isStreaming: false });
        },
        // onError - 错误处理
        (error: string) => {
          console.error('AI响应错误:', error);
          set(state => ({
            sessions: state.sessions.map(session =>
              session.id === currentSession.id
                ? {
                    ...session,
                    messages: session.messages.map(msg =>
                      msg.id === aiMessage.id
                        ? { ...msg, content: '抱歉，AI服务暂时不可用，请稍后再试。' }
                        : msg
                    )
                  }
                : session
            ),
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  messages: state.currentSession.messages.map(msg =>
                    msg.id === aiMessage.id
                      ? { ...msg, content: '抱歉，AI服务暂时不可用，请稍后再试。' }
                      : msg
                  )
                }
              : null
          }));
        }
      );

      // 会话会自动保存到后端，这里不需要额外调用

    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'AI对话失败',
        isStreaming: false
      });
      
      // 移除失败的AI消息
      set(state => ({
        sessions: state.sessions.map(session =>
          session.id === currentSession.id
            ? {
                ...session,
                messages: session.messages.slice(0, -1)
              }
            : session
        ),
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              messages: state.currentSession.messages.slice(0, -1)
            }
          : null
      }));
    } finally {
      set({ isStreaming: false });
    }
  },



  // 加载消息历史（简化实现）
  loadMessages: async (sessionId: string, page: number = 1, pageSize: number = 50) => {
    try {
      // 这里可以从API加载消息，暂时返回当前会话的消息
      const currentSession = get().currentSession;
      if (currentSession && currentSession.id === sessionId) {
        return currentSession.messages;
      }
      return [];
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载消息失败'
      });
      return [];
    }
  },

      // 加载会话列表
      loadSessions: async () => {
        try {
          set({ isLoading: true, error: null });

          const sessionsData = await chatHistoryService.getSessions({
            pageSize: 50,
            order: 'desc'
          });

          const sessions = sessionsData.list.map(convertBackendSession);

          set({
            sessions,
            isLoading: false
          });
        } catch (error) {
          console.error('加载会话列表失败:', error);
          set({
            error: error instanceof Error ? error.message : '加载会话失败',
            isLoading: false
          });
        }
      },

      // 删除会话
      deleteSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });

          await chatHistoryService.deleteSession(parseInt(sessionId));

          const newState = {
            sessions: get().sessions.filter(s => s.id !== sessionId),
            currentSession: get().currentSession?.id === sessionId ? null : get().currentSession
          };

          set({
            ...newState,
            isLoading: false
          });

          // 保存用户数据
          saveUserData(getCurrentUserId(), newState);
        } catch (error) {
          console.error('删除会话失败:', error);
          set({
            error: error instanceof Error ? error.message : '删除会话失败',
            isLoading: false
          });
        }
      },

      // 更新会话标题
      updateSessionTitle: async (sessionId: string, title: string) => {
        try {
          set({ isLoading: true, error: null });

          await chatHistoryService.updateSession(parseInt(sessionId), {
            id: parseInt(sessionId),
            title,
            description: title  // 使用title作为description
          });

          const newState = {
            sessions: get().sessions.map(s => 
              s.id === sessionId 
                ? { ...s, title, updatedAt: new Date() }
                : s
            ),
            currentSession: get().currentSession?.id === sessionId 
              ? { ...get().currentSession!, title, updatedAt: new Date() }
              : get().currentSession
          };

          set({
            ...newState,
            isLoading: false
          });

          // 保存用户数据
          saveUserData(getCurrentUserId(), newState);
        } catch (error) {
          console.error('更新会话标题失败:', error);
          set({
            error: error instanceof Error ? error.message : '更新会话失败',
            isLoading: false
          });
        }
      },


      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 用户切换
      switchUser: (userId: number) => {
        try {
          // 保存当前用户的数据（如果有的话）
          const currentState = get();
          if (currentState.sessions.length > 0 || currentState.currentSession) {
            try {
              const currentUserId = getCurrentUserId();
              saveUserData(currentUserId, {
                sessions: currentState.sessions,
                currentSession: currentState.currentSession
              });
            } catch (error) {
              console.warn('保存当前用户数据失败，可能是因为用户未登录:', error);
            }
          }

          // 加载新用户的数据
          const userData = loadUserData(userId);
          set({
            sessions: userData.sessions || [],
            currentSession: userData.currentSession || null,
            error: null
          });

          console.log(`已切换到用户 ${userId} 的聊天数据`);
        } catch (error) {
          console.error('用户切换失败:', error);
          set({ error: '用户切换失败' });
        }
      }
    }),
    {
      name: 'chat-store-global',
      // 由于需要用户隔离，我们手动处理数据持久化，这里只保存全局状态
      partialize: (state) => ({
        isInitialized: state.isInitialized
      })
    }
  )
);
