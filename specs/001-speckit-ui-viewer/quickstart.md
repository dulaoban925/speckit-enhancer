# Quick Start: Spec-Kit UI Viewer

**Feature**: Spec-Kit UI Viewer
**Date**: 2025-11-19
**Phase**: 1 - Quick Start Guide

## Overview

本文档提供 Spec-Kit UI Viewer 的快速入门指南,帮助开发者快速了解项目结构、安装依赖、运行开发服务器和执行测试。

---

## Prerequisites

### Required

- **Node.js**: 18.x 或更高版本 (推荐使用 LTS 版本)
- **npm**: 9.x 或更高版本 (随 Node.js 安装)
- **Git**: 用于版本控制

### Optional

- **VS Code**: 推荐的代码编辑器 (配合 TypeScript 和 ESLint 插件)
- **Playwright**: 自动安装,用于 E2E 测试

### 验证安装

```bash
node --version  # 应显示 v18.x.x 或更高
npm --version   # 应显示 9.x.x 或更高
git --version   # 应显示 2.x.x 或更高
```

---

## Project Structure

```
peckit-enhancer/
├── cli/                      # CLI 命令实现
│   ├── src/
│   │   ├── commands/         # 命令处理器
│   │   ├── services/         # 业务逻辑
│   │   └── index.ts          # CLI 入口
│   ├── tests/                # CLI 测试
│   └── package.json
│
├── frontend/                 # 前端 SPA
│   ├── src/
│   │   ├── components/       # React 组件
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # 服务层
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── store/            # Zustand 状态管理
│   │   └── App.tsx
│   ├── tests/                # 前端测试
│   └── package.json
│
├── .specify/                 # Spec-Kit 配置
│   ├── memory/
│   │   ├── constitution.md   # 项目宪章
│   │   └── comments/         # 评论存储
│   └── templates/
│
└── specs/                    # 特性规格
    └── 001-speckit-ui-viewer/
        ├── spec.md           # 功能规格
        ├── plan.md           # 实施计划
        ├── research.md       # 技术研究
        ├── data-model.md     # 数据模型
        ├── contracts/        # API 合约
        └── quickstart.md     # 本文档
```

---

## Installation

### Step 1: Clone Repository

```bash
git clone <repository-url> peckit-enhancer
cd peckit-enhancer
```

### Step 2: Install CLI Dependencies

```bash
cd cli
npm install
cd ..
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### Step 4: Link CLI Globally (Optional)

```bash
cd cli
npm link
cd ..
```

现在可以在任何目录运行 `speckit-ui` 命令。

---

## Development Workflow

### Start Development Server

#### Option 1: 使用 CLI (推荐)

```bash
# 在项目根目录运行
speckit-ui serve

# 或指定端口
speckit-ui serve --port 8080

# 或不自动打开浏览器
speckit-ui serve --no-open
```

#### Option 2: 直接运行前端开发服务器

```bash
cd frontend
npm run dev
```

访问 http://localhost:3000 查看 UI。

### Development with Hot Reload

前端和 CLI 都支持热重载:

- **Frontend**: Vite HMR 自动刷新页面
- **CLI**: 使用 `tsx watch` 监听文件变化

```bash
# CLI 开发模式 (监听文件变化)
cd cli
npm run dev

# Frontend 开发模式 (Vite HMR)
cd frontend
npm run dev
```

---

## Running Tests

### CLI Tests

```bash
cd cli

# 运行所有测试
npm test

# 运行单个测试文件
npm test -- serve.test.ts

# 运行测试并查看覆盖率
npm run test:coverage
```

### Frontend Tests

#### Unit Tests

```bash
cd frontend

# 运行所有单元测试
npm test

# 运行测试并查看覆盖率
npm run test:coverage

# 监听模式 (开发时推荐)
npm run test:watch
```

#### E2E Tests

```bash
cd frontend

# 首次运行需要安装浏览器
npx playwright install

# 运行所有 E2E 测试
npm run test:e2e

