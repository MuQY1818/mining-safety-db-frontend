const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('=== 高级Proxy配置启动 ===');
  console.log('Version: Advanced multipart handling v2.0');
  
  app.use('/api', createProxyMiddleware({
    target: 'https://mining-backend.ziven.site',
    changeOrigin: true,
    secure: true,
    logLevel: 'info',
    
    // === 高级配置 ===
    // 不缓冲multipart数据，直接流式传输
    buffer: false,
    // 不让proxy修改响应内容
    selfHandleResponse: false,
    // 不添加X-Forwarded headers
    xfwd: false,
    // 禁用WebSocket处理，避免干扰
    ws: false,
    // 超时配置
    timeout: 60000, // 60秒超时
    proxyTimeout: 60000,
    
    onProxyReq: (proxyReq, req, res) => {
      console.log('\n=== 代理请求分析 ===');
      console.log(`${req.method} ${req.url}`);
      console.log('Headers:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'authorization': req.headers.authorization ? 'Present (JWT)' : 'Missing',
        'user-agent': req.headers['user-agent']
      });
      
      // 专门针对multipart/form-data的处理
      if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        console.log('🎯 Multipart请求检测:');
        console.log('- Original Content-Type:', req.headers['content-type']);
        console.log('- Content-Length:', req.headers['content-length']);
        
        // 提取boundary
        const boundary = req.headers['content-type'].match(/boundary=([^;]+)/);
        if (boundary) {
          console.log('- Boundary:', boundary[1]);
        }
        
        // 确保代理请求保持相同的headers
        console.log('✅ 保持multipart格式不变，直接转发');
      }
    },
    
    onProxyRes: (proxyRes, req, res) => {
      console.log(`📥 代理响应: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
      
      if (req.url.includes('/file/upload')) {
        console.log('文件上传响应详情:');
        console.log('- Status:', proxyRes.statusCode);
        console.log('- Headers:', {
          'content-type': proxyRes.headers['content-type'],
          'content-length': proxyRes.headers['content-length']
        });
        
        // 监听响应数据
        let body = '';
        proxyRes.on('data', (chunk) => {
          body += chunk;
        });
        proxyRes.on('end', () => {
          console.log('- Response Body:', body.substring(0, 200) + '...');
        });
      }
    },
    
    onError: (err, req, res) => {
      console.error('\n🚨 Proxy错误:');
      console.error('- Error:', err.message);
      console.error('- Code:', err.code);
      console.error('- URL:', req.url);
      console.error('- Method:', req.method);
      
      // 返回更友好的错误响应
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Proxy Error',
          message: '代理服务器无法连接到后端',
          details: err.message
        });
      }
    }
  }));
  
  console.log('✅ 高级Proxy配置完成');
  console.log('Target: https://mining-backend.ziven.site');
  console.log('Features: Stream processing, Multipart optimization, Error handling');
};