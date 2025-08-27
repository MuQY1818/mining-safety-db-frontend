// AI聊天状态管理 - 集成后端存储
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, ChatSession } from '../types/ai';
import { aiApi } from '../services/ai';
import { chatHistoryService, ChatSession as BackendChatSession, ChatMessage as BackendChatMessage } from '../services/chatHistory';

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
  clearSession: (sessionId: string) => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

// 辅助函数：转换后端会话数据到前端格式
const convertBackendSession = (backendSession: BackendChatSession): ChatSession => ({
  id: backendSession.id,
  userId: 1, // TODO: 从认证状态获取
  title: backendSession.title,
  status: backendSession.status,
  messageCount: backendSession.messageCount,
  totalTokens: backendSession.totalTokens,
  createdAt: new Date(backendSession.createdAt),
  updatedAt: new Date(backendSession.updatedAt),
  lastMessageAt: backendSession.lastMessageAt ? new Date(backendSession.lastMessageAt) : undefined,
  messages: [] // 消息单独加载
});

// 辅助函数：转换后端消息数据到前端格式
const convertBackendMessage = (backendMessage: BackendChatMessage): ChatMessage => ({
  id: backendMessage.id,
  sessionId: backendMessage.sessionId,
  role: backendMessage.role,
  content: backendMessage.content,
  timestamp: new Date(backendMessage.createdAt),
  tokensUsed: backendMessage.tokensUsed,
  modelName: backendMessage.modelName,
  responseTime: backendMessage.responseTime
});

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

          const backendSession = await chatHistoryService.createSession({ title });
          const newSession = convertBackendSession(backendSession);

          set(state => ({
            sessions: [newSession, ...state.sessions],
            currentSession: newSession,
            isLoading: false
          }));

          return newSession.id;
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
            // 如果本地没有，从后端获取
            const backendSession = await chatHistoryService.getSession(sessionId);
            session = convertBackendSession(backendSession);
            set(state => ({
              sessions: [session!, ...state.sessions]
            }));
          }

          // 加载会话消息
          const messagesData = await chatHistoryService.getMessages(sessionId, {
            pageSize: 100,
            sortOrder: 'asc'
          });

          const messages = messagesData.items.map(convertBackendMessage);
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
              await chatHistoryService.saveMessages(currentSession.id, {
                messages: [
                  {
                    role: 'user',
                    content: userMessage.content,
                    timestamp: userMessage.timestamp.toISOString()
                  },
                  {
                    role: 'assistant',
                    content: finalAiMessage.content,
                    timestamp: finalAiMessage.timestamp.toISOString(),
                    tokensUsed: Math.ceil(finalAiMessage.content.length / 4),
                    modelName: 'qwen-plus'
                  }
                ]
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
            sortBy: 'lastMessageAt',
            sortOrder: 'desc'
          });

          const sessions = sessionsData.items.map(convertBackendSession);

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

          await chatHistoryService.deleteSession(sessionId);

          set(state => ({
            sessions: state.sessions.filter(s => s.id !== sessionId),
            currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
            isLoading: false
          }));
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

          const updatedSession = await chatHistoryService.updateSession(sessionId, { title });
          const convertedSession = convertBackendSession(updatedSession);

          set(state => ({
            sessions: state.sessions.map(s => s.id === sessionId ? convertedSession : s),
            currentSession: state.currentSession?.id === sessionId ? convertedSession : state.currentSession,
            isLoading: false
          }));
        } catch (error) {
          console.error('更新会话标题失败:', error);
          set({
            error: error instanceof Error ? error.message : '更新会话失败',
            isLoading: false
          });
        }
      },

      // 清空会话
      clearSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });

          await chatHistoryService.clearSession(sessionId);

          set(state => ({
            sessions: state.sessions.map(s =>
              s.id === sessionId
                ? { ...s, messages: [], messageCount: 0, totalTokens: 0, lastMessageAt: undefined }
                : s
            ),
            currentSession: state.currentSession?.id === sessionId
              ? { ...state.currentSession, messages: [], messageCount: 0, totalTokens: 0, lastMessageAt: undefined }
              : state.currentSession,
            isLoading: false
          }));
        } catch (error) {
          console.error('清空会话失败:', error);
          set({
            error: error instanceof Error ? error.message : '清空会话失败',
            isLoading: false
          });
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        // 只持久化基本信息，不持久化消息内容
        sessions: state.sessions.map(s => ({ ...s, messages: [] })),
        currentSession: state.currentSession ? { ...state.currentSession, messages: [] } : null
      })
    }
  )
);
