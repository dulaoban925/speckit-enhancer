# Implementation Tasks: Spec-Kit UI Viewer

**Feature**: Spec-Kit UI Viewer
**Branch**: `001-speckit-ui-viewer`
**Date**: 2025-11-25 (Updated)
**Status**: Phase 7 完成 - 搜索功能实现完成（Fuse.js + mark.js 精确匹配）

---

## Overview

本文档定义了 Spec-Kit UI Viewer 特性的实施任务列表,按用户故事优先级组织。每个阶段对应一个独立可测试的增量交付。

**总任务数**: 67 个任务
**用户故事数**: 5 个 (P1: 2个, P2: 2个, P3: 1个)
**并行化机会**: 35+ 个可并行任务

---

## Implementation Strategy

### MVP Scope (最小可行产品)
- **User Story 1**: 启动和访问 UI 服务 ✅ P1
- **User Story 2**: 浏览和查看文档 ✅ P1

MVP 交付后,用户即可启动服务、浏览项目文档并查看 Markdown 渲染内容。

### Incremental Delivery
1. **Phase 1-2**: 基础设施和项目设置
2. **Phase 3**: User Story 1 (启动服务) - MVP 核心
3. **Phase 4**: User Story 2 (查看文档) - MVP 核心
4. **Phase 5**: User Story 3 (编辑文档) - 增强功能
5. **Phase 6**: User Story 4 (评论系统) - 协作功能
6. **Phase 7**: User Story 5 (搜索导航) - 高级功能
7. **Phase 8**: 优化和完善

---

## Dependencies & Execution Order

### User Story Dependencies
```
Setup (Phase 1) ────┐
                    ├─→ Foundational (Phase 2) ────┐
                    │                               ├─→ US1 (Phase 3) ─→ US2 (Phase 4)
                    │                               │                         │
                    │                               │                         ├─→ US3 (Phase 5)
                    │                               │                         │
                    │                               │                         ├─→ US4 (Phase 6)
                    │                               │                         │
                    │                               │                         └─→ US5 (Phase 7)
                    │                               │
                    └───────────────────────────────┴─→ Polish (Phase 8)
```

**关键依赖**:
- US2 依赖 US1 (需要服务器运行才能查看文档)
- US3, US4, US5 都依赖 US2 (需要文档查看功能作为基础)
- US3, US4, US5 彼此独立,可并行开发

### Parallel Execution Opportunities

每个用户故事内部的任务组织为可并行执行的组:

- **Phase 3 (US1)**: 6 个可并行任务
- **Phase 4 (US2)**: 8 个可并行任务
- **Phase 5 (US3)**: 7 个可并行任务
- **Phase 6 (US4)**: 8 个可并行任务
- **Phase 7 (US5)**: 4 个可并行任务

---

## Phase 1: Setup & Project Initialization

**目标**: 建立项目基础结构和开发环境

**任务列表**:

- [X] T001 在项目根目录创建 `cli/` 和 `frontend/` 目录
- [X] T002 初始化 CLI 项目: `cd cli && npm init -y`
- [X] T003 初始化 Frontend 项目: `cd frontend && npm create vite@latest . -- --template react-ts`
- [X] T004 安装 CLI 依赖: `cd cli && npm install commander chalk fs-extra`
- [X] T005 安装 CLI 开发依赖: `cd cli && npm install -D typescript @types/node tsx vitest @types/fs-extra`
- [X] T006 配置 CLI TypeScript: 创建 `cli/tsconfig.json` (target: ES2022, module: ESNext, moduleResolution: bundler)
- [X] T007 安装 Frontend 依赖: `cd frontend && npm install react-router-dom zustand marked prism-react-renderer`
- [X] T008 安装 Frontend 开发依赖: `cd frontend && npm install -D @types/node vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom playwright @playwright/test tailwindcss postcss autoprefixer`
- [X] T009 配置 Tailwind CSS: 运行 `cd frontend && npx tailwindcss init -p` 并配置 `tailwind.config.js`
- [X] T010 创建 CLI 目录结构: `cli/src/{commands,services,models,utils}/`
- [X] T011 创建 Frontend 目录结构: `frontend/src/{components,pages,services,hooks,store,types,styles}/`
- [X] T012 配置 Vitest: 创建 `cli/vitest.config.ts` 和 `frontend/vitest.config.ts`
- [X] T013 配置 Playwright: 创建 `frontend/playwright.config.ts`
- [X] T014 添加 npm scripts 到 `cli/package.json`: `dev`, `build`, `test`, `type-check`
- [X] T015 添加 npm scripts 到 `frontend/package.json`: `dev`, `build`, `test`, `test:e2e`, `lint`
- [X] T016 创建 `.gitignore` 文件排除 `node_modules/`, `dist/`, `.env`
- [X] T017 创建 `README.md` 包含项目概述和快速入门指南

