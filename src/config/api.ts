// API配置文件

export const API_CONFIG = {
  // 本地后端服务地址
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://117.72.145.157:8081/api',
  
  // 是否使用Mock数据
  USE_MOCK: process.env.REACT_APP_USE_MOCK === 'false',
  
  // 请求超时时间
  TIMEOUT: 10000,
  
  // API版本
  VERSION: 'v1'
};

// 硅基流动AI配置 - 已迁移到后端，前端不再直接调用
// export const SILICONFLOW_CONFIG = {
//   // API基础配置 - 已移至后端安全存储
//   // baseURL: 'https://api.siliconflow.cn/v1',
//   // apiKey: process.env.REACT_APP_SILICONFLOW_API_KEY || RUNTIME_CONFIG.SILICONFLOW_API_KEY,
//   ...
// };

// AI配置已完全迁移到后端 /api/chat/ai 接口
// 前端仅需调用后端API，无需直接持有AI服务的API密钥

// 应用配置
export const APP_CONFIG = {
  name: process.env.REACT_APP_APP_NAME || '矿区语言安全数据库',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  theme: process.env.REACT_APP_SAFETY_THEME || 'mining',
  
  // 功能开关
  features: {
    aiChat: true, // AI聊天通过后端API提供
    feedback: process.env.REACT_APP_ENABLE_FEEDBACK === 'true',
    aiStream: true // 流式响应通过后端SSE提供
  }
};
