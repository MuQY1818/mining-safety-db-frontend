// AI聊天页面
import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { RobotOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import ChatLayout from '../../components/AIChat/ChatLayout';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Title, Paragraph } = Typography;

const AIChatPage: React.FC = () => {
  return (
    <div style={{ 
      height: '100vh', 
      padding: '24px',
      background: MINING_BLUE_COLORS.background.page 
    }}>
      {/* 页面标题 */}
      <Card
        style={{ 
          marginBottom: 16,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: '16px 24px' }}
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
                  专业的矿区安全知识问答系统，为您提供准确、及时的安全指导
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
              color="blue"
              style={{ padding: '4px 12px', fontSize: 14 }}
            >
              24/7 在线
            </Tag>
          </Space>
        </div>
      </Card>

      {/* 聊天界面 */}
      <div style={{ height: 'calc(100% - 120px)' }}>
        <ChatLayout />
      </div>
    </div>
  );
};

export default AIChatPage;