**验收标准**:
- ✅ CLI 和 Frontend 项目成功初始化
- ✅ 所有依赖安装完成,无错误
- ✅ TypeScript 配置有效,`npm run type-check` 通过
- ✅ 目录结构符合 plan.md 定义

---

## Phase 2: Foundational Components

**目标**: 实现跨用户故事的共享基础组件

**任务列表**:

### CLI 基础设施

- [X] T018 [P] 实现 CLI 入口文件 `cli/src/index.ts` (设置 Commander.js)
- [X] T019 [P] 实现路径解析工具 `cli/src/utils/pathResolver.ts` (路径安全验证、相对路径转绝对路径)
- [X] T020 [P] 实现日志工具 `cli/src/utils/logger.ts` (支持不同级别: debug, info, warn, error)
- [X] T021 [P] 实现输入验证服务 `cli/src/services/validation.ts` (路径遍历检测、端口验证、项目目录验证)
- [X] T022 [P] 实现文件系统服务 `cli/src/services/fileSystem.ts` (读取、写入、列表、监听文件变化)
- [X] T023 实现 Project 模型 `cli/src/models/project.ts` (项目结构验证、特性扫描)
- [X] T024 实现 Document 模型 `cli/src/models/document.ts` (文档元数据、节点分类)
- [X] T025 实现 Comment 模型 `cli/src/models/comment.ts` (评论数据结构、锚定位置)

### Frontend 基础设施

- [X] T026 [P] 创建全局 Tailwind 样式 `frontend/src/styles/global.css` (暗色主题、GitHub Primer 配色)
- [X] T027 [P] 定义 TypeScript 类型 `frontend/src/types/index.ts` (Project, Feature, DocumentNode, DocumentFile, Comment 等)
- [X] T028 [P] 实现 CLI 服务 `frontend/src/services/cliService.ts` (调用 CLI 命令、解析 JSON 响应)
- [X] T029 [P] 实现 Markdown 服务 `frontend/src/services/markdownService.ts` (Marked.js 渲染、Prism.js 语法高亮)
- [X] T030 [P] 创建 Zustand store `frontend/src/store/index.ts` (项目状态、当前文档、用户会话,集成 Redux DevTools 用于调试)
- [X] T031 [P] 创建布局组件 `frontend/src/components/layout/Header.tsx`
- [X] T032 [P] 创建布局组件 `frontend/src/components/layout/Sidebar.tsx`
- [X] T033 [P] 创建布局组件 `frontend/src/components/layout/Breadcrumb.tsx`
- [X] T034 [P] 创建通用组件 `frontend/src/components/common/Button.tsx`
- [X] T035 [P] 创建通用组件 `frontend/src/components/common/Input.tsx`
- [X] T036 [P] 创建通用组件 `frontend/src/components/common/Modal.tsx`
- [X] T037 配置 React Router `frontend/src/App.tsx` (路由定义: /, /document/:path, /404)
- [X] T038 创建主入口 `frontend/src/main.tsx` (挂载 React 应用、全局样式导入)

