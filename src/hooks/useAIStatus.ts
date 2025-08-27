// AI状态检查Hook
import { useState, useEffect } from 'react';
import { aiApi } from '../services/ai';

export interface AIStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
}

export const useAIStatus = (checkInterval: number = 30000) => {
  const [status, setStatus] = useState<AIStatus>({
    isOnline: false,
    isChecking: false,
    lastChecked: null,
    error: null
  });

  const checkAIStatus = async () => {
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const isOnline = await aiApi.checkStatus();
      setStatus({
        isOnline,
        isChecking: false,
        lastChecked: new Date(),
        error: null
      });
    } catch (error) {
      setStatus({
        isOnline: false,
        isChecking: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'AI服务检查失败'
      });
    }
  };

  useEffect(() => {
    // 立即检查一次
    checkAIStatus();
    
    // 设置定期检查
    const interval = setInterval(checkAIStatus, checkInterval);
    
    return () => clearInterval(interval);
  }, [checkInterval]);

  return {
    ...status,
    checkStatus: checkAIStatus
  };
};
