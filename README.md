# Speckit Enhancer

一个无服务端的增强套件,为 Spec-Kit 工作流提供 Dashboard UI、文档管理和协作评论功能。

## 特性

- 🚀 **CLI 驱动**: 通过简单的命令行工具启动本地服务
- 📄 **文档查看**: 按节点分类浏览所有项目文档 (宪章、规格、计划、任务等)
- ✏️ **实时编辑**: 在线编辑 Markdown 文档,支持实时预览
- 💬 **协作评论**: 在文档特定位置添加评论和讨论
  - **V2.0 DOM 注入方案**: 零性能开销，评论标记完美跟随文本
  - **智能定位**: 上下文匹配算法，文档变化后自动重定位
  - **自动持久化**: MutationObserver 自动检测 DOM 变化并重新注入标记
  - **流畅交互**: 文本选中后自动打开评论表单
- 🔍 **快速搜索**: 全文搜索和跨文档导航 ✅
  - **Fuse.js 精确匹配**: Extended Search 模式，支持精确包含搜索
  - **智能高亮**: mark.js 精确高亮搜索关键词，永久保留
  - **智能定位**: 多匹配项时自动定位到目标行最近的匹配
  - **键盘友好**: Cmd+K / Ctrl+K 唤起，支持 ↑↓ 导航
- 🌙 **暗色主题**: GitHub Primer 风格的暗色 UI

## 快速开始

### 前置要求

- Node.js 18+ (推荐使用 LTS 版本)
- npm 9+

### 安装

```bash
# 克隆仓库
git clone <repository-url> peckit-enhancer
cd peckit-enhancer

# 安装 CLI 依赖
cd cli
npm install
npm link

# 安装 Frontend 依赖
cd ../frontend
npm install
```

### 使用

在任意 Spec-Kit 项目根目录运行:

#### 启动 Dashboard

```bash
# 最简单的方式
speckit-enhancer dashboard
ske dashboard                     # 使用简写

# 显式指定 start 命令
speckit-enhancer dashboard start
ske dashboard start

# 指定端口和选项
speckit-enhancer dashboard -p 8080 --no-open
ske dashboard start --port 8080 --verbose
```

服务启动后,在浏览器访问 http://localhost:3000

#### 文档管理

```bash
# 列出项目文档
ske docs list
ske docs list -f json

# 读取文档
ske docs read spec.md
ske docs read specs/001-feature/spec.md -f json

# 写入文档
ske docs write spec.md "content"

# 监听文档变化
ske docs watch spec.md
```

#### 评论管理

评论功能支持在文档中添加协作讨论，特别适合团队审查和反馈。

**在 Dashboard UI 中使用评论**：

1. **添加评论**：
   - 在文档预览模式下，用鼠标选中任意文本
   - 评论表单会自动弹出
   - 输入评论内容并提交

2. **查看评论**：
   - 被评论的文本会显示黄色高亮和下划线
   - 点击高亮标记打开评论面板
   - 评论面板显示所有评论和回复

3. **管理评论**：
   - 支持回复评论（线程讨论）
   - 可以标记评论为"已解决"
   - 可以编辑或删除评论

**使用 CLI 管理评论**：

```bash
# 列出评论
ske comment list -d spec.md -f 001

# 添加评论
ske comment add \
  -d spec.md \
  -f 001 \
  -c "评论内容" \
  -a "作者" \
  -s 10 -e 12 \
  -t "选中的文本"

# 更新评论
ske comment update <comment-id> -d spec.md -f 001 --status resolved

# 删除评论
ske comment delete <comment-id> -d spec.md -f 001
```

**评论存储**：
- 评论存储在 `.specify/memory/comments/<feature-id>/<document-name>.json`
- 支持离线访问，无需服务器
- 自动持久化到本地文件系统

#### 项目管理

```bash
# 初始化项目（即将推出）
ske project init

# 查看项目信息（即将推出）
ske project info

# 验证项目结构（即将推出）
ske project validate
```

## 开发

### 开发模式

```bash
# CLI 开发 (监听文件变化)
cd cli
npm run dev

# Frontend 开发 (Vite HMR)
cd frontend
npm run dev
```

