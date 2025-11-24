# Implementation Plan: Spec-Kit UI Viewer

**Branch**: `001-speckit-ui-viewer` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-speckit-ui-viewer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

构建一个无服务端的 Web UI,允许用户通过 CLI 命令启动本地服务来查看、编辑和评论 Spec-Kit 项目文档。系统采用 CLI 驱动的前端架构,所有文件操作通过 CLI 命令与文件系统交互,支持 Markdown 渲染、实时预览编辑、评论锚定和冲突检测等核心功能。技术方案将使用 React + Vite 构建 SPA,通过 Node.js CLI 提供文件系统访问能力。

## Technical Context

**Language/Version**: Node.js 18+ (LTS), TypeScript 5.x
**Primary Dependencies**: React 18, Vite 5, Marked.js (Markdown 渲染), Prism.js (语法高亮), Commander.js (CLI 框架)
**Storage**: 本地文件系统 (`.specify/memory/comments/` 用于评论存储,JSON 格式)
**Testing**: Vitest (单元测试), Playwright (E2E 测试)
**Target Platform**: 本地开发环境 (macOS, Linux, Windows),现代浏览器 (Chrome, Firefox, Safari, Edge 最新两个版本)
**Project Type**: web (CLI + 前端 SPA)
**Performance Goals**:
  - 文档切换响应 < 500ms
  - Markdown 渲染 (10,000 行) < 100ms
  - 评论操作 < 200ms
  - 初始加载 < 2s
  - 搜索响应 (50 个文档) < 1s
**Constraints**:
  - 无服务端架构 (NON-NEGOTIABLE)
  - 内存占用 < 100MB (典型项目)
  - 支持 50+ 规格项目
  - 离线可用 (除首次安装 CLI)
**Scale/Scope**:
  - 典型项目: 10 个规格, 200 条评论
  - 最大支持: 50+ 规格, 无文档大小限制 (性能保证在 10,000 行内)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Serverless Architecture** | ✅ PASS | 完全符合。所有文件操作通过 CLI 命令,前端为静态资源,无 HTTP 后端服务 |
| **II. CLI-First Interface** | ✅ PASS | 完全符合。所有文件系统操作通过 CLI 命令公开,支持 --json 输出 |
| **III. Single-Page Application** | ✅ PASS | 完全符合。使用 React + Vite 构建 SPA,静态资源输出,支持 HMR |
| **IV. Multi-Phase Document Support** | ✅ PASS | 完全符合。支持所有 Spec-Kit 工作流文档 (spec, plan, tasks, research, data-model, contracts, quickstart) |
| **V. Collaborative Commenting** | ✅ PASS | 完全符合。评论独立存储在 `.specify/memory/comments/`,支持线程讨论,元数据完整 |
| **VI. Development Simplicity** | ✅ PASS | 完全符合。选择简单成熟技术栈 (React, Vite),避免过度工程,优先实现核心功能 |

### Quality Gates

#### Specification Phase Gates
- ✅ 无实现细节泄漏到 spec.md
- ✅ 零 NEEDS CLARIFICATION 标记 (所有问题已在 Clarifications 部分解决)
- ✅ 所有用户故事独立可测试
- ✅ 用户故事已按优先级分类 (P1, P2, P3)

#### Planning Phase Gates (当前阶段)
- ✅ 技术上下文完全解决 (无 NEEDS CLARIFICATION)
- ✅ CLI 命令合约已文档化 (contracts/ 目录包含 5 个核心命令合约)
- ✅ 项目结构决策已文档化 (Web 应用结构: CLI + Frontend)
- ✅ 安全考虑已在宪章中明确 (命令注入防护、路径遍历防护、XSS 防护)
- ✅ 浏览器兼容性目标已确认 (最新 2 版本的主流浏览器)

### Post-Design Re-evaluation (Phase 1 完成后)

**所有 Planning Phase Gates 已通过 ✅**

Phase 1 产出:
- ✅ research.md: 完成技术栈研究和决策
- ✅ data-model.md: 完成 7 个核心实体的数据模型设计
- ✅ contracts/: 完成 5 个核心 CLI 命令的合约定义
- ✅ quickstart.md: 完成快速入门指南
- ✅ Agent 上下文已更新 (CLAUDE.md)

**计划阶段状态**: ✅ 完成,准备进入任务生成阶段 (`/speckit.tasks`)

