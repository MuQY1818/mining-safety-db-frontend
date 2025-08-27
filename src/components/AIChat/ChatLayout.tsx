// AI聊天布局组件 - 整合会话管理和聊天界面
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Drawer, message } from 'antd';
import { MenuOutlined, MessageOutlined } from '@ant-design/icons';
import ChatInterface from './ChatInterface';
import ChatSessionManager from './ChatSessionManager';
import { ChatSession } from '../../types/ai';
import { useChatStore } from '../../store/chatStore';
import { MINING_BLUE_COLORS } from '../../config/theme';

interface ChatLayoutProps {
  relatedItem?: any; // 相关的安全资料
  style?: React.CSSProperties;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ relatedItem, style }) => {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isSessionDrawerVisible, setIsSessionDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { currentSession, setCurrentSession, createSession } = useChatStore();

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 处理会话选择
  const handleSessionSelect = (session: ChatSession) => {
    setSelectedSession(session);
    setCurrentSession(session.id);
    
    // 在移动端选择会话后关闭抽屉
    if (isMobile) {
      setIsSessionDrawerVisible(false);
    }
  };

  // 创建新会话（如果没有当前会话）
  useEffect(() => {
    if (!currentSession && !selectedSession) {
      const initializeSession = async () => {
        try {
          const title = relatedItem ? `关于${relatedItem.title}的咨询` : '矿区安全咨询';
          const description = relatedItem ? `询问关于"${relatedItem.title}"的安全问题` : undefined;
          
          createSession(title);
        } catch (error) {
          message.error('初始化会话失败');
        }
      };

      initializeSession();
    }
  }, [currentSession, selectedSession, createSession, relatedItem]);

  // 桌面端布局
  const renderDesktopLayout = () => (
    <Row gutter={16} style={{ height: '100%', ...style }}>
      {/* 会话管理面板 */}
      <Col span={8}>
        <ChatSessionManager
          onSessionSelect={handleSessionSelect}
          selectedSessionId={selectedSession?.id || currentSession?.id}
          style={{ height: '100%' }}
        />
      </Col>
      
      {/* 聊天界面 */}
      <Col span={16}>
        <ChatInterface
          sessionId={selectedSession?.id || currentSession?.id}
          relatedItem={relatedItem}
        />
      </Col>
    </Row>
  );

  // 移动端布局
  const renderMobileLayout = () => (
    <div style={{ height: '100%', ...style }}>
      {/* 顶部工具栏 */}
      <Card
        size="small"
        style={{ 
          marginBottom: 8,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: '8px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setIsSessionDrawerVisible(true)}
            style={{ color: MINING_BLUE_COLORS.primary }}
          >
            会话列表
          </Button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageOutlined style={{ color: MINING_BLUE_COLORS.primary }} />
            <span style={{ 
              fontSize: 14, 
              fontWeight: 500,
              color: MINING_BLUE_COLORS.text.primary 
            }}>
              {selectedSession?.title || currentSession?.title || '矿区安全AI助手'}
            </span>
          </div>
        </div>
      </Card>

      {/* 聊天界面 */}
      <div style={{ height: 'calc(100% - 60px)' }}>
        <ChatInterface
          sessionId={selectedSession?.id || currentSession?.id}
          relatedItem={relatedItem}
        />
      </div>

      {/* 会话管理抽屉 */}
      <Drawer
        title="对话历史"
        placement="left"
        onClose={() => setIsSessionDrawerVisible(false)}
        open={isSessionDrawerVisible}
        width="80%"
        styles={{
          body: { padding: 0 }
        }}
      >
        <ChatSessionManager
          onSessionSelect={handleSessionSelect}
          selectedSessionId={selectedSession?.id || currentSession?.id}
          style={{ height: '100%' }}
        />
      </Drawer>
    </div>
  );

  return isMobile ? renderMobileLayout() : renderDesktopLayout();
};

export default ChatLayout;