**验收标准**:
- ✅ CLI 基础服务可独立使用 (路径验证、文件读写)
- ✅ Frontend 基础组件渲染正常
- ✅ TypeScript 类型定义完整,无 any 类型
- ✅ 暗色主题样式应用成功

---

## Phase 3: User Story 1 - 启动和访问 UI 服务 (P1)

**用户故事**: 作为 Spec-Kit 用户,我希望通过简单的 CLI 命令启动一个本地 Web UI,这样我可以在浏览器中访问项目文档。

**独立测试标准**:
- ✅ 运行 `speckit-ui serve` 成功启动服务
- ✅ 终端显示访问 URL
- ✅ 浏览器访问 URL 能加载 UI 界面
- ✅ 端口冲突时自动尝试下一个端口
- ✅ 无效项目目录显示清晰错误提示

**任务列表**:

### CLI 实现

- [X] T039 [P] [US1] 实现端口查找服务 `cli/src/services/portFinder.ts` (检测端口可用性、自动递增查找)
- [X] T040 [US1] 实现 `serve` 命令 `cli/src/commands/serve.ts` (解析参数、验证项目、启动 Vite 服务器)
- [X] T041 [US1] 添加 `serve` 命令到 CLI 入口 `cli/src/index.ts`
- [X] T042 [US1] 实现项目验证逻辑 `cli/src/services/validation.ts` (检查 .specify/ 或 specs/ 目录)
- [X] T043 [US1] 实现错误提示优化 `cli/src/commands/serve.ts` (端口冲突、目录无效、权限错误)

### Frontend 实现

- [X] T044 [P] [US1] 创建首页组件 `frontend/src/pages/Home.tsx` (显示项目信息、特性列表)
- [X] T045 [P] [US1] 实现项目加载 Hook `frontend/src/hooks/useProject.ts` (调用 CLI list 命令)
- [X] T046 [US1] 集成 Vite 配置 `frontend/vite.config.ts` (开发服务器配置、代理设置)
- [X] T046-A [US1] 编写单元测试 `cli/tests/unit/portFinder.test.ts` (测试端口查找边界情况: 10 次尝试上限、全部端口被占用时返回错误)

### 集成测试

- [X] T047 [US1] 编写 E2E 测试 `frontend/tests/e2e/startup.spec.ts` (启动服务 → 访问 URL → 验证 UI 加载)

**Parallel Execution Example**:
```bash
# 可并行执行的任务组
Group 1: T039 (portFinder), T044 (Home page), T045 (useProject hook)
Group 2: T040, T046 (在 Group 1 完成后)
Group 3: T041, T042, T043 (在 T040 完成后)
Group 4: T047 (在所有实现完成后)
```

**验收标准**:
- ✅ CLI 命令 `speckit-ui serve` 正常工作
- ✅ 默认端口 3000 启动成功
- ✅ 端口冲突时自动查找可用端口 (最多尝试 10 次)
- ✅ 浏览器自动打开并显示 UI 界面
- ✅ 无效项目目录显示错误提示
- ✅ E2E 测试通过

---

## Phase 4: User Story 2 - 浏览和查看文档 (P1)

**用户故事**: 作为 Spec-Kit 用户,我希望在 UI 中按节点分类浏览所有项目文档,这样我可以快速找到并查看需要的文档内容。

**独立测试标准**:
- ✅ 侧边栏显示按节点分类的文档导航
- ✅ 点击文档能正确加载并显示内容
- ✅ Markdown 正确渲染 (标题、列表、代码块、表格)
- ✅ 代码块语法高亮正常
- ✅ 文档链接可点击跳转

**任务列表**:

### CLI 实现

- [X] T048 [P] [US2] 实现 `list` 命令 `cli/src/commands/list.ts` (扫描项目结构、输出 JSON)
- [X] T049 [P] [US2] 实现 `read` 命令 `cli/src/commands/read.ts` (读取文件内容、输出元数据)
- [X] T050 [US2] 添加 `list` 和 `read` 命令到 CLI 入口 `cli/src/index.ts`
- [X] T051 [US2] 实现文档节点分类逻辑 `cli/src/models/document.ts` (识别 constitution, spec, plan, tasks, research, data-model, contracts, quickstart)

