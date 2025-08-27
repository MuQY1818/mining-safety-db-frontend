import { useAuthStore } from '../store/authStore';
import { renderHook, act } from '@testing-library/react';

// Mock the apiService
jest.mock('../services/api', () => ({
  apiService: {
    login: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn()
  }
}));

const mockApiService = require('../services/api').apiService;

describe('AuthStore', () => {
  beforeEach(() => {
    // Clear all mocks and localStorage
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
      const mockResponse = {
        token: 'mock-jwt-token-1',
        user: {
          id: 1,
          username: 'admin',
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
        username: 'admin',
        role: 'admin',
        email: 'admin@mining.com'
      });
      expect(result.current.token).toBe('mock-jwt-token-1');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      
      // Check if token is stored in localStorage
      expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token-1');
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
      // Set initial logged in state
      localStorage.setItem('auth_token', 'mock-token');
      
      const { result } = renderHook(() => useAuthStore());

      // Set initial state
      act(() => {
        result.current.setUser({
          id: 'admin',
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
      
      // Check if token is removed from localStorage
      expect(localStorage.getItem('auth_token')).toBeNull();
      
      // Check if logout API was called
      expect(mockApiService.logout).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set error state
      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
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
        username: 'admin',
        realName: '管理员',
        role: 'admin',
        email: 'admin@mining.com'
      };

      localStorage.setItem('auth_token', 'mock-jwt-token-1');
      mockApiService.getProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 1,
        username: 'admin',
        role: 'admin',
        email: 'admin@mining.com'
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
      
      // Set auth state
      act(() => {
        result1.current.setUser({
          id: 'admin',
          userName: 'admin',
          role: 'admin',
          email: 'admin@mining.com'
        });
        result1.current.setToken('mock-token');
        result1.current.setAuthenticated(true);
      });

      // Create new hook instance
      const { result: result2 } = renderHook(() => useAuthStore());

      // State should be persisted
      expect(result2.current.user).toEqual({
        id: 1,
        username: 'admin',
        role: 'admin',
        email: 'admin@mining.com'
      });
      expect(result2.current.token).toBe('mock-token');
      expect(result2.current.isAuthenticated).toBe(true);
    });
  });
});