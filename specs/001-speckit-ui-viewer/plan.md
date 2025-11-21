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
