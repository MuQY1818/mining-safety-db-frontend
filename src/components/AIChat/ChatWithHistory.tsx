// 带历史记录的AI聊天组件 - 在现有ChatInterface基础上添加历史功能
import React, { useState } from 'react';
import { Row, Col, Drawer, Button } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import ChatInterface from './ChatInterface';
import ChatHistoryPanel from './ChatHistoryPanel';
import { ChatSession } from '../../types/ai';
import { MINING_BLUE_COLORS } from '../../config/theme';

interface ChatWithHistoryProps {
  relatedItem?: any; // 相关的安全资料
  showHistory?: boolean; // 是否显示历史面板
  style?: React.CSSProperties;
}

const ChatWithHistory: React.FC<ChatWithHistoryProps> = ({
  relatedItem,
  showHistory = true,
  style
}) => {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isHistoryDrawerVisible, setIsHistoryDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 监听屏幕尺寸变化
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 处理会话选择
  const handleSessionSelect = (session: ChatSession) => {
    setSelectedSession(session);
    
    // 在移动端选择会话后关闭抽屉
    if (isMobile) {
      setIsHistoryDrawerVisible(false);
    }
  };

  // 桌面端布局
  const renderDesktopLayout = () => (
    <Row gutter={16} style={{ height: '100%', ...style }}>
      {/* 历史记录面板 */}
      {showHistory && (
        <Col span={6}>
          <ChatHistoryPanel
            onSessionSelect={handleSessionSelect}
            selectedSessionId={selectedSession?.id}
            style={{ height: '100%' }}
          />
        </Col>
      )}
      
      {/* 聊天界面 */}
      <Col span={showHistory ? 18 : 24}>
        <ChatInterface
          sessionId={selectedSession?.id}
          relatedItem={relatedItem}
        />
      </Col>
    </Row>
  );

  // 移动端布局
  const renderMobileLayout = () => (
    <div style={{ height: '100%', ...style }}>
      {/* 顶部工具栏 */}
      {showHistory && (
        <div style={{ 
          padding: '8px 16px', 
          borderBottom: `1px solid ${MINING_BLUE_COLORS.border.light}`,
          background: 'white',
          marginBottom: 8
        }}>
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => setIsHistoryDrawerVisible(true)}
            style={{ color: MINING_BLUE_COLORS.primary }}
          >
            对话历史
          </Button>
        </div>
      )}

      {/* 聊天界面 */}
      <div style={{ height: showHistory ? 'calc(100% - 60px)' : '100%' }}>
        <ChatInterface
          sessionId={selectedSession?.id}
          relatedItem={relatedItem}
        />
      </div>

      {/* 历史记录抽屉 */}
      {showHistory && (
        <Drawer
          title="对话历史"
          placement="left"
          onClose={() => setIsHistoryDrawerVisible(false)}
          open={isHistoryDrawerVisible}
          width="80%"
          styles={{ body: { padding: 0 } }}
        >
          <ChatHistoryPanel
            onSessionSelect={handleSessionSelect}
            selectedSessionId={selectedSession?.id}
            style={{ height: '100%' }}
          />
        </Drawer>
      )}
    </div>
  );

  return isMobile ? renderMobileLayout() : renderDesktopLayout();
};

export default ChatWithHistory;
