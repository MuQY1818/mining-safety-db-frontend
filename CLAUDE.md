# CLAUDE.md

> 本文件由助手（Claude Code）持续维护。任何影响目录结构、依赖、脚本、接口或配置的改动，必须在此同步更新。
> 小改动进入 **16. Changelog**；大改动需同步更新相应小节。

## 1. 项目概览
- **项目目标**：React前端应用，为矿区语言安全数据库系统提供用户界面，包含AI聊天、安全资料管理、用户反馈等功能
- **技术栈**：React 18+ + TypeScript、Ant Design v5、Zustand、React Query v5、Axios、SiliconFlow AI
- **运行入口**：`npm start` 或见「5. 运行与调试」
- **服务清单**：前端React应用（单体架构）
- **后端代码仓库**：`~/Code/Project/mining-db-server` （Spring Boot + MyBatis-Plus + MinIO）

## 2. 日期约定（必须遵守）
- 所有日期一律通过系统命令获取，不得手填或猜测。
- **格式**：`YYYY-MM-DD`；不确定写 `<待补充>`。
- **Linux/macOS/WSL**：`date +%F`  
  **Windows PowerShell**：`Get-Date -Format yyyy-MM-dd`
- **UTC 时间戳**（如需）：`date -u +"%Y-%m-%dT%H:%M:%SZ"` / `Get-Date -Format o`（取日期部分）

> 建议在脚本/生成器中嵌入：
> - Bash: `TODAY=$(date +%F)`
> - PowerShell: `$TODAY = Get-Date -Format 'yyyy-MM-dd'`
> - Node: `const TODAY = new Date().toISOString().slice(0,10);`

## 3. 目录结构（自动更新）
> 仅展示关键 1~2 层；当新增/重命名/移动目录时更新本节。
```text
src/
├── components/          # 可复用UI组件
│   ├── AIChat/         # AI聊天相关组件  
│   ├── DataManagement/ # 数据管理组件
│   ├── Feedback/       # 反馈系统组件
│   └── Layout/         # 布局组件
├── pages/              # 页面组件
│   ├── Login/          # 登录页
│   ├── Dashboard/      # 仪表板
│   ├── AIChat/         # AI聊天页
│   └── Feedback/       # 反馈页
├── store/              # 状态管理（Zustand）
├── services/           # API服务层
├── types/              # TypeScript类型定义
├── hooks/              # 自定义React Hooks
├── config/             # 配置文件
└── api/                # API端点定义
```

## 4. 开发环境与依赖

- **Node**：使用 **npm**（项目历史原因，存在package-lock.json），TypeScript `strict: true`
- **初始化**
  - 前端：`npm install`
  - 环境配置：`cp .env.example .env.development`
- **环境变量**：复制 `.env.example` → `.env.development`；**真实密钥不得提交**
  - `REACT_APP_API_BASE_URL`: 后端API地址（默认：https://mining-backend.ziven.site/api）
  - `REACT_APP_SILICONFLOW_API_KEY`: AI服务API密钥

## 5. 运行与调试

- **前端开发**：`npm start`（默认端口3000）
- **构建生产版本**：`npm run build` → 输出到 `build/`
- **类型检查**：`tsc --noEmit`
- **代码规范检查**：`npm run lint`
- **单元测试**：`npm test`
- **最小可复现示例**：`src/test-user-isolation.ts`（用户数据隔离测试）
- **常用环境变量**
  - `PORT`, `REACT_APP_API_BASE_URL`, `REACT_APP_SILICONFLOW_API_KEY`

## 6. 代码规范

- **前端**：`eslint` + `prettier` + TypeScript（严格模式），公共 API/组件必须写 **TSDoc**
- **提交规范**：Conventional Commits（`feat|fix|docs|chore|refactor|test|perf`）
- **最小变更**：提交前提供 **最小补丁（Unified diff）**，尽量避免整文件回写
- **注释语言**：统一使用中文注释，提高团队协作效率

## 7. 接口/契约（按需维护）

> 变更 API 时必须更新本节（或链接到 API文档）。

- **后端 REST API 规范**：基于Spring Boot，路径 `/api/*`，使用JWT认证
- **错误模型**：`AjaxResult<T>` wrapper格式
  ```typescript
  interface AjaxResult<T> {
    code: number;    // 0=成功, 非0=失败
    message: string;
    data?: T;
  }
  ```
- **版本策略**：当前无版本号，破坏性变更需协调后端
- **关键API端点**：
  - 用户认证：`POST /user/login`
  - 安全数据：`GET /safety-data/list`
  - 反馈系统：`POST /feedback`
  - 文件上传：`POST /file/upload`

