// 硅基流动AI服务
import { SILICONFLOW_CONFIG } from '../config/api';
import { ChatMessage } from '../types/ai';

export class SiliconFlowService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = SILICONFLOW_CONFIG.apiKey!;
    this.baseURL = SILICONFLOW_CONFIG.baseURL;
    
    if (!this.apiKey) {
      console.warn('硅基流动API Key未配置，AI功能将不可用');
    }
  }

  /**
   * 流式聊天 - 参考项目的实现方式
   */
  async chatStream(
    message: string,
    history: ChatMessage[] = [],
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.apiKey) {
      onError('硅基流动API Key未配置');
      return;
    }

    try {
      const messages = [
        {
          role: 'system' as const,
          content: SILICONFLOW_CONFIG.systemPrompt
        },
        ...history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: message
        }
      ];

      const requestBody = {
        model: SILICONFLOW_CONFIG.models.chat,
        messages,
        ...SILICONFLOW_CONFIG.defaultParams,
        stream: true
      };

      // 开发环境下打印请求信息
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 硅基流动API请求:', {
          model: SILICONFLOW_CONFIG.models.chat,
          messageCount: messages.length,
          url: `${this.baseURL}/chat/completions`
        });
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `硅基流动API请求失败: ${response.status} ${response.statusText}`;
        const detailMessage = errorData.error?.message || errorData.message || '未知错误';

        console.error('❌ 硅基流动API错误:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        onError(`${errorMessage}\n详细信息: ${detailMessage}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('无法获取响应流');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // 开发环境下打印响应信息
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 硅基流动API响应成功:', response.status);
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.warn('解析流式数据失败:', e);
            }
          }
        }
      }

      onComplete();
    } catch (error) {
      console.error('硅基流动流式请求失败:', error);
      onError(error instanceof Error ? error.message : '网络请求失败');
    }
  }

  /**
   * 非流式聊天
   */
  async chat(
    messages: ChatMessage[],
    model: string = SILICONFLOW_CONFIG.models.chat
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('硅基流动API Key未配置');
    }

    const response = await this.makeRequest(messages, model, false);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`硅基流动API错误: ${data.error.message}`);
    }
    
    return data.choices[0].message.content;
  }

  /**
   * 发起API请求
   */
  private async makeRequest(
    messages: ChatMessage[],
    model: string,
    stream: boolean
  ): Promise<Response> {
    const requestBody = {
      model,
      messages: [
        {
          role: 'system' as const,
          content: SILICONFLOW_CONFIG.systemPrompt
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      ...SILICONFLOW_CONFIG.defaultParams,
      stream
    };

    // 开发环境下打印请求信息
    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 硅基流动API请求:', {
        model,
        messageCount: messages.length,
        stream,
        url: `${this.baseURL}/chat/completions`
      });
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = `硅基流动API请求失败: ${response.status} ${response.statusText}`;
      const detailMessage = errorData.error?.message || errorData.message || '未知错误';

      console.error('❌ 硅基流动API错误:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        model,
        messageCount: messages.length
      });

      throw new Error(`${errorMessage}\n详细信息: ${detailMessage}`);
    }

    // 开发环境下打印响应信息
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ 硅基流动API响应成功:', response.status);
    }

    return response;
  }

  /**
   * 检查API连接状态
   */
  async checkConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const testMessages: ChatMessage[] = [
        { 
          id: 'test',
          sessionId: 'test',
          role: 'user', 
          content: '你好',
          timestamp: new Date()
        }
      ];
      
      await this.chat(testMessages);
      return true;
    } catch (error) {
      console.error('硅基流动API连接检查失败:', error);
      return false;
    }
  }

  /**
   * 获取可用模型列表
   */
  async getModels(): Promise<string[]> {
    if (!this.apiKey) {
      return Object.values(SILICONFLOW_CONFIG.models);
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      const data = await response.json();
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return Object.values(SILICONFLOW_CONFIG.models);
    }
  }
}

// 导出单例实例
export const siliconFlowService = new SiliconFlowService();