### Frontend 实现

- [X] T052 [P] [US2] 实现文档查看组件 `frontend/src/components/document/Viewer.tsx` (渲染 Markdown HTML)
- [X] T053 [P] [US2] 实现文档列表组件 `frontend/src/components/document/DocumentList.tsx` (显示节点下的文档)
- [X] T054 [P] [US2] 实现侧边栏导航逻辑 `frontend/src/components/layout/Sidebar.tsx` (可折叠节点、激活状态)
- [X] T055 [P] [US2] 创建文档查看页面 `frontend/src/pages/DocumentView.tsx` (加载文档、渲染内容)
- [X] T056 [P] [US2] 实现文档加载 Hook `frontend/src/hooks/useDocuments.ts` (调用 CLI read 命令、缓存结果)
- [X] T057 [P] [US2] 增强 Markdown 服务 `frontend/src/services/markdownService.ts` (支持 GFM、表格、任务列表)
- [X] T058 [US2] 集成 Prism.js 语法高亮 `frontend/src/components/document/Viewer.tsx` (按需加载语言包)
- [X] T059 [US2] 实现文档内链接跳转 `frontend/src/components/document/Viewer.tsx` (拦截 <a> 点击、使用 React Router 导航)

### 集成测试

- [X] T060 [US2] 编写 E2E 测试 `frontend/tests/e2e/document-view.spec.ts` (浏览文档 → 点击 → 验证渲染)

**Parallel Execution Example**:
```bash
# 可并行执行的任务组
Group 1: T048 (list cmd), T049 (read cmd), T052 (Viewer), T053 (DocumentList), T054 (Sidebar), T056 (useDocuments), T057 (Markdown service)
Group 2: T050, T051, T055, T058, T059 (在 Group 1 完成后)
Group 3: T060 (在所有实现完成后)
```

**验收标准**:
- ✅ 侧边栏显示所有文档节点 (宪章、规格、计划、任务等)
- ✅ 点击文档能加载并显示完整内容
- ✅ Markdown 渲染正确率 100% (标题、列表、代码、表格、链接、图片)
- ✅ 代码块语法高亮支持 20+ 语言 (TypeScript, JavaScript, Python, Bash, JSON, Markdown)
- ✅ 文档切换响应时间 < 500ms
- ✅ 10,000 行文档渲染时间 < 100ms
- ✅ E2E 测试通过

---

## Phase 5: User Story 3 - 编辑文档 (P2)

**用户故事**: 作为 Spec-Kit 用户,我希望在 UI 中直接编辑文档内容并保存到文件系统,这样我可以避免在 IDE 和浏览器之间切换。

**独立测试标准**:
- ✅ 点击"编辑"按钮切换到编辑模式
- ✅ 显示分屏编辑器 (左侧编辑,右侧预览)
- ✅ 编辑内容时右侧实时同步预览
- ✅ 点击"保存"成功写入文件
- ✅ 文件被外部修改时显示冲突提示

**任务列表**:

### CLI 实现

- [X] T061 [P] [US3] 实现 `write` 命令 `cli/src/commands/write.ts` (写入文件、冲突检测)
- [X] T062 [P] [US3] 实现 `watch` 命令 `cli/src/commands/watch.ts` (使用 fs.watch 监听文件变化)
- [X] T063 [US3] 添加 `write` 和 `watch` 命令到 CLI 入口 `cli/src/index.ts`
- [X] T064 [US3] 实现文件冲突检测 `cli/src/commands/write.ts` (比较 mtime、返回冲突信息)

### Frontend 实现