## 8. 配置与安全

- `.env*` 不提交；提供 `.env.example` 明确必填项
- 访问云端/付费 API：SiliconFlow AI API，默认使用环境变量配置
- 日志中严禁输出密钥、令牌、个人敏感信息
- **用户数据隔离**：实现多用户登录时的数据完全隔离
- **测试账号**：管理员账号 `test1` / `123456` （仅用于开发测试）

## 9. 可观测性与调试

- **日志**：开发环境自动开启API请求日志，生产环境关闭
- **错误边界**：智能区分网络错误、认证错误、业务错误
- **指标建议**：关注API响应时间、认证成功率、AI服务可用性
- **调试工具**：React DevTools、Redux DevTools（Zustand）

## 10. 测试与质量门禁

- **测试命令**
  - 前端：`npm test`（Jest + React Testing Library）
  - 类型检查：`tsc --noEmit`
  - 代码规范：`npm run lint`
- **CI检查**：TypeScript类型检查，ESLint代码规范
- **覆盖重点**：
  - `authStore`: 用户认证逻辑
  - `chatStore`: AI聊天会话管理
  - `apiService`: API调用和错误处理
- **性能基线**：
  - API超时10秒
  - 分页大小默认10条
  - React Query缓存时间5分钟
- **当前测试状态**（2025-08-28）：
  - 总体通过率：100% (14/14项)
  - ✅ 已通过：api.test.ts (4/4), authStore.test.ts (9/9), App.test.tsx (1/1)
  - ✅ 项目构建：TypeScript编译成功，仅有未使用变量警告

## 11. 构建与发布

### 本地构建
- **前端构建**：`npm run build`
- **产物目录**：`build/` 静态文件
- **类型检查**：`tsc --noEmit`

### Docker镜像部署
- **本地构建推送**：`./scripts/build-and-push.sh [tag]`
- **服务器更新**：`./scripts/server-update.sh [image_tag]`
- **CI/CD自动化**：推送代码到main分支自动触发镜像构建和推送
- **镜像仓库**：GitHub Container Registry (`ghcr.io/muqy1818/mining-safety-db-frontend`)

### 部署模式
- **滚动更新**：零停机时间更新（默认）
- **蓝绿部署**：`--blue-green` 选项支持
- **自动回滚**：健康检查失败时自动回滚到上一版本
- **版本管理**：支持语义化版本标签和时间戳标签

### 生产环境配置
- **环境变量**：`.env.production` （基于 `.env.production.example` 创建）
- **监控集成**：Prometheus + Grafana 可选配置
- **日志收集**：Fluent Bit 日志聚合
- **健康检查**：自动化健康检查和服务重启

### 版本与变更
- **版本策略**：Git标签 + Docker镜像标签
- **变更记录**：本文件 **16. Changelog**
- **自动化**：GitHub Actions完整CI/CD流程

## 12. AI服务与集成规范

- **AI服务**：SiliconFlow API，智能问答功能
- **配置**：环境变量 `REACT_APP_SILICONFLOW_API_KEY`
- **错误处理**：网络错误自动重试，API配额错误友好提示
- **数据管理**：聊天记录本地存储 + 后端API同步
- **用户体验**：流式响应实时显示，支持会话管理

## 13. 迁移与兼容（按需维护）

- **npm vs pnpm**：项目使用npm（历史原因，存在package-lock.json）
- **平台兼容**：支持 Windows/Linux/macOS 开发环境
- **API兼容**：兼容旧版API响应格式（code:0和code:200）

## 14. 常用脚本/命令（统一入口）

### 本地开发
- 开发服务：`npm start`
- 构建应用：`npm run build`
- 代码检查：`npm run lint`
- 类型检查：`tsc --noEmit`

### Docker部署
- 本地构建推送：`./scripts/build-and-push.sh [tag]`
- 服务器更新：`./scripts/server-update.sh [image_tag]`
- 查看部署状态：`./scripts/server-update.sh --status`
- 回滚上一版本：`./scripts/server-update.sh --rollback`

### 生产环境管理
- 启动服务：`docker-compose -f docker-compose.prod.yml up -d`
- 停止服务：`docker-compose -f docker-compose.prod.yml down`
- 查看日志：`docker-compose -f docker-compose.prod.yml logs -f`
- 健康检查：`curl http://localhost/health`

## 15. 例外与临时约定

- **与全局CLAUDE.md的差异**：
  - 使用npm而非pnpm（项目历史原因，存在package-lock.json）
  - 前端项目无需Docker容器化
  - 无ML训练模块，第12章适配为AI服务规范
