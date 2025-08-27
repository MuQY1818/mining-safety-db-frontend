// 用户建议提交表单组件
import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Upload,
  Button,
  Space,
  message,
  Row,
  Col,
  Typography,
  Tag,
  Divider
} from 'antd';
import {
  BulbOutlined,
  UploadOutlined,
  SendOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { FeedbackFormData } from '../../types/feedback';
import { MINING_BLUE_COLORS } from '../../config/theme';
import type { UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface FeedbackFormProps {
  onSubmit: (data: FeedbackFormData) => Promise<void>;
  loading?: boolean;
}

// 建议类型选项
const feedbackTypeOptions = [
  { value: 'bug', label: '🐛 错误报告', description: '系统错误或异常' },
  { value: 'feature', label: '✨ 功能建议', description: '新功能或改进' },
  { value: 'improvement', label: '🎨 改进建议', description: '界面设计改进' },
  { value: 'other', label: '💬 其他', description: '其他建议' }
];

// 优先级选项
const priorityOptions = [
  { value: 'low', label: '低优先级', color: 'default' },
  { value: 'medium', label: '中等优先级', color: 'blue' },
  { value: 'high', label: '高优先级', color: 'orange' },
  { value: 'urgent', label: '紧急', color: 'red' }
];

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, loading = false }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      const submitData: FeedbackFormData = {
        ...values,
        attachments: fileList.map(file => file.originFileObj).filter(Boolean) as File[]
      };

      await onSubmit(submitData);
      message.success('建议提交成功！我们会尽快处理您的建议。');
      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error('提交建议失败:', error);
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 文件上传配置
  const uploadProps = {
    fileList,
    onChange: (info: any) => {
      setFileList(info.fileList);
    },
    beforeUpload: (file: File) => {
      const isValidType = file.type.startsWith('image/') || 
                         file.type === 'application/pdf' ||
                         file.type.includes('document');
      if (!isValidType) {
        message.error('只能上传图片、PDF或文档文件！');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('文件大小不能超过 5MB！');
        return false;
      }
      return false; // 阻止自动上传
    },
    onRemove: (file: UploadFile) => {
      setFileList(prev => prev.filter(item => item.uid !== file.uid));
    }
  };

  return (
    <Card
      style={{
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      {/* 表单标题 */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <BulbOutlined style={{ 
          fontSize: 32, 
          color: MINING_BLUE_COLORS.primary,
          marginBottom: 16 
        }} />
        <Title level={3} style={{ margin: 0, color: MINING_BLUE_COLORS.primary }}>
          提交建议
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          您的建议对我们很重要，帮助我们不断改进系统
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'feature',
          priority: 'medium'
        }}
      >
        {/* 建议基本信息 */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="title"
              label="建议标题"
              rules={[
                { required: true, message: '请输入建议标题' },
                { min: 5, message: '标题至少5个字符' },
                { max: 100, message: '标题不能超过100个字符' }
              ]}
            >
              <Input placeholder="请简要描述您的建议..." />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="type"
              label="建议类型"
              rules={[{ required: true, message: '请选择建议类型' }]}
            >
              <Select placeholder="选择建议类型">
                {feedbackTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select placeholder="选择优先级">
                {priorityOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Tag color={option.color}>{option.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="description"
              label="详细描述"
              rules={[
                { required: true, message: '请详细描述您的建议' },
                { min: 20, message: '描述至少20个字符' },
                { max: 1000, message: '描述不能超过1000个字符' }
              ]}
            >
              <TextArea
                rows={6}
                placeholder="请详细描述您的建议，包括：&#10;1. 具体的问题或需求&#10;2. 期望的解决方案&#10;3. 使用场景或背景&#10;4. 其他相关信息"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">联系信息（可选）</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="userName"
              label="姓名"
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="您的姓名" 
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="userEmail"
              label="邮箱"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="您的邮箱" 
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="userContact"
              label="联系方式"
            >
              <Input 
                prefix={<PhoneOutlined />} 
                placeholder="手机号或其他联系方式" 
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="attachments"
              label="附件"
              extra="可上传相关截图、文档等文件，支持图片、PDF、文档格式，单个文件不超过5MB"
            >
              <Upload {...uploadProps} multiple>
                <Button icon={<UploadOutlined />}>选择文件</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        {/* 提交按钮 */}
        <Row>
          <Col span={24} style={{ textAlign: 'center' }}>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                loading={submitting || loading}
                onClick={handleSubmit}
                style={{ minWidth: 120 }}
              >
                提交建议
              </Button>
              <Button
                size="large"
                onClick={() => {
                  form.resetFields();
                  setFileList([]);
                }}
              >
                重置表单
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default FeedbackForm;
