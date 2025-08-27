// 数据管理组件
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Table,
  Tag,
  Popconfirm,
  message,
  Typography,
  Tooltip,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { SafetyData, SafetyLevel } from '../../types/safety';
import { MINING_BLUE_COLORS } from '../../config/theme';
import DataForm from './DataForm';
import { useSafetyDataStore } from '../../store/safetyDataStore';

const { Title, Text } = Typography;

// 安全等级标签配置
const safetyLevelConfig = {
  low: { color: 'success', icon: '🟢', label: '低风险' },
  medium: { color: 'warning', icon: '🟡', label: '中等风险' },
  high: { color: 'orange', icon: '🟠', label: '高风险' },
  critical: { color: 'error', icon: '🔴', label: '极高风险' }
};

// 矿区类型标签配置
const mineTypeConfig = {
  coal: { color: 'default', label: '煤矿' },
  metal: { color: 'blue', label: '金属矿' },
  nonmetal: { color: 'green', label: '非金属矿' },
  openpit: { color: 'purple', label: '露天矿' }
};

// 安全类别标签配置
const categoryConfig = {
  gas_detection: { color: 'cyan', label: '瓦斯检测' },
  equipment_safety: { color: 'blue', label: '设备安全' },
  emergency_response: { color: 'red', label: '应急响应' },
  safety_training: { color: 'green', label: '安全培训' },
  accident_prevention: { color: 'orange', label: '事故预防' },
  environmental_protection: { color: 'lime', label: '环境保护' }
};

const DataManagement: React.FC = () => {
  const navigate = useNavigate();
  const [formVisible, setFormVisible] = useState(false);
  const [editingData, setEditingData] = useState<SafetyData | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    data,
    addData,
    updateData,
    deleteData,
    loading: storeLoading
  } = useSafetyDataStore();

  // 处理添加数据
  const handleAdd = () => {
    setEditingData(null);
    setFormVisible(true);
  };

  // 处理编辑数据
  const handleEdit = (record: SafetyData) => {
    setEditingData(record);
    setFormVisible(true);
  };

  // 处理删除数据
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deleteData(id);
      message.success('删除成功！');
    } catch (error) {
      message.error('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (formData: Partial<SafetyData>) => {
    try {
      if (editingData) {
        await updateData(editingData.id, formData);
      } else {
        await addData(formData as Omit<SafetyData, 'id'>);
      }
    } catch (error) {
      throw error; // 让表单组件处理错误
    }
  };

  // 处理查看详情
  const handleView = (record: SafetyData) => {
    navigate(`/data-detail/${record.id}`);
  };

  // 处理下载
  const handleDownload = (record: SafetyData) => {
    if (record.downloadUrl) {
      window.open(record.downloadUrl, '_blank');
    } else {
      message.warning('该资料暂无下载链接');
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 350,
      render: (text: string, record: SafetyData) => (
        <div>
          <Text strong style={{ color: MINING_BLUE_COLORS.primary, fontSize: 16 }}>
            {text}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description?.substring(0, 50)}...
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px', color: '#999' }}>
            📍 {record.location.province} {record.location.city}
          </Text>
        </div>
      )
    },
    {
      title: '安全等级',
      dataIndex: 'safetyLevel',
      key: 'safetyLevel',
      width: 120,
      render: (level: SafetyLevel) => {
        const config = safetyLevelConfig[level];
        return (
          <Tag color={config.color}>
            {config.icon} {config.label}
          </Tag>
        );
      }
    },
    {
      title: '矿区类型',
      dataIndex: 'mineType',
      key: 'mineType',
      width: 100,
      render: (type: string) => {
        const config = mineTypeConfig[type as keyof typeof mineTypeConfig];
        return <Tag color={config?.color}>{config?.label}</Tag>;
      }
    },
    {
      title: '安全类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        const config = categoryConfig[category as keyof typeof categoryConfig];
        return <Tag color={config?.color}>{config?.label}</Tag>;
      }
    },
    {
      title: '发布日期',
      dataIndex: 'publishDate',
      key: 'publishDate',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN')
    },
    {
      title: '浏览次数',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      render: (count: number) => (
        <Text type="secondary">{count || 0}</Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: SafetyData) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            >
              详情
            </Button>
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              disabled={!record.downloadUrl}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条安全资料吗？此操作不可恢复。"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDelete(record.id)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* 页面标题和操作栏 */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={4}>
              <Title level={4} style={{ margin: 0, color: MINING_BLUE_COLORS.primary }}>
                数据管理
              </Title>
              <Text type="secondary">
                管理矿区安全资料数据，支持添加、编辑、删除操作
              </Text>
            </Space>
          </Col>
          <Col>
            {/* 添加资料功能已移至主页面 */}
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card
        style={{
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={storeLoading || loading}
          pagination={{
            total: data.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* 添加/编辑表单 */}
      <DataForm
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleFormSubmit}
        initialData={editingData}
        loading={loading}
      />
    </div>
  );
};

export default DataManagement;
