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
  loadSessionsPaginated: (page: number, pageSize: number) => Promise<{
    sessions: ChatSession[];
    total: number;
    hasMore: boolean;
  }>;
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
const convertBackendMessage = (backendMessage: BackendChatMessage, sessionId: string): ChatMessage => ({
  id: backendMessage.id.toString(),  // 前端使用string ID
  sessionId: sessionId,  // 使用传入的正确的sessionId，而不是message.id
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
    console.log('🔍 [loadUserData] 尝试加载localStorage数据，key:', key);
    const stored = localStorage.getItem(key);
    console.log('🔍 [loadUserData] localStorage原始数据:', stored ? stored.substring(0, 200) + '...' : 'null');
    
    if (stored) {
      const data = JSON.parse(stored);
      console.log('🔍 [loadUserData] 解析后的数据结构:', {
        hasData: !!data,
        hasSessions: !!data.sessions,
        sessionsCount: data.sessions?.length || 0,
        hasCurrentSession: !!data.currentSession,
        currentSessionId: data.currentSession?.id,
        dataKeys: Object.keys(data)
      });
      
      // 恢复Date对象
      if (data.sessions) {
        data.sessions = data.sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) || []
        }));
      }
      if (data.currentSession) {
        data.currentSession = {
          ...data.currentSession,
          createdAt: new Date(data.currentSession.createdAt),
          updatedAt: new Date(data.currentSession.updatedAt),
          messages: data.currentSession.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) || []
        };
      }
      
      return {
        sessions: data.sessions || [],
        currentSession: data.currentSession || null
      };
    }
  } catch (error) {
    console.error('❌ [loadUserData] 加载用户聊天数据失败:', error);
  }
  console.log('📭 [loadUserData] 返回空数据');
  return { sessions: [], currentSession: null };
};