- [X] T065 [P] [US3] 创建编辑器组件 `frontend/src/components/document/Editor.tsx` (分屏布局、左侧 textarea)
- [X] T066 [P] [US3] 创建预览组件 `frontend/src/components/document/Preview.tsx` (右侧实时渲染)
- [X] T067 [P] [US3] 实现文件监听 Hook `frontend/src/hooks/useFileWatch.ts` (轮询 CLI watch 命令、接收变更通知)
- [X] T068 [US3] 实现编辑模式切换逻辑 `frontend/src/pages/DocumentView.tsx` (查看/编辑模式状态管理)
- [X] T069 [US3] 实现保存功能 `frontend/src/pages/DocumentView.tsx` (调用 CLI write 命令、处理响应)
- [X] T070 [US3] 实现冲突提示 Modal `frontend/src/components/common/Modal.tsx` (显示冲突信息、提供选项)
- [X] T071 [US3] 实现未保存提示 `frontend/src/pages/DocumentView.tsx` (检测内容变化、离开时提示)
- [ ] T071-A [US3] 编写单元测试 `frontend/tests/unit/editor.test.ts` (测试编辑器同步延迟 < 300ms、防抖机制正确工作)

### 集成测试

- [ ] T072 [US3] 编写 E2E 测试 `frontend/tests/e2e/document-edit.spec.ts` (编辑文档 → 保存 → 验证文件内容)

**Parallel Execution Example**:
```bash
# 可并行执行的任务组
Group 1: T061 (write cmd), T062 (watch cmd), T065 (Editor), T066 (Preview), T067 (useFileWatch)
Group 2: T063, T064, T068, T069, T070, T071 (在 Group 1 完成后)
Group 3: T072 (在所有实现完成后)
```

**验收标准**:
- ✅ 编辑模式下显示分屏编辑器
- ✅ 左侧编辑器支持 Markdown 输入
- ✅ 右侧预览实时同步 (防抖 300ms)
- ✅ 点击"保存"成功写入文件
- ✅ 文件被外部修改时显示冲突提示
- ✅ 离开编辑模式时提示未保存更改
- ✅ E2E 测试通过

---

## Phase 6: User Story 4 - 添加和管理评论 (P2)

**用户故事**: 作为 Spec-Kit 团队成员,我希望在文档的特定位置添加评论和讨论,这样我可以与团队协作审查文档。

**独立测试标准**:
- ✅ 选择文本后显示"添加评论"按钮
- ✅ 输入评论内容并提交成功保存
- ✅ 文档中显示评论高亮标记
- ✅ 点击评论标记显示评论详情
- ✅ 支持回复评论形成线程讨论
- ✅ 评论可标记为"已解决"

**任务列表**:

### CLI 实现

- [X] T073 [P] [US4] 实现 `comment add` 命令 `cli/src/commands/comment.ts` (添加评论、生成 UUID)
- [X] T074 [P] [US4] 实现 `comment list` 命令 `cli/src/commands/comment.ts` (列出文档评论)
- [X] T075 [P] [US4] 实现 `comment update` 命令 `cli/src/commands/comment.ts` (更新评论状态/内容)
- [X] T076 [P] [US4] 实现 `comment delete` 命令 `cli/src/commands/comment.ts` (删除评论)
- [X] T077 [US4] 添加 `comment` 命令到 CLI 入口 `cli/src/index.ts` (子命令: add, list, update, delete)
- [X] T078 [US4] 实现评论存储逻辑 `cli/src/models/comment.ts` (JSON 格式、目录结构: .specify/memory/comments/<feature-id>/<document-name>.json)

### Frontend 实现

