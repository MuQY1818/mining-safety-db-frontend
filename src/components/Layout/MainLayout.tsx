// 主布局组件
import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Badge } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  DatabaseOutlined,
  PlusOutlined,
  MessageOutlined,
  BulbOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAIStatus } from '../../hooks/useAIStatus';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isOnline: aiOnline, isChecking: aiChecking } = useAIStatus();

  // 菜单项配置
  const menuItems = [
    {
      key: '/',
      icon: <DatabaseOutlined />,
      label: '数据库',
    },
    {
      key: '/ai-chat',
      icon: <MessageOutlined />,
      label: 'AI问答',
    },
    {
      key: '/feedback',
      icon: <BulbOutlined />,
      label: '用户建议',
    },
  ];

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${MINING_BLUE_COLORS.background.primary} 0%, #e8f4fd 100%)`
    }}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: `linear-gradient(180deg, ${MINING_BLUE_COLORS.primary} 0%, ${MINING_BLUE_COLORS.secondary} 100%)`,
          borderRight: `1px solid ${MINING_BLUE_COLORS.border.medium}`,
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Logo区域 */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 16px',
          borderBottom: `1px solid rgba(255,255,255,0.2)`,
          background: 'rgba(255,255,255,0.1)',
        }}>
          {!collapsed ? (
            <Space>
              <div style={{
                width: 32,
                height: 32,
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: MINING_BLUE_COLORS.primary,
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                矿
              </div>
              <div>
                <Title level={5} style={{ margin: 0, color: 'white' }}>
                  矿大安全数据库
                </Title>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  语言景观视域研究
                </Text>
              </div>
            </Space>
          ) : (
            <div style={{
              width: 32,
              height: 32,
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: MINING_BLUE_COLORS.primary,
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              矿
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent',
            marginTop: '16px',
          }}
          theme="dark"
        />
      </Sider>

      {/* 主内容区 */}
      <Layout>
        {/* 顶部导航栏 */}
        <Header style={{
          padding: '0 16px',
          background: MINING_BLUE_COLORS.background.card,
          borderBottom: `1px solid ${MINING_BLUE_COLORS.border.light}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* 左侧：折叠按钮和标题 */}
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <Title level={4} style={{ margin: 0, color: MINING_BLUE_COLORS.text.primary }}>
              语言景观视域下矿区语言安全研究及多模态数据库建设
            </Title>
          </Space>

          {/* 右侧：用户信息 */}
          <Space>
            {/* AI状态指示 */}
            <Badge
              status={aiOnline ? "success" : "error"}
              text={aiChecking ? "检查中..." : (aiOnline ? "AI在线" : "AI离线")}
            />
            
            {/* 用户头像和菜单 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  size="small" 
                  style={{ 
                    backgroundColor: MINING_BLUE_COLORS.primary 
                  }}
                >
                  {user?.userName?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Text>{user?.userName || '用户'}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content style={{
          margin: '16px',
          padding: '24px',
          background: MINING_BLUE_COLORS.background.card,
          borderRadius: 12,
          minHeight: 'calc(100vh - 112px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: `1px solid ${MINING_BLUE_COLORS.border.light}`,
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
