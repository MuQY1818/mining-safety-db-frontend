import React from 'react';

// 模拟所有复杂的依赖
jest.mock('react-markdown', () => {
  const mockReact = require('react');
  return function ReactMarkdown({ children }: { children: string }) {
    return mockReact.createElement('div', { 'data-testid': 'markdown' }, children);
  };
});

jest.mock('./services/siliconflow', () => ({
  siliconFlowService: {
    isConfigured: false,
  }
}));

jest.mock('./store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })
}));

test('基本模块导入测试', () => {
  // 测试App组件可以被正常导入
  const App = require('./App').default;
  expect(App).toBeDefined();
  expect(typeof App).toBe('function');
});
