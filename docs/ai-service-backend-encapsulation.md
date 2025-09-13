# AI服务后端封装方案

## 一、项目背景

当前前端项目直接调用SiliconFlow API，存在API Key泄露和被盗刷的风险。为了提高安全性，需要在后端封装AI服务，由后端统一管理API Key和调用外部AI服务。

## 二、前端当前实现分析

### 2.1 核心调用流程
```
ChatInterface.tsx → chatStore.ts → ai.ts → siliconflow.ts → SiliconFlow API
```

### 2.2 关键文件结构
- `src/services/ai.ts`: AI服务统一接口
- `src/services/siliconflow.ts`: SiliconFlow API具体实现
- `src/store/chatStore.ts`: 聊天状态管理
- `src/components/AIChat/ChatInterface.tsx`: 聊天界面组件

### 2.3 当前API调用格式
```typescript
// 流式聊天调用
siliconFlowService.chatStream(
  message: string,
  history: ChatMessage[],
  onChunk: (chunk: string) => void,
  onComplete: () => void | Promise<void>,
  onError: (error: string) => void
): Promise<void>

// 非流式聊天调用
siliconFlowService.chat(messages: ChatMessage[]): Promise<string>
```

### 2.4 当前配置方式
```typescript
// 配置文件
SILICONFLOW_CONFIG = {
  baseURL: 'https://api.siliconflow.cn/v1',
  apiKey: process.env.REACT_APP_SILICONFLOW_API_KEY,
  models: {
    chat: 'Qwen/Qwen2.5-7B-Instruct',
    reasoning: 'Qwen/Qwen2.5-7B-Instruct',
    coding: 'Qwen/Qwen2.5-7B-Instruct',
    fallback: 'Qwen/Qwen2.5-7B-Instruct'
  },
  defaultParams: {
    max_tokens: 4000,
    temperature: 0.3,
    top_p: 0.8,
    stream: true,
    presence_penalty: 0.1,
    frequency_penalty: 0.1
  },
  systemPrompt: `你是中国矿业大学"语言景观视域下矿区语言安全研究及多模态数据库建设"项目的专业AI助手...`
}
```

## 三、后端API封装设计

### 3.1 核心接口设计

#### 3.1.1 流式聊天接口
```java
@PostMapping("/ai/chat/stream")
public SseEmitter chatStream(@RequestBody ChatRequest request, 
                            @RequestHeader("Authorization") String token) {
    // 验证用户权限和配额
    // 调用SiliconFlow API
    // 返回SseEmitter用于流式响应
}
```

#### 3.1.2 非流式聊天接口
```java
@PostMapping("/ai/chat")
public AjaxResult<String> chat(@RequestBody ChatRequest request,
                               @RequestHeader("Authorization") String token) {
    // 验证用户权限和配额
    // 调用SiliconFlow API
    // 直接返回完整回复
}
```

#### 3.1.3 AI配置管理接口
```java
@GetMapping("/ai/config")
public AjaxResult<AIConfig> getConfig() {
    // 返回AI配置（不包含敏感信息）
}

@PostMapping("/ai/config")
public AjaxResult<Void> updateConfig(@RequestBody AIConfig config) {
    // 更新AI配置（管理员权限）
}
```

#### 3.1.4 会话管理接口
```java
@GetMapping("/ai/sessions")
public AjaxResult<PageResult<ChatSession>> getSessions(
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "10") Integer size,
        @RequestHeader("Authorization") String token) {
    // 获取用户会话列表
}

@PostMapping("/ai/sessions")
public AjaxResult<String> createSession(@RequestBody CreateSessionRequest request,
                                      @RequestHeader("Authorization") String token) {
    // 创建新会话
}

@DeleteMapping("/ai/sessions/{sessionId}")
public AjaxResult<Void> deleteSession(@PathVariable String sessionId,
                                     @RequestHeader("Authorization") String token) {
    // 删除会话
}
```

### 3.2 数据库表设计

#### 3.2.1 AI会话表 (ai_session)
```sql
CREATE TABLE ai_session (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(64) UNIQUE NOT NULL COMMENT '会话ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    title VARCHAR(255) NOT NULL COMMENT '会话标题',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '是否删除',
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
```

