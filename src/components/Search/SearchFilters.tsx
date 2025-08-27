// 搜索和筛选组件
import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Input, 
  Select, 
  Button, 
  Space, 
  Row, 
  Col, 
  Tag,
  Tooltip,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import { 
  SearchParams, 
  SafetyCategory, 
  SafetyLevel, 
  MiningType, 
  LanguageType, 
  AccessLevel 
} from '../../types/database';
// Labels for dropdown options
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
import { useDebounce } from '../../hooks/useDebounce';

const { Option } = Select;

interface SearchFiltersProps {
  onSearch: (params: Partial<SearchParams>) => void;
  loading?: boolean;
  initialValues?: Partial<SearchParams>;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  onSearch,
  loading = false,
  initialValues = {}
}) => {
  // 状态管理
  const [keyword, setKeyword] = useState(initialValues.keyword || '');
  const [category, setCategory] = useState<SafetyCategory | undefined>(initialValues.category);
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel | undefined>(initialValues.safetyLevel);
  const [miningType, setMiningType] = useState<MiningType | undefined>(initialValues.miningType);
  const [languageType, setLanguageType] = useState<LanguageType | undefined>(initialValues.languageType);
  const [accessLevel, setAccessLevel] = useState<AccessLevel | undefined>(initialValues.accessLevel);
  const [standardCode, setStandardCode] = useState(initialValues.standardCode || '');
  const [authorName, setAuthorName] = useState(initialValues.authorName || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 防抖搜索
  const debouncedKeyword = useDebounce(keyword, 300);
  const debouncedStandardCode = useDebounce(standardCode, 300);
  const debouncedAuthorName = useDebounce(authorName, 300);

  // 构建搜索参数
  const buildSearchParams = useCallback((): Partial<SearchParams> => {
    const params: Partial<SearchParams> = {};
    
    if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
    if (category) params.category = category;
    if (safetyLevel) params.safetyLevel = safetyLevel;
    if (miningType) params.miningType = miningType;
    if (languageType) params.languageType = languageType;
    if (accessLevel) params.accessLevel = accessLevel;
    if (debouncedStandardCode.trim()) params.standardCode = debouncedStandardCode.trim();
    if (debouncedAuthorName.trim()) params.authorName = debouncedAuthorName.trim();
    
    return params;
  }, [
    debouncedKeyword, 
    category, 
    safetyLevel, 
    miningType, 
    languageType, 
    accessLevel, 
    debouncedStandardCode, 
    debouncedAuthorName
  ]);

  // 触发搜索
  React.useEffect(() => {
    const params = buildSearchParams();
    onSearch(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, category, safetyLevel, miningType, languageType, accessLevel, debouncedStandardCode, debouncedAuthorName]);

  // 清空所有筛选条件
  const handleClearAll = () => {
    setKeyword('');
    setCategory(undefined);
    setSafetyLevel(undefined);
    setMiningType(undefined);
    setLanguageType(undefined);
    setAccessLevel(undefined);
    setStandardCode('');
    setAuthorName('');
  };

  // 快速搜索建议
  const quickSearchTags = [
    { label: '瓦斯安全', value: { category: SafetyCategory.GAS_SAFETY } },
    { label: '高风险', value: { safetyLevel: SafetyLevel.HIGH } },
    { label: '极高风险', value: { safetyLevel: SafetyLevel.CRITICAL } },
    { label: '煤矿', value: { miningType: MiningType.COAL } },
    { label: '机械安全', value: { category: SafetyCategory.MECHANICAL_SAFETY } },
    { label: '消防安全', value: { category: SafetyCategory.FIRE_SAFETY } }
  ];

  const handleQuickSearch = (searchValue: Partial<SearchParams>) => {
    if (searchValue.category) setCategory(searchValue.category);
    if (searchValue.safetyLevel) setSafetyLevel(searchValue.safetyLevel);
    if (searchValue.miningType) setMiningType(searchValue.miningType);
  };

  // 获取当前激活的筛选条件数量
  const getActiveFiltersCount = () => {
    let count = 0;
    if (category) count++;
    if (safetyLevel) count++;
    if (miningType) count++;
    if (languageType) count++;
    if (accessLevel) count++;
    if (standardCode.trim()) count++;
    if (authorName.trim()) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card
      style={{
        marginBottom: 24,
        borderRadius: '16px',
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        background: 'white'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      {/* 主搜索栏 */}
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8} lg={10}>
          <Input
            size="large"
            placeholder="🔍 搜索资料标题、关键词..."
            prefix={<SearchOutlined style={{ color: MINING_BLUE_COLORS.secondary }} />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{
              borderRadius: '12px',
              border: '2px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = MINING_BLUE_COLORS.primary;
              e.target.style.boxShadow = `0 4px 12px ${MINING_BLUE_COLORS.primary}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#f0f0f0';
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          />
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            size="large"
            placeholder="🏷️ 安全类别"
            value={category}
            onChange={setCategory}
            allowClear
            style={{
              width: '100%',
              borderRadius: '12px'
            }}
            dropdownStyle={{
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            {Object.entries(safetyCategoryLabels).map(([key, label]) => (
              <Option key={key} value={key}>
                {label}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            size="large"
            placeholder="⚠️ 安全等级"
            value={safetyLevel}
            onChange={setSafetyLevel}
            allowClear
            style={{
              width: '100%',
              borderRadius: '12px'
            }}
            dropdownStyle={{
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            {Object.entries(safetyLevelLabels).map(([key, label]) => (
              <Option key={key} value={key}>
                <span style={{
                  color: key === SafetyLevel.CRITICAL ? '#f5222d' :
                         key === SafetyLevel.HIGH ? '#fa8c16' :
                         key === SafetyLevel.MEDIUM ? '#faad14' : '#52c41a',
                  fontWeight: '600'
                }}>
                  {key === SafetyLevel.CRITICAL ? '🔴' :
                   key === SafetyLevel.HIGH ? '🟠' :
                   key === SafetyLevel.MEDIUM ? '🟡' : '🟢'} {label}
                </span>
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={24} lg={2}>
          <Space>
            <Tooltip title={showAdvanced ? '收起高级筛选' : '展开高级筛选'}>
              <Button
                type="text"
                icon={<FilterOutlined />}
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{ 
                  color: activeFiltersCount > 0 ? MINING_BLUE_COLORS.primary : undefined 
                }}
              >
                {activeFiltersCount > 0 && (
                  <span style={{ 
                    marginLeft: 4, 
                    fontSize: '12px',
                    color: MINING_BLUE_COLORS.primary 
                  }}>
                    ({activeFiltersCount})
                  </span>
                )}
                {showAdvanced ? <UpOutlined /> : <DownOutlined />}
              </Button>
            </Tooltip>
            
            {activeFiltersCount > 0 && (
              <Tooltip title="清空所有筛选">
                <Button
                  type="text"
                  icon={<ClearOutlined />}
                  onClick={handleClearAll}
                  danger
                />
              </Tooltip>
            )}
          </Space>
        </Col>
      </Row>

      {/* 快速搜索标签 */}
      <Row style={{ marginTop: 12 }}>
        <Col span={24}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#666', fontSize: '12px', marginRight: 8 }}>快速筛选:</span>
            {quickSearchTags.map((tag, index) => (
              <Tag
                key={index}
                style={{ 
                  cursor: 'pointer',
                  borderRadius: '12px',
                  fontSize: '11px'
                }}
                onClick={() => handleQuickSearch(tag.value)}
              >
                {tag.label}
              </Tag>
            ))}
          </div>
        </Col>
      </Row>

      {/* 高级筛选 */}
      {showAdvanced && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="矿区类型"
                value={miningType}
                onChange={setMiningType}
                allowClear
                style={{ width: '100%' }}
              >
                {Object.entries(miningTypeLabels).map(([key, label]) => (
                  <Option key={key} value={key}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="语言类型"
                value={languageType}
                onChange={setLanguageType}
                allowClear
                style={{ width: '100%' }}
              >
                {Object.entries(languageTypeLabels).map(([key, label]) => (
                  <Option key={key} value={key}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="访问权限"
                value={accessLevel}
                onChange={setAccessLevel}
                allowClear
                style={{ width: '100%' }}
              >
                {Object.entries(accessLevelLabels).map(([key, label]) => (
                  <Option key={key} value={key}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="标准编码"
                value={standardCode}
                onChange={(e) => setStandardCode(e.target.value)}
                allowClear
              />
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="作者姓名"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                allowClear
              />
            </Col>
          </Row>
        </>
      )}
    </Card>
  );
};

export default SearchFilters;