### Constitution Version
**Version**: 1.0.2 | **Last Amended**: 2025-11-18

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
cli/
├── src/
│   ├── commands/
│   │   ├── serve.ts         # 启动开发服务器命令
│   │   ├── read.ts          # 读取文件命令
│   │   ├── write.ts         # 写入文件命令
│   │   ├── comment.ts       # 评论管理命令
│   │   └── list.ts          # 列出文档命令
│   ├── services/
│   │   ├── fileSystem.ts    # 文件系统操作服务
│   │   ├── validation.ts    # 输入验证和安全检查
│   │   └── portFinder.ts    # 端口查找服务
│   ├── models/
│   │   ├── project.ts       # 项目模型
│   │   ├── document.ts      # 文档模型
│   │   └── comment.ts       # 评论模型
│   ├── utils/
│   │   ├── pathResolver.ts  # 路径解析工具
│   │   └── logger.ts        # 日志工具
│   └── index.ts             # CLI 入口
├── tests/
│   ├── unit/                # CLI 单元测试
│   ├── integration/         # CLI 集成测试
│   └── fixtures/            # 测试数据
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # 布局组件 (Header, Sidebar, Breadcrumb)
│   │   ├── document/        # 文档组件 (Viewer, Editor, Preview)
│   │   ├── comment/         # 评论组件 (Panel, Item, Form)
│   │   └── common/          # 通用组件 (Button, Input, Modal)
│   ├── pages/
│   │   ├── Home.tsx         # 首页
│   │   ├── DocumentView.tsx # 文档查看页
│   │   └── NotFound.tsx     # 404 页面
│   ├── services/
│   │   ├── cliService.ts    # CLI 命令调用服务
│   │   ├── markdownService.ts # Markdown 渲染服务
│   │   └── commentService.ts  # 评论管理服务
│   ├── hooks/
│   │   ├── useDocuments.ts  # 文档管理 Hook
│   │   ├── useComments.ts   # 评论管理 Hook
│   │   └── useFileWatch.ts  # 文件监听 Hook (fs.watch)
│   ├── store/
│   │   └── index.ts         # 状态管理 (Zustand)
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   ├── styles/
│   │   └── global.css       # 全局样式 (Tailwind)
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/
│   ├── unit/                # 前端单元测试
│   └── e2e/                 # Playwright E2E 测试
├── public/
│   └── favicon.ico
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**Structure Decision**: 采用 **Web 应用结构** (CLI + Frontend)。

**理由**:
1. **CLI 部分**: 提供文件系统操作能力,作为前端与本地文件系统的桥梁。所有文件读写、项目验证、端口管理等操作都通过 CLI 命令完成。
2. **Frontend 部分**: 独立的 React SPA,通过调用 CLI 命令与文件系统交互。这种分离确保了前端可以作为纯静态资源部署。
3. **关键设计决策**:
   - CLI 使用 Commander.js 框架,提供清晰的命令结构
   - 前端使用 Zustand 进行轻量级状态管理 (避免 Redux 的复杂性)
   - 使用 Vite 作为构建工具,提供快速的 HMR 和开发体验
   - TypeScript 贯穿全栈,确保类型安全
   - 测试分层: CLI 单元测试 + 前端单元测试 + E2E 测试

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无宪章违规。所有设计决策符合宪章原则。

## Design Revisions

### Revision 1: 评论标记实现方案重构 (2025-01-24)

**状态**: ✅ 已完成实现 (2025-11-24)

**问题**: 初始实现使用 fixed 定位覆盖层来标记被评论的文本,存在以下问题:
1. 需要监听滚动事件并实时更新标记位置,性能开销大
2. Range 对象可能失效,导致位置计算不准确
3. 标记与文本位置同步困难,用户体验差
4. 实现复杂度高,维护成本高

**解决方案**: 采用 **DOM 直接注入** 方案,在 Markdown 渲染后直接修改 DOM 结构

**实际实现** (2025-11-24):

已成功实现 V2.0 DOM 注入方案，核心实现包括：

