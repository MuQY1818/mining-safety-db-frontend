// 登录页面
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Title, Text, Paragraph } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, error, clearError } = useAuthStore();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    clearError();
    
    try {
      await login(values);
      navigate('/');
    } catch (error) {
      // 错误已经在store中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${MINING_BLUE_COLORS.primary} 0%, ${MINING_BLUE_COLORS.secondary} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: 16,
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        {/* Logo和标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            background: MINING_BLUE_COLORS.primary,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
          }}>
            <SafetyOutlined />
          </div>
          
          <Title level={3} style={{ margin: 0, color: MINING_BLUE_COLORS.primary }}>
            矿区语言安全数据库
          </Title>
          
          <Text type="secondary">
            语言景观视域下矿区语言安全研究
          </Text>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={clearError}
            style={{ marginBottom: 24 }}
          />
        )}

        {/* 登录表单 */}
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: MINING_BLUE_COLORS.text.secondary }} />}
              placeholder="用户名"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: MINING_BLUE_COLORS.text.secondary }} />}
              placeholder="密码"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '24px 0' }}>
          <Text type="secondary">系统特性</Text>
        </Divider>

        {/* 系统特性介绍 */}
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: MINING_BLUE_COLORS.safety.low,
              marginRight: 8,
            }} />
            <Text type="secondary">智能AI问答助手</Text>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: MINING_BLUE_COLORS.safety.medium,
              marginRight: 8,
            }} />
            <Text type="secondary">多模态安全资料管理</Text>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: MINING_BLUE_COLORS.safety.high,
              marginRight: 8,
            }} />
            <Text type="secondary">专业安全等级标识</Text>
          </div>
        </Space>

        {/* 底部信息 */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
            © 2025 中国矿业大学 语言景观视域研究团队
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
