// AI聊天界面组件
import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Avatar,
  List,
  Spin,
  Tag,
  Tooltip,
  message,
  Row,
  Col,
  Drawer,
  Empty,
  Popconfirm
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { ChatMessage } from '../../types/ai';
import { useChatStore } from '../../store/chatStore';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface ChatInterfaceProps {
  sessionId?: string;
  relatedItem?: any; // 相关的安全资料
  showHistory?: boolean; // 是否显示历史对话
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, relatedItem, showHistory = true }) => {
  const [inputValue, setInputValue] = useState('');
  const [showHistoryPanel, setShowHistoryPanel] = useState(true); // 默认显示历史面板
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    sessions,
    currentSession,
    isStreaming,
    error,
    sendMessage,
    createSession,
    setCurrentSession,
    deleteSession,
    clearError
  } = useChatStore();

  // 快捷问题
  const quickQuestions = [
    '煤矿瓦斯检测的标准浓度是多少？',
    '矿山机械安全操作要点有哪些？',
    '矿区应急预案的基本要素？',
    '如何进行有效的安全培训？'
  ];

  useEffect(() => {
    // 如果没有任何会话，创建新会话
    if (sessions.length === 0) {
      const newSessionId = createSession(
        relatedItem ? `关于${relatedItem.title}的咨询` : '矿区安全咨询'
      );
      console.log('创建了新会话:', newSessionId);
    }
    // 如果有sessionId参数但不是当前会话，切换到指定会话
    if (sessionId && sessionId !== currentSession?.id) {
      setCurrentSession(sessionId);
    }
  }, [sessions.length, currentSession, createSession, setCurrentSession, sessionId, relatedItem]);

  useEffect(() => {
    // 自动滚动到底部
    scrollToBottom();
  }, [currentSession?.messages]);

  useEffect(() => {
    // 如果有相关资料，自动发送介绍消息
    if (relatedItem && currentSession && currentSession.messages.length === 0) {
      const introMessage = `我想了解关于"${relatedItem.title}"的安全信息，这是一个${relatedItem.safetyLevel}等级的${relatedItem.category}资料。`;
      handleSendMessage(introMessage);
    }
  }, [relatedItem, currentSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    try {
      await sendMessage(messageContent);
      setInputValue('');
      clearError();
    } catch (error) {
      message.error('发送消息失败，请重试');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  // 切换历史面板显示
  const toggleHistoryPanel = () => {
    setShowHistoryPanel(!showHistoryPanel);
  };

  // 选择历史会话
  const handleSelectSession = (session: any) => {
    setCurrentSession(session.id);
    setShowHistoryPanel(false); // 选择后关闭面板
  };

  // 创建新会话
  const handleCreateNewSession = () => {
    createSession('新的安全咨询');
    message.success('新会话创建成功');
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



  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === 'user';
    
    return (
      <div
        key={msg.id}
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            maxWidth: '80%',
          }}
        >
          {/* 头像 */}
          <Avatar
            size="small"
            icon={isUser ? <UserOutlined /> : <RobotOutlined />}
            style={{
              backgroundColor: isUser ? MINING_BLUE_COLORS.primary : MINING_BLUE_COLORS.secondary,
              margin: isUser ? '0 0 0 8px' : '0 8px 0 0',
            }}
          />
          
          {/* 消息内容 */}
          <div
            style={{
              background: isUser ? MINING_BLUE_COLORS.primary : MINING_BLUE_COLORS.background.card,
              color: isUser ? 'white' : MINING_BLUE_COLORS.text.primary,
              padding: '12px 16px',
              borderRadius: 12,
              border: isUser ? 'none' : `1px solid ${MINING_BLUE_COLORS.border.light}`,
              position: 'relative',
            }}
          >
            <Paragraph
              style={{
                margin: 0,
                color: isUser ? 'white' : MINING_BLUE_COLORS.text.primary,
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </Paragraph>
            
            {/* AI消息的操作按钮 */}
            {!isUser && (
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Tooltip title="复制内容">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(msg.content)}
                    style={{ color: MINING_BLUE_COLORS.text.secondary }}
                  />
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 历史对话面板 */}
      {showHistory && showHistoryPanel && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space>
                <HistoryOutlined style={{ color: MINING_BLUE_COLORS.primary }} />
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
          style={{ width: '300px', marginRight: '16px' }}
          styles={{ body: { padding: 0, height: 'calc(100% - 57px)', overflow: 'auto' } }}
        >
          {sessions.length > 0 ? (
            <List
              dataSource={sessions}
              renderItem={(session) => (
                <List.Item
                  key={session.id}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: session.id === currentSession?.id ? MINING_BLUE_COLORS.background.hover : 'transparent',
                    borderLeft: session.id === currentSession?.id ? `3px solid ${MINING_BLUE_COLORS.primary}` : '3px solid transparent',
                  }}
                  onClick={() => handleSelectSession(session)}
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="确定要删除这个会话吗？"
                      onConfirm={(e) => handleDeleteSession(session.id, e!)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={<Text strong style={{ fontSize: 14 }}>{session.title}</Text>}
                    description={
                      <div style={{ fontSize: 12, color: MINING_BLUE_COLORS.text.secondary }}>
                        {formatTime(session.updatedAt)} • {session.messages.length} 条消息
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无对话记录"
              style={{ padding: '40px 20px' }}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNewSession}>
                创建第一个对话
              </Button>
            </Empty>
          )}
        </Card>
      )}

      {/* 主聊天界面 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              <RobotOutlined style={{ color: MINING_BLUE_COLORS.primary }} />
              <Text strong>矿区安全AI助手</Text>
              <Tag color="green">在线</Tag>
            </Space>
            {showHistory && (
              <Button
                type={showHistoryPanel ? "default" : "primary"}
                icon={<HistoryOutlined />}
                onClick={toggleHistoryPanel}
                style={{
                  color: showHistoryPanel ? MINING_BLUE_COLORS.text.secondary : 'white',
                  backgroundColor: showHistoryPanel ? 'transparent' : MINING_BLUE_COLORS.primary,
                  borderColor: MINING_BLUE_COLORS.primary
                }}
              >
                {showHistoryPanel ? '隐藏历史' : '显示历史'}
              </Button>
            )}
          </div>
        }
      style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 } }}
    >
      {/* 错误提示 */}
      {error && (
        <div style={{ padding: '8px 16px', background: '#fff2f0', borderBottom: '1px solid #ffccc7' }}>
          <Text type="danger">{error}</Text>
        </div>
      )}

      {/* 消息列表 */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          background: '#ffffff',
        }}
      >
        {/* 欢迎消息 */}
        {(!currentSession?.messages || currentSession.messages.length === 0) && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <RobotOutlined style={{ fontSize: 48, color: MINING_BLUE_COLORS.secondary, marginBottom: 16 }} />
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              您好！我是矿区安全AI助手，专门为您解答矿区安全相关问题。
            </Text>
            
            {/* 快捷问题 */}
            <div style={{ marginTop: 20 }}>
              <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
                <ThunderboltOutlined /> 快速开始：
              </Text>
              <Space direction="vertical" size="small">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    type="link"
                    size="small"
                    onClick={() => handleSendMessage(question)}
                    style={{ 
                      color: MINING_BLUE_COLORS.primary,
                      textAlign: 'left',
                      whiteSpace: 'normal',
                      height: 'auto',
                      padding: '4px 8px'
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </Space>
            </div>
          </div>
        )}

        {/* 消息列表 */}
        {currentSession?.messages.map(renderMessage)}
        
        {/* 正在输入指示器 */}
        {isStreaming && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}>
            <Avatar
              size="small"
              icon={<RobotOutlined />}
              style={{ backgroundColor: MINING_BLUE_COLORS.secondary, marginRight: 8 }}
            />
            <Spin size="small" />
            <Text type="secondary" style={{ marginLeft: 8 }}>AI正在思考...</Text>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{ 
        padding: '16px', 
        borderTop: `1px solid ${MINING_BLUE_COLORS.border.light}`,
        background: 'white'
      }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="请输入您的矿区安全问题..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={isStreaming}
            style={{ resize: 'none' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => handleSendMessage()}
            loading={isStreaming}
            disabled={!inputValue.trim()}
            style={{ height: 'auto' }}
          >
            发送
          </Button>
        </Space.Compact>
        
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            按 Enter 发送，Shift + Enter 换行
          </Text>
        </div>
      </div>
    </Card>
    </div>
  );
};

export default ChatInterface;
