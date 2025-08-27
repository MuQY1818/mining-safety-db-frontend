// API集成测试脚本 - 验证前端与远端后端服务器的兼容性
// 远端服务器: https://mining-backend.ziven.site

import { apiService } from './services/api';
import { chatHistoryService } from './services/chatHistory';

// 测试配置
const REMOTE_SERVER = 'https://mining-backend.ziven.site/api';
const TEST_TOKEN = 'your_test_token_here'; // 需要替换为实际的测试token

// 测试结果记录
interface TestResult {
  name: string;
  status: 'success' | 'error' | 'skip';
  message: string;
  response?: any;
  error?: any;
}

class APIIntegrationTester {
  private results: TestResult[] = [];
  
  constructor() {
    // 设置测试用的API base URL
    (apiService as any).baseURL = REMOTE_SERVER;
  }

  private logResult(result: TestResult) {
    this.results.push(result);
    console.log(`[${result.status.toUpperCase()}] ${result.name}: ${result.message}`);
    if (result.response) {
      console.log('Response:', result.response);
    }
    if (result.error) {
      console.error('Error:', result.error);
    }
    console.log('---');
  }

  private async testWithAuth<T>(
    testName: string,
    testFn: () => Promise<T>
  ): Promise<void> {
    try {
      // 设置测试token
      localStorage.setItem('auth_token', TEST_TOKEN);
      
      const response = await testFn();
      this.logResult({
        name: testName,
        status: 'success',
        message: '测试通过',
        response
      });
    } catch (error: any) {
      this.logResult({
        name: testName,
        status: 'error',
        message: error.message || '测试失败',
        error
      });
    }
  }

  private async testWithoutAuth<T>(
    testName: string,
    testFn: () => Promise<T>
  ): Promise<void> {
    try {
      // 清除token测试
      localStorage.removeItem('auth_token');
      
      const response = await testFn();
      this.logResult({
        name: testName,
        status: 'success',
        message: '测试通过',
        response
      });
    } catch (error: any) {
      this.logResult({
        name: testName,
        status: 'error',
        message: error.message || '测试失败',
        error
      });
    }
  }

  // 1. 测试API响应码处理
  async testApiResponseCodeHandling() {
    console.log('🧪 测试1: API响应码处理');
    
    await this.testWithoutAuth('反馈提交-无效参数', async () => {
      return await apiService.submitFeedback({
        type: 'bug',
        title: '',  // 空标题应该触发参数错误
        content: '',
        contactInfo: 'test@example.com'
      });
    });
  }

  // 2. 测试用户认证API
  async testUserAuthAPIs() {
    console.log('🧪 测试2: 用户认证API');
    
    await this.testWithoutAuth('用户登录-无效凭据', async () => {
      return await apiService.login('testuser', 'wrongpassword');
    });

    await this.testWithoutAuth('用户注册-测试用户', async () => {
      return await apiService.signup('testuser_' + Date.now(), 'password123', '测试用户');
    });
  }

  // 3. 测试反馈API
  async testFeedbackAPIs() {
    console.log('🧪 测试3: 反馈API');
    
    await this.testWithAuth('提交反馈', async () => {
      return await apiService.submitFeedback({
        type: 'bug',
        title: '测试反馈',
        content: '这是一个API集成测试反馈',
        contactInfo: 'test@example.com'
      });
    });

    await this.testWithAuth('获取反馈列表', async () => {
      return await apiService.getFeedbackList({
        page: 1,
        pageSize: 10,
        status: 'all',
        order: 'desc'
      });
    });
  }

  // 4. 测试安全数据API
  async testSafetyDataAPIs() {
    console.log('🧪 测试4: 安全数据API');
    
    await this.testWithAuth('获取安全数据列表', async () => {
      return await apiService.getSafetyData({
        page: 1,
        pageSize: 10
      });
    });

    await this.testWithAuth('获取安全数据详情', async () => {
      // 尝试获取ID为1的数据
      return await apiService.getSafetyDataById(1);
    });
  }

