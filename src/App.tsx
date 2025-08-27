import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 主题配置
import { antdTheme, cssVariables } from './config/theme';

// 页面组件
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard/Dashboard';
import NewAIChatPage from './pages/AIChat/NewAIChat';

import FeedbackPage from './pages/Feedback/FeedbackPage';
import DataDetailPage from './pages/DataDetail/DataDetailPage';

import MainLayout from './components/Layout/MainLayout';

// 状态管理
import { useAuthStore } from './store/authStore';

// 创建QueryClient实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    // 只在未认证时检查认证状态，避免重复调用
    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  // 如果正在加载认证状态，显示加载页面
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>正在验证身份...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// 主应用组件
const App: React.FC = () => {
  // 注入CSS变量
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = cssVariables;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={antdTheme}
        locale={zhCN}
      >
        <AntdApp>
          <Router>
            <Routes>
              {/* 登录页面 */}
              <Route path="/login" element={<LoginPage />} />

              {/* 受保护的路由 */}
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />



              <Route path="/add-data" element={
                <ProtectedRoute>
                  <div>添加数据页面 - 开发中</div>
                </ProtectedRoute>
              } />

              <Route path="/edit-data/:id" element={
                <ProtectedRoute>
                  <div>编辑数据页面 - 开发中</div>
                </ProtectedRoute>
              } />

              <Route path="/ai-chat" element={
                <ProtectedRoute>
                  <NewAIChatPage />
                </ProtectedRoute>
              } />



              <Route path="/feedback" element={
                <ProtectedRoute>
                  <FeedbackPage />
                </ProtectedRoute>
              } />

              <Route path="/data-detail/:id" element={
                <ProtectedRoute>
                  <DataDetailPage />
                </ProtectedRoute>
              } />

              {/* 默认重定向 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