1. **CommentHighlighter 服务** (`dashboard/src/services/commentHighlighter.ts`)
   - `inject()`: 主入口，遍历评论并注入标记
   - `findTextNode()`: 使用 TreeWalker + 上下文匹配查找目标文本节点
   - `wrapTextNode()`: 分割文本节点并包裹在 `<span class="comment-highlight">` 中
   - `createHighlightSpan()`: 创建带样式的高亮元素（根据状态显示不同颜色）
   - `bindEvents()`: 绑定点击和悬停事件
   - `clear()`: 清除所有评论标记

2. **MutationObserver 监听** (`dashboard/src/pages/DocumentView.tsx`)
   - 自动检测 DOM 结构变化（如打开/关闭评论面板导致重新渲染）
   - 防止无限循环：注入时暂停观察器，完成后恢复
   - 200ms 防抖优化，避免频繁触发
   - 排除评论标记自身的变化

3. **交互优化**
   - 文本选中后自动打开评论表单（移除中间"添加评论"按钮）
   - 评论标记点击打开评论面板
   - 悬停时增强视觉反馈

4. **性能优势**
   - ✅ 零滚动监听开销
   - ✅ 标记完美跟随文本（无延迟）
   - ✅ 自动适应 DOM 变化
   - ✅ 实现简单，易维护

#### 新架构设计

**模式分离**:
- **预览模式** (Preview Mode): 只读渲染器,支持评论标记和评论功能
- **编辑模式** (Edit Mode): 左侧编辑器 + 右侧预览,不显示评论标记

**评论标记实现**:
```html
<span
  class="comment-highlight"
  data-comment-id="comment_xxx"
  data-status="open"
  style="
    background-color: rgba(255, 235, 59, 0.3);
    border-bottom: 2px solid #FFEB3B;
    padding: 1px 2px;
    border-radius: 2px;
    cursor: pointer;
  "
  title="点击查看/编辑评论"
>
  被评论的文本内容
</span>
```

**技术实现路径**:
1. Markdown 渲染为 HTML
2. 加载评论数据
3. 使用 TreeWalker 遍历文本节点
4. 根据评论锚点定位文本节点
5. 将目标文本包裹在 `<span class="comment-highlight">` 中
6. 绑定点击事件打开评论面板

**优势**:
1. ✅ **零性能开销**: 无需监听滚动,标记自动跟随 DOM 布局
2. ✅ **实现简单**: 只需在渲染阶段处理 DOM,无需复杂的位置计算
3. ✅ **完美同步**: 标记是 DOM 的一部分,自动跟随滚动和窗口大小变化
4. ✅ **易于维护**: 清晰的单向数据流,无复杂状态管理

**影响的组件**:
- `Viewer.tsx`: 渲染完成后调用评论标记注入器
- `CommentHighlighter.ts` (新增): 负责 DOM 节点查找和包裹
- `useCommentMarkers.ts` (删除): 不再需要动态计算位置
- `useTextSelection.ts`: 保留,用于预览模式的文本选择创建评论

**评论样式**:
```css
.comment-highlight {
  background-color: rgba(255, 235, 59, 0.3);
  border-bottom: 2px solid #FFEB3B;
  padding: 1px 2px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.comment-highlight:hover {
  background-color: rgba(255, 235, 59, 0.5);
  border-bottom-width: 3px;
}

.comment-highlight[data-status="resolved"] {
  background-color: rgba(76, 175, 80, 0.2);
  border-bottom-color: #4CAF50;
}

.comment-highlight[data-status="archived"] {
  background-color: rgba(158, 158, 158, 0.2);
  border-bottom-color: #9E9E9E;
  opacity: 0.6;
}
```

**实现优先级**:
1. ✅ **Phase 1 完成**: 重构 Viewer 为纯预览模式,实现模式切换
2. ✅ **Phase 2 完成**: 实现 CommentHighlighter 核心算法
3. ✅ **Phase 3 完成**: 集成评论交互(点击、悬停、创建)
4. ✅ **Phase 4 完成**: 优化和边界情况处理
   - 实现 MutationObserver 自动重新注入
   - 优化交互流程（文本选中后自动打开表单）
   - 防抖和性能优化

**技术风险及解决**:
- ✅ **跨标签文本**: 使用 TreeWalker 遍历文本节点,支持跨标签匹配
- ✅ **文本变化**: 使用上下文匹配算法(contextBefore/contextAfter)提高定位准确性
- ✅ **DOM 变化**: 使用 MutationObserver 自动检测并重新注入标记
- ✅ **性能优化**: 零滚动监听,标记自动跟随文本