  // 5. 测试聊天API
  async testChatAPIs() {
    console.log('🧪 测试5: 聊天API');
    
    let sessionId: number;

    await this.testWithAuth('创建聊天会话', async () => {
      const result = await chatHistoryService.createSession({
        title: '测试聊天会话',
        description: 'API集成测试会话'
      });
      sessionId = result.sessionId;
      return result;
    });

    if (sessionId!) {
      await this.testWithAuth('获取聊天会话列表', async () => {
        return await chatHistoryService.getSessions({
          page: 1,
          pageSize: 10,
          order: 'desc'
        });
      });

      await this.testWithAuth('保存聊天消息', async () => {
        return await chatHistoryService.saveMessage({
          sessionId,
          role: 'user',
          content: '这是一条测试消息',
          modelName: 'test'
        });
      });

      await this.testWithAuth('获取聊天消息', async () => {
        return await chatHistoryService.getMessages(sessionId, {
          page: 1,
          pageSize: 10,
          order: 'asc'
        });
      });

      await this.testWithAuth('更新会话标题', async () => {
        return await chatHistoryService.updateSession(sessionId, {
          id: sessionId,
          title: '更新后的测试会话标题',
          description: '更新后的描述'
        });
      });

      await this.testWithAuth('删除聊天会话', async () => {
        return await chatHistoryService.deleteSession(sessionId);
      });
    }
  }

  // 6. 测试文件上传API  
  async testFileUploadAPI() {
    console.log('🧪 测试6: 文件上传API');
    
    // 创建一个测试文件
    const testFile = new File(['测试文件内容'], 'test.txt', { 
      type: 'text/plain' 
    });

    await this.testWithAuth('文件上传', async () => {
      return await apiService.uploadFile(testFile);
    });
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始API集成测试');
    console.log('服务器地址:', REMOTE_SERVER);
    console.log('='.repeat(50));

    try {
      // 按顺序运行所有测试
      await this.testApiResponseCodeHandling();
      await this.testUserAuthAPIs();
      await this.testFeedbackAPIs();
      await this.testSafetyDataAPIs();
      await this.testChatAPIs();
      await this.testFileUploadAPI();

      // 生成测试报告
      this.generateReport();
    } catch (error) {
      console.error('测试过程中发生错误:', error);
    }
  }

  // 生成测试报告
  private generateReport() {
    console.log('\n📊 测试报告');
    console.log('='.repeat(50));
    
    const total = this.results.length;
    const success = this.results.filter(r => r.status === 'success').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;

    console.log(`总测试数: ${total}`);
    console.log(`✅ 成功: ${success}`);
    console.log(`❌ 失败: ${errors}`);
    console.log(`⏭️  跳过: ${skipped}`);
    console.log(`成功率: ${((success / total) * 100).toFixed(1)}%`);

    if (errors > 0) {
      console.log('\n❌ 失败的测试:');
      this.results
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
    }

    console.log('\n🎯 修复验证结果:');
    
    // 检查关键修复点
    const feedbackTest = this.results.find(r => r.name.includes('反馈提交'));
    if (feedbackTest) {
      console.log(`API响应码处理: ${feedbackTest.status === 'error' && feedbackTest.message.includes('参数错误') ? '✅ 修复成功' : '❌ 需要检查'}`);
    }

    const chatTests = this.results.filter(r => r.name.includes('聊天') || r.name.includes('会话'));
    const chatSuccess = chatTests.filter(t => t.status === 'success').length;
    console.log(`Chat API兼容性: ${chatSuccess >= chatTests.length * 0.8 ? '✅ 修复成功' : '❌ 需要检查'}`);

    const safetyTests = this.results.filter(r => r.name.includes('安全数据'));
    const safetySuccess = safetyTests.filter(t => t.status === 'success').length;
    console.log(`安全数据API: ${safetySuccess >= safetyTests.length * 0.8 ? '✅ 修复成功' : '❌ 需要检查'}`);
  }
}

// 使用方法
export const runAPIIntegrationTest = async () => {
  const tester = new APIIntegrationTester();
  await tester.runAllTests();
};

// 在浏览器控制台中可以直接调用
(window as any).testAPI = runAPIIntegrationTest;

console.log('✨ API集成测试脚本已加载');
console.log('使用方法:');
console.log('1. 在浏览器中打开应用');
console.log('2. 打开开发者工具控制台');
console.log('3. 修改TEST_TOKEN变量为有效的JWT token');
console.log('4. 运行: await testAPI()');