#### 3.2.2 AI消息表 (ai_message)
```sql
CREATE TABLE ai_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(64) NOT NULL COMMENT '会话ID',
    role ENUM('user', 'assistant', 'system') NOT NULL COMMENT '角色',
    content TEXT NOT NULL COMMENT '消息内容',
    model_name VARCHAR(100) COMMENT '模型名称',
    tokens_used INT DEFAULT 0 COMMENT 'Token使用量',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at),
    INDEX idx_role (role)
);
```

#### 3.2.3 AI配置表 (ai_config)
```sql
CREATE TABLE ai_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT NOT NULL COMMENT '配置值',
    is_encrypted TINYINT(1) DEFAULT 1 COMMENT '是否加密',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_key (config_key)
);
```

#### 3.2.4 用户配额表 (user_quota)
```sql
CREATE TABLE user_quota (
    user_id BIGINT PRIMARY KEY COMMENT '用户ID',
    daily_tokens_limit INT DEFAULT 100000 COMMENT '每日Token限制',
    daily_tokens_used INT DEFAULT 0 COMMENT '每日已使用Token',
    last_reset_date DATE DEFAULT CURRENT_DATE COMMENT '最后重置日期',
    monthly_tokens_limit INT DEFAULT 3000000 COMMENT '每月Token限制',
    monthly_tokens_used INT DEFAULT 0 COMMENT '每月已使用Token',
    INDEX idx_daily_usage (daily_tokens_used),
    INDEX idx_monthly_usage (monthly_tokens_used)
);
```

### 3.3 安全机制设计

#### 3.3.1 API Key加密存储
```java
@Configuration
public class EncryptionConfig {
    
    @Value("${ai.encryption.key}")
    private String encryptionKey;
    
    @Bean
    public StringEncryptor stringEncryptor() {
        return new AES256Encryptor(encryptionKey);
    }
}
```

#### 3.3.2 请求频率限制
```java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    private static final int MAX_REQUESTS_PER_MINUTE = 30;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String userId = getCurrentUserId(request);
        String key = "rate_limit:ai:" + userId;
        
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, 1, TimeUnit.MINUTES);
        }
        
        if (count != null && count > MAX_REQUESTS_PER_MINUTE) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            return false;
        }
        
        return true;
    }
}
```

#### 3.3.3 用户配额管理
```java
@Service
public class UserQuotaService {
    
    @Autowired
    private UserQuotaMapper userQuotaMapper;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    public boolean checkQuota(Long userId, int tokensNeeded) {
        UserQuota quota = userQuotaMapper.selectById(userId);
        if (quota == null) {
            // 创建默认配额
            quota = createDefaultQuota(userId);
        }
        
        // 检查每日配额
        if (!isSameDay(quota.getLastResetDate())) {
            quota.setDailyTokensUsed(0);
            quota.setLastResetDate(new Date());
        }
        
        return quota.getDailyTokensUsed() + tokensNeeded <= quota.getDailyTokensLimit();
    }
    
    public void useQuota(Long userId, int tokensUsed) {
        UserQuota quota = userQuotaMapper.selectById(userId);
        quota.setDailyTokensUsed(quota.getDailyTokensUsed() + tokensUsed);
        quota.setMonthlyTokensUsed(quota.getMonthlyTokensUsed() + tokensUsed);
        userQuotaMapper.updateById(quota);
    }
}
```

### 3.4 核心实现类

#### 3.4.1 AI控制器
```java
@RestController
@RequestMapping("/api")
public class AIController {
    
    @Autowired
    private AIService aiService;
    
    @Autowired
    private UserQuotaService quotaService;
    
    @PostMapping("/ai/chat/stream")
    public SseEmitter chatStream(@RequestBody ChatRequest request,
                               @RequestHeader("Authorization") String token) {
        // 验证用户
        Long userId = validateToken(token);
        
        // 检查配额
        if (!quotaService.checkQuota(userId, 1000)) { // 预估1000 tokens
            throw new QuotaExceededException("今日配额已用完");
        }
        
        // 创建SSE发射器
        SseEmitter emitter = new SseEmitter(30000L); // 30秒超时
        
        // 异步处理
        CompletableFuture.runAsync(() -> {
            try {
                aiService.chatStream(request, userId, emitter);
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        
        return emitter;
    }
}
```

