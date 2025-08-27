import { useAuthStore } from '../store/authStore';
import { renderHook, act } from '@testing-library/react';

// 模拟apiService
jest.mock('../services/api', () => ({
  apiService: {
    login: jest.fn(),
    logout: jest.fn().mockResolvedValue({}),
    getProfile: jest.fn()
  }
}));

const mockApiService = require('../services/api').apiService;

describe('AuthStore', () => {
  beforeEach(() => {
    // 清除所有模拟和本地存储
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully and update state', async () => {
      // 模拟JWT token（包含用户ID）
      const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MzQ1NjQ3ODksImV4cCI6MTYzNDY1MTE4OX0.mock-signature';
      
      const mockResponse = {
        token: mockJwtToken,
        user: {
          id: 1,
          userName: 'admin',
          realName: '管理员',
          role: 'admin'
        }
      };

      mockApiService.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ username: 'admin', password: '123456' });
      });

      expect(result.current.user).toEqual({
        id: 1,
        userName: 'admin',
        realName: '管理员',
        phone: '',
        role: 'admin',
        email: 'admin@mining.com',
        avatar: ''
      });
      expect(result.current.token).toBe(mockJwtToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      
      // 检查token是否存储在localStorage中
      expect(localStorage.getItem('auth_token')).toBe(mockJwtToken);
    });

    it('should handle login failure', async () => {
      const errorMessage = '用户名或密码错误';
      mockApiService.login.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(result.current.login({ username: 'invalid', password: 'wrong' }))
          .rejects.toThrow(errorMessage);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('logout', () => {
    it('should logout and clear state', async () => {
      // 设置初始登录状态
      localStorage.setItem('auth_token', 'mock-token');
      
      const { result } = renderHook(() => useAuthStore());

      // 设置初始状态
      act(() => {
        result.current.setUser({
          id: 1,
          userName: 'admin',
          role: 'admin',
          email: 'admin@mining.com'
        });
        result.current.setToken('mock-token');
        result.current.setAuthenticated(true);
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      
      // 检查token是否从 localStorage中移除
      expect(localStorage.getItem('auth_token')).toBeNull();
      
      // 检查是否调用了登出API
      expect(mockApiService.logout).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useAuthStore());

      // 设置错误状态
      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      // 清除错误
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('should check auth status with valid token', async () => {
      const mockProfile = {
        id: 1,
        userName: 'admin',
        realName: '管理员',
        role: 'admin',
        email: 'admin@mining.com'
      };

      const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MzQ1NjQ3ODksImV4cCI6MTYzNDY1MTE4OX0.mock-signature';
      localStorage.setItem('auth_token', mockJwtToken);
      mockApiService.getProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 1,
        userName: 'admin',
        realName: '管理员',
        phone: '',
        role: 'admin',
        email: 'admin@mining.com',
        avatar: ''
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle invalid token', async () => {
      localStorage.setItem('auth_token', 'invalid-token');
      mockApiService.getProfile.mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle missing token', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist auth state', () => {
      const { result: result1 } = renderHook(() => useAuthStore());
      
      // 设置认证状态
      act(() => {
        result1.current.setUser({
          id: 1,
          userName: 'admin',
          role: 'admin',
          email: 'admin@mining.com'
        });
        result1.current.setToken('mock-token');
        result1.current.setAuthenticated(true);
      });

      // 创建新的hook实例
      const { result: result2 } = renderHook(() => useAuthStore());

      // 状态应该被持久化
      expect(result2.current.user).toEqual({
        id: 1,
        userName: 'admin',
        role: 'admin',
        email: 'admin@mining.com'
      });
      expect(result2.current.token).toBe('mock-token');
      expect(result2.current.isAuthenticated).toBe(true);
    });
  });
});