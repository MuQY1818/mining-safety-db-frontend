// 用户建议页面
import React, { useState, useEffect } from 'react';
import {
  Layout,
  Breadcrumb,
  Space,
  Tabs,
  Card,
  Statistic,
  Row,
  Col,
  Typography
} from 'antd';
import {
  HomeOutlined,
  BulbOutlined,
  FormOutlined,
  UnorderedListOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import FeedbackForm from '../../components/Feedback/FeedbackForm';
import FeedbackList from '../../components/Feedback/FeedbackList';
import { FeedbackFormData } from '../../types/feedback';
import { useFeedbackStore } from '../../store/feedbackStore';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;

const FeedbackPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('submit');

  const {
    feedbacks,
    filteredFeedbacks,
    loading,
    stats,
    pagination,
    fetchFeedbacks,
    submitFeedback,
    voteFeedback,
    fetchStats
  } = useFeedbackStore();

  // 页面加载时获取数据 - fetchStats 会在 fetchFeedbacks 完成后自动调用
  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // 处理建议提交
  const handleSubmitFeedback = async (data: FeedbackFormData) => {
    try {
      await submitFeedback(data);
      // 提交成功后切换到列表页面
      setActiveTab('list');
    } catch (error) {
      // 错误已在store中处理
    }
  };

  // 处理投票
  const handleVote = (id: number, type: 'up' | 'down') => {
    voteFeedback(id, type);
  };

  // 统计数据
  const displayStats = stats || {
    total: feedbacks.length,
    byStatus: {
      pending: feedbacks.filter(f => f.status === 'pending').length,
      resolved: feedbacks.filter(f => f.status === 'resolved').length,
      closed: feedbacks.filter(f => f.status === 'closed').length
    }
  };

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
              title: (
                <Space>
                  <BulbOutlined />
                  <span>用户建议</span>
                </Space>
              ),
            },
          ]}
        />

        {/* 页面标题 */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Title level={2} style={{ color: MINING_BLUE_COLORS.primary, margin: 0 }}>
            用户建议反馈
          </Title>
          <p style={{ color: '#666', marginTop: 8 }}>
            您的每一个建议都是我们前进的动力
          </p>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总建议数"
                value={displayStats.total}
                prefix={<BulbOutlined style={{ color: MINING_BLUE_COLORS.primary }} />}
                valueStyle={{ color: MINING_BLUE_COLORS.primary }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待处理"
                value={displayStats.byStatus.pending}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已处理"
                value={displayStats.byStatus.resolved}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已关闭"
                value={displayStats.byStatus.closed}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 主要内容 */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'submit',
              label: (
                <Space>
                  <FormOutlined />
                  提交建议
                </Space>
              ),
              children: (
                <FeedbackForm 
                  onSubmit={handleSubmitFeedback}
                  loading={loading}
                />
              )
            },
            {
              key: 'list',
              label: (
                <Space>
                  <UnorderedListOutlined />
                  建议列表
                </Space>
              ),
              children: (
                <FeedbackList
                  feedbacks={filteredFeedbacks}
                  loading={loading}
                  total={pagination.total}
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  onVote={handleVote}
                />
              )
            },
            {
              key: 'stats',
              label: (
                <Space>
                  <BarChartOutlined />
                  统计分析
                </Space>
              ),
              children: (
                <Card>
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <BarChartOutlined style={{ fontSize: 48, color: '#ccc' }} />
                    <p style={{ color: '#999', marginTop: 16 }}>
                      统计分析功能开发中...
                    </p>
                  </div>
                </Card>
              )
            }
          ]}
        />
      </Content>
    </Layout>
  );
};

export default FeedbackPage;