#### 3.4.2 AI服务实现
```java
@Service
public class AIServiceImpl implements AIService {
    
    @Autowired
    private SiliconFlowClient siliconFlowClient;
    
    @Autowired
    private ChatSessionService sessionService;
    
    @Autowired
    private UserQuotaService quotaService;
    
    @Override
    public void chatStream(ChatRequest request, Long userId, SseEmitter emitter) {
        try {
            // 获取或创建会话
            ChatSession session = sessionService.getOrCreateSession(userId, request.getSessionId());
            
            // 保存用户消息
            ChatMessage userMessage = new ChatMessage();
            userMessage.setSessionId(session.getSessionId());
            userMessage.setRole("user");
            userMessage.setContent(request.getMessage());
            userMessage.setCreatedAt(new Date());
            sessionService.saveMessage(userMessage);
            
            // 构建对话历史
            List<ChatMessage> history = sessionService.getSessionHistory(session.getSessionId());
            List<Map<String, String>> messages = buildMessages(history, request.getMessage());
            
            // 调用SiliconFlow API
            siliconFlowClient.chatStream(messages, new StreamCallback() {
                private StringBuilder contentBuilder = new StringBuilder();
                
                @Override
                public void onChunk(String chunk) {
                    contentBuilder.append(chunk);
                    try {
                        emitter.send(SseEmitter.event()
                            .data(chunk)
                            .name("message"));
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }
                
                @Override
                public void onComplete() {
                    // 保存AI回复
                    ChatMessage aiMessage = new ChatMessage();
                    aiMessage.setSessionId(session.getSessionId());
                    aiMessage.setRole("assistant");
                    aiMessage.setContent(contentBuilder.toString());
                    aiMessage.setModelName("Qwen/Qwen2.5-7B-Instruct");
                    aiMessage.setTokensUsed(calculateTokens(contentBuilder.toString()));
                    aiMessage.setCreatedAt(new Date());
                    sessionService.saveMessage(aiMessage);
                    
                    // 更新配额
                    quotaService.useQuota(userId, aiMessage.getTokensUsed());
                    
                    try {
                        emitter.send(SseEmitter.event()
                            .data("[DONE]")
                            .name("done"));
                        emitter.complete();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }
                
                @Override
                public void onError(String error) {
                    try {
                        emitter.send(SseEmitter.event()
                            .data(error)
                            .name("error"));
                        emitter.complete();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }
            });
            
        } catch (Exception e) {
            throw new AIServiceException("AI服务调用失败", e);
        }
    }
}
```

#### 3.4.3 SiliconFlow客户端
```java
@Service
public class SiliconFlowClient {
    
    @Value("${ai.siliconflow.base-url}")
    private String baseUrl;
    
    @Value("${ai.siliconflow.api-key}")
    private String apiKey;
    
    @Autowired
    private RestTemplate restTemplate;
    
    public void chatStream(List<Map<String, String>> messages, StreamCallback callback) {
        try {
            // 构建请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "Qwen/Qwen2.5-7B-Instruct");
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 4000);
            requestBody.put("temperature", 0.3);
            requestBody.put("top_p", 0.8);
            requestBody.put("stream", true);
            requestBody.put("presence_penalty", 0.1);
            requestBody.put("frequency_penalty", 0.1);
            
            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            // 创建请求实体
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // 发送流式请求
            restTemplate.execute(
                baseUrl + "/chat/completions",
                HttpMethod.POST,
                request -> {
                    request.getHeaders().addAll(headers);
                    new ObjectMapper().writeValue(request.getBody(), requestBody);
                },
                response -> {
                    try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(response.getBody()))) {
                        
                        String line;
                        while ((line = reader.readLine()) != null) {
                            if (line.startsWith("data: ")) {
                                String data = line.substring(6);
                                if (data.equals("[DONE]")) {
                                    callback.onComplete();
                                    break;
                                }
                                
                                try {
                                    Map<String, Object> chunk = new ObjectMapper()
                                        .readValue(data, Map.class);
                                    
                                    Map<String, Object> choice = (Map<String, Object>) 
                                        ((List<?>) chunk.get("choices")).get(0);
                                    Map<String, Object> delta = (Map<String, Object>) 
                                        choice.get("delta");
                                    
                                    if (delta.containsKey("content")) {
                                        callback.onChunk((String) delta.get("content"));
                                    }
                                } catch (Exception e) {
                                    // 忽略解析错误
                                }
                            }
                        }
                    }
                    return null;
                }
            );
            
        } catch (Exception e) {
            callback.onError("SiliconFlow API调用失败: " + e.getMessage());
        }
    }
}
```

## 四、前端适配方案