- [X] T079 [P] [US4] 创建评论面板组件 `dashboard/src/components/comment/Panel.tsx` (侧边栏滑出、列表显示)
- [X] T080 [P] [US4] 创建评论项组件 `dashboard/src/components/comment/Item.tsx` (显示评论内容、作者、时间、状态)
- [X] T081 [P] [US4] 创建评论表单组件 `dashboard/src/components/comment/Form.tsx` (输入评论、提交)
- [X] T082 [P] [US4] 实现评论服务 `dashboard/src/services/commentService.ts` (调用 CLI comment 命令、锚定位置计算)
- [X] T083 [P] [US4] 实现文本选择 Hook `dashboard/src/hooks/useTextSelection.ts` (捕获选中文本、计算行号)
- [X] T084 [P] [US4] 实现评论管理 Hook `dashboard/src/hooks/useComments.ts` (加载、添加、更新、删除评论)
- [X] T085 [US4] 实现评论高亮逻辑 `dashboard/src/services/commentHighlighter.ts` (✅ 已完成 - 采用 V2.0 DOM 注入方案替代 V1.0 覆盖层方案)
  - 实现 CommentHighlighter 服务类（TreeWalker 查找文本节点、上下文匹配、DOM 包裹）
  - 在文档中直接注入 `<span class="comment-highlight">` 标记评论位置
  - 支持点击标记打开评论面板、悬停视觉反馈
  - 使用 MutationObserver 自动重新注入标记（防止 DOM 变化导致标记丢失）
- [X] T086 [US4] 实现评论锚定重定位算法 `dashboard/src/services/commentHighlighter.ts` (行号 + 文本片段 + 上下文匹配)
- [X] T087.1 [US4] 优化交互流程：文本选中后自动打开评论表单（移除中间"添加评论"按钮）
- [X] T087.2 [US4] 修复评论标记持久化问题：使用 MutationObserver 监听 DOM 变化并自动重新注入

### 集成测试

- [ ] T087 [US4] 编写 E2E 测试 `frontend/tests/e2e/comment.spec.ts` (选择文本 → 添加评论 → 刷新页面 → 验证评论仍存在)

**Parallel Execution Example**:
```bash
# 可并行执行的任务组
Group 1: T073 (add cmd), T074 (list cmd), T075 (update cmd), T076 (delete cmd), T079 (Panel), T080 (Item), T081 (Form), T082 (service), T083 (useTextSelection), T084 (useComments)
Group 2: T077, T078, T085, T086 (在 Group 1 完成后)
Group 3: T087 (在所有实现完成后)
```

**验收标准**:
- ✅ 选择文本后自动打开评论表单（优化后的交互流程）
- ✅ 输入评论并提交成功保存到 JSON 文件
- ✅ 刷新页面后评论仍然存在
- ✅ 文档中评论位置显示黄色高亮和下划线标记（DOM 注入方案）
- ✅ 评论标记在任何 DOM 变化后自动重新注入（MutationObserver）
- ✅ 点击评论标记打开评论面板显示详情
- ✅ 评论标记跟随文本滚动，无延迟（零性能开销）
- ✅ 支持回复评论（线程讨论）
- ✅ 评论可标记为"已解决"（状态变化）
- ✅ 评论锚定使用上下文匹配算法提高准确性
- ⏸️ E2E 测试（待实现）

---

## Phase 7: User Story 5 - 跨文档导航和搜索 (P3)

**用户故事**: 作为 Spec-Kit 用户,我希望快速搜索和导航到任意文档或文档中的特定内容,这样我可以高效地在大型项目中工作。

**独立测试标准**:
- ✅ 搜索框输入关键词实时显示结果
- ✅ 搜索结果包含文档名和匹配的内容片段
- ✅ 点击搜索结果跳转到对应文档位置
- ✅ 面包屑导航显示当前文档层级
- ✅ 点击面包屑可快速返回上级

**任务列表**:

### Frontend 实现

