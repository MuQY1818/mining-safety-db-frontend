// AI问答页面 - 重新设计
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Input,
  Space,
  Typography,
  Avatar,
  Spin,
  Tag,
  Button,
  List,
  Empty,
  Popconfirm,
  message
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  SafetyOutlined,
  ExclamationCircleOutlined,
  BookOutlined,
  HistoryOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { siliconFlowService } from '../../services/siliconflow';
import { MINING_BLUE_COLORS } from '../../config/theme';
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const NewAIChatPage: React.FC = () => {
  // 聊天会话管理
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [showHistoryPanel, setShowHistoryPanel] = useState(true);

  // 当前会话的消息
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 初始化默认会话
  useEffect(() => {
    if (sessions.length === 0) {
      const defaultSession: ChatSession = {
        id: Date.now().toString(),
        title: '矿区安全咨询',
        messages: [{
          id: '1',
          type: 'assistant',
          content: '您好！我是矿区安全AI助手，专门为您解答各种矿区安全问题。您可以问我关于煤矿安全、金属矿安全、非金属矿安全、露天矿安全等任何问题，比如瓦斯检测标准、安全操作规程、应急预案等。',
          timestamp: new Date()
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setSessions([defaultSession]);
      setCurrentSessionId(defaultSession.id);
      setMessages(defaultSession.messages);
    }
  }, [sessions.length]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 创建新会话
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新的安全咨询',
      messages: [{
        id: '1',
        type: 'assistant',
        content: '您好！我是矿区安全AI助手，有什么安全问题需要咨询吗？',
        timestamp: new Date()
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    message.success('新会话创建成功');
  };

  // 切换会话
  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  // 删除会话
  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        const firstSession = remainingSessions[0];
        setCurrentSessionId(firstSession.id);
        setMessages(firstSession.messages);
      } else {
        createNewSession();
      }
    }
    message.success('会话已删除');
  };

  // 快捷问题
  const quickQuestions = [
    {
      icon: <SafetyOutlined />,
      question: '煤矿瓦斯检测的标准浓度是多少？'
    },
    {
      icon: <ExclamationCircleOutlined />,
      question: '矿山机械安全操作要点有哪些？'
    },
    {
      icon: <QuestionCircleOutlined />,
      question: '矿区应急预案的基本要素？'
    },
    {
      icon: <BookOutlined />,
      question: '如何进行有效的安全培训？'
    }
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage, aiMessage];
    setMessages(newMessages);

    // 更新当前会话
    setSessions(prev => prev.map(session =>
      session.id === currentSessionId
        ? { ...session, messages: newMessages, updatedAt: new Date() }
        : session
    ));

    setInputMessage('');
    setIsLoading(true);

    try {
      await siliconFlowService.chatStream(
        inputMessage.trim(),
        [],
        (chunk: string) => {
          setMessages(prev => {
            const updatedMessages = prev.map(msg =>
              msg.id === aiMessage.id
                ? { ...msg, content: msg.content + chunk }
                : msg
            );
            // 同时更新会话
            setSessions(prevSessions => prevSessions.map(session =>
              session.id === currentSessionId
                ? { ...session, messages: updatedMessages, updatedAt: new Date() }
                : session
            ));
            return updatedMessages;
          });
        },
        () => {
          setIsLoading(false);
        },
        () => {
          setMessages(prev => {
            const updatedMessages = prev.map(msg =>
              msg.id === aiMessage.id
                ? { ...msg, content: '抱歉，AI服务暂时不可用，请稍后再试。' }
                : msg
            );
            // 同时更新会话
            setSessions(prevSessions => prevSessions.map(session =>
              session.id === currentSessionId
                ? { ...session, messages: updatedMessages, updatedAt: new Date() }
                : session
            ));
            return updatedMessages;
          });
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages(prev => {
        const updatedMessages = prev.map(msg =>
          msg.id === aiMessage.id
            ? { ...msg, content: '抱歉，发送消息失败，请稍后再试。' }
            : msg
        );
        // 同时更新会话
        setSessions(prevSessions => prevSessions.map(session =>
          session.id === currentSessionId
            ? { ...session, messages: updatedMessages, updatedAt: new Date() }
            : session
        ));
        return updatedMessages;
      });
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        width: '100%',
        margin: '0 auto'
      }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Space direction="vertical" size={8}>
            <div>
              <RobotOutlined style={{ 
                fontSize: 32, 
                color: MINING_BLUE_COLORS.primary,
                marginBottom: 8 
              }} />
            </div>
            <Title level={3} style={{ 
              margin: 0, 
              color: MINING_BLUE_COLORS.primary 
            }}>
              矿区安全AI助手
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              专业的矿区安全知识问答，基于硅基流动AI技术
            </Text>
          </Space>
        </div>

        <div style={{ height: '600px', display: 'flex', gap: '24px' }}>
          {/* 左侧：历史记录面板 */}
          {showHistoryPanel && (
            <div style={{ width: '300px', flexShrink: 0 }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e8e8e8',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* 历史记录标题 */}
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #e8e8e8',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Space>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <HistoryOutlined style={{ color: 'white', fontSize: '16px' }} />
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>对话历史</span>
                  </Space>
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={createNewSession}
                    style={{ color: MINING_BLUE_COLORS.primary }}
                  >
                    新建
                  </Button>
                </div>

                {/* 会话列表 */}
                <div style={{
                  padding: '20px',
                  flex: 1,
                  overflow: 'auto'
                }}>
                  {sessions.length === 0 ? (
                    <Empty
                      description="暂无对话记录"
                      style={{ marginTop: '40px' }}
                    />
                  ) : (
                    <List
                      dataSource={sessions}
                      renderItem={(session) => (
                        <List.Item
                          style={{
                            padding: '12px 16px',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            border: session.id === currentSessionId ? `2px solid ${MINING_BLUE_COLORS.primary}` : '1px solid #e8e8e8',
                            background: session.id === currentSessionId ? '#f0f7ff' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => switchSession(session.id)}
                          actions={[
                            <Popconfirm
                              title="确定删除这个会话吗？"
                              onConfirm={(e) => {
                                e?.stopPropagation();
                                deleteSession(session.id);
                              }}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                size="small"
                                danger
                                onClick={(e) => e.stopPropagation()}
                              />
                            </Popconfirm>
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <div style={{
                                fontSize: '14px',
                                fontWeight: session.id === currentSessionId ? 'bold' : 'normal',
                                color: session.id === currentSessionId ? MINING_BLUE_COLORS.primary : '#333'
                              }}>
                                {session.title}
                              </div>
                            }
                            description={
                              <div style={{ fontSize: '12px', color: '#999' }}>
                                {session.updatedAt.toLocaleDateString()} {session.updatedAt.toLocaleTimeString()}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}

                  {/* 快速提问区域 */}
                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e8e8e8' }}>
                    <Text strong style={{ fontSize: '14px', color: '#666' }}>快速提问</Text>
                    <div style={{ marginTop: '12px' }}>
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        {quickQuestions.slice(0, 2).map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickQuestion(item.question)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #e8e8e8',
                              background: 'white',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '12px',
                              color: '#666'
                            }}
                          >
                            {item.question}
                          </button>
                        ))}
                      </Space>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 右侧：聊天界面 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* 聊天标题 */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e8e8e8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Space>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: `linear-gradient(135deg, ${MINING_BLUE_COLORS.primary} 0%, ${MINING_BLUE_COLORS.secondary} 100%)`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <RobotOutlined style={{ color: 'white', fontSize: '20px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>矿区安全AI助手</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>在线 · 随时为您服务</div>
                  </div>
                </Space>
                <Button
                  type="text"
                  icon={<HistoryOutlined />}
                  onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                  style={{ color: MINING_BLUE_COLORS.primary }}
                >
                  {showHistoryPanel ? '隐藏历史' : '显示历史'}
                </Button>
              </div>

              {/* 消息列表 */}
              <div
                ref={chatContainerRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  background: '#fafafa',
                  minHeight: 0
                }}
              >
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '80%',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                        }}
                      >
                        <Avatar
                          icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                          style={{
                            backgroundColor: message.type === 'user' 
                              ? MINING_BLUE_COLORS.primary 
                              : MINING_BLUE_COLORS.secondary,
                            flexShrink: 0
                          }}
                        />
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            backgroundColor: message.type === 'user' 
                              ? MINING_BLUE_COLORS.primary 
                              : 'white',
                            color: message.type === 'user' ? 'white' : 'black',
                            border: message.type === 'assistant' ? '1px solid #e8e8e8' : 'none',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          {message.type === 'user' ? (
                            <Paragraph 
                              style={{ 
                                margin: 0, 
                                color: 'white',
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {message.content}
                            </Paragraph>
                          ) : (
                            <div style={{ 
                              color: 'black',
                              lineHeight: '1.6'
                            }}>
                              <ReactMarkdown>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                          <div style={{ 
                            fontSize: '11px', 
                            marginTop: '8px',
                            opacity: 0.7,
                            color: message.type === 'user' ? 'rgba(255,255,255,0.8)' : '#999'
                          }}>
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Space>
              </div>

              {/* 输入区域 */}
              <div style={{ 
                padding: '20px', 
                borderTop: '1px solid #e8e8e8',
                background: 'white',
                borderRadius: '0 0 16px 16px'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <TextArea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onPressEnter={handleKeyPress}
                    placeholder="请输入您的问题..."
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    disabled={isLoading}
                    style={{ 
                      flex: 1,
                      borderRadius: '12px',
                      border: '2px solid #e8e8e8',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      border: 'none',
                      background: `linear-gradient(135deg, ${MINING_BLUE_COLORS.primary} 0%, ${MINING_BLUE_COLORS.secondary} 100%)`,
                      color: 'white',
                      cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                      opacity: inputMessage.trim() && !isLoading ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      flexShrink: 0
                    }}
                  >
                    {isLoading ? <Spin size="small" /> : <SendOutlined />}
                  </button>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: '12px', 
                  color: '#999', 
                  marginTop: '12px' 
                }}>
                  按 Enter 发送消息，Shift + Enter 换行
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAIChatPage;