### 4.1 API调用路径变更
```typescript
// 修改 src/services/siliconflow.ts
// 原有调用
// https://api.siliconflow.cn/v1/chat/completions

// 修改为后端API
const API_BASE_URL = '/api';

export class SiliconFlowService {
  async chatStream(
    message: string,
    history: ChatMessage[] = [],
    onChunk: (chunk: string) => void,
    onComplete: () => void | Promise<void>,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sessionId: getCurrentSessionId(),
          history: history.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              await onComplete();
              return;
            }
            
            try {
              const event = JSON.parse(data);
              if (event.type === 'message') {
                onChunk(event.data);
              } else if (event.type === 'error') {
                onError(event.data);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'AI服务异常');
    }
  }
}
```

### 4.2 前端配置简化
```typescript
// 移除前端API Key配置
export const SILICONFLOW_CONFIG = {
  models: {
    chat: 'Qwen/Qwen2.5-7B-Instruct',
    reasoning: 'Qwen/Qwen2.5-7B-Instruct',
    coding: 'Qwen/Qwen2.5-7B-Instruct',
    fallback: 'Qwen/Qwen2.5-7B-Instruct'
  },
  defaultParams: {
    max_tokens: 4000,
    temperature: 0.3,
    top_p: 0.8,
    stream: true,
    presence_penalty: 0.1,
    frequency_penalty: 0.1
  },
  systemPrompt: `你是中国矿业大学"语言景观视域下矿区语言安全研究及多模态数据库建设"项目的专业AI助手...`
};
```

### 4.3 错误处理优化
```typescript
// 统一错误处理
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIError';
  }
}

// 错误类型映射
const ERROR_MAP = {
  'QUOTA_EXCEEDED': '今日配额已用完，请明天再试',
  'RATE_LIMIT': '请求过于频繁，请稍后再试',
  'UNAUTHORIZED': '登录已过期，请重新登录',
  'SERVICE_UNAVAILABLE': 'AI服务暂时不可用，请稍后再试'
};
```

## 五、部署配置

### 5.1 环境变量配置
```bash
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mining_safety_db
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:password}
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}

ai:
  siliconflow:
    base-url: https://api.siliconflow.cn/v1
    api-key: ${SILICONFLOW_API_KEY}
    default-model: Qwen/Qwen2.5-7B-Instruct
    max-tokens: 4000
    temperature: 0.3
  encryption:
    key: ${ENCRYPTION_KEY:default-encryption-key-32-chars}

security:
  jwt:
    secret: ${JWT_SECRET:default-jwt-secret-key}
    expiration: 86400000
```

### 5.2 Docker配置
```dockerfile
FROM openjdk:17-jre-slim

WORKDIR /app
COPY target/mining-db-server.jar app.jar

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=prod
ENV SILICONFLOW_API_KEY=${SILICONFLOW_API_KEY}
ENV JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 5.3 数据库迁移脚本
```sql
-- 创建AI相关表
CREATE TABLE IF NOT EXISTS ai_session (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(64) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS ai_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(64) NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    model_name VARCHAR(100),
    tokens_used INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS ai_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    is_encrypted TINYINT(1) DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (config_key)
);

CREATE TABLE IF NOT EXISTS user_quota (
    user_id BIGINT PRIMARY KEY,
    daily_tokens_limit INT DEFAULT 100000,
    daily_tokens_used INT DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    monthly_tokens_limit INT DEFAULT 3000000,
    monthly_tokens_used INT DEFAULT 0,
    INDEX idx_daily_usage (daily_tokens_used),
    INDEX idx_monthly_usage (monthly_tokens_used)
);

-- 插入默认配置
INSERT INTO ai_config (config_key, config_value) VALUES 
('siliconflow.api_key', 'your-encrypted-api-key'),
('siliconflow.base_url', 'https://api.siliconflow.cn/v1'),
('siliconflow.default_model', 'Qwen/Qwen2.5-7B-Instruct'),
('daily_token_limit', '100000'),
('monthly_token_limit', '3000000');
```

## 六、测试验证

### 6.1 接口测试用例
```java
@SpringBootTest
public class AIControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    public void testChatStream() throws Exception {
        ChatRequest request = new ChatRequest();
        request.setMessage("你好");
        request.setSessionId("test-session");
        
        MvcResult result = mockMvc.perform(post("/api/ai/chat/stream")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer test-token")
                .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();
        
        // 验证SSE响应
        // ...
    }
    
