// 数据表格组件
import React, { useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Tooltip,
  Popconfirm,
  Typography
} from 'antd';
import { 
  DownloadOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  RobotOutlined
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { 
  MiningLanguageItem, 
  SafetyLevel, 
  AccessLevel,
  SafetyCategory,
  MiningType,
  LanguageType
} from '../../types/database';
// 显示标签
const safetyLevelLabels = {
  LOW: '低风险',
  MEDIUM: '中等风险', 
  HIGH: '高风险',
  CRITICAL: '极高风险'
};

const miningTypeLabels = {
  COAL: '煤矿',
  METAL: '金属矿',
  NON_METAL: '非金属矿',
  OPEN_PIT: '露天矿'
};

const safetyCategoryLabels = {
  GAS_SAFETY: '瓦斯安全',
  MECHANICAL_SAFETY: '机械安全',
  FIRE_SAFETY: '消防安全',
  ELECTRICAL_SAFETY: '电气安全',
  CHEMICAL_SAFETY: '化学安全',
  STRUCTURAL_SAFETY: '结构安全',
  PERSONAL_PROTECTION: '个人防护',
  EMERGENCY_RESPONSE: '应急响应',
  ENVIRONMENTAL_SAFETY: '环境安全',
  TRAINING_EDUCATION: '培训教育'
};

const languageTypeLabels = {
  CHINESE: '中文',
  ENGLISH: '英文',
  BILINGUAL: '双语',
  MULTILINGUAL: '多语言'
};

const accessLevelLabels = {
  PUBLIC: '公开访问',
  INTERNAL: '内部访问',
  RESTRICTED: '受限访问'
};
import { MINING_BLUE_COLORS } from '../../config/theme';

const { Text } = Typography;

// 安全等级颜色映射
const safetyLevelColors: Record<SafetyLevel, string> = {
  [SafetyLevel.LOW]: 'success',
  [SafetyLevel.MEDIUM]: 'warning',
  [SafetyLevel.HIGH]: 'orange',
  [SafetyLevel.CRITICAL]: 'error'
};

// 安全等级图标映射
const safetyLevelIcons: Record<SafetyLevel, string> = {
  [SafetyLevel.LOW]: '🟢',
  [SafetyLevel.MEDIUM]: '🟡',
  [SafetyLevel.HIGH]: '🟠',
  [SafetyLevel.CRITICAL]: '🔴'
};

// 访问权限颜色映射
const accessLevelColors: Record<AccessLevel, string> = {
  [AccessLevel.PUBLIC]: 'green',
  [AccessLevel.INTERNAL]: 'blue',
  [AccessLevel.RESTRICTED]: 'red'
};

interface DataTableProps {
  data: MiningLanguageItem[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    onChange: (page: number, pageSize: number) => void;
  };
  onEdit?: (record: MiningLanguageItem) => void;
  onDelete?: (record: MiningLanguageItem) => void;
  onDownload?: (record: MiningLanguageItem) => void;
  onPreview?: (record: MiningLanguageItem) => void;
  onAIAnalyze?: (record: MiningLanguageItem) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  loading = false,
  pagination,
  onEdit,
  onDelete,
  onDownload,
  onPreview,
  onAIAnalyze
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 格式化文件大小
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 表格列定义
  const columns: ColumnsType<MiningLanguageItem> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      render: (title: string, record) => (
        <Tooltip title={record.description || title}>
          <div>
            <Text strong style={{ color: MINING_BLUE_COLORS.primary }}>
              {title}
            </Text>
            {record.version && (
              <Tag style={{ marginLeft: 8, fontSize: '11px' }}>
                {record.version}
              </Tag>
            )}
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.standardCode && `标准编码: ${record.standardCode}`}
            </Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: '安全类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: SafetyCategory) => (
        <Tag color="blue">{safetyCategoryLabels[category]}</Tag>
      ),
      filters: Object.entries(safetyCategoryLabels).map(([key, label]) => ({
        text: label,
        value: key,
      })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: '安全等级',
      dataIndex: 'safetyLevel',
      key: 'safetyLevel',
      width: 120,
      render: (level: SafetyLevel) => (
        <Tag 
          color={safetyLevelColors[level]}
          style={{ fontWeight: 'bold' }}
        >
          {safetyLevelIcons[level]} {safetyLevelLabels[level]}
        </Tag>
      ),
      filters: Object.entries(safetyLevelLabels).map(([key, label]) => ({
        text: label,
        value: key,
      })),
      onFilter: (value, record) => record.safetyLevel === value,
      sorter: (a, b) => {
        const order = [SafetyLevel.LOW, SafetyLevel.MEDIUM, SafetyLevel.HIGH, SafetyLevel.CRITICAL];
        return order.indexOf(a.safetyLevel) - order.indexOf(b.safetyLevel);
      },
    },
    {
      title: '矿区类型',
      dataIndex: 'miningType',
      key: 'miningType',
      width: 100,
      render: (type: MiningType) => (
        <Tag color="purple">{miningTypeLabels[type]}</Tag>
      ),
      filters: Object.entries(miningTypeLabels).map(([key, label]) => ({
        text: label,
        value: key,
      })),
      onFilter: (value, record) => record.miningType === value,
    },
    {
      title: '语言类型',
      dataIndex: 'languageType',
      key: 'languageType',
      width: 100,
      render: (type: LanguageType) => (
        <Tag color="cyan">{languageTypeLabels[type]}</Tag>
      ),
    },
    {
      title: '访问权限',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      width: 100,
      render: (level: AccessLevel) => (
        <Tag color={accessLevelColors[level]}>
          {accessLevelLabels[level]}
        </Tag>
      ),
    },
    {
      title: '文件信息',
      key: 'fileInfo',
      width: 120,
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '12px' }}>
            {record.fileType || 'PDF'}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {formatFileSize(record.fileSize)}
          </Text>
        </div>
      ),
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      key: 'authorName',
      width: 100,
      render: (author?: string) => author || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 140,
      render: (date: string) => (
        <Text style={{ fontSize: '12px' }}>
          {formatDate(date)}
        </Text>
      ),
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => onPreview?.(record)}
            />
          </Tooltip>
          
          <Tooltip title="下载">
            <Button 
              type="text" 
              size="small" 
              icon={<DownloadOutlined />}
              onClick={() => onDownload?.(record)}
              style={{ color: MINING_BLUE_COLORS.primary }}
            />
          </Tooltip>
          
          <Tooltip title="AI解读">
            <Button 
              type="text" 
              size="small" 
              icon={<RobotOutlined />}
              onClick={() => onAIAnalyze?.(record)}
              style={{ color: '#722ed1' }}
            />
          </Tooltip>
          
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => onEdit?.(record)}
              style={{ color: '#faad14' }}
            />
          </Tooltip>
          
          <Popconfirm
            title="确认删除"
            description="确定要删除这条记录吗？"
            onConfirm={() => onDelete?.(record)}
            okText="确认"
            cancelText="取消"
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
      ),
    },
  ];

  // 行选择配置
  const rowSelection: TableProps<MiningLanguageItem>['rowSelection'] = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      {/* 批量操作栏 */}
      {selectedRowKeys.length > 0 && (
        <div style={{
          marginBottom: 20,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)'
        }}>
          <Space size="middle">
            <Text style={{ color: 'white', fontWeight: '600' }}>
              ✅ 已选择 {selectedRowKeys.length} 项
            </Text>
            <Button
              size="small"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                borderRadius: '8px'
              }}
            >
              批量下载
            </Button>
            <Button
              size="small"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                borderRadius: '8px'
              }}
            >
              批量编辑
            </Button>
            <Button
              size="small"
              danger
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ff7875',
                borderRadius: '8px'
              }}
            >
              批量删除
            </Button>
          </Space>
        </div>
      )}

      {/* 数据表格 */}
      <Table<MiningLanguageItem>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={pagination ? {
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          pageSizeOptions: ['10', '20', '50', '100'],
          style: {
            marginTop: '24px',
            textAlign: 'center'
          }
        } : false}
        rowSelection={rowSelection}
        scroll={{ x: 1400 }}
        size="middle"
        bordered={false}
        style={{
          background: 'white',
          borderRadius: '12px'
        }}
        rowClassName={(record, index) =>
          index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
        }
      />
    </div>
  );
};

export default DataTable;
