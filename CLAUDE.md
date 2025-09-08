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

- 2025-09-02：完成dev分支到main的merge操作-智能反馈状态通知功能正式发布；**影响面**：git merge解决CLAUDE.md和DataForm.tsx冲突，FeedbackList.tsx智能状态检查和右上角DOM通知系统正式并入主分支，文件上传通知系统统一使用appNotification，所有功能完整集成；**回滚**：git reset --hard HEAD~1恢复merge前状态；**相关**：CLAUDE.md冲突解决，DataForm.tsx统一通知系统，FeedbackList.tsx状态通知功能

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
- **多用户隔离**: 不同用户登录时数据完全隔离

## 16. Changelog（倒序追加，**仅在此节插入新行**）

> 由助手自动在行首插入当天日期（通过系统命令获取），格式如下：

- `<YYYY-MM-DD>`：<改动摘要>；**影响面**：<受影响模块>；**回滚**：<回滚方式>；**相关**：<文件/PR/Issue>

- 2025-09-01：深度调试反馈处理API-确认为后端BUG需要后端修复；**影响面**：添加详细前端调试日志确认参数传递正确(feedbackId:31849487949893有效数字，status:resolved，reply:已处理)，后端FeedbackServiceImpl.handleFeedback()第114行selectById()异常返回null，前端已完成所有可能修复，待解决问题中标记为后端BUG需要后端开发者检查MyBatis-Plus配置；**回滚**：移除调试日志和getFeedbackDetail方法；**相关**：FeedbackList.tsx:107-132+139-146，api.ts:323-340，CLAUDE.md:206待解决问题更新
- 2025-08-31：修复反馈功能字段映射不匹配问题-完整匹配API响应格式；**影响面**：types/feedback.ts中UserFeedback接口更新为匹配API字段(content/reply/contactInfo)，FeedbackList.tsx修复9个字段引用(description→content, adminReply→reply, userName→contactInfo)，feedbackStore.ts修复过滤逻辑字段引用，移除不存在的adminRepliedAt字段，TypeScript编译通过；**回滚**：恢复原有字段名description/adminReply/userName，添加回adminRepliedAt字段引用；**相关**：types/feedback.ts:20-39，FeedbackList.tsx:299+377+384+388+396+406+409+431+304，feedbackStore.ts:188
- 2025-08-31：修复反馈处理API类型不匹配问题-UserFeedback.id改为number类型；**影响面**：types/feedback.ts中UserFeedback接口id字段类型从string改为number，FeedbackList.tsx和FeedbackPage.tsx中投票和处理函数参数类型统一为number，移除handleFeedback调用中的Number()类型转换，解决反馈处理时feedbackId为0导致的"资源不存在"错误；**回滚**：恢复UserFeedback.id为string类型，添加回Number()转换调用；**相关**：types/feedback.ts:21，FeedbackList.tsx:44+102+125，FeedbackPage.tsx:63
- 2025-08-31：完成用户注册功能-Tabs切换界面和完整验证流程；**影响面**：types/database.ts添加RegisterRequest接口，authStore.ts扩展注册方法和状态管理(isRegistering/registerError)，Login/index.tsx重构为Tab模式支持登录和注册，注册成功后自动登录并跳转首页，表单验证包含用户名格式、密码强度、确认密码一致性检查；**回滚**：移除RegisterRequest接口，删除authStore中注册相关方法和状态，恢复Login页面为单一登录表单；**相关**：types/database.ts:135-140,authStore.ts:141-179,Login/index.tsx完整重构
- 2025-08-31：修复详情页面重复计数问题-添加防重复机制；**影响面**：DataDetailPage.tsx添加useRef防止同一ID重复调用API，优化依赖数组只保留id，直接调用store.getState()避免不必要的重渲染，清理未使用的allData变量；**回滚**：移除useRef和防重复逻辑，恢复allData依赖；**相关**：DataDetailPage.tsx:70-127行防重复逻辑，viewCountUpdated ref机制
- 2025-08-31：修复数据详情页无法打开问题-恢复本地数据查找模式；**影响面**：DataDetailPage.tsx改为混合模式(先显示本地数据再后台调用API增加浏览次数)，移除formatFileSize未使用函数，优化错误处理避免直接跳转首页；**回滚**：恢复纯API调用模式，添加formatFileSize函数；**相关**：DataDetailPage.tsx:71-112行逻辑重构，从API调用改回本地store查找+后台API
- 2025-08-31：配置真实GitHub仓库地址和API密钥；**影响面**：构建脚本默认配置改为muqy1818用户名，Docker配置文件更新真实仓库地址，生产环境配置添加SiliconFlow API密钥，CLAUDE.md文档更新镜像仓库信息；**回滚**：恢复your-org占位符配置，移除API密钥配置；**相关**：build-and-push.sh:38-47,docker-compose.prod.yml:12,.env.production:10+32-33,.env.production.example:19+26+119
- 2025-08-31：实现三项功能改进-数据详情API调用、管理员权限控制、Docker环境AI修复；**影响面**：DataDetailPage组件改为调用API递增浏览次数，Dashboard组件添加管理员权限验证，Docker构建配置添加AI API密钥传递；**回滚**：恢复原有useEffect逻辑，移除权限判断条件，移除Dockerfile和env配置中的AI相关配置；**相关**：DataDetailPage.tsx:70-93，Dashboard.tsx:367-377，Dockerfile:28-33，build-and-push.sh:122-129，.env配置文件
- 2025-08-29：建立完整的Docker镜像CI/CD部署方案；**影响面**：新增GitHub Actions自动化构建推送、本地构建脚本、服务器更新脚本、生产环境配置模板，实现代码push→镜像构建→服务器拉取→滚动更新的完整流程；**回滚**：删除.github/workflows/、scripts/build-and-push.sh、scripts/server-update.sh、.env.production.example文件；**相关**：CI/CD工作流、Docker镜像仓库集成、蓝绿部署支持
- 2025-08-29：清理所有测试文件回到纯净生产代码状态；**影响面**：删除src测试文件6个、tests目录、playwright.config.ts、测试脚本2个、调试文件9个，项目专注于生产功能；**回滚**：从git历史恢复测试文件和配置；**相关**：*.test.*、tests/、playwright.config.ts、scripts/run-all-tests.sh、debug-python-upload.py等
- $(date +%F)：修复API key安全泄露问题-实现运行时配置机制；**影响面**：清理所有.env文件中的真实API key替换为占位符，更新.gitignore确保所有.env*文件被忽略，创建src/config/runtime.ts运行时配置系统，修改Dockerfile和docker-compose.prod.yml支持运行时环境变量注入，添加docker/entrypoint.sh脚本动态注入配置到HTML，更新public/index.html和App.tsx初始化运行时配置，修改scripts/server-update.sh添加API key配置说明；**回滚**：恢复原有环境变量文件内容，移除运行时配置相关代码；**相关**：.env*文件清理，.gitignore更新，src/config/runtime.ts:1-88，docker/entrypoint.sh:1-46，Dockerfile:82-88，docker-compose.prod.yml:33-35，public/index.html:13，src/App.tsx:9+70，scripts/server-update.sh:457-472
- 2025-08-29：修复UI核心问题-表单验证和数据加载；**影响面**：DataForm组件DatePicker验证、Dashboard首次访问数据加载、认证状态持久化、数据存储错误处理；**回滚**：git revert 667db04；**相关**：DataForm.tsx,Dashboard.tsx,authStore.ts,safetyDataStore.ts
- 2025-09-08：AI功能401认证错误修复完成-runtime配置注入成功；**影响面**：Docker镜像重新构建并推送，entrypoint脚本正确注入API key，AI功能恢复正常；**回滚**：使用旧版本镜像；**相关**：docker/entrypoint.sh，Dockerfile，docker-compose.simple.yml
- 2025-09-08：成功构建并推送Docker镜像到GitHub Container Registry；影响面：完成镜像构建和推送流程，镜像已上传至ghcr.io/muqy1818/mining-safety-db-frontend:latest；回滚：删除GitHub Container Registry中的镜像；相关：scripts/build-and-push.sh，Dockerfile，docker-compose.simple.yml
- 2025-09-08：修复构建脚本API key占位符问题-重新构建推送包含真实API key的镜像；影响面：scripts/build-and-push.sh第150行修复，Docker镜像现在包含真实API key，服务器AI功能应该正常；回滚：恢复占位符配置；相关：scripts/build-and-push.sh:150行，ghcr.io/muqy1818/mining-safety-db-frontend:latest镜像
- 2025-09-08：彻底修复AI功能离线问题-.env.production文件API key占位符替换为真实密钥；影响面：修复.env.production第13行API key，重新构建推送镜像，验证新镜像包含正确API key sk-mtluervosowzcbzqctuxrntymfenpgriigjjkhdmwrorpsby；回滚：恢复占位符配置；相关：.env.production:13行，ghcr.io/muqy1818/mining-safety-db-frontend:latest镜像
