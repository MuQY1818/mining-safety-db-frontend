// 登录页面
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert, Divider, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, ContactsOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { RegisterRequest } from '../../types/database';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Title, Text, Paragraph } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
  realName: string;
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();
  const { 
    login, 
    register, 
    error, 
    registerError, 
    isRegistering,
    clearError, 
    clearRegisterError 
  } = useAuthStore();

  const onLoginFinish = async (values: LoginForm) => {
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

  const onRegisterFinish = async (values: RegisterForm) => {
    clearRegisterError();
    
    try {
      const registerData: RegisterRequest = {
        username: values.username,
        password: values.password,
        realName: values.realName
      };
      
      await register(registerData);
      message.success('注册成功！已自动登录');
      navigate('/');
    } catch (error) {
      // 错误已经在store中处理
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

        {/* Tabs切换 */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'login' | 'register')}
          style={{ marginBottom: 24 }}
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <>
                  {/* 登录错误提示 */}
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
                    onFinish={onLoginFinish}
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
                </>
              )
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <>
                  {/* 注册错误提示 */}
                  {registerError && (
                    <Alert
                      message={registerError}
                      type="error"
                      showIcon
                      closable
                      onClose={clearRegisterError}
                      style={{ marginBottom: 24 }}
                    />
                  )}

                  {/* 注册表单 */}
                  <Form
                    name="register"
                    onFinish={onRegisterFinish}
                    autoComplete="off"
                    size="large"
                  >
                    <Form.Item
                      name="username"
                      rules={[
                        { required: true, message: '请输入用户名' },
                        { min: 3, max: 20, message: '用户名需要3-20个字符' },
                        { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined style={{ color: MINING_BLUE_COLORS.text.secondary }} />}
                        placeholder="用户名（3-20字符）"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="realName"
                      rules={[
                        { required: true, message: '请输入真实姓名' },
                        { min: 2, max: 10, message: '真实姓名需要2-10个字符' }
                      ]}
                    >
                      <Input
                        prefix={<ContactsOutlined style={{ color: MINING_BLUE_COLORS.text.secondary }} />}
                        placeholder="真实姓名"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[
                        { required: true, message: '请输入密码' },
                        { min: 6, max: 20, message: '密码需要6-20个字符' },
                        { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, message: '密码需包含字母和数字' }
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: MINING_BLUE_COLORS.text.secondary }} />}
                        placeholder="密码（6-20字符，包含字母数字）"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: '请确认密码' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: MINING_BLUE_COLORS.text.secondary }} />}
                        placeholder="确认密码"
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 16 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isRegistering}
                        block
                        style={{
                          height: 48,
                          borderRadius: 8,
                          fontSize: 16,
                          fontWeight: 500,
                        }}
                      >
                        注册
                      </Button>
                    </Form.Item>
                  </Form>
                </>
              )
            }
          ]}
        />

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
