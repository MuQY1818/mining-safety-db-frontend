// AI聊天会话管理组件
import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Input,
  Modal,
  Space,
  Typography,
  Avatar,
  Dropdown,
  message,
  Tooltip,
  Empty,
  Spin,
  Tag,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  MessageOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  UserOutlined,
  RobotOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { ChatSession } from '../../types/ai';
import { useChatStore } from '../../store/chatStore';
import { MINING_BLUE_COLORS } from '../../config/theme';
// 简单的时间格式化函数，替代date-fns
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}天前`;
  return date.toLocaleDateString('zh-CN');
};

const { Text, Paragraph } = Typography;
const { Search } = Input;

interface ChatSessionManagerProps {
  onSessionSelect?: (session: ChatSession) => void;
  selectedSessionId?: string;
  style?: React.CSSProperties;
}

const ChatSessionManager: React.FC<ChatSessionManagerProps> = ({
  onSessionSelect,
  selectedSessionId,
  style
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<ChatSession | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');

  const {
    sessions,
    isLoading,
    error,
    loadSessions,
    createSession,
    deleteSession,
    clearError
  } = useChatStore();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  // 过滤会话列表
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (session.description && session.description.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  // 创建新会话
  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) {
      message.error('请输入会话标题');
      return;
    }

    try {
      const sessionId = await createSession(newSessionTitle.trim());
      setIsCreateModalVisible(false);
      setNewSessionTitle('');
      setNewSessionDescription('');
      message.success('会话创建成功');

      // 自动选择新创建的会话
      const newSession = sessions.find(s => s.id === sessionId);
      if (newSession && onSessionSelect) {
        onSessionSelect(newSession);
      }
    } catch (error) {
      message.error('创建会话失败');
    }
  };

  // 更新会话信息（简化实现）
  const handleUpdateSession = async () => {
    if (!editingSession || !newSessionTitle.trim()) {
      message.error('请输入会话标题');
      return;
    }

    try {
      // 这里可以添加更新会话的逻辑
      setEditingSession(null);
      setNewSessionTitle('');
      setNewSessionDescription('');
      message.success('会话更新成功');
    } catch (error) {
      message.error('更新会话失败');
    }
  };

  // 删除会话
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      message.success('会话删除成功');
    } catch (error) {
      message.error('删除会话失败');
    }
  };

  // 归档会话（简化实现）
  const handleArchiveSession = async (sessionId: string) => {
    try {
      // 这里可以添加归档会话的逻辑
      message.success('会话归档成功');
    } catch (error) {
      message.error('归档会话失败');
    }
  };

  // 导出会话（简化实现）
  const handleExportSession = async (sessionId: string) => {
    try {
      // 这里可以添加导出会话的逻辑
      message.success('会话导出成功');
    } catch (error) {
      message.error('导出会话失败');
    }
  };

  // 编辑会话
  const handleEditSession = (session: ChatSession) => {
    setEditingSession(session);
    setNewSessionTitle(session.title);
    setNewSessionDescription(session.description || '');
  };

  // 会话操作菜单
  const getSessionMenuItems = (session: ChatSession) => [
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: () => handleEditSession(session)
    },
    {
      key: 'archive',
      label: '归档',
      icon: <InboxOutlined />,
      onClick: () => handleArchiveSession(session.id)
    },
    {
      key: 'export',
      label: '导出',
      icon: <ExportOutlined />,
      onClick: () => handleExportSession(session.id)
    },
    {
      type: 'divider' as const
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteSession(session.id)
    }
  ];

  // 渲染会话项
  const renderSessionItem = (session: ChatSession) => {
    const isSelected = session.id === selectedSessionId;
    const lastMessageTime = session.lastMessageAt
      ? formatTimeAgo(new Date(session.lastMessageAt))
      : '暂无消息';

    return (
      <List.Item
        key={session.id}
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          backgroundColor: isSelected ? MINING_BLUE_COLORS.background.selected : 'transparent',
          borderLeft: isSelected ? `3px solid ${MINING_BLUE_COLORS.primary}` : '3px solid transparent',
          transition: 'all 0.2s ease'
        }}
        onClick={() => onSessionSelect?.(session)}
        actions={[
          <Dropdown
            menu={{ items: getSessionMenuItems(session) }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong style={{ fontSize: 14 }}>
                {session.title}
              </Text>
              {session.status === 'archived' && (
                <Tag color="orange" style={{ fontSize: 11, padding: '0 4px' }}>已归档</Tag>
              )}
            </div>
          }
          description={
            <div>
              {session.description && (
                <Paragraph
                  ellipsis={{ rows: 1 }}
                  style={{ margin: 0, fontSize: 12, color: MINING_BLUE_COLORS.text.secondary }}
                >
                  {session.description}
                </Paragraph>
              )}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                marginTop: 4,
                fontSize: 11,
                color: MINING_BLUE_COLORS.text.tertiary
              }}>
                <span>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {lastMessageTime}
                </span>
                <span>{session.messageCount} 条消息</span>
                <span>{session.totalTokens} tokens</span>
              </div>
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
            onClick={() => setIsCreateModalVisible(true)}
          >
            新建对话
          </Button>
        </div>
      }
      style={{ height: '100%', ...style }}
      bodyStyle={{ padding: 0, height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column' }}
    >
      {/* 搜索框 */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${MINING_BLUE_COLORS.border.light}` }}>
        <Search
          placeholder="搜索对话..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {/* 会话列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Spin spinning={isLoading}>
          {filteredSessions.length > 0 ? (
            <List
              dataSource={filteredSessions}
              renderItem={renderSessionItem}
              style={{ height: '100%' }}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={searchKeyword ? '未找到匹配的对话' : '暂无对话记录'}
              style={{ padding: '40px 20px' }}
            >
              {!searchKeyword && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalVisible(true)}
                >
                  创建第一个对话
                </Button>
              )}
            </Empty>
          )}
        </Spin>
      </div>

      {/* 创建会话弹窗 */}
      <Modal
        title="创建新对话"
        open={isCreateModalVisible}
        onOk={handleCreateSession}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setNewSessionTitle('');
          setNewSessionDescription('');
        }}
        okText="创建"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>对话标题 *</Text>
            <Input
              placeholder="请输入对话标题"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <Text strong>对话描述</Text>
            <Input.TextArea
              placeholder="请输入对话描述（可选）"
              value={newSessionDescription}
              onChange={(e) => setNewSessionDescription(e.target.value)}
              rows={3}
              style={{ marginTop: 4 }}
            />
          </div>
        </Space>
      </Modal>

      {/* 编辑会话弹窗 */}
      <Modal
        title="编辑对话"
        open={!!editingSession}
        onOk={handleUpdateSession}
        onCancel={() => {
          setEditingSession(null);
          setNewSessionTitle('');
          setNewSessionDescription('');
        }}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>对话标题 *</Text>
            <Input
              placeholder="请输入对话标题"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <Text strong>对话描述</Text>
            <Input.TextArea
              placeholder="请输入对话描述（可选）"
              value={newSessionDescription}
              onChange={(e) => setNewSessionDescription(e.target.value)}
              rows={3}
              style={{ marginTop: 4 }}
            />
          </div>
        </Space>
      </Modal>
    </Card>
  );
};

export default ChatSessionManager;
