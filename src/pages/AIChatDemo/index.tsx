// AI聊天演示页面 - 展示带历史记录的聊天功能
import React from 'react';
import { Card, Typography, Space, Tag, Button } from 'antd';
import { RobotOutlined, SafetyCertificateOutlined, HistoryOutlined } from '@ant-design/icons';
import ChatInterface from '../../components/AIChat/ChatInterface';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Title, Paragraph } = Typography;

const AIChatDemoPage: React.FC = () => {
  return (
    <div style={{ 
      height: '100vh', 
      padding: '24px',
      background: MINING_BLUE_COLORS.background.primary 
    }}>
      {/* 页面标题 */}
      <Card
        style={{ 
          marginBottom: 16,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space size="large">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${MINING_BLUE_COLORS.primary}, ${MINING_BLUE_COLORS.secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <RobotOutlined style={{ fontSize: 24, color: 'white' }} />
              </div>
              <div>
                <Title level={3} style={{ margin: 0, color: MINING_BLUE_COLORS.text.primary }}>
                  矿区安全AI助手
                </Title>
                <Paragraph style={{ margin: 0, color: MINING_BLUE_COLORS.text.secondary }}>
                  专业的矿区安全知识问答系统，支持对话历史记录
                </Paragraph>
              </div>
            </div>
          </Space>
          
          <Space>
            <Tag 
              icon={<SafetyCertificateOutlined />} 
              color="green"
              style={{ padding: '4px 12px', fontSize: 14 }}
            >
              安全认证
            </Tag>
            <Tag 
              icon={<HistoryOutlined />}
              color="blue"
              style={{ padding: '4px 12px', fontSize: 14 }}
            >
              历史记录
            </Tag>
            <Tag 
              color="orange"
              style={{ padding: '4px 12px', fontSize: 14 }}
            >
              24/7 在线
            </Tag>
          </Space>
        </div>
      </Card>

      {/* 功能说明 */}
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 8
        }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space wrap>
          <Button type="text" size="small" style={{ color: MINING_BLUE_COLORS.text.secondary }}>
            💡 左侧面板显示对话历史记录
          </Button>
          <Button type="text" size="small" style={{ color: MINING_BLUE_COLORS.text.secondary }}>
            🔄 支持多个对话会话管理
          </Button>
          <Button type="text" size="small" style={{ color: MINING_BLUE_COLORS.text.secondary }}>
            📝 自动保存对话内容
          </Button>
          <Button type="text" size="small" style={{ color: MINING_BLUE_COLORS.text.secondary }}>
            🗂️ 点击"隐藏历史"可收起左侧面板
          </Button>
        </Space>
      </Card>

      {/* 聊天界面 */}
      <div style={{ height: 'calc(100% - 200px)' }}>
        <ChatInterface showHistory={true} />
      </div>
    </div>
  );
};

export default AIChatDemoPage;
