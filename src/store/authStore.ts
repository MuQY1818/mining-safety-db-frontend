// 认证状态管理
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/database';
import { apiService } from '../services/api';

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
  // 内部方法（用于测试）
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setError: (error: string) => void;
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
          
          // 保存token到localStorage
          localStorage.setItem('auth_token', loginResponse.token);

          // 获取完整用户信息
          const profile = await apiService.getProfile();
          const user: User = {
            id: profile.userName, // 使用userName作为唯一标识
            userName: profile.userName,
            realName: profile.realName,
            phone: profile.phone,
            role: profile.role as 'admin' | 'user',
            email: profile.email,
            avatar: profile.avatar
          };

          set({
            user,
            token: loginResponse.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '登录失败'
          });
          throw error;
        }
      },

      // 登出
      logout: () => {
        // 调用API登出
        apiService.logout().catch(console.error);
        
        // 清除本地状态
        localStorage.removeItem('auth_token');
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
      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        set({ token });
      },

      setAuthenticated: (authenticated: boolean) => {
        set({ isAuthenticated: authenticated });
      },

      setError: (error: string) => {
        set({ error });
      },

      // 检查认证状态
      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });

        try {
          // 获取用户信息（移除mock token检查，直接使用真实API）
          const profile = await apiService.getProfile();
          const user: User = {
            id: profile.userName, // 使用userName作为唯一标识
            userName: profile.userName,
            realName: profile.realName,
            phone: profile.phone,
            role: profile.role as 'admin' | 'user',
            email: profile.email,
            avatar: profile.avatar
          };

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          // Token无效，清除认证状态
          localStorage.removeItem('auth_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
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