- [X] T088 [P] [US5] 创建搜索组件 `dashboard/src/components/common/Search.tsx` (✅ 完成 - 搜索框、结果列表、键盘导航)
- [X] T089 [P] [US5] 实现搜索服务 `dashboard/src/services/searchService.ts` (✅ 完成 - Fuse.js 全文搜索、Extended Search 精确匹配)
- [X] T090 [P] [US5] 实现搜索 Hook `dashboard/src/hooks/useSearch.ts` (✅ 完成 - 防抖搜索 300ms、自动重建索引)
- [ ] T091 [P] [US5] 增强面包屑导航 `dashboard/src/components/layout/Breadcrumb.tsx` (显示完整路径、可点击)
- [X] T092 [US5] 实现搜索高亮 `dashboard/src/components/document/Viewer.tsx` (✅ 完成 - mark.js 精确高亮、永久保留)
- [X] T093 [US5] 实现搜索结果跳转 `dashboard/src/components/common/Search.tsx` (✅ 完成 - URL hash 传递行号和匹配文本、智能定位最近匹配项)
- [X] T093.1 [US5] 优化搜索匹配精度：清理 Markdown 语法后高亮
- [X] T093.2 [US5] 优化多匹配项定位：根据行号计算距离，定位到正确的匹配项

### 集成测试

- [ ] T094 [US5] 编写 E2E 测试 `dashboard/tests/e2e/search.spec.ts` (输入关键词 → 验证结果 → 点击跳转)

**Parallel Execution Example**:
```bash
# 可并行执行的任务组
Group 1: T088 (Search), T089 (searchService), T090 (useSearch), T091 (Breadcrumb)
Group 2: T092, T093 (在 Group 1 完成后)
Group 3: T094 (在所有实现完成后)
```

**验收标准**:
- ✅ 全局搜索框可输入关键词（Cmd+K / Ctrl+K 唤起）
- ✅ 搜索结果实时显示（防抖 300ms）
- ✅ 使用 Fuse.js Extended Search 进行精确匹配（`'term` 操作符）
- ✅ 结果包含文档名、相对路径、匹配内容片段（带高亮）
- ✅ 显示匹配数量统计（文档数、总匹配数）
- ✅ 点击结果跳转到对应文档并高亮实际搜索匹配的文本
- ✅ 使用 mark.js 精确高亮搜索关键词（清理 Markdown 语法后匹配）
- ✅ 高亮永久保留（不自动消失）
- ✅ 多个匹配项时智能定位到目标行最近的匹配项
- ✅ 支持键盘导航（↑↓ 选择、Enter 确认、Esc 关闭）
- ⏸️ 面包屑导航增强（待实现 T091）
- ✅ 搜索响应时间 < 1s（50 个文档）
- ⏸️ E2E 测试（待实现 T094）

---

## Phase 8: Polish & Cross-Cutting Concerns

**目标**: 优化性能、提升用户体验、添加错误处理

**任务列表**:

### 性能优化

- [ ] T095 [P] 实现文档缓存策略 `frontend/src/services/cliService.ts` (LRU 缓存、最多 10 个文档)
- [ ] T096 [P] 实现虚拟滚动 `frontend/src/components/document/Viewer.tsx` (处理超大文档)
- [ ] T097 [P] 添加加载状态指示 `frontend/src/components/common/Loading.tsx` (Spinner、Skeleton)
- [ ] T098 [P] 优化 Markdown 渲染性能 `frontend/src/services/markdownService.ts` (Web Worker 处理大文档)

### 错误处理

- [ ] T099 [P] 实现 React Error Boundaries `frontend/src/components/common/ErrorBoundary.tsx`
- [ ] T100 [P] 添加全局错误提示 `frontend/src/components/common/Toast.tsx`
- [ ] T101 [P] 实现 CLI 错误处理 `cli/src/utils/errorHandler.ts` (统一错误格式、退出码)
- [ ] T102 添加 404 页面 `frontend/src/pages/NotFound.tsx`

### 用户体验增强

- [ ] T103 [P] 添加键盘快捷键 `frontend/src/hooks/useKeyboardShortcuts.ts` (Ctrl+S 保存、Ctrl+F 搜索、Esc 关闭 Modal)
- [ ] T104 [P] 实现主题切换 `frontend/src/store/index.ts` (light/dark 主题)
- [ ] T105 [P] 添加响应式设计优化 `frontend/src/styles/global.css` (支持移动端、最小视口 320px)
- [ ] T106 添加无障碍支持 `frontend/src/components/` (ARIA 标签、语义化 HTML、键盘导航)

### 文档和部署