- **临时约定**：
  - 2025-02-01前：兼容旧版API响应格式（code:0和code:200）

### 待解决问题
- **用户注册功能**：需要检查和修复注册流程
- **文件上传后端参数验证**：前端已完成枚举值映射和必需字段补全，但后端仍返回"参数错误"，需要进一步排查具体的参数验证规则
- **反馈处理功能后端BUG**：已分析后端代码，前端传参完全正确(feedbackId有效数字，状态pending→resolved，reply非空)，但后端FeedbackServiceImpl.handleFeedback()第114行feedbackMapper.selectById()仍返回null导致200001错误，疑似MyBatis-Plus查询或数据库连接问题，需要后端开发者检查mapper配置和数据库事务

------

## 16. Changelog（倒序追加，**仅在此节插入新行**）

> 由助手自动在行首插入当天日期（通过系统命令获取），格式如下：

- `<YYYY-MM-DD>`：<改动摘要>；**影响面**：<受影响模块>；**回滚**：<回滚方式>；**相关**：<文件/PR/Issue>

> **自动插入片段（Claude 可直接复用）**
>  **Bash**：
>
> ```bash
> TODAY=$(date +%F)
> echo "- ${TODAY}：<改动摘要>；影响面：<模块>；回滚：<方式>；相关：<文件/PR>" >> CLAUDE.md
> ```
>
> **PowerShell**：
>
> ```powershell
> $TODAY = Get-Date -Format 'yyyy-MM-dd'
> Add-Content CLAUDE.md "- $TODAY：<改动摘要>；影响面：<模块>；回滚：<方式>；相关：<文件/PR>"
> ```
>
> **Node**：
>
> ```js
> const fs = require('fs');
> const today = new Date().toISOString().slice(0,10);
> fs.appendFileSync('CLAUDE.md', `- ${today}：<改动摘要>；影响面：<模块>；回滚：<方式>；相关：<文件/PR>\n`);
> ```

- 2025-09-02：文件上传优化完成-通知系统修复和失败自动清理；**影响面**：DataForm.tsx使用App.useApp()修复Modal中通知显示，上传失败时自动从fileList删除文件(322行)，清理测试按钮和无用导入，提示信息优化"文件已自动删除，请重新选择"，编译成功无警告；**回滚**：恢复全局notification，移除自动删除逻辑，恢复测试按钮；**相关**：DataForm.tsx:77+322+333行核心修复
- 2025-09-02：AI聊天消息持久化问题完全修复-流式响应onComplete回调链路彻底解决；**影响面**：重构siliconflow.ts流式处理引擎，添加多种结束检测格式支持([DONE]/finish_reason/空数据)、30秒总超时+10秒块超时双重保护、异常处理确保onComplete始终执行、Promise异步链正确处理，Playwright端到端验证确认消息成功保存到chat_message表，解决了长期存在的"消息显示但不保存"核心BUG；**回滚**：恢复原有简单流处理逻辑，移除增强检测和超时保护；**相关**：siliconflow.ts:98-235行完整重构，ensureComplete+isStreamEnd+超时保护机制
- 2025-08-29：文件上传Content-Type问题彻底修复-Playwright端到端验证成功；**影响面**：src/services/api.ts uploadFile方法添加headers:{'Content-Type':undefined}，移除全局axios配置对multipart请求的干扰，Python脚本和前端行为完全一致，文件上传功能恢复正常；**回滚**：移除添加的headers配置；**相关**：api.ts:210-212行修复，Playwright自动化验证，debug-python-upload.py对比验证
- 2025-08-29：文件上传功能深度诊断完成-确定问题根源在proxy转发；**影响面**：Python诊断脚本验证后端服务正常，高级proxy配置v2.0实施，详细multipart格式分析，确认前端通过proxy的200500错误需要进一步底层修复；**回滚**：恢复基础proxy配置；**相关**：debug-python-upload.py，setupProxy.js高级配置，Playwright端到端验证
- 2025-08-29：文件上传功能调试进展-proxy配置修复但系统错误持续；**影响面**：setupProxy.js修复multipart请求处理，发现Python直接调用后端成功而前端proxy失败，200500系统错误需要后端日志协助定位；**回滚**：恢复原有proxy配置；**相关**：setupProxy.js，api.ts，Playwright自动化测试验证
- 2025-08-28：完成文件上传功能前端修复和系统调试；**影响面**：DataForm.tsx枚举值映射修复，SafetyData类型定义完善，UploadResponse接口简化，后端必需字段补全，Playwright端到端测试验证；**回滚**：恢复原有枚举值格式，移除额外字段；**相关**：DataForm.tsx，safety.ts，api.ts，后端UploadSafetyDataRequest分析
- 2025-08-28：完成Docker部署方案和完整技术文档；**影响面**：JWT认证修复，Docker容器化配置，Nginx优化，后端API文档，部署自动化脚本；**回滚**：移除Docker配置，恢复本地开发模式；**相关**：Dockerfile，docker-compose.yml，nginx.conf，docs/，scripts/
- 2025-08-28：完成所有代码修复和测试验证；**影响面**：TypeScript类型错误修复，测试套件100%通过(14/14)，项目构建成功，文件上传功能修复；**回滚**：恢复authStore类型定义，撤销测试修改；**相关**：authStore.ts类型定义，App.test.tsx ES模块配置，全项目构建验证
- 2025-08-28：完成前端代码规范化和用户隔离修复；**影响面**：英文注释中文化100%完成，用户数据隔离修复，JWT认证完善，TypeScript编译通过，测试通过率77%(10/13)；**回滚**：恢复英文注释，移除JWT解析逻辑；**相关**：全项目代码文件，authStore.ts，chatStore.ts，package.json
- 2025-08-28：根据全局模板重构CLAUDE.md文档结构；**影响面**：文档结构标准化，增加必要章节；**回滚**：恢复原有文档格式；**相关**：CLAUDE.md
- 2025-08-27：API规范合规性和用户会话隔离修复；**影响面**：authStore.ts, chatStore.ts, types/database.ts；**回滚**：恢复User类型为string ID，移除JWT解析逻辑；**相关**：authStore.ts, chatStore.ts, types/database.ts, api.ts
- 2025-08-27：项目文档标准化；**影响面**：文档结构更清晰，便于维护和新团队成员上手；**回滚**：恢复原有文档格式；**相关**：CLAUDE.md

