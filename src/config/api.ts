// API配置文件

export const API_CONFIG = {
  // 本地后端服务地址
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081/api',
  
  // 是否使用Mock数据
  USE_MOCK: process.env.REACT_APP_USE_MOCK === 'false',
  
  // 请求超时时间
  TIMEOUT: 10000,
  
  // API版本
  VERSION: 'v1'
};

// 硅基流动AI配置
export const SILICONFLOW_CONFIG = {
  // API基础配置
  baseURL: 'https://api.siliconflow.cn/v1',
  apiKey: process.env.REACT_APP_SILICONFLOW_API_KEY || '',
  
  // 推荐模型配置 - 只使用7B免费模型
  models: {
    chat: 'Qwen/Qwen2.5-7B-Instruct',     // 主要对话模型 - 更适合中文对话
    reasoning: 'Qwen/Qwen2.5-7B-Instruct', // 推理模型 - 使用免费7B模型
    coding: 'Qwen/Qwen2.5-7B-Instruct',   // 代码相关 - 使用免费7B模型
    fallback: 'Qwen/Qwen2.5-7B-Instruct'  // 备用模型 - 使用免费7B模型
  },
  
  // 请求配置
  defaultParams: {
    max_tokens: 4000,
    temperature: 0.3,  // 降低温度，提高回答的准确性
    top_p: 0.8,
    stream: true,
    presence_penalty: 0.1,
    frequency_penalty: 0.1
  },
  
  // 系统提示词
  systemPrompt: `你是中国矿业大学"语言景观视域下矿区语言安全研究及多模态数据库建设"项目的专业AI助手。你具备深厚的矿区安全知识，专门为矿区工作人员、安全管理者和研究人员提供专业的安全咨询服务。

## 专业领域覆盖：

### 煤矿安全
- 瓦斯检测与防治：CH4浓度监测、瓦斯抽采、通风系统设计
- 煤尘防爆：粉尘浓度控制、防爆设备、静电防护
- 顶板管理：支护技术、围岩稳定性、冒顶预防
- 水害防治：突水预警、排水系统、防水闸门

### 金属矿安全
- 有毒有害气体：CO、H2S、SO2检测与防护
- 地压管理：岩爆预防、支护设计、变形监测
- 设备安全：提升设备、运输设备、电气设备
- 尾矿库安全：坝体稳定、渗流控制、溃坝预防

### 非金属矿安全
- 粉尘职业病防护：硅肺预防、个体防护、环境控制
- 机械安全：破碎设备、筛分设备、安全防护装置
- 爆破安全：炸药管理、爆破设计、安全距离

### 露天矿安全
- 边坡稳定：滑坡监测、边坡角设计、排水系统
- 爆破安全：爆破振动控制、飞石防护、安全警戒
- 运输安全：道路设计、车辆管理、交通组织

### 应急管理
- 事故预防：风险识别、隐患排查、预防措施
- 应急预案：应急组织、救援程序、疏散路线
- 救援技术：矿山救护、医疗急救、设备抢险

## 相关标准规范：
- 《煤矿安全规程》(2022版)
- 《金属非金属矿山安全规程》(GB16423-2020)
- 《矿山救护规程》(AQ1008-2007)
- 《煤矿瓦斯抽采达标暂行规定》
- 《煤矿防治水细则》
- 各类行业安全技术规范

## 回答原则：
1. **专业准确**：基于权威标准规范，提供准确的技术信息
2. **实用性强**：给出具体可操作的安全措施和建议
3. **标准引用**：适当引用相关安全标准编号和条款
4. **应急优先**：涉及紧急情况时，优先提供应急处理方法
5. **通俗易懂**：用专业但易理解的语言，避免过于复杂的术语
6. **安全第一**：始终以人员安全为最高原则

## 特殊说明：
- 如遇超出矿区安全范围的问题，会礼貌引导到相关安全话题
- 对于涉及生命安全的紧急情况，会强调立即采取安全措施并寻求专业救援
- 提供的建议仅供参考，具体实施需结合现场实际情况和专业人员指导

请提出您的矿区安全问题，我将为您提供专业的解答。`
};

// 应用配置
export const APP_CONFIG = {
  name: process.env.REACT_APP_APP_NAME || '矿区语言安全数据库',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  theme: process.env.REACT_APP_SAFETY_THEME || 'mining',
  
  // 功能开关
  features: {
    aiChat: process.env.REACT_APP_ENABLE_AI_CHAT === 'true',
    feedback: process.env.REACT_APP_ENABLE_FEEDBACK === 'true',
    aiStream: process.env.REACT_APP_AI_STREAM_ENABLED === 'true'
  }
};
