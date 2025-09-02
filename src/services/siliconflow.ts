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
   * 流式聊天 - 增强版本，支持多种结束检测和超时保护
   */
  async chatStream(
    message: string,
    history: ChatMessage[] = [],
    onChunk: (chunk: string) => void,
    onComplete: () => void | Promise<void>,
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
          url: `${this.baseURL}/chat/completions`,
          stream: requestBody.stream,
          requestBodyKeys: Object.keys(requestBody)
        });
        console.log('🤖 完整requestBody:', requestBody);
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
      let completed = false;
      let lastChunkTime = Date.now();
      const STREAM_TIMEOUT = 30000; // 30秒超时保护
      const CHUNK_TIMEOUT = 10000;  // 10秒无新数据超时

      // 开发环境下打印响应信息
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 硅基流动API响应成功:', response.status);
        console.log('🔧 启用增强流处理：超时保护=' + STREAM_TIMEOUT + 'ms，块超时=' + CHUNK_TIMEOUT + 'ms');
      }

      // 确保 onComplete 始终被调用的保护函数
      const ensureComplete = async (reason: string) => {
        if (!completed) {
          completed = true;
          console.log(`📥 ${reason}，触发onComplete回调`);
          try {
            console.log('📥 开始调用onComplete...');
            const result = onComplete();
            if (result && typeof result.then === 'function') {
              console.log('📥 检测到Promise，等待异步执行...');
              await result;
              console.log('📥 onComplete异步执行完成');
            } else {
              console.log('📥 onComplete同步执行完成，返回值:', result);
            }
          } catch (error) {
            console.error('📥 onComplete调用失败:', error);
            throw error; // 重新抛出以便外层捕获
          }
        }
      };

      // 流结束检测函数 - 精确判断只有真正结束信号才结束
      const isStreamEnd = (data: string): boolean => {
        const trimmed = data.trim();
        
        // 明确的文本结束信号
        if (trimmed === '[DONE]' || 
            trimmed === 'data: [DONE]' || 
            trimmed === '[DONE].') {
          console.log('✅ [siliconflow] 检测到文本结束信号:', trimmed);
          return true;
        }
        
        // 空数据不算结束（可能是网络分片）
        if (trimmed === '') {
          return false;
        }
        
        // 检测JSON中的明确结束信号
        try {
          const parsed = JSON.parse(trimmed);
          
          // 🔍 调试：记录结束检测过程
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [siliconflow] 检测结束信号:', {
              hasChoices: !!parsed.choices,
              choicesLength: parsed.choices?.length,
              finishReason: parsed.choices?.[0]?.finish_reason,
              hasDelta: !!parsed.choices?.[0]?.delta,
              hasContent: !!parsed.choices?.[0]?.delta?.content
            });
          }
          
          // 只有明确的finish_reason才算真正结束
          if (parsed.choices?.[0]?.finish_reason === 'stop' || 
              parsed.choices?.[0]?.finish_reason === 'length') {
            console.log('✅ [siliconflow] 检测到finish_reason结束信号:', parsed.choices[0].finish_reason);
            return true;
          }
          
          // 关键修复：不要因为没有delta.content就判断结束！
          // 第一个数据块可能包含完整内容但没有delta结构
          return false;
          
        } catch (e) {
          // JSON解析失败，检查是否是文本结束信号
          if (trimmed.includes('[DONE]')) {
            console.log('✅ [siliconflow] 检测到包含[DONE]的结束信号');
            return true;
          }
        }
        
        return false;
      };

      // 超时保护定时器
      const streamStartTime = Date.now();
      const timeoutCheck = setInterval(() => {
        const elapsed = Date.now() - streamStartTime;
        const sinceLastChunk = Date.now() - lastChunkTime;
        
        if (elapsed > STREAM_TIMEOUT) {
          console.warn('⚠️ 流式响应总时间超时，强制结束');
          clearInterval(timeoutCheck);
          ensureComplete('总时间超时保护').catch(console.error);
          return;
        }
        
        if (sinceLastChunk > CHUNK_TIMEOUT && !completed) {
          console.warn('⚠️ 长时间无新数据，强制结束');
          clearInterval(timeoutCheck);
          ensureComplete('无数据超时保护').catch(console.error);
          return;
        }
      }, 1000);

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            clearInterval(timeoutCheck);
            await ensureComplete('流式响应自然结束(done=true)');
            return;
          }

          lastChunkTime = Date.now(); // 更新最后数据时间
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            // 🔍 调试：记录每一行原始数据
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 [siliconflow] 原始数据行:', JSON.stringify(line));
            }

            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              // 🔍 调试：记录解析前的数据
              if (process.env.NODE_ENV === 'development') {
                console.log('🔍 [siliconflow] 提取的data:', JSON.stringify(data));
              }
              
              // 增强的流结束检测
              if (isStreamEnd(data)) {
                clearInterval(timeoutCheck);
                await ensureComplete('收到结束信号: ' + data);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                
                // 🔍 调试：记录解析后的完整数据结构
                if (process.env.NODE_ENV === 'development') {
                  console.log('🔍 [siliconflow] 解析后数据结构:', JSON.stringify(parsed, null, 2));
                  console.log('🔍 [siliconflow] choices数组:', parsed.choices);
                  if (parsed.choices && parsed.choices[0]) {
                    console.log('🔍 [siliconflow] delta对象:', parsed.choices[0].delta);
                    console.log('🔍 [siliconflow] message对象:', parsed.choices[0].message);
                    console.log('🔍 [siliconflow] delta.content:', parsed.choices[0].delta?.content);
                    console.log('🔍 [siliconflow] message.content:', parsed.choices[0].message?.content);
                  }
                }

                // 增强内容提取逻辑 - 支持多种响应格式
                let content: string | undefined;
                
                // 优先从delta.content提取（流式响应常用格式）
                if (parsed.choices?.[0]?.delta?.content) {
                  content = parsed.choices[0].delta.content;
                  console.log('✅ [siliconflow] 从delta.content提取内容:', JSON.stringify(content), '长度:', content?.length || 0);
                }
                // 备用：从message.content提取（完整消息格式）
                else if (parsed.choices?.[0]?.message?.content) {
                  content = parsed.choices[0].message.content;
                  console.log('✅ [siliconflow] 从message.content提取内容:', JSON.stringify(content), '长度:', content?.length || 0);
                }
                // 备用：从根级content提取（简化格式）
                else if (parsed.content && typeof parsed.content === 'string') {
                  content = parsed.content;
                  console.log('✅ [siliconflow] 从根级content提取内容:', JSON.stringify(content), '长度:', content?.length || 0);
                }

                if (content) {
                  onChunk(content);
                  lastChunkTime = Date.now(); // 更新数据时间
                } else {
                  // 🔍 调试：记录为什么没有提取到内容
                  if (process.env.NODE_ENV === 'development') {
                    console.log('⚠️ [siliconflow] 未从任何字段提取到内容:', {
                      'choices存在': !!parsed.choices,
                      'choices[0]存在': !!parsed.choices?.[0],
                      'delta存在': !!parsed.choices?.[0]?.delta,
                      'delta.content值': parsed.choices?.[0]?.delta?.content,
                      'message存在': !!parsed.choices?.[0]?.message,
                      'message.content值': parsed.choices?.[0]?.message?.content,
                      '根级content值': parsed.content
                    });
                  }
                }
              } catch (e) {
                console.warn('❌ [siliconflow] 解析流式数据失败:', data, e);
                // 如果连续解析失败且数据为空，可能是结束信号
                if (!data || data.length === 0) {
                  clearInterval(timeoutCheck);
                  await ensureComplete('空数据检测到结束');
                  return;
                }
              }
            } else if (line.trim()) {
              // 🔍 调试：记录不以'data: '开头但不为空的行
              if (process.env.NODE_ENV === 'development') {
                console.log('🔍 [siliconflow] 非data行:', JSON.stringify(line));
              }
            }
          }
        }
      } catch (streamError) {
        clearInterval(timeoutCheck);
        console.error('流处理异常:', streamError);
        // 即使发生异常也要确保 onComplete 被调用
        await ensureComplete('流处理异常保护').catch(console.error);
        throw streamError;
      }
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
