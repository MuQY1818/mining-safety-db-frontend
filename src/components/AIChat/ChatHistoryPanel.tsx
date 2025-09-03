// AI聊天历史面板组件 - 在现有基础上添加的简单历史记录功能
import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Typography,
  Avatar,
  Empty,
  Spin,
  Tooltip,
  Popconfirm,
  message,
  Divider
} from 'antd';
import {
  MessageOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DownOutlined
} from '@ant-design/icons';
import { ChatSession } from '../../types/ai';
import { useChatStore } from '../../store/chatStore';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Text } = Typography;

interface ChatHistoryPanelProps {
  onSessionSelect?: (session: ChatSession) => void;
  selectedSessionId?: string;
  style?: React.CSSProperties;
}

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  onSessionSelect,
  selectedSessionId,
  style
}) => {
  const {
    sessions,
    isLoading,
    error,
    loadSessions,
    loadSessionsPaginated,
    createSession,
    deleteSession,
    clearError
  } = useChatStore();
  
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadInitialSessions();
  }, [loadSessions, loadSessionsPaginated]);

  const loadInitialSessions = async () => {
    try {
      setCurrentPage(1);
      const result = await loadSessionsPaginated(1, 20);
      setHasMore(result.hasMore);
    } catch (error) {
      message.error('加载会话列表失败');
    }
  };

  const loadMoreSessions = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const result = await loadSessionsPaginated(nextPage, 20);
      setCurrentPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      message.error('加载更多会话失败');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  // 创建新会话
  const handleCreateNewSession = async () => {
    try {
      const sessionId = await createSession('新的安全咨询');
      const newSession = sessions.find(s => s.id === sessionId);
      if (newSession && onSessionSelect) {
        onSessionSelect(newSession);
      }
      message.success('新会话创建成功');
    } catch (error) {
      message.error('创建会话失败');
    }
  };

  // 删除会话
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSession(sessionId);
      message.success('会话删除成功');
    } catch (error) {
      message.error('删除会话失败');
    }
  };

  // 格式化时间
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return '刚刚';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 渲染会话项
  const renderSessionItem = (session: ChatSession) => {
    const isSelected = session.id === selectedSessionId;
    
    return (
      <List.Item
        key={session.id}
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          backgroundColor: isSelected ? MINING_BLUE_COLORS.background.hover : 'transparent',
          borderLeft: isSelected ? `3px solid ${MINING_BLUE_COLORS.primary}` : '3px solid transparent',
          transition: 'all 0.2s ease'
        }}
        onClick={() => onSessionSelect?.(session)}
        actions={[
          <Popconfirm
            key="delete"
            title="确定要删除这个会话吗？"
            onConfirm={(e) => handleDeleteSession(session.id, e!)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除会话">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
                style={{ color: MINING_BLUE_COLORS.text.secondary }}
              />
            </Tooltip>
          </Popconfirm>
        ]}
      >
        <List.Item.Meta
          avatar={
            <Avatar
              size="small"
              icon={<MessageOutlined />}
              style={{ backgroundColor: MINING_BLUE_COLORS.secondary }}
            />
          }
          title={
            <Text strong style={{ fontSize: 14 }}>
              {session.title}
            </Text>
          }
          description={
            <div style={{ 
              fontSize: 12, 
              color: MINING_BLUE_COLORS.text.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {formatTime(session.updatedAt)}
              </span>
              <span>{session.messageCount || 0} 条消息</span>
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <MessageOutlined style={{ color: MINING_BLUE_COLORS.primary }} />
            <Text strong>对话历史</Text>
          </Space>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleCreateNewSession}
          >
            新建
          </Button>
        </div>
      }
      style={{ height: '100%', ...style }}
      styles={{ body: { padding: 0, height: 'calc(100% - 57px)', overflow: 'auto' } }}
    >
      <Spin spinning={isLoading}>
        {sessions.length > 0 ? (
          <>
            <List
              dataSource={sessions}
              renderItem={renderSessionItem}
            />
            {hasMore && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ textAlign: 'center', padding: '12px' }}>
                  <Button
                    onClick={loadMoreSessions}
                    loading={loadingMore}
                    icon={<DownOutlined />}
                  >
                    {loadingMore ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无对话记录"
            style={{ padding: '40px 20px' }}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateNewSession}
            >
              创建第一个对话
            </Button>
          </Empty>
        )}
      </Spin>
    </Card>
  );
};

export default ChatHistoryPanel;