# Spec-Kit UI Viewer

一个无服务端的 Web UI 工具,用于查看、编辑和评论 Spec-Kit 项目文档。

## 特性

- 🚀 **CLI 驱动**: 通过简单的命令行工具启动本地服务
- 📄 **文档查看**: 按节点分类浏览所有项目文档 (宪章、规格、计划、任务等)
- ✏️ **实时编辑**: 在线编辑 Markdown 文档,支持实时预览
- 💬 **协作评论**: 在文档特定位置添加评论和讨论
- 🔍 **快速搜索**: 全文搜索和跨文档导航
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

```bash
speckit-ui serve

# 或指定端口
speckit-ui serve --port 8080

# 或不自动打开浏览器
speckit-ui serve --no-open
```

服务启动后,在浏览器访问 http://localhost:3000

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
peckit-enhancer/
├── cli/                # CLI 命令实现
│   ├── src/
│   │   ├── commands/   # 命令处理器
│   │   ├── services/   # 业务逻辑
│   │   ├── models/     # 数据模型
│   │   ├── utils/      # 工具函数
│   │   └── index.ts    # CLI 入口
│   └── tests/          # CLI 测试
│
├── frontend/           # 前端 SPA
│   ├── src/
│   │   ├── components/ # React 组件
│   │   ├── pages/      # 页面组件
│   │   ├── services/   # 服务层
│   │   ├── hooks/      # 自定义 Hooks
│   │   ├── store/      # Zustand 状态管理
│   │   ├── types/      # TypeScript 类型
│   │   └── styles/     # 全局样式
│   └── tests/          # 前端测试
│
└── specs/              # 特性规格
    └── 001-speckit-ui-viewer/
        ├── spec.md
        ├── plan.md
        ├── tasks.md
        └── ...
```

## 技术栈

- **语言**: TypeScript 5.x
- **前端**: React 18, Vite 5, Zustand, Tailwind CSS
- **CLI**: Commander.js, Chalk
- **Markdown**: Marked.js, Prism.js
- **测试**: Vitest, Playwright

## 文档

- [功能规格](./specs/001-speckit-ui-viewer/spec.md)
- [实施计划](./specs/001-speckit-ui-viewer/plan.md)
- [快速入门指南](./specs/001-speckit-ui-viewer/quickstart.md)

## 许可证

MIT
