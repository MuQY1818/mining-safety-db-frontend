// 认证状态管理
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/database';
import { apiService } from '../services/api';

// JWT token解析工具函数
const parseJwt = (token: string): any => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT token解析失败:', error);
    return null;
  }
};

// 从JWT token中获取用户ID
const getUserIdFromToken = (token: string): number | null => {
  const payload = parseJwt(token);
  // 后端JWT使用 "user_id" 字段名 (对应 JwtUtils.USER_ID_KEY)
  return payload?.user_id ? parseInt(payload.user_id) : null;
};

interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 操作
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  clearUserData: (userId?: number) => void;
  // 内部方法（用于测试）
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 登录
      login: async (credentials: { username: string; password: string }) => {
        set({ isLoading: true, error: null });

        try {
          // 调用登录API获取token
          const loginResponse = await apiService.login(credentials.username, credentials.password);
          
          if (!loginResponse.token) {
            throw new Error('登录响应中缺少token');
          }

          // 保存token到localStorage
          localStorage.setItem('auth_token', loginResponse.token);

          // 从token中解析用户ID
          const userId = getUserIdFromToken(loginResponse.token);
          if (!userId) {
            throw new Error('无法从token中获取用户ID');
          }

          // 使用token获取用户详细信息
          const profile = await apiService.getProfile();
          const user: User = {
            id: userId, // 从JWT token解析的数字ID
            userName: profile?.userName || 'unknown',
            realName: profile?.realName || '',
            phone: profile?.phone || '',
            role: (profile?.role as 'admin' | 'user') || 'user',
            email: profile?.email || `${profile?.userName || 'user'}@mining.com`,
            avatar: profile?.avatar || ''
          };

          // 确保状态更新成功
          set({
            user,
            token: loginResponse.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          console.log('登录成功，用户信息已保存:', user);
        } catch (error) {
          console.error('登录失败:', error);
          
          // 清理可能的半状态
          localStorage.removeItem('auth_token');
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : '登录失败'
          });
          throw error;
        }
      },

      // 登出
      logout: () => {
        // 获取当前用户ID用于清理
        const currentUser = get().user;
        
        // 调用API登出（异步，不阻塞UI）
        try {
          apiService.logout();
        } catch (error) {
          console.error('登出API调用失败:', error);
        }
        
        // 清除本地状态
        localStorage.removeItem('auth_token');
        
        // 清理用户特定数据
        if (currentUser?.id) {
          get().clearUserData(currentUser.id);
        }
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 内部方法（用于测试）
      setUser: (user: User | null) => {
        set({ user });
      },

      setToken: (token: string | null) => {
        set({ token });
      },

      setAuthenticated: (authenticated: boolean) => {
        set({ isAuthenticated: authenticated });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // 检查认证状态
      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        // 如果已经认证且有用户信息，跳过API调用
        const currentState = get();
        if (currentState.isAuthenticated && currentState.user && currentState.token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          // 从token中解析用户ID
          const userId = getUserIdFromToken(token);
          if (!userId) {
            throw new Error('token中缺少用户ID信息');
          }

          // 获取用户信息
          const profile = await apiService.getProfile();
          const user: User = {
            id: userId, // 从JWT token解析的数字ID
            userName: profile?.userName || 'unknown',
            realName: profile?.realName || '',
            phone: profile?.phone || '',
            role: (profile?.role as 'admin' | 'user') || 'user',
            email: profile?.email || `${profile?.userName || 'user'}@mining.com`,
            avatar: profile?.avatar || ''
          };

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('认证检查失败:', error);
          
          // 在认证错误或token相关错误时清除认证状态
          const isAuthError = error?.response?.status === 401 || 
                             error?.message?.toLowerCase().includes('token') || 
                             error?.message?.includes('Invalid token') ||
                             error?.name === 'TokenExpiredError';
          
          if (isAuthError) {
            localStorage.removeItem('auth_token');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
          } else {
            // 网络错误或其他临时问题，保持认证状态但停止加载
            set({
              isLoading: false,
              error: null
            });
          }
        }
      },

      // 清理用户特定数据
      clearUserData: (userId?: number) => {
        try {
          // 如果没有提供userId，从当前状态获取
          const targetUserId = userId || get().user?.id;
          if (!targetUserId) {
            return;
          }

          // 清理用户特定的存储数据
          const userStorageKeys = [
            `chat-store-user-${targetUserId}`,
            `safety-data-store-user-${targetUserId}`,
            `feedback-store-user-${targetUserId}`
          ];

          userStorageKeys.forEach(key => {
            localStorage.removeItem(key);
          });

          // 清理临时存储（如果存在）
          localStorage.removeItem('chat-store-temp');
          
          console.log(`已清理用户 ${targetUserId} 的本地数据`);
        } catch (error) {
          console.error('清理用户数据时出错:', error);
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