# 运行特定浏览器的测试
npm run test:e2e -- --project=chromium

# 调试模式 (打开 Playwright Inspector)
npm run test:e2e:debug
```

---

## Building for Production

### Build CLI

```bash
cd cli
npm run build
```

输出: `cli/dist/` (编译后的 JavaScript)

### Build Frontend

```bash
cd frontend
npm run build
```

输出: `frontend/dist/` (静态资源,可部署到 CDN)

### Build Both

```bash
# 在项目根目录运行
npm run build:all
```

---

## Common Commands

### CLI Commands

```bash
# 启动服务器
speckit-ui serve [project-path] [--port <port>]

# 读取文件
speckit-ui read <file-path> --json

# 写入文件
speckit-ui write <file-path> --content "content"

# 列出项目结构
speckit-ui list [project-path] --json

# 添加评论
speckit-ui comment add <file-path> <comment-json>

# 列出评论
speckit-ui comment list <file-path> --json

# 查看帮助
speckit-ui --help
speckit-ui serve --help
```

### Frontend Development

```bash
cd frontend

# 启动开发服务器
npm run dev

# 运行单元测试
npm test

# 运行 E2E 测试
npm run test:e2e

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 代码格式化
npm run format
```

---

## Development Tips

### 1. TypeScript Support

- 所有代码使用 TypeScript 编写
- 使用 `npm run type-check` 检查类型错误
- VS Code 自动提供类型提示和错误检测

### 2. Debugging

#### CLI Debugging

```bash
# 使用 Node.js inspector
node --inspect-brk cli/dist/index.js serve

# 使用 VS Code launch.json (已配置)
按 F5 启动调试
```

#### Frontend Debugging

- 使用浏览器 DevTools (F12)
- 使用 React DevTools 扩展
- Zustand DevTools (自动连接到 Redux DevTools Extension)

### 3. Code Style

- 使用 ESLint 和 Prettier 保持代码风格一致
- 运行 `npm run lint` 检查代码风格
- 运行 `npm run format` 自动格式化代码

### 4. Git Workflow

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 提交代码
git add .
git commit -m "feat: add your feature"

# 推送到远程
git push origin feature/your-feature-name
```

---

## Troubleshooting

### 问题 1: 端口被占用

**症状**: `Error: Port 3000 is already in use`

**解决方案**:

```bash
# 使用其他端口
speckit-ui serve --port 8080

# 或关闭占用端口的进程 (macOS/Linux)
lsof -ti:3000 | xargs kill

# 或关闭占用端口的进程 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 问题 2: 依赖安装失败

**症状**: `npm install` 报错

**解决方案**:

```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 问题 3: TypeScript 类型错误

**症状**: VS Code 显示大量类型错误

**解决方案**:

```bash
# 重新安装依赖
npm install

# 重启 TypeScript 服务器 (VS Code)
Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### 问题 4: E2E 测试失败

**症状**: Playwright 测试失败或浏览器无法启动

**解决方案**:

```bash
# 重新安装浏览器
npx playwright install

# 清除测试缓存
npm run test:e2e -- --project=chromium --headed
```

---

## Environment Variables

### CLI Environment Variables

```bash
# .env 文件 (cli/.env)
LOG_LEVEL=debug          # 日志级别: debug, info, warn, error
DEFAULT_PORT=3000        # 默认端口
MAX_PORT_ATTEMPTS=10     # 最大端口尝试次数
```

### Frontend Environment Variables

```bash
# .env 文件 (frontend/.env)
VITE_CLI_PATH=../cli/dist/index.js  # CLI 路径
VITE_API_TIMEOUT=5000               # API 超时时间 (ms)
```

---

## Next Steps

1. ✅ 完成快速入门指南
2. ⏳ 更新 Agent 上下文 (CLAUDE.md)
3. ⏳ 开始实施任务 (运行 `/speckit.tasks`)

---

## Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Quick Start Guide Completed**: 2025-11-19
**Status**: ✅ Ready for implementation
