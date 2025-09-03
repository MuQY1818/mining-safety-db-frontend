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
  Space,
  App
} from 'antd';
import dayjs from 'dayjs';
import {
  UploadOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { SafetyData, UploadSafetyDataRequest } from '../../types/safety';
import type { UploadFile } from 'antd/es/upload/interface';
import { apiService } from '../../services/api';
import { DEFAULT_UPLOAD_CONFIG } from '../../api/endpoints';

const { TextArea } = Input;
const { Option } = Select;

interface DataFormProps {
  visible?: boolean;
  onCancel: () => void;
  onSubmit: (data: UploadSafetyDataRequest | SafetyData) => Promise<void>;
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
  
  // 使用Antd App组件的notification API
  const { notification: appNotification } = App.useApp();


  // 当初始数据变化时，更新表单
  useEffect(() => {
    if (initialData) {
      // 安全的日期转换处理
      const dateStr = initialData.publishDate || initialData.createdAt;
      let publishDate = null;
      if (dateStr) {
        try {
          publishDate = dayjs(dateStr);
          // 验证日期是否有效
          if (!publishDate.isValid()) {
            console.warn('无效的日期格式:', dateStr);
            publishDate = null;
          }
        } catch (error) {
          console.warn('日期格式转换失败:', dateStr, error);
          publishDate = null;
        }
      }

      form.setFieldsValue({
        ...initialData,
        publishDate: publishDate,
        province: initialData.province,
        city: initialData.city,
        district: initialData.district
      });
      
      console.log('📅 设置表单日期值:', {
        原始日期: dateStr,
        转换后: publishDate?.format?.('YYYY-MM-DD') || null,
        有效性: publishDate?.isValid?.() || false
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
      console.log('🔄 开始表单提交，验证字段...');
      
      const values = await form.validateFields();
      console.log('✅ 表单验证成功，字段值:', values);
      
      // 处理文件上传
      let downloadUrl = '';
      let fileType = '';
      let fileSize = '0';
      
      if (fileList.length > 0 && fileList[0].response) {
        downloadUrl = fileList[0].response.url;
        fileType = fileList[0].type || fileList[0].response.type || '';
        fileSize = fileList[0].size?.toString() || fileList[0].response.size?.toString() || '0';
        console.log('📁 使用上传的文件URL:', downloadUrl);
      } else if (initialData?.downloadUrl) {
        downloadUrl = initialData.downloadUrl;
        fileType = initialData.fileType || '';
        fileSize = initialData.fileSize || '0';
        console.log('📁 使用初始数据的文件URL:', downloadUrl);
      } else {
        console.log('⚠️ 没有找到文件URL');
      }

      // 根据API文档，枚举值直接使用前端格式，无需映射转换
      console.log('📋 表单原始值（按API文档格式）:', {
        safetyLevel: values.safetyLevel, // API文档: "low", "medium", "high", "critical"
        mineType: values.mineType,       // API文档: "coal", "metal", "nonmetal", "openpit"
        category: values.category        // API文档: "gas_detection", "equipment_safety", 等等
      });

      // 构造完全匹配后端UploadSafetyDataRequest的数据
      const submitData: UploadSafetyDataRequest = {
        title: values.title,
        description: values.description,
        safetyLevel: values.safetyLevel,  // 直接使用API文档格式
        mineType: values.mineType,        // 直接使用API文档格式  
        category: values.category,        // 直接使用API文档格式
        province: values.province,
        city: values.city,
        district: values.district || '未指定区县',
        address: '默认详细地址',
        longitude: '116.407526',
        latitude: '39.904030',
        downloadUrl: downloadUrl || 'http://placeholder.example.com/default.pdf',
        fileSize: fileSize,
        fileType: fileType || 'application/pdf',
        relatedItems: [],
        tags: []
      };

      console.log('🚀 准备提交数据:', submitData);
      await onSubmit(submitData);
      message.success(initialData ? '更新成功！' : '添加成功！');
      handleCancel();
    } catch (error: any) {
      console.error('❌ 表单提交失败:', error);
      
      // 区分验证错误和提交错误
      if (error.errorFields) {
        console.error('📋 表单验证失败的字段:', error.errorFields);
        message.error('请检查表单填写是否完整');
        // 自动滚动到第一个错误字段
        form.scrollToField(error.errorFields[0].name);
      } else {
        message.error(`操作失败: ${error.message || '请重试'}`);
      }
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
      console.log('📁 文件列表变化:', newFileList.map(f => ({
        name: f.name,
        status: f.status,
        uid: f.uid
      })));
      
      // 自动删除验证失败的文件（status为error或undefined的文件）
      const validFiles = newFileList.filter(file => 
        file.status !== 'error' && file.status !== undefined
      );
      
      if (validFiles.length !== newFileList.length) {
        console.log('🗑️ 自动删除验证失败的文件，删除数量:', newFileList.length - validFiles.length);
        // 延迟一小段时间再删除，确保用户能看到错误信息
        setTimeout(() => {
          setFileList(validFiles);
        }, 2000); // 2秒后自动删除失败文件
        return;
      }
      
      setFileList(newFileList);
    },
    beforeUpload: (file: File) => {
      console.log('📁 文件上传检测:', { 
        fileName: file.name, 
        fileType: file.type, 
        fileSize: file.size 
      });

      // 检查文件类型是否在允许列表中
      const isValidType = DEFAULT_UPLOAD_CONFIG.allowedTypes.includes(file.type);
      if (!isValidType) {
        // 提供更详细的错误信息，包括支持的格式
        const supportedFormats = [
          'PDF文档(.pdf)', 
          'Office文档(.doc/.docx/.xls/.xlsx/.ppt/.pptx)', 
          '文本文档(.txt/.rtf/.odt)',
          '视频文件(.mp4/.avi/.mov/.wmv/.flv/.webm/.3gp)', 
          '音频文件(.mp3/.wav/.ogg/.aac)',
          '图片文件(.jpg/.jpeg/.png/.gif/.webp/.bmp/.svg/.tiff)'
        ].join('、');
        appNotification.error({
          message: '❌ 文件格式不支持！',
          description: (
            <div>
              <p><strong>当前文件类型：</strong>{file.type || '未识别'}</p>
              <p><strong>📋 支持的格式：</strong></p>
              <p>{supportedFormats}</p>
            </div>
          ),
          duration: 8,
          placement: 'topRight',
        });
        return false;
      }

      // 检查文件大小
      const maxSizeMB = DEFAULT_UPLOAD_CONFIG.maxSize / 1024 / 1024;
      const fileSizeMB = file.size / 1024 / 1024;
      if (file.size > DEFAULT_UPLOAD_CONFIG.maxSize) {
        appNotification.error({
          message: '📏 文件大小超出限制！',
          description: (
            <div>
              <p><strong>当前文件：</strong>{fileSizeMB.toFixed(2)}MB</p>
              <p><strong>最大允许：</strong>{maxSizeMB}MB</p>
              <p><strong>💡 建议：</strong>请选择小于500MB的文件</p>
            </div>
          ),
          duration: 6,
          placement: 'topRight',
        });
        return false;
      }

      console.log('✅ 文件检测通过');
      return true;
    },
    customRequest: async (options: any) => {
      const { file, onSuccess, onError } = options;
      
      // 显示开始上传提示
      const hideUploadingMessage = message.loading({
        content: `正在上传 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`,
        duration: 0 // 不自动消失
      });
      
      try {
        console.log('📁 开始通过customRequest上传文件:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        // 调用上传API
        const response = await apiService.uploadFile(file);
        
        console.log('✅ customRequest文件上传成功:', response);
        
        // 关闭上传中提示
        hideUploadingMessage();
        
        // 验证响应数据
        if (!response || !response.url) {
          throw new Error('服务器返回数据不完整');
        }
        
        // 上传成功，调用onSuccess并传入响应数据和文件信息
        onSuccess({
          ...response,
          name: file.name,
          size: file.size,
          type: file.type
        }, file);
        
        // 显示详细的成功提示
        appNotification.success({
          message: '🎉 文件上传成功！',
          description: (
            <div>
              <p><strong>📄 文件名：</strong>{file.name}</p>
              <p><strong>📏 文件大小：</strong>{(file.size / 1024 / 1024).toFixed(2)}MB</p>
              <p><strong>✅ 状态：</strong>已准备就绪，可以提交表单</p>
            </div>
          ),
          duration: 4,
          placement: 'topRight',
        });
      } catch (error: any) {
        console.error('❌ customRequest文件上传失败:', error);
        
        // 关闭上传中提示
        hideUploadingMessage();
        
        onError(error);
        
        // 上传失败时自动从文件列表中删除
        setFileList(prev => prev.filter(item => item.uid !== file.uid));
        
        // 显示详细的错误提示
        const errorMessage = error.message || error.response?.data?.msg || '上传服务异常';
        appNotification.error({
          message: '❌ 文件上传失败！',
          description: (
            <div>
              <p><strong>📄 文件名：</strong>{file.name}</p>
              <p><strong>📏 文件大小：</strong>{(file.size / 1024 / 1024).toFixed(2)}MB</p>
              <p><strong>🔍 错误原因：</strong>{errorMessage}</p>
              <p><strong>💡 建议：</strong>文件已自动删除，请重新选择文件上传</p>
            </div>
          ),
          duration: 8,
          placement: 'topRight',
        });
      }
    },
    maxCount: 1, // 限制只能上传一个文件
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
            extra="支持 PDF、Office文档、图片、视频格式，文件大小不超过 500MB"
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
