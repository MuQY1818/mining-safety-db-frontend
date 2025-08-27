// 数据添加/编辑表单组件
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Upload,
  Button,
  message,
  Row,
  Col,
  DatePicker,
  InputNumber,
  Space
} from 'antd';
import {
  UploadOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { SafetyData } from '../../types/safety';
import type { UploadFile } from 'antd/es/upload/interface';

const { TextArea } = Input;
const { Option } = Select;

interface DataFormProps {
  visible?: boolean;
  onCancel: () => void;
  onSubmit: (data: Partial<SafetyData>) => Promise<void>;
  initialData?: SafetyData | null;
  loading?: boolean;
}

// 安全等级选项
const safetyLevelOptions = [
  { value: 'low', label: '🟢 低风险', color: '#52c41a' },
  { value: 'medium', label: '🟡 中等风险', color: '#faad14' },
  { value: 'high', label: '🟠 高风险', color: '#fa8c16' },
  { value: 'critical', label: '🔴 极高风险', color: '#f5222d' }
];

// 矿区类型选项
const mineTypeOptions = [
  { value: 'coal', label: '煤矿' },
  { value: 'metal', label: '金属矿' },
  { value: 'nonmetal', label: '非金属矿' },
  { value: 'openpit', label: '露天矿' }
];

// 安全类别选项
const categoryOptions = [
  { value: 'gas_detection', label: '瓦斯检测' },
  { value: 'equipment_safety', label: '设备安全' },
  { value: 'emergency_response', label: '应急响应' },
  { value: 'safety_training', label: '安全培训' },
  { value: 'accident_prevention', label: '事故预防' },
  { value: 'environmental_protection', label: '环境保护' }
];

const DataForm: React.FC<DataFormProps> = ({
  visible = true,
  onCancel,
  onSubmit,
  initialData,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 当初始数据变化时，更新表单
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        publishDate: (initialData.publishDate || initialData.createdAt) ? new Date(initialData.publishDate || initialData.createdAt) : null,
        province: initialData.province,
        city: initialData.city,
        district: initialData.district
      });
      // 设置文件列表
      if (initialData.downloadUrl) {
        setFileList([{
          uid: '1',
          name: initialData.title + '.pdf',
          status: 'done',
          url: initialData.downloadUrl
        }]);
      }
    } else {
      form.resetFields();
      setFileList([]);
    }
  }, [initialData, form]);

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      // 处理文件上传
      let downloadUrl = '';
      if (fileList.length > 0 && fileList[0].response) {
        downloadUrl = fileList[0].response.url;
      } else if (initialData?.downloadUrl) {
        downloadUrl = initialData.downloadUrl;
      }

      const submitData: Partial<SafetyData> = {
        ...values,
        downloadUrl,
        publishDate: values.publishDate?.toISOString(),
        province: values.province,
        city: values.city,
        district: values.district,
        id: initialData?.id
      };

      await onSubmit(submitData);
      message.success(initialData ? '更新成功！' : '添加成功！');
      handleCancel();
    } catch (error) {
      console.error('表单提交失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  // 文件上传配置
  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
      setFileList(newFileList);
    },
    beforeUpload: (file: File) => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type.startsWith('image/') ||
                         file.type.includes('document');
      if (!isValidType) {
        message.error('只能上传 PDF、图片或文档格式的文件！');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB！');
        return false;
      }
      return true;
    }
  };

  // 如果visible为false，不渲染
  if (visible === false) {
    return null;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        safetyLevel: 'medium',
        mineType: 'coal',
        category: 'gas_detection'
      }}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="title"
            label="资料标题"
            rules={[
              { required: true, message: '请输入资料标题' },
              { min: 5, message: '标题至少5个字符' },
              { max: 100, message: '标题不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入详细的资料标题" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="safetyLevel"
            label="安全等级"
            rules={[{ required: true, message: '请选择安全等级' }]}
          >
            <Select placeholder="选择安全等级">
              {safetyLevelOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <span style={{ color: option.color }}>{option.label}</span>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="mineType"
            label="矿区类型"
            rules={[{ required: true, message: '请选择矿区类型' }]}
          >
            <Select placeholder="选择矿区类型">
              {mineTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="category"
            label="安全类别"
            rules={[{ required: true, message: '请选择安全类别' }]}
          >
            <Select placeholder="选择安全类别">
              {categoryOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="province"
            label="省份"
            rules={[{ required: true, message: '请输入省份' }]}
          >
            <Input placeholder="请输入省份" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="city"
            label="城市"
            rules={[{ required: true, message: '请输入城市' }]}
          >
            <Input placeholder="请输入城市" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="district"
            label="区县"
          >
            <Input placeholder="请输入区县（可选）" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="publishDate"
            label="发布日期"
            rules={[{ required: true, message: '请选择发布日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择发布日期" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="viewCount"
            label="浏览次数"
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="浏览次数（可选）"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="description"
            label="资料描述"
            rules={[
              { required: true, message: '请输入资料描述' },
              { min: 10, message: '描述至少10个字符' },
              { max: 500, message: '描述不能超过500个字符' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述该安全资料的内容、适用范围和重要性..."
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="file"
            label="上传文件"
            extra="支持 PDF、图片、文档格式，文件大小不超过 10MB"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Row justify="end" style={{ marginTop: 24 }}>
        <Space>
          <Button onClick={handleCancel} icon={<CloseOutlined />}>
            取消
          </Button>
          <Button
            type="primary"
            loading={submitting || loading}
            onClick={handleSubmit}
            icon={<SaveOutlined />}
          >
            {initialData ? '更新' : '添加'}
          </Button>
        </Space>
      </Row>
    </Form>
  );
};

export default DataForm;