const saveUserData = (userId: number, data: { sessions: ChatSession[]; currentSession: ChatSession | null }) => {
  try {
    const key = `chat-store-user-${userId}`;
    console.log('💾 [saveUserData] 保存用户数据，key:', key);
    console.log('💾 [saveUserData] 保存数据结构:', {
      sessionsCount: data.sessions?.length || 0,
      hasCurrentSession: !!data.currentSession,
      currentSessionId: data.currentSession?.id,
      currentSessionMessageCount: data.currentSession?.messages?.length || 0
    });
    
    const serialized = JSON.stringify(data);
    console.log('💾 [saveUserData] 序列化数据大小:', serialized.length, '字符');
    localStorage.setItem(key, serialized);
    console.log('✅ [saveUserData] 数据保存成功');
  } catch (error) {
    console.error('❌ [saveUserData] 保存用户聊天数据失败:', error);
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
        const currentState = get();
        console.log('🎯 [chatStore] initialize方法被调用，当前状态:', {
          isInitialized: currentState.isInitialized,
          isLoading: currentState.isLoading,
          sessionsCount: currentState.sessions.length,
          hasCurrentSession: !!currentState.currentSession
        });
        
        // 防止重复初始化
        if (currentState.isInitialized && !currentState.isLoading) {
          console.log('⚠️ [chatStore] 已经初始化过，跳过重复初始化');
          return;
        }

        console.log('🚀 [chatStore] 开始初始化聊天存储');

        try {
          set({ isLoading: true, error: null });
          
          // 获取当前登录用户ID
          let currentUserId: number;
          try {
            currentUserId = getCurrentUserId();
            console.log('🚀 [chatStore] 当前用户ID:', currentUserId);
            console.log('🚀 [chatStore] 用户认证状态:', useAuthStore.getState().isAuthenticated);
            console.log('🚀 [chatStore] 用户信息:', JSON.stringify(useAuthStore.getState().user, null, 2));
          } catch (userError) {
            console.error('❌ [chatStore] 获取用户ID失败:', userError);
            console.error('❌ [chatStore] authStore状态:', JSON.stringify(useAuthStore.getState(), null, 2));
            set({ 
              error: '用户未登录或登录过期',
              isLoading: false,
              isInitialized: false 
            });
            return;
          }

          // 首先加载用户的本地数据（用于快速显示）
          const userData = loadUserData(currentUserId);
          console.log('🔍 [chatStore] 本地数据加载结果:', {
            hasUserData: !!userData,
            sessionsCount: userData.sessions?.length || 0,
            currentSessionId: userData.currentSession?.id,
            localStorageKey: `chat-store-user-${currentUserId}`
          });
          
          if (userData.sessions && userData.sessions.length > 0) {
            console.log('🚀 [chatStore] 加载本地用户数据，会话数量:', userData.sessions.length);
            console.log('🚀 [chatStore] 本地会话列表:', userData.sessions.map(s => ({
              id: s.id,
              title: s.title,
              messageCount: s.messages?.length || 0
            })));
            set(state => ({
              ...state,
              sessions: userData.sessions || [],
              currentSession: userData.currentSession || null
            }));
          } else {
            console.log('📭 [chatStore] 没有找到本地用户数据');
          }

          // 然后从后端加载最新数据并合并
          console.log('🚀 [chatStore] 开始从后端加载会话列表');
          try {
            console.log('📡 [chatStore] 调用getSessions API，参数:', { page: 1, pageSize: 20, order: 'desc' });
            const sessionsData = await chatHistoryService.getSessions({
              page: 1,
              pageSize: 20,
              order: 'desc'
            });
            
            console.log('📡 [chatStore] getSessions API原始响应:', JSON.stringify(sessionsData, null, 2));
            console.log('🔍 [chatStore] 响应数据分析:', {
              hasData: !!sessionsData,
              hasListField: !!sessionsData?.list,
              listLength: sessionsData?.list?.length || 0,
              totalCount: sessionsData?.total || 0,
              responseFields: Object.keys(sessionsData || {})
            });
            
            const backendSessions = sessionsData.list.map(convertBackendSession);
            console.log('✅ [chatStore] 后端会话加载成功，数量:', backendSessions.length);
            console.log('🔍 [chatStore] 转换后的会话列表:', backendSessions.map(s => ({
              id: s.id,
              title: s.title,
              userId: s.userId,
              messageCount: s.messageCount,
              messagesLength: s.messages?.length || 0
            })));
            
            // 合并本地和后端数据，优先使用后端数据
            const mergedSessions = backendSessions.length > 0 ? backendSessions : userData.sessions || [];
            
            set(state => ({
              ...state,
              sessions: mergedSessions,
              // 如果当前会话不在新的会话列表中，清除当前会话
              currentSession: mergedSessions.find(s => s.id === state.currentSession?.id) || null
            }));
            
            // 保存更新后的数据到localStorage
            const finalState = get();
            saveUserData(currentUserId, {
              sessions: finalState.sessions,
              currentSession: finalState.currentSession
            });
            
          } catch (loadError) {
            console.error('❌ [chatStore] 从后端加载会话失败:', loadError);
            
            // 分析错误类型
            let errorMessage = '加载会话历史失败';
            if (loadError && typeof loadError === 'object') {
              const error = loadError as any;
              if (error.response?.status === 401) {
                errorMessage = '用户认证失效，请重新登录';
              } else if (error.response?.status === 404) {
                errorMessage = '会话接口不存在';
              } else if (error.response?.status >= 500) {
                errorMessage = '服务器错误，请稍后再试';
              } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
                errorMessage = '网络连接失败，请检查网络';
              }
            }
            
            console.warn('⚠️ [chatStore] 使用本地数据，错误类型:', errorMessage);
            
            // 如果后端加载失败，保留本地数据
            if (!userData.sessions || userData.sessions.length === 0) {
              console.log('📝 [chatStore] 无本地数据，创建空状态');
              set(state => ({
                ...state,
                sessions: [],
                currentSession: null,
                error: `${errorMessage}（将在网络恢复后自动重试）`
              }));
            } else {
              console.log('📝 [chatStore] 使用本地缓存数据');
              set(state => ({
                ...state,
                error: `${errorMessage}（使用本地缓存数据）`
              }));
            }
          }

          // 如果有当前会话，为其加载消息内容
          const currentState = get();
          console.log('🔄 [chatStore] 检查是否需要加载当前会话消息:', {
            hasCurrentSession: !!currentState.currentSession,
            currentSessionId: currentState.currentSession?.id,
            currentSessionMessageCount: currentState.currentSession?.messages?.length || 0
          });
          
          if (currentState.currentSession) {
            console.log('🔄 [chatStore] 检测到当前会话，开始加载其消息:', currentState.currentSession.id);
            try {
              console.log('📡 [chatStore] 调用setCurrentSession加载消息');
              await get().setCurrentSession(currentState.currentSession.id);
              const updatedState = get();
              console.log('✅ [chatStore] 当前会话消息加载完成，消息数量:', updatedState.currentSession?.messages?.length || 0);
            } catch (messageLoadError) {
              console.error('❌ [chatStore] 加载当前会话消息失败:', messageLoadError);
              console.error('❌ [chatStore] 错误详情:', messageLoadError instanceof Error ? messageLoadError.stack : 'Unknown error');
              // 即使消息加载失败，也要继续初始化
            }
          } else {
            console.log('📭 [chatStore] 无当前会话，跳过消息加载');
          }

          set({ isInitialized: true });
          const finalState = get();
          console.log('✅ [chatStore] 初始化完成，会话数量:', finalState.sessions.length);
          if (finalState.currentSession) {
            console.log('✅ [chatStore] 当前会话消息数量:', finalState.currentSession.messages.length);
          }

        } catch (error) {
          console.error('❌ [chatStore] 初始化聊天存储失败:', error);
          const errorMessage = error instanceof Error ? error.message : '初始化失败';
          set({ 
            error: errorMessage,
            isInitialized: false 
          });
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
        console.log('🔄 [chatStore] 开始切换到会话:', sessionId);
        
        try {
          set({ isLoading: true, error: null });

          let session = get().sessions.find(s => s.id === sessionId);
          if (!session) {
            console.log('🔄 [chatStore] 本地未找到会话，重新加载会话列表');
            // 如果本地没有会话，先从会话列表重新加载
            await get().loadSessions();
            session = get().sessions.find(s => s.id === sessionId);
            if (!session) {
              throw new Error(`会话 ${sessionId} 不存在或已被删除`);
            }
          }

          // 检查是否已经有缓存的消息，避免重复API调用
          if (session.messages && session.messages.length > 0) {
            console.log('✨ [chatStore] 使用缓存消息，跳过API调用，消息数量:', session.messages.length);
            set({
              currentSession: session,
              isLoading: false
            });
            return; // 直接返回，不需要API调用
          }

          console.log('🔄 [chatStore] 开始加载会话消息，sessionId:', sessionId);
          
          // 重试机制：尝试加载会话消息
          let messagesData: Awaited<ReturnType<typeof chatHistoryService.getMessages>>;
          let retryCount = 0;
          const maxRetries = 2;
          
          while (retryCount <= maxRetries) {
            try {
              const sessionIdNum = parseInt(sessionId);
              if (isNaN(sessionIdNum)) {
                throw new Error(`无效的会话ID: ${sessionId}`);
              }
              
              // 检查sessionId是否超出安全范围
              if (sessionIdNum > Number.MAX_SAFE_INTEGER) {
                console.warn('⚠️ [chatStore] sessionId超出JavaScript安全整数范围:', sessionIdNum);
              }
              
              console.log('🔍 [chatStore] sessionId验证通过:', sessionId);
              
              messagesData = await chatHistoryService.getMessages(sessionIdNum, {
                page: 1,
                pageSize: 20,
                order: 'asc'
              });
              
              // 🔍 调试：检查API响应格式（简化版）
              console.log('🔍 [chatStore] API响应:', {
                hasData: !!messagesData,
                messageCount: messagesData?.list?.length || 0,
                total: messagesData?.total || 0
              });
              
              // 验证响应格式 - 修复data为null的情况
              if (!messagesData || messagesData === null) {
                console.warn('⚠️ [chatStore] API返回data为null，可能是会话没有消息或后端查询失败');
                messagesData = { list: [], total: 0, page: 1, pageSize: 100 };
              } else if (typeof messagesData !== 'object') {
                throw new Error('API响应格式错误：响应不是对象');
              } else if (!messagesData.list) {
                console.warn('⚠️ [chatStore] API响应缺少list字段，尝试兼容处理');
                // 尝试兼容不同的响应格式
                if (Array.isArray(messagesData)) {
                  messagesData = { list: messagesData, total: messagesData.length, page: 1, pageSize: 100 };
                } else {
                  // 如果没有消息，创建空的响应
                  messagesData = { list: [], total: 0, page: 1, pageSize: 100 };
                }
              }
              
              break; // 成功则跳出重试循环
            } catch (apiError) {
              retryCount++;
              console.warn(`⚠️ [chatStore] 加载消息失败 (尝试 ${retryCount}/${maxRetries + 1}):`, apiError);
              
              if (retryCount > maxRetries) {
                throw apiError; // 超过重试次数则抛出错误
              }
              
              // 等待1秒后重试
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          const messages = messagesData!.list.map((msg: BackendChatMessage) => convertBackendMessage(msg, sessionId));
          const updatedSession = { ...session, messages };

          console.log('✅ [chatStore] 会话切换成功，消息数量:', messages.length);

          set(state => ({
            currentSession: updatedSession,
            sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
            isLoading: false
          }));

          // 保存用户数据
          try {
            const currentState = get();
            saveUserData(getCurrentUserId(), {
              sessions: currentState.sessions,
              currentSession: currentState.currentSession
            });
          } catch (saveError) {
            console.warn('⚠️ [chatStore] 保存用户数据失败:', saveError);
          }

        } catch (error) {
          console.error('❌ [chatStore] 设置当前会话失败:', error);
          const errorMessage = error instanceof Error ? error.message : '加载会话失败';
          set({ 
            error: errorMessage,
            isLoading: false,
            currentSession: null 
          });
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

      // 获取所有消息用于AI对话（暂时不需要历史消息，直接使用单条消息）
      
      console.log('🎯 [chatStore] 开始调用aiApi.chatStream');
      
      // 使用流式响应
      await aiApi.chatStream(
        content, // 用户消息内容
        currentSession.id,
        // onChunk - 处理流式数据
        (chunk: string) => {
          console.log('📝 [chatStore] 收到AI chunk:', chunk.length, '字符');
          set(state => {
            // 使用当前state中的最新数据，而不是闭包变量
            const currentSessionId = state.currentSession?.id;
            if (!currentSessionId || !state.currentSession) {
              console.warn('⚠️ [chatStore] 当前没有活动会话，跳过chunk更新');
              return state;
            }

            // 找到最新的AI消息（最后一条消息且role为assistant）
            const currentSessionMessages = state.currentSession.messages;
            const lastMessage = currentSessionMessages[currentSessionMessages.length - 1];
            
            if (!lastMessage || lastMessage.role !== 'assistant') {
              console.warn('⚠️ [chatStore] 找不到最新的AI消息，跳过chunk更新');
              return state;
            }

            console.log('📝 [chatStore] 更新AI消息，当前长度:', lastMessage.content.length, '添加chunk:', chunk.length);

            return {
              sessions: state.sessions.map(session =>
                session.id === currentSessionId
                  ? {
                      ...session,
                      messages: session.messages.map(msg =>
                        msg.id === lastMessage.id
                          ? { ...msg, content: msg.content + chunk }
                          : msg
                      )
                    }
                  : session
              ),
              currentSession: {
                ...state.currentSession,
                messages: state.currentSession.messages.map(msg =>
                  msg.id === lastMessage.id
                    ? { ...msg, content: msg.content + chunk }
                    : msg
                )
              },
              isLoading: state.isLoading,
              isStreaming: state.isStreaming,
              error: state.error,
              isInitialized: state.isInitialized,
              createSession: state.createSession,
              setCurrentSession: state.setCurrentSession,
              sendMessage: state.sendMessage,
              loadSessions: state.loadSessions,
              deleteSession: state.deleteSession,
              updateSessionTitle: state.updateSessionTitle,
              clearError: state.clearError,
              initialize: state.initialize,
              switchUser: state.switchUser
            };
          });
        },
        // onComplete - 完成回调（后端已自动保存消息）
        async () => {
          console.log('🎯 [chatStore] AI响应完成');
          console.log('🎯 [chatStore] 后端已自动保存消息，前端无需手动保存');
          
          // 仅更新前端状态，无需调用保存API
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

      // 后端在流式响应的同时已自动保存消息，前端无需额外处理

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
            page: 1,
            pageSize: 20,
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

      // 分页加载会话列表
      loadSessionsPaginated: async (page: number = 1, pageSize: number = 20) => {
        try {
          // 如果是第一页，设置isLoading状态
          if (page === 1) {
            set({ isLoading: true, error: null });
          }

          const sessionsData = await chatHistoryService.getSessions({
            page,
            pageSize,
            order: 'desc'
          });

          const sessions = sessionsData.list.map(convertBackendSession);

          if (page === 1) {
            // 第一页，替换现有会话列表
            set({
              sessions,
              isLoading: false
            });
          } else {
            // 后续页，追加到现有会话列表
            set(state => ({
              sessions: [...state.sessions, ...sessions],
              isLoading: false
            }));
          }
          
          return {
            sessions,
            total: sessionsData.total,
            hasMore: page * pageSize < sessionsData.total
          };
        } catch (error) {
          console.error('加载会话列表失败:', error);
          set({
            error: error instanceof Error ? error.message : '加载会话失败',
            isLoading: false
          });
          throw error;
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
      // 不保存isInitialized状态，每次刷新都重新初始化以确保数据加载
      partialize: (state) => ({
        // 不持久化任何状态，让每次刷新都重新初始化
      })
    }
  )
);
