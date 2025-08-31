// 数据详情页面
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Breadcrumb,
  Descriptions,
  message,
  Spin
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  TagsOutlined,
  HomeOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { SafetyData } from '../../types/safety';
import { useSafetyDataStore } from '../../store/safetyDataStore';
import { apiService } from '../../services/api';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

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

const DataDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 防止重复调用API的ref
  const viewCountUpdated = useRef<string | null>(null);

  useEffect(() => {
    const loadDataDetail = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      // 获取当前store状态，避免依赖allData变化
      const currentAllData = useSafetyDataStore.getState().data;
      
      // 首先尝试从本地store查找数据，确保界面可以立即显示
      const localItem = currentAllData.find(item => String(item.id) === id);
      if (localItem) {
        setData(localItem);
        setLoading(false);
        
        // 检查是否已经为此ID调用过API，防止重复计数
        if (viewCountUpdated.current !== id) {
          viewCountUpdated.current = id;
          
          // 在后台调用API来增加浏览次数，但不影响界面显示
          try {
            console.log('📊 后台调用API增加浏览次数，ID:', id);
            await apiService.getSafetyDataById(Number(id));
            console.log('✅ 浏览次数更新成功');
          } catch (error) {
            console.warn('⚠️ 浏览次数更新失败（不影响界面显示）:', error);
            // 如果API调用失败，重置ref以便下次重试
            viewCountUpdated.current = null;
          }
        } else {
          console.log('📊 该ID已更新过浏览次数，跳过重复调用');
        }
        return;
      }

      // 如果本地没有数据，尝试API调用
      try {
        setLoading(true);
        console.log('🔄 本地无数据，尝试API获取详情...');
        const item = await apiService.getSafetyDataById(Number(id));
        setData(item);
        viewCountUpdated.current = id; // 记录已调用
        console.log('✅ API获取详情成功');
      } catch (error) {
        console.error('❌ API获取详情失败:', error);
        message.error('数据不存在或加载失败，请返回列表页重新加载数据');
        // 不直接跳转，让用户自己决定是否返回
      } finally {
        setLoading(false);
      }
    };

    loadDataDetail();
  }, [id]); // 只依赖id，避免因allData变化导致重复执行

  // 处理下载
  const handleDownload = () => {
    if (data?.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
      message.success('开始下载');
    } else {
      message.warning('暂无下载链接');
    }
  };


  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
        <Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
        <Content style={{ padding: '24px' }}>
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <Title level={3}>数据不存在</Title>
            <Button type="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Content style={{ padding: '24px' }}>
        {/* 面包屑导航 */}
        <Breadcrumb
          style={{ marginBottom: 24 }}
          items={[
            {
              href: '/',
              title: (
                <Space>
                  <HomeOutlined />
                  <span>首页</span>
                </Space>
              ),
            },
            {
              href: '/data-management',
              title: (
                <Space>
                  <DatabaseOutlined />
                  <span>数据管理</span>
                </Space>
              ),
            },
            {
              title: (
                <Space>
                  <FileTextOutlined />
                  <span>数据详情</span>
                </Space>
              ),
            },
          ]}
        />

        {/* 返回按钮 */}
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          返回
        </Button>

        {/* 主要内容 */}
        <Row gutter={24}>
          {/* 左侧主要信息 */}
          <Col span={16}>
            <Card
              style={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* 标题和标签 */}
              <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ color: MINING_BLUE_COLORS.primary, marginBottom: 16 }}>
                  {data.title}
                </Title>
                <Space wrap>
                  <Tag color={safetyLevelConfig[data.safetyLevel].color} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {safetyLevelConfig[data.safetyLevel].icon} {safetyLevelConfig[data.safetyLevel].label}
                  </Tag>
                  <Tag color={mineTypeConfig[data.mineType].color} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {mineTypeConfig[data.mineType].label}
                  </Tag>
                  <Tag color={categoryConfig[data.category].color} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {categoryConfig[data.category].label}
                  </Tag>
                </Space>
              </div>

              {/* 描述 */}
              <div style={{ marginBottom: 24 }}>
                <Title level={4}>详细描述</Title>
                <Paragraph style={{ fontSize: 16, lineHeight: 1.8, color: '#333' }}>
                  {data.description}
                </Paragraph>
              </div>

              {/* 标签 */}
              {data.tags && data.tags.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={4}>
                    <TagsOutlined style={{ marginRight: 8 }} />
                    相关标签
                  </Title>
                  <Space wrap>
                    {data.tags.map((tag, index) => (
                      <Tag key={index} color="blue" style={{ fontSize: 13, padding: '2px 8px' }}>
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              {/* 地理位置信息 */}
              <div style={{ marginBottom: 24 }}>
                <Title level={4}>
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  地理位置
                </Title>
                <Card size="small" style={{ background: '#f8f9fa' }}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="省份">{data.province}</Descriptions.Item>
                    <Descriptions.Item label="城市">{data.city}</Descriptions.Item>
                    {data.district && (
                      <Descriptions.Item label="区县">{data.district}</Descriptions.Item>
                    )}
                    {data.address && (
                      <Descriptions.Item label="详细地址" span={2}>{data.address}</Descriptions.Item>
                    )}
                    {data.latitude && data.longitude && (
                      <>
                        <Descriptions.Item label="纬度">{data.latitude}</Descriptions.Item>
                        <Descriptions.Item label="经度">{data.longitude}</Descriptions.Item>
                      </>
                    )}
                  </Descriptions>
                </Card>
              </div>
            </Card>
          </Col>

          {/* 右侧信息面板 */}
          <Col span={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 操作按钮 */}
              <Card
                title="操作"
                style={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    block
                    size="large"
                    disabled={!data.downloadUrl}
                  >
                    下载资料
                  </Button>
                  <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', display: 'block' }}>
                    {data.downloadUrl ? `文件大小: ${data.fileSize || '未知'}` : '暂无下载链接'}
                  </Text>
                </Space>
              </Card>

              {/* 基本信息 */}
              <Card
                title="基本信息"
                style={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item 
                    label={<><CalendarOutlined style={{ marginRight: 4 }} />发布日期</>}
                  >
                    {formatDate(data.publishDate || data.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item 
                    label={<><EyeOutlined style={{ marginRight: 4 }} />浏览次数</>}
                  >
                    {data.viewCount.toLocaleString()}
                  </Descriptions.Item>
                  {data.fileType && (
                    <Descriptions.Item label="文件类型">
                      {data.fileType.toUpperCase()}
                    </Descriptions.Item>
                  )}
                  {data.createdAt && (
                    <Descriptions.Item label="创建时间">
                      {formatDate(data.createdAt)}
                    </Descriptions.Item>
                  )}
                  {data.updatedAt && (
                    <Descriptions.Item label="更新时间">
                      {formatDate(data.updatedAt)}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              {/* 相关资料 */}
              {data.relatedItems && data.relatedItems.length > 0 && (
                <Card
                  title="相关资料"
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ color: '#666', fontSize: 14 }}>
                    暂无相关资料推荐
                  </div>
                </Card>
              )}
            </Space>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default DataDetailPage;
