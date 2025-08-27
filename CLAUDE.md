# CLAUDE.md

> 本文件由助手（Claude Code）持续维护。任何影响目录结构、依赖、脚本、接口或配置的改动，必须在此同步更新。
> 小改动进入 **16. Changelog**；大改动需同步更新相应小节。

## 1. 项目概览
- **项目目标**：React前端应用，为矿区语言安全数据库系统提供用户界面，包含AI聊天、安全资料管理、用户反馈等功能
- **技术栈**：React 18+ + TypeScript、Ant Design v5、Zustand、React Query v5、Axios、SiliconFlow AI
- **运行入口**：`npm start` 或见「5. 运行与调试」
- **服务清单**：前端React应用（单体架构）

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
  - 总体通过率：77% (10/13项)
  - ✅ 已通过：api.test.ts (4/4), authStore大部分测试 (6/9)
  - ❌ 待修复：authStore logout测试、checkAuth测试(2项)、App.test.tsx ES模块配置

## 11. 构建与发布

- **前端**：`npm run build`
- **产物目录**：`build/` 静态文件
- **版本与变更**：使用本文件 **16. Changelog**

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

> 以下为项目常用命令：

- 开发：`npm start`
- 构建：`npm run build`
- 测试：`npm test`
- 代码检查：`npm run lint`
- 类型检查：`tsc --noEmit`

## 15. 例外与临时约定

- **与全局CLAUDE.md的差异**：
  - 使用npm而非pnpm（项目历史原因，存在package-lock.json）
  - 前端项目无需Docker容器化
  - 无ML训练模块，第12章适配为AI服务规范
- **临时约定**：
  - 2025-02-01前：兼容旧版API响应格式（code:0和code:200）

### 待解决问题（2025-08-28凌晨1:24发现）
- **文件上传功能**：无法正常上传文件，需要检查API调用和后端配置
- **用户注册功能**：需要检查和修复注册流程

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