### 运行测试

```bash
# CLI 单元测试
cd cli
npm test

# Frontend 单元测试
cd frontend
npm test

# E2E 测试
cd frontend
npm run test:e2e
```

### 构建生产版本

```bash
# 构建 CLI
cd cli
npm run build

# 构建 Frontend
cd frontend
npm run build
```

## 项目结构

```
speckit-enhancer/
├── cli/                # CLI 命令实现
│   ├── src/
│   │   ├── commands/   # 命令处理器 (serve, list, read, write, watch, comment)
│   │   ├── services/   # 业务逻辑 (文件系统、验证、端口查找)
│   │   ├── models/     # 数据模型 (Project, Document, Comment)
│   │   ├── utils/      # 工具函数 (路径解析、日志)
│   │   └── index.ts    # CLI 入口 (命令注册)
│   └── tests/          # CLI 测试
│
├── dashboard/          # Dashboard 前端 SPA
│   ├── src/
│   │   ├── components/ # React 组件
│   │   │   ├── common/     # 通用组件 (Button, Input, Modal, Search)
│   │   │   ├── document/   # 文档组件 (Viewer, Editor, Preview)
│   │   │   ├── comment/    # 评论组件 (Panel, Item, Form)
│   │   │   └── layout/     # 布局组件 (Header, Sidebar, Breadcrumb)
│   │   ├── pages/      # 页面组件 (Home, DocumentView, NotFound)
│   │   ├── services/   # 服务层 (CLI, Markdown, Comment, Search)
│   │   ├── hooks/      # 自定义 Hooks (useProject, useDocuments, useComments, useSearch)
│   │   ├── store/      # Zustand 状态管理
│   │   ├── types/      # TypeScript 类型定义
│   │   └── styles/     # 全局样式 (Tailwind CSS)
│   └── tests/          # 前端测试 (Unit + E2E)
│
├── docs/               # 实现文档和测试指南
│   ├── README.md                          # 文档说明
│   ├── search-implementation-summary.md   # 搜索功能实现总结
│   ├── search-implementation-report.md    # 搜索功能初步报告
│   └── test-guide.md                      # 功能测试指南
│
└── specs/              # 特性规格
    └── 001-speckit-ui-viewer/
        ├── spec.md                        # 功能规格（✅ Phase 6 & 7 已完成）
        ├── plan.md                        # 实施计划
        ├── tasks.md                       # 任务列表（✅ Phase 6 & 7 已完成）
        ├── data-model.md                  # 数据模型
        ├── contracts/                     # API 合约
        ├── research.md                    # 技术研究
        └── quickstart.md                  # 快速入门
```

## 技术栈

- **语言**: TypeScript 5.x
- **前端**: React 18, Vite 5, Zustand, Tailwind CSS
- **CLI**: Commander.js, Chalk
- **Markdown**: Marked.js, Prism.js
- **搜索**: Fuse.js (模糊搜索), mark.js (文本高亮)
- **测试**: Vitest, Playwright

## 文档

### 项目规格文档

- [功能规格](./specs/001-speckit-ui-viewer/spec.md) - 完整的功能需求和用户故事
- [实施计划](./specs/001-speckit-ui-viewer/plan.md) - 技术栈、架构设计和实施策略
- [任务列表](./specs/001-speckit-ui-viewer/tasks.md) - 详细的实施任务和进度（Phase 7 搜索功能已完成）
- [快速入门指南](./specs/001-speckit-ui-viewer/quickstart.md) - 开发者快速上手指南

### 实现文档

- **[docs/](./docs/)** - 功能实现文档和测试指南
  - **评论系统 (Phase 6)**
    - [评论系统实现总结](./docs/implementation-summary.md) - V2.0 DOM 注入方案完整实现记录
    - [V2.0 技术设计文档](./docs/design-comment-markers-v2.md) - 评论标记技术设计
  - **搜索功能 (Phase 7)**
    - [搜索功能实现总结](./docs/search-implementation-summary.md) - Fuse.js + mark.js 完整实现记录
    - [搜索功能测试指南](./docs/test-guide.md) - 快速测试步骤和验收标准

## 许可证

MIT