    @Test
    public void testQuotaLimit() throws Exception {
        // 测试配额限制
        // ...
    }
}
```

### 6.2 性能测试
```java
@Test
public void testConcurrentRequests() throws Exception {
    int threadCount = 10;
    ExecutorService executor = Executors.newFixedThreadPool(threadCount);
    
    List<Future<?>> futures = new ArrayList<>();
    for (int i = 0; i < threadCount; i++) {
        futures.add(executor.submit(() -> {
            // 模拟并发请求
            // ...
        }));
    }
    
    // 等待所有请求完成
    for (Future<?> future : futures) {
        future.get();
    }
}
```

## 七、上线部署

### 7.1 部署步骤
1. **数据库迁移**：执行SQL脚本创建相关表
2. **后端部署**：更新Spring Boot应用
3. **前端更新**：修改API调用地址
4. **功能测试**：验证AI服务正常运行
5. **监控配置**：配置日志和监控

### 7.2 回滚方案
1. **前端回滚**：恢复原有API调用地址
2. **后端回滚**：关闭新的AI接口
3. **数据备份**：保留原始数据

## 八、后续优化

### 8.1 功能增强
- 支持多模型切换
- 添加对话历史搜索
- 实现用户画像和个性化推荐
- 添加AI对话质量评估

### 8.2 性能优化
- 实现对话缓存
- 优化Token计算
- 添加请求队列
- 实现负载均衡

### 8.3 安全增强
- 添加敏感词过滤
- 实现内容审核
- 添加异常行为检测
- 完善审计日志

## 九、给后端同学的Prompt

请基于以下需求实现后端AI服务封装：

### 需求概述
在前端项目`mining-safety-db-frontend`中，当前直接调用SiliconFlow API存在API Key泄露风险。需要在后端`mining-db-server`项目中封装AI服务，统一管理API Key和调用外部AI服务。

### 技术要求
1. **框架**：Spring Boot 2.7+ + MyBatis-Plus + Redis
2. **数据库**：MySQL 8.0+
3. **缓存**：Redis
4. **安全**：JWT认证 + API Key加密存储
5. **流式响应**：SSE (Server-Sent Events)

### 核心功能
1. **流式聊天接口**：`POST /api/ai/chat/stream`
   - 支持SSE流式响应
   - 集成用户权限验证
   - 实现配额管理
   - 保存对话历史

2. **非流式聊天接口**：`POST /api/ai/chat`
   - 直接返回完整回复
   - 相同的安全和配额检查

3. **会话管理接口**：
   - `GET /api/ai/sessions` - 获取会话列表
   - `POST /api/ai/sessions` - 创建会话
   - `DELETE /api/ai/sessions/{sessionId}` - 删除会话

4. **配置管理接口**：
   - `GET /api/ai/config` - 获取配置
   - `POST /api/ai/config` - 更新配置（管理员）

### 数据库设计
请参考文档中的表结构设计，包括：
- `ai_session` - AI会话表
- `ai_message` - AI消息表
- `ai_config` - AI配置表
- `user_quota` - 用户配额表

### 安全要求
1. **API Key加密存储**：使用AES-256加密
2. **用户权限验证**：JWT Token验证
3. **请求频率限制**：基于用户ID的限流
4. **配额管理**：每日/每月Token使用限制
5. **敏感信息保护**：日志中不输出敏感信息

### 性能要求
1. **响应时间**：< 3秒
2. **并发处理**：支持100+并发请求
3. **错误处理**：完善的错误处理和重试机制
4. **监控指标**：API调用次数、响应时间、错误率

### 兼容性要求
1. **前端兼容**：保持前端调用接口不变
2. **响应格式**：保持与SiliconFlow API响应格式一致
3. **错误处理**：保持前端错误处理逻辑不变

### 实现步骤
1. 设计并创建数据库表
2. 实现核心业务逻辑
3. 添加安全机制
4. 实现流式响应
5. 编写测试用例
6. 部署和验证

### 参考代码
前端当前实现可参考：
- `src/services/ai.ts` - AI服务接口
- `src/services/siliconflow.ts` - SiliconFlow API调用
- `src/store/chatStore.ts` - 聊天状态管理

### 注意事项
1. **API Key安全**：严禁在代码中硬编码API Key
2. **错误处理**：提供友好的错误提示
3. **日志记录**：记录关键操作日志
4. **性能监控**：添加性能监控指标
5. **测试覆盖**：编写完整的单元测试和集成测试

请按照这个方案实现后端AI服务封装，确保安全性和性能要求。