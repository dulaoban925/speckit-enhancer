# Speckit Enhancer CLI

<div align="center">

**🚀 为 Spec-Kit 工作流提供强大的 CLI 工具和可视化 Dashboard**

[![npm version](https://img.shields.io/npm/v/@superying/speckit-enhancer-cli.svg)](https://www.npmjs.com/package/@superying/speckit-enhancer-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

[功能特性](#功能特性) • [快速开始](#快速开始) • [命令文档](#命令文档) • [使用示例](#使用示例)

</div>

---

## 简介

Speckit Enhancer CLI 是一个为 [Spec-Kit](https://github.com/spec-kit) 工作流设计的命令行工具，提供：

- 📊 **可视化 Dashboard** - 实时查看和编辑规格文档、任务和评论
- 📝 **文档管理** - 读取、写入、监听文档变化
- 💬 **评论系统** - 为文档添加锚点评论和讨论
- 🔄 **实时同步** - 文件变化自动同步到 UI
- 🎨 **现代化 UI** - GitHub 风格的暗色主题界面

## 功能特性

### Dashboard UI

- ✨ 现代化的 Web 界面，支持暗色主题
- 📂 按特性分类浏览项目文档（spec、plan、tasks 等）
- ✏️ Markdown 文档实时编辑和预览
- 💬 支持文档锚点评论和线程讨论
- 🔍 全文搜索和快速导航
- 📊 特性统计面板（进度、风险、协作指标）
- 🔄 文件变化自动检测和刷新提示

### CLI 命令

- 🖥️ **Dashboard 管理** - 启动本地 Web 服务
- 📄 **文档操作** - 列出、读取、写入项目文档
- 👁️ **文件监听** - 实时监控文件变化
- 💬 **评论管理** - 添加、查询、更新、删除评论
- 🔧 **项目管理** - 项目信息查看和验证

## 安装

### 全局安装（推荐）

```bash
npm install -g @superying/speckit-enhancer-cli
```

安装后可使用 `speckit-enhancer` 或缩写 `ske` 命令。

### 项目内安装

```bash
npm install @superying/speckit-enhancer-cli
```

然后通过 `npx` 使用：

```bash
npx ske dashboard
```

## 快速开始

### 1. 启动 Dashboard

在 Spec-Kit 项目根目录下运行：

```bash
ske dashboard
```

或指定项目路径：

```bash
ske dashboard /path/to/your/speckit-project
```

### 2. 自定义配置

```bash
# 指定端口和主机
ske dashboard --port 8080 --host 0.0.0.0

# 启动但不自动打开浏览器
ske dashboard --no-open

# 启用详细日志
ske dashboard --verbose
```

### 3. 访问 Dashboard

浏览器自动打开 `http://localhost:3000`（或你指定的端口）

## 命令文档

### Dashboard 命令

#### `ske dashboard [options] [project-path]`

启动 Dashboard Web UI 服务。

**参数：**
- `project-path` - 项目根目录路径（默认：当前目录 `.`）

**选项：**
- `-p, --port <port>` - 服务端口（默认：`3000`）
- `-h, --host <host>` - 服务主机（默认：`localhost`）
- `-o, --open` - 自动打开浏览器（默认：`true`）
- `--no-open` - 不自动打开浏览器
- `-v, --verbose` - 详细日志输出（默认：`false`）

**别名：** `dash`, `dashboard start`

**示例：**
```bash
# 默认启动（端口 3000，自动打开浏览器）
ske dashboard

# 自定义端口和主机
ske dashboard -p 8080 -h 0.0.0.0

# 不自动打开浏览器
ske dashboard --no-open

# 启用详细日志
ske dashboard -v
```

---

### Docs 命令

#### `ske docs list [options] [project-path]`

列出项目结构和所有文档。

**参数：**
- `project-path` - 项目根目录路径（默认：`.`）

**选项：**
- `-f, --format <format>` - 输出格式：`json` 或 `text`（默认：`json`）
- `-v, --verbose` - 详细输出（默认：`false`）

**示例：**
```bash
# 列出当前项目的文档
ske docs list

# 以文本格式输出
ske docs list --format text
```

#### `ske docs read <file-path> [options]`

读取文档内容。

**参数：**
- `file-path` - 文档文件路径（必需）

**选项：**
- `-f, --format <format>` - 输出格式：`json` 或 `text`（默认：`json`）
- `-r, --project-root <path>` - 项目根目录（默认：当前工作目录）

**示例：**
```bash
# 读取规格文档
ske docs read specs/001-feature-name/spec.md

# 以文本格式输出
ske docs read specs/001-feature-name/spec.md --format text
```

#### `ske docs write <file-path> <content> [options]`

写入文档内容。

**参数：**
- `file-path` - 文档文件路径（必需）
- `content` - 文档内容（必需）

**选项：**
- `-f, --format <format>` - 输出格式：`json` 或 `text`（默认：`json`）
- `-r, --project-root <path>` - 项目根目录（默认：当前工作目录）
- `-e, --expected-mtime <timestamp>` - 预期的最后修改时间（用于冲突检测）
- `-F, --force` - 强制写入，忽略冲突检测（默认：`false`）

**示例：**
```bash
# 写入内容
ske docs write specs/001-feature-name/notes.md "# 笔记\n\n这是内容"

# 带冲突检测的写入
ske docs write specs/001-feature-name/spec.md "更新内容" -e 1700000000000

# 强制写入（忽略冲突）
ske docs write specs/001-feature-name/spec.md "新内容" --force
```

#### `ske docs watch <file-path> [options]`

监听文件变化。

**参数：**
- `file-path` - 要监听的文件路径（必需）

**选项：**
- `-f, --format <format>` - 输出格式：`json` 或 `text`（默认：`json`）
- `-r, --project-root <path>` - 项目根目录（默认：当前工作目录）
- `-v, --verbose` - 详细输出（默认：`false`）

**示例：**
```bash
# 监听规格文档变化
ske docs watch specs/001-feature-name/spec.md

# 启用详细日志
ske docs watch specs/001-feature-name/spec.md -v
```

---

### Comment 命令

#### `ske comment add [options]`

为文档添加新评论。

**必需选项：**
- `-d, --document-path <path>` - 文档路径
- `-f, --feature-id <id>` - 特性 ID
- `-c, --content <text>` - 评论内容
- `-a, --author <name>` - 作者名称
- `-s, --start-line <number>` - 起始行号
- `-e, --end-line <number>` - 结束行号
- `-t, --text-fragment <text>` - 选中的文本片段

**可选选项：**
- `--context-before <text>` - 前置上下文
- `--context-after <text>` - 后置上下文
- `-p, --parent-id <id>` - 父评论 ID（用于回复）
- `-F, --format <format>` - 输出格式（默认：`json`）
- `-r, --project-root <path>` - 项目根目录（默认：当前工作目录）

**示例：**
```bash
ske comment add \
  -d "specs/001-feature-name/spec.md" \
  -f "001-feature-name" \
  -c "这里需要更详细的说明" \
  -a "张三" \
  -s 10 \
  -e 12 \
  -t "## 需求描述"
```

#### `ske comment list [options]`

列出文档的所有评论。

**必需选项：**
- `-d, --document-path <path>` - 文档路径
- `-f, --feature-id <id>` - 特性 ID

**可选选项：**
- `-S, --status <status>` - 按状态过滤：`open`、`resolved`、`archived`
- `-F, --format <format>` - 输出格式（默认：`json`）
- `-r, --project-root <path>` - 项目根目录（默认：当前工作目录）

**示例：**
```bash
# 列出所有评论
ske comment list -d "specs/001-feature-name/spec.md" -f "001-feature-name"

# 只列出未解决的评论
ske comment list -d "specs/001-feature-name/spec.md" -f "001-feature-name" -S open
```

#### `ske comment update <comment-id> [options]`

更新评论内容或状态。

**参数：**
- `comment-id` - 评论 ID（必需）

**必需选项：**
- `-d, --document-path <path>` - 文档路径
- `-f, --feature-id <id>` - 特性 ID

**可选选项：**
- `-c, --content <text>` - 新的评论内容
- `-S, --status <status>` - 新的评论状态：`open`、`resolved`、`archived`
- `-F, --format <format>` - 输出格式（默认：`json`）
- `-r, --project-root <path>` - 项目根目录（默认：当前工作目录）

**示例：**
```bash
# 更新评论内容
ske comment update abc123 \
  -d "specs/001-feature-name/spec.md" \
  -f "001-feature-name" \
  -c "已更新说明"

# 标记评论为已解决
ske comment update abc123 \
  -d "specs/001-feature-name/spec.md" \
  -f "001-feature-name" \
  -S resolved
```

#### `ske comment delete <comment-id> [options]`

删除评论（包括其所有回复）。

**参数：**
- `comment-id` - 评论 ID（必需）

**必需选项：**
- `-d, --document-path <path>` - 文档路径
- `-f, --feature-id <id>` - 特性 ID

**可选选项：**
- `-F, --format <format>` - 输出格式（默认：`json`）
- `-r, --project-root <path>` - 项目根目录（默认：当前工作目录）

**示例：**
```bash
ske comment delete abc123 \
  -d "specs/001-feature-name/spec.md" \
  -f "001-feature-name"
```

---

### Project 命令

> 注意：以下命令为规划中的功能，即将推出。

#### `ske project init [project-path] [options]`

初始化 Spec-Kit 项目。

#### `ske project info [project-path] [options]`

显示项目信息。

#### `ske project validate [project-path] [options]`

验证项目结构。

---

## 使用示例

### 场景 1：启动 Dashboard 并查看项目

```bash
# 进入 Spec-Kit 项目目录
cd /path/to/your/speckit-project

# 启动 Dashboard
ske dashboard

# 浏览器自动打开，可以：
# - 在左侧栏查看所有特性
# - 点击文档节点查看内容
# - 点击特性卡片查看统计面板
# - 实时编辑 Markdown 文档
# - 添加评论和讨论
```

### 场景 2：在其他端口运行 Dashboard

```bash
# 如果 3000 端口被占用
ske dashboard --port 8080

# 或者在所有网络接口上监听（允许局域网访问）
ske dashboard --host 0.0.0.0 --port 8080
```

### 场景 3：通过 CLI 读取文档内容

```bash
# 读取规格文档
ske docs read specs/001-feature-name/spec.md

# 读取任务文档
ske docs read specs/001-feature-name/tasks.md

# 以纯文本格式输出
ske docs read specs/001-feature-name/spec.md --format text
```

### 场景 4：监听文档变化

```bash
# 监听 spec.md 的变化
ske docs watch specs/001-feature-name/spec.md

# 当文件被修改时，会输出变化信息
```

### 场景 5：添加和管理评论

```bash
# 为文档的某一段添加评论
ske comment add \
  -d "specs/001-feature-name/spec.md" \
  -f "001-feature-name" \
  -c "这个需求需要更详细的说明" \
  -a "张三" \
  -s 15 \
  -e 20 \
  -t "## 功能需求"

# 查看该文档的所有评论
ske comment list \
  -d "specs/001-feature-name/spec.md" \
  -f "001-feature-name"

# 标记评论为已解决
ske comment update <comment-id> \
  -d "specs/001-feature-name/spec.md" \
  -f "001-feature-name" \
  -S resolved
```

---

## 技术栈

- **CLI 框架**: [Commander.js](https://github.com/tj/commander.js)
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件**: GitHub Primer 风格
- **Markdown 渲染**: Marked.js + Prism.js
- **图表库**: Recharts 2.x
- **状态管理**: Zustand 4.x

---

## 项目结构

```
cli/
├── src/
│   ├── commands/        # CLI 命令实现
│   │   ├── serve.ts     # Dashboard 启动命令
│   │   ├── list.ts      # 文档列表命令
│   │   ├── read.ts      # 文档读取命令
│   │   ├── write.ts     # 文档写入命令
│   │   ├── watch.ts     # 文件监听命令
│   │   └── comment.ts   # 评论管理命令
│   ├── models/          # 数据模型
│   ├── services/        # 业务逻辑
│   │   ├── fileSystem.ts    # 文件系统操作
│   │   ├── staticServer.ts  # 静态服务器
│   │   └── portFinder.ts    # 端口查找
│   ├── utils/           # 工具函数
│   └── index.ts         # CLI 入口
├── public/              # Dashboard 构建产物
├── dist/                # 编译输出
└── package.json
```

---

## 开发

### 克隆仓库

```bash
git clone https://github.com/your-username/speckit-enhancer.git
cd speckit-enhancer/cli
```

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发模式（支持热重载）
npm run dev

# 在另一个终端测试命令
node dist/index.js dashboard
```

### 构建

```bash
npm run build
```

### 本地测试

```bash
# 链接到全局
npm link

# 现在可以直接使用 ske 命令
ske dashboard
```

### 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 类型检查

```bash
npm run type-check
```

---

## 常见问题

### Q: 启动 Dashboard 时提示端口被占用？

A: 使用 `--port` 选项指定其他端口：
```bash
ske dashboard --port 8080
```

### Q: Dashboard 显示"暂无特性"？

A: 确保你在 Spec-Kit 项目根目录运行命令，项目需要包含：
- `.specify/` 目录（Spec-Kit 配置）
- `specs/` 目录（特性规格）

### Q: 如何在局域网内访问 Dashboard？

A: 使用 `--host 0.0.0.0` 选项：
```bash
ske dashboard --host 0.0.0.0
```
然后在其他设备上通过 `http://<你的IP>:3000` 访问。

### Q: 评论数据存储在哪里？

A: 评论存储在项目的 `.specify/memory/comments/` 目录下，以 JSON 格式保存。

---

## 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: 添加某个特性'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具链相关

---

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 相关链接

- [npm 包](https://www.npmjs.com/package/@superying/speckit-enhancer-cli)
- [GitHub 仓库](https://github.com/your-username/speckit-enhancer)
- [问题反馈](https://github.com/your-username/speckit-enhancer/issues)
- [Spec-Kit 文档](https://github.com/spec-kit)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star！**

Made with ❤️ by [Your Name]

</div>