---

## 技术栈详细说明

### 状态管理架构
- **认证状态**: Zustand store（authStore）+ localStorage持久化
- **聊天历史**: Zustand store（chatStore）+ 后端API存储
- **安全数据**: Zustand store（safetyDataStore）+ React Query缓存
- **用户反馈**: Zustand store（feedbackStore）+ 服务端同步

### API集成模式
- **后端服务**: Spring Boot + JWT认证
- **响应格式**: AjaxResult<T> wrapper兼容多种格式
- **错误处理**: 智能区分网络错误、认证错误、业务错误
- **重试策略**: 网络错误自动重试，认证错误清除token

### 用户体验特性
- **路由保护**: ProtectedRoute组件确保登录后访问
- **状态持久化**: 刷新页面保持登录状态和用户数据
- **AI流式响应**: 实时显示AI回复内容
- **多用户隔离**: 不同用户登录时数据完全隔离- 2025-09-02：文件上传功能全面增强-支持500MB大文件和完整文档视频格式；影响面：endpoints.ts文件大小限制50MB→500MB+扩展30+种文件类型支持，DataForm.tsx UI文本更新+增强成功失败通知，api.ts错误提示优化，支持PDF/Office/图片/视频/音频全格式；回滚：恢复50MB限制和原有文件类型列表，移除增强通知；相关：endpoints.ts:144+145-188行配置扩展，DataForm.tsx:450+217-296行UI和验证增强，api.ts:243-245行错误提示优化
- 2025-09-02：文件上传失败自动删除功能完全修复-beforeUpload验证失败文件正确清理；**影响面**：DataForm.tsx修复onChange过滤逻辑，从只过滤error状态改为同时过滤error和undefined状态(file.status \!== 'error' && file.status \!== undefined)，解决beforeUpload验证失败时文件状态为undefined导致的自动删除失效问题，Playwright端到端验证确认不支持文件类型自动删除+错误通知正常显示；**回滚**：恢复原有过滤逻辑file.status \!== 'error'；**相关**：DataForm.tsx:216-218行过滤逻辑修复，beforeUpload/onChange状态处理优化
- 2025-09-02：修复用户建议状态通知功能-实现智能处理流程和自定义右上角通知；**影响面**：FeedbackList.tsx完整重构notification系统，移除Ant Design静态函数依赖，手动创建DOM通知元素(position:fixed,top:20px,right:20px)，支持已处理/已关闭状态智能检测，包含完整反馈信息展示(标题/类型/管理员回复)，滑动动画效果和6秒自动关闭，彻底解决了用户点击处理已完成反馈时弹窗通知显示问题；**回滚**：恢复Ant Design notification静态函数调用，移除自定义DOM通知实现；**相关**：FeedbackList.tsx:124-208行自定义通知系统，handleManageFeedback状态检查逻辑，Playwright端到端验证成功
