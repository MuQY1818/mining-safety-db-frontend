// 建议列表组件 - 简化版本用于测试API修复
import React, { useState } from 'react';
import {
  Card,
  List,
  Tag,
  Space,
  Button,
  Typography,
  Avatar,
  Tooltip,
  Modal,
  Input,
  Select,
  Row,
  Col,
  Empty,
  Pagination
} from 'antd';
import {
  LikeOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { UserFeedback, FeedbackType, FeedbackStatus, FeedbackPriority } from '../../types/feedback';
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface FeedbackListProps {
  feedbacks: UserFeedback[];
  loading?: boolean;
  total?: number;
  current?: number;
  pageSize?: number;
  onPageChange?: (page: number, size: number) => void;
  onVote?: (id: string, type: 'up' | 'down') => void;
  showAdminActions?: boolean;
}

// 状态标签配置
const statusConfig = {
  pending: { color: 'default', label: '待处理' },
  resolved: { color: 'success', label: '已处理' },
  closed: { color: 'default', label: '已关闭' }
};

// 类型标签配置
const typeConfig = {
  bug: { color: 'red', label: '🐛 错误报告' },
  feature: { color: 'blue', label: '✨ 功能建议' },
  improvement: { color: 'purple', label: '🔧 改进建议' },
  other: { color: 'default', label: '💬 其他建议' }
};

// 优先级标签配置
const priorityConfig = {
  low: { color: 'default', label: '低' },
  medium: { color: 'blue', label: '中' },
  high: { color: 'orange', label: '高' },
  urgent: { color: 'red', label: '紧急' }
};

const FeedbackList: React.FC<FeedbackListProps> = ({
  feedbacks,
  loading = false,
  total = 0,
  current = 1,
  pageSize = 10,
  onPageChange,
  onVote,
  showAdminActions = false
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [filters, setFilters] = useState({
    type: undefined as FeedbackType | undefined,
    status: undefined as FeedbackStatus | undefined,
    priority: undefined as FeedbackPriority | undefined
  });

  // 处理查看详情
  const handleViewDetail = (feedback: UserFeedback) => {
    setSelectedFeedback(feedback);
    setDetailVisible(true);
  };

  // 处理投票
  const handleVote = (id: string, type: 'up' | 'down') => {
    onVote?.(id, type);
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  // 安全获取配置
  const getTypeConfig = (type: string) => typeConfig[type as FeedbackType] || { color: 'default', label: type };
  const getPriorityConfig = (priority?: string) => priority ? (priorityConfig[priority as FeedbackPriority] || { color: 'default', label: priority }) : null;
  const getStatusConfig = (status: string) => statusConfig[status as FeedbackStatus] || { color: 'default', label: status };

  return (
    <div>
      {/* 筛选器 */}
      <Card 
        size="small" 
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <FilterOutlined />
            筛选条件
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Select
              placeholder="建议类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              {Object.entries(typeConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="处理状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="优先级"
              allowClear
              style={{ width: '100%' }}
              value={filters.priority}
              onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
            >
              {Object.entries(priorityConfig).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => setFilters({ type: undefined, status: undefined, priority: undefined })}
            >
              清除筛选
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 建议列表 */}
      <Card>
        <List
          loading={loading}
          dataSource={feedbacks}
          renderItem={(item) => {
            const typeConf = getTypeConfig(item.type);
            const priorityConf = getPriorityConfig(item.priority);
            const statusConf = getStatusConfig(item.status);

            return (
              <List.Item
                key={item.id}
                actions={[
                  <Space key="actions">
                    <Tooltip title="查看详情">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(item)}
                      />
                    </Tooltip>
                    <Tooltip title="点赞">
                      <Button
                        type="text"
                        icon={<LikeOutlined />}
                        onClick={() => handleVote(item.id, 'up')}
                      >
                        {item.upvotes || 0}
                      </Button>
                    </Tooltip>
                  </Space>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={<UserOutlined />} 
                      style={{ backgroundColor: MINING_BLUE_COLORS.primary }}
                    />
                  }
                  title={
                    <Space>
                      <Text strong style={{ color: MINING_BLUE_COLORS.primary }}>
                        {item.title}
                      </Text>
                      <Tag color={typeConf.color}>
                        {typeConf.label}
                      </Tag>
                      {priorityConf && (
                        <Tag color={priorityConf.color}>
                          {priorityConf.label}
                        </Tag>
                      )}
                      <Tag color={statusConf.color}>
                        {statusConf.label}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Paragraph 
                        ellipsis={{ rows: 2, expandable: false }} 
                        style={{ margin: '8px 0', color: '#666' }}
                      >
                        {item.description}
                      </Paragraph>
                      <Space size="large" style={{ fontSize: 12, color: '#999' }}>
                        <span>
                          <UserOutlined style={{ marginRight: 4 }} />
                          {item.userName || '匿名用户'}
                        </span>
                        <span>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          {formatTime(item.createdAt)}
                        </span>
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
          locale={{
            emptyText: (
              <Empty
                description="暂无建议"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
        
        {/* 分页 */}
        {total > 0 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Pagination
              current={current}
              total={total}
              pageSize={pageSize}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条建议`
              }
              onChange={onPageChange}
            />
          </div>
        )}
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="建议详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedFeedback && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={getTypeConfig(selectedFeedback.type).color}>
                {getTypeConfig(selectedFeedback.type).label}
              </Tag>
              {getPriorityConfig(selectedFeedback.priority) && (
                <Tag color={getPriorityConfig(selectedFeedback.priority)!.color}>
                  优先级: {getPriorityConfig(selectedFeedback.priority)!.label}
                </Tag>
              )}
              <Tag color={getStatusConfig(selectedFeedback.status).color}>
                {getStatusConfig(selectedFeedback.status).label}
              </Tag>
            </Space>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>建议标题：</Text>
              <div>{selectedFeedback.title}</div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>详细描述：</Text>
              <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                {selectedFeedback.description}
              </div>
            </div>
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text strong>提交者：</Text>
                <div>{selectedFeedback.userName || '匿名用户'}</div>
              </Col>
              <Col span={8}>
                <Text strong>联系邮箱：</Text>
                <div>{selectedFeedback.userEmail || '未提供'}</div>
              </Col>
              <Col span={8}>
                <Text strong>提交时间：</Text>
                <div>{formatTime(selectedFeedback.createdAt)}</div>
              </Col>
            </Row>
            
            {selectedFeedback.adminReply && (
              <div style={{ marginTop: 16 }}>
                <Text strong>管理员回复：</Text>
                <div style={{ 
                  marginTop: 8, 
                  padding: 12, 
                  background: '#e6f7ff', 
                  borderRadius: 6,
                  border: '1px solid #91d5ff'
                }}>
                  {selectedFeedback.adminReply}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  回复时间：{selectedFeedback.adminRepliedAt && formatTime(selectedFeedback.adminRepliedAt)}
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeedbackList;