// 运行时配置文件
// 支持在部署后通过环境变量修改配置

// 全局运行时配置接口
interface RuntimeConfig {
  REACT_APP_API_BASE_URL: string;
  REACT_APP_SILICONFLOW_API_KEY: string;
  REACT_APP_ENABLE_AI_CHAT: string;
  REACT_APP_ENABLE_FEEDBACK: string;
  REACT_APP_AI_STREAM_ENABLED: string;
}

// 从window对象获取运行时配置
const getRuntimeConfig = (): RuntimeConfig => {
  if (typeof window !== 'undefined' && (window as any).RUNTIME_CONFIG) {
    return (window as any).RUNTIME_CONFIG;
  }
  
  // 返回默认配置
  return {
    REACT_APP_API_BASE_URL: 'http://117.72.145.157:8081/api',
    REACT_APP_SILICONFLOW_API_KEY: '',
    REACT_APP_ENABLE_AI_CHAT: 'true',
    REACT_APP_ENABLE_FEEDBACK: 'true',
    REACT_APP_AI_STREAM_ENABLED: 'true'
  };
};

// 获取运行时环境变量
export const getRuntimeEnv = (key: keyof RuntimeConfig): string => {
  const config = getRuntimeConfig();
  return config[key] || process.env[key] || '';
};

// 运行时配置对象
export const RUNTIME_CONFIG = {
  get API_BASE_URL(): string {
    return getRuntimeEnv('REACT_APP_API_BASE_URL') || 'http://117.72.145.157:8081/api';
  },
  
  get SILICONFLOW_API_KEY(): string {
    return getRuntimeEnv('REACT_APP_SILICONFLOW_API_KEY') || '';
  },
  
  get ENABLE_AI_CHAT(): boolean {
    return getRuntimeEnv('REACT_APP_ENABLE_AI_CHAT') === 'true';
  },
  
  get ENABLE_FEEDBACK(): boolean {
    return getRuntimeEnv('REACT_APP_ENABLE_FEEDBACK') === 'true';
  },
  
  get AI_STREAM_ENABLED(): boolean {
    return getRuntimeEnv('REACT_APP_AI_STREAM_ENABLED') === 'true';
  }
};

// 初始化运行时配置
export const initRuntimeConfig = (): void => {
  if (typeof window !== 'undefined') {
    // 从meta标签读取配置（Docker环境变量注入）
    const metaConfig = document.querySelector('meta[name="runtime-config"]');
    if (metaConfig && metaConfig.getAttribute('content')) {
      try {
        const config = JSON.parse(metaConfig.getAttribute('content') || '{}');
        (window as any).RUNTIME_CONFIG = config;
      } catch (error) {
        console.warn('Failed to parse runtime config from meta tag:', error);
      }
    }
  }
};