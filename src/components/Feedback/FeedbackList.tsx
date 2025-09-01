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
  Pagination,
  Form,
  message
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
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface FeedbackListProps {
  feedbacks: UserFeedback[];
  loading?: boolean;
  total?: number;
  current?: number;
  pageSize?: number;
  onPageChange?: (page: number, size: number) => void;
  onVote?: (id: number, type: 'up' | 'down') => void;
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
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [handleVisible, setHandleVisible] = useState(false);
  const [handleLoading, setHandleLoading] = useState(false);
  const [handleForm] = Form.useForm();
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
  const handleVote = (id: number, type: 'up' | 'down') => {
    onVote?.(id, type);
  };

  // 管理员处理反馈
  const handleManageFeedback = async (feedback: UserFeedback) => {
    console.log('🔍 选中的反馈对象完整信息:', feedback);
    console.log('🔍 反馈ID类型和值:', typeof feedback.id, feedback.id);
    console.log('🔍 反馈对象的所有键:', Object.keys(feedback));
    
    try {
      // 获取最新的反馈详情，确保状态是最新的
      const latestFeedback = await apiService.getFeedbackDetail(feedback.id);
      console.log('🔄 最新反馈数据:', latestFeedback);
      
      setSelectedFeedback({...feedback, ...latestFeedback});
      handleForm.setFieldsValue({
        status: latestFeedback.status,
        reply: latestFeedback.reply || ''
      });
    } catch (error) {
      console.warn('获取最新反馈详情失败，使用当前数据:', error);
      setSelectedFeedback(feedback);
      handleForm.setFieldsValue({
        status: feedback.status,
        reply: feedback.reply || ''
      });
    }
    
    setHandleVisible(true);
  };

  // 提交处理结果
  const handleSubmitHandle = async () => {
    if (!selectedFeedback) return;
    
    try {
      setHandleLoading(true);
      const values = await handleForm.validateFields();
      
      // 参数验证
      if (!selectedFeedback.id || selectedFeedback.id <= 0) {
        message.error('无效的反馈ID');
        return;
      }
      
      if (!values.status || !values.reply?.trim()) {
        message.error('请填写完整的处理状态和回复内容');
        return;
      }
      
      // 让后端来验证状态，前端不做状态限制
      
      console.log('🔧 准备处理反馈 - 详细信息:', {
        'selectedFeedback完整对象': selectedFeedback,
        'feedbackId值': selectedFeedback.id,
        'feedbackId类型': typeof selectedFeedback.id,
        'status值': values.status,
        'reply值': values.reply,
        '表单values': values
      });
      
      await apiService.handleFeedback(
        selectedFeedback.id,
        values.status,
        values.reply
      );
      
      message.success('反馈处理成功！');
      setHandleVisible(false);
      handleForm.resetFields();
      
      // 触发页面刷新或重新获取数据
      window.location.reload();
    } catch (error: any) {
      console.error('处理反馈失败:', error);
      message.error(`处理失败：${error.message || '未知错误'}`);
    } finally {
      setHandleLoading(false);
    }
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
            // 调试：输出每个反馈项的数据结构
            console.log('📋 反馈列表项数据结构:', {
              'item完整对象': item,
              'item.id': item.id,
              'id类型': typeof item.id,
              '所有键': Object.keys(item)
            });
            
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
                    {isAdmin && (
                      <Tooltip title="处理反馈">
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleManageFeedback(item)}
                        >
                          处理
                        </Button>
                      </Tooltip>
                    )}
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
                        {item.content}
                      </Paragraph>
                      <Space size="large" style={{ fontSize: 12, color: '#999' }}>
                        <span>
                          <UserOutlined style={{ marginRight: 4 }} />
                          {item.contactInfo || '匿名用户'}
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
                {selectedFeedback.content}
              </div>
            </div>
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text strong>提交者：</Text>
                <div>{selectedFeedback.contactInfo || '匿名用户'}</div>
              </Col>
              <Col span={8}>
                <Text strong>联系邮箱：</Text>
                <div>{selectedFeedback.contactInfo || '未提供'}</div>
              </Col>
              <Col span={8}>
                <Text strong>提交时间：</Text>
                <div>{formatTime(selectedFeedback.createdAt)}</div>
              </Col>
            </Row>
            
            {selectedFeedback.reply && (
              <div style={{ marginTop: 16 }}>
                <Text strong>管理员回复：</Text>
                <div style={{ 
                  marginTop: 8, 
                  padding: 12, 
                  background: '#e6f7ff', 
                  borderRadius: 6,
                  border: '1px solid #91d5ff'
                }}>
                  {selectedFeedback.reply}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  回复时间：{formatTime(selectedFeedback.createdAt)}
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 管理员处理反馈模态框 */}
      <Modal
        title="处理反馈"
        open={handleVisible}
        onCancel={() => setHandleVisible(false)}
        onOk={handleSubmitHandle}
        confirmLoading={handleLoading}
        width={600}
      >
        {selectedFeedback && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <Text strong>反馈内容：</Text>
              <div style={{ marginTop: 8 }}>{selectedFeedback.title}</div>
              <div style={{ marginTop: 4, color: '#666' }}>{selectedFeedback.content}</div>
            </div>
            
            <Form form={handleForm} layout="vertical">
              <Form.Item
                name="status"
                label="处理状态"
                rules={[{ required: true, message: '请选择处理状态' }]}
              >
                <Select placeholder="选择状态">
                  <Option value="pending">待处理</Option>
                  <Option value="resolved">已处理</Option>
                  <Option value="closed">已关闭</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="reply"
                label="管理员回复"
                rules={[{ required: true, message: '请输入处理回复' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="请输入处理结果和回复内容..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeedbackList;