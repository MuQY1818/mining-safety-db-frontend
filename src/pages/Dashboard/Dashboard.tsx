// 主数据展示页面 - 整合数据管理功能
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  message,
  Table,
  Tag,
  Tooltip,
  Modal,
  Popconfirm,
  Input,
  Select
} from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SafetyOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { SafetyData, UploadSafetyDataRequest } from '../../types/safety';
import { useSafetyDataStore } from '../../store/safetyDataStore';
import { useAuthStore } from '../../store/authStore';
import DataForm from '../../components/DataManagement/DataForm';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// 安全等级配置
const safetyLevelConfig = {
  low: { color: 'success', icon: '🟢', label: '低风险' },
  medium: { color: 'warning', icon: '🟡', label: '中等风险' },
  high: { color: 'orange', icon: '🟠', label: '高风险' },
  critical: { color: 'error', icon: '🔴', label: '极高风险' }
};

// 矿区类型配置
const mineTypeConfig = {
  coal: { color: 'default', label: '煤矿' },
  metal: { color: 'blue', label: '金属矿' },
  nonmetal: { color: 'green', label: '非金属矿' },
  openpit: { color: 'purple', label: '露天矿' }
};

// 安全类别配置
const categoryConfig = {
  gas_detection: { color: 'cyan', label: '瓦斯检测' },
  equipment_safety: { color: 'blue', label: '设备安全' },
  emergency_response: { color: 'red', label: '应急响应' },
  safety_training: { color: 'green', label: '安全培训' },
  accident_prevention: { color: 'orange', label: '事故预防' },
  environmental_protection: { color: 'lime', label: '环境保护' }
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [formVisible, setFormVisible] = useState(false);
  const [editingData, setEditingData] = useState<SafetyData | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  
  const { 
    data, 
    addData, 
    updateData, 
    deleteData, 
    fetchData,
    loading: storeLoading 
  } = useSafetyDataStore();

  // 获取认证状态和persist恢复状态
  const { isAuthenticated, hasHydrated, user } = useAuthStore();

  // 初始化数据加载 - 等待persist恢复完成后判断认证状态
  useEffect(() => {
    if (hasHydrated) {
      if (isAuthenticated && !storeLoading) {
        console.log('🔄 Dashboard认证恢复完成，开始加载数据');
        fetchData();
      } else if (!isAuthenticated) {
        console.log('⚠️ 用户未认证，跳过数据加载');
      }
    } else {
      console.log('⏳ 等待认证状态恢复...');
    }
  }, [hasHydrated, isAuthenticated, fetchData]); // 添加hasHydrated依赖

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
  const handleDelete = async (id: number) => {
    try {
      await deleteData(String(id));
      message.success('删除成功！');
    } catch (error) {
      message.error('删除失败，请重试');
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
      message.success('开始下载');
    } else {
      message.warning('该资料暂无下载链接');
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (formData: UploadSafetyDataRequest | SafetyData) => {
    try {
      if (editingData) {
        // 编辑模式：将formData作为SafetyData的部分更新
        await updateData(String(editingData.id), formData as Partial<SafetyData>);
        message.success('更新成功！');
      } else {
        // 添加模式：formData是UploadSafetyDataRequest类型
        await addData(formData as UploadSafetyDataRequest);
        message.success('添加成功！');
      }
      setFormVisible(false);
      setEditingData(null);
    } catch (error) {
      throw error; // 让表单组件处理错误
    }
  };

  // 筛选数据
  const filteredData = data.filter(item => {
    const matchKeyword = !searchKeyword || 
      item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.description.toLowerCase().includes(searchKeyword.toLowerCase());
    
    const matchCategory = !selectedCategory || item.category === selectedCategory;
    const matchLevel = !selectedLevel || item.safetyLevel === selectedLevel;
    
    return matchKeyword && matchCategory && matchLevel;
  });

  // 统计数据
  const stats = {
    total: data.length,
    low: data.filter(item => item.safetyLevel === 'low').length,
    medium: data.filter(item => item.safetyLevel === 'medium').length,
    high: data.filter(item => item.safetyLevel === 'high').length,
    critical: data.filter(item => item.safetyLevel === 'critical').length
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
            📍 {record.province} {record.city}
          </Text>
        </div>
      )
    },
    {
      title: '类型与等级',
      key: 'typeAndLevel',
      width: 200,
      render: (_: any, record: SafetyData) => (
        <Space direction="vertical" size="small">
          <Tag color={safetyLevelConfig[record.safetyLevel].color}>
            {safetyLevelConfig[record.safetyLevel].icon} {safetyLevelConfig[record.safetyLevel].label}
          </Tag>
          <Tag color={mineTypeConfig[record.mineType].color}>
            {mineTypeConfig[record.mineType].label}
          </Tag>
        </Space>
      )
    },
    {
      title: '发布信息',
      key: 'publishInfo',
      width: 150,
      render: (_: any, record: SafetyData) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: 12 }}>
            {new Date(record.publishDate || record.createdAt).toLocaleDateString('zh-CN')}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <EyeOutlined style={{ marginRight: 4 }} />
            {record.viewCount.toLocaleString()}
          </Text>
        </Space>
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
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Content style={{ padding: '24px', background: '#ffffff' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Title level={2} style={{ color: MINING_BLUE_COLORS.primary, margin: 0 }}>
            矿区安全语言资料数据库
          </Title>
          <Text type="secondary">专业的矿区安全知识资源管理平台</Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FileTextOutlined style={{ fontSize: 24, color: MINING_BLUE_COLORS.primary, marginRight: 12 }} />
                <div>
                  <Text type="secondary">总资料数</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: MINING_BLUE_COLORS.primary }}>
                    {stats.total}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <SafetyOutlined style={{ fontSize: 24, color: '#52c41a', marginRight: 12 }} />
                <div>
                  <Text type="secondary">低风险</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {stats.low}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <SafetyOutlined style={{ fontSize: 24, color: '#faad14', marginRight: 12 }} />
                <div>
                  <Text type="secondary">中等风险</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                    {stats.medium}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <SafetyOutlined style={{ fontSize: 24, color: '#ff4d4f', marginRight: 12 }} />
                <div>
                  <Text type="secondary">高风险</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                    {stats.high + stats.critical}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 操作栏 */}
        <Card style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                {/* 只有管理员用户才显示添加资料按钮 */}
                {user?.role === 'admin' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    size="large"
                  >
                    添加资料
                  </Button>
                )}
                <Button
                  icon={<DownloadOutlined />}
                  size="large"
                >
                  导出数据
                </Button>
                <Button
                  icon={<BarChartOutlined />}
                  size="large"
                >
                  统计分析
                </Button>
              </Space>
            </Col>
            <Col>
              <Space>
                <Search
                  placeholder="搜索资料标题、描述..."
                  allowClear
                  style={{ width: 250 }}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <Select
                  placeholder="安全类别"
                  allowClear
                  style={{ width: 120 }}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                >
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <Option key={key} value={key}>
                      {config.label}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="安全等级"
                  allowClear
                  style={{ width: 120 }}
                  value={selectedLevel}
                  onChange={setSelectedLevel}
                >
                  {Object.entries(safetyLevelConfig).map(([key, config]) => (
                    <Option key={key} value={key}>
                      {config.label}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 数据表格 */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={storeLoading}
            pagination={{
              total: filteredData.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条资料`
            }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* 数据表单模态框 */}
        <Modal
          title={editingData ? '编辑资料' : '添加资料'}
          open={formVisible}
          onCancel={() => {
            setFormVisible(false);
            setEditingData(null);
          }}
          footer={null}
          width={800}
          destroyOnClose
        >
          <DataForm
            initialData={editingData}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setFormVisible(false);
              setEditingData(null);
            }}
          />
        </Modal>
      </Content>
    </Layout>
  );
};

export default Dashboard;