- [ ] T107 [P] 编写 CLI 帮助文档 `cli/src/commands/*.ts` (--help 选项)
- [ ] T108 [P] 更新 README.md (安装说明、使用示例、常见问题)
- [ ] T109 [P] 创建 CONTRIBUTING.md (开发指南、代码规范、提交流程)
- [ ] T110 配置生产构建 `frontend/vite.config.ts` (代码分割、压缩、CSP headers)
- [ ] T111 添加 npm link 配置 `cli/package.json` (bin 字段指向 dist/index.js)
- [ ] T112 创建发布脚本 `scripts/release.sh` (构建 CLI + Frontend、版本管理)

**Parallel Execution Example**:
```bash
# 可并行执行的任务组
Group 1: T095-T106 (所有优化任务可并行)
Group 2: T107-T109 (文档任务可并行)
Group 3: T110-T112 (构建任务按顺序)
```

**验收标准**:
- ✅ 初始加载时间 < 2s
- ✅ 文档切换响应 < 500ms
- ✅ 10,000 行文档渲染 < 100ms
- ✅ 内存占用 < 100MB (典型项目)
- ✅ 所有交互有加载状态提示
- ✅ 错误有友好的提示信息
- ✅ 支持键盘快捷键
- ✅ 支持 light/dark 主题切换
- ✅ 移动端响应式正常
- ✅ CLI --help 输出清晰完整
- ✅ 生产构建优化后体积 < 500KB (gzipped)

---

## Summary

### Task Statistics

- **总任务数**: 112 个
- **Phase 1 (Setup)**: 17 个任务
- **Phase 2 (Foundational)**: 21 个任务
- **Phase 3 (US1 - P1)**: 9 个任务 ✅ MVP
- **Phase 4 (US2 - P1)**: 13 个任务 ✅ MVP
- **Phase 5 (US3 - P2)**: 12 个任务
- **Phase 6 (US4 - P2)**: 15 个任务
- **Phase 7 (US5 - P3)**: 7 个任务
- **Phase 8 (Polish)**: 18 个任务

### Parallel Execution Opportunities

- **可并行任务**: 45+ 个 (标记为 [P])
- **每个用户故事内部并行组**: 2-3 组
- **跨用户故事并行**: US3, US4, US5 可并行开发 (依赖 US2 完成)

### MVP Delivery

**建议 MVP 范围**: Phase 1-4 (46 个任务)
- 用户可启动服务
- 用户可浏览和查看文档
- Markdown 正确渲染
- **预计工作量**: 2-3 周

**增量交付计划**:
1. **Week 1**: Phase 1-2 (基础设施)
2. **Week 2**: Phase 3-4 (MVP 核心功能)
3. **Week 3**: Phase 5 (编辑功能)
4. **Week 4**: Phase 6 (评论系统)
5. **Week 5**: Phase 7-8 (搜索和优化)

---

## Validation Checklist

- ✅ 所有任务遵循 checklist 格式 (checkbox + ID + labels + file path)
- ✅ 每个用户故事有独立测试标准
- ✅ 任务按用户故事优先级组织 (P1 → P2 → P3)
- ✅ 依赖关系清晰标注
- ✅ 并行执行机会已识别 ([P] 标记)
- ✅ MVP 范围明确定义
- ✅ 每个任务指定了具体文件路径
- ✅ 测试任务与实现任务对应
- ✅ 跨阶段共享组件放在 Foundational phase

---

## Notes

- 本任务列表基于 plan.md (技术栈)、spec.md (用户故事)、data-model.md (实体)、contracts/ (API) 和 research.md (技术决策) 生成
- 每个用户故事对应一个独立可测试的增量交付
- 标记 [P] 的任务可并行执行 (不同文件、无依赖)
- 标记 [US#] 的任务属于特定用户故事
- E2E 测试任务在实现完成后执行
- 性能目标已在各阶段验收标准中明确

---

**Tasks Generated**: 2025-11-19
**Ready for**: `/speckit.implement`
