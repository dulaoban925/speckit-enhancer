# Speckit Enhancer

<div align="center">

**🚀 为 Spec-Kit 工作流提供强大的增强套件**

[![npm version](https://img.shields.io/npm/v/@superying/speckit-enhancer-cli.svg)](https://www.npmjs.com/package/@superying/speckit-enhancer-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

一个无服务端的增强套件，提供可视化 Dashboard、文档管理和协作评论功能。

</div>

---

## 功能特性

### 📊 可视化 Dashboard

- **特性统计面板** - 实时展示项目进度、风险、协作指标
  - 任务完成率和状态分布
  - 文档健康度评估
  - 协作活跃度统计
  - 风险识别和预警
  - 用户故事进度跟踪
  - 进度时间线图表
- **文档浏览与编辑** - 按特性分类浏览文档，支持在线编辑和实时预览
- **GitHub 风格界面** - 现代化的暗色主题，符合开发者习惯

### 💬 协作评论系统

- **文本锚点评论** - 选中文档任意文本添加评论
- **智能标记** - V2.0 DOM 注入方案，零性能开销
- **线程讨论** - 支持评论回复和嵌套讨论
- **状态管理** - 可标记评论为"已解决"或"已归档"
- **离线优先** - 评论存储在本地，支持 Git 团队共享

### 🔍 全文搜索

- **跨文档搜索** - 快速搜索所有特性文档
- **智能高亮** - 搜索关键词在文档中永久高亮
- **键盘友好** - Cmd+K / Ctrl+K / Ctrl+F 快速唤起

### ⌨️ 快捷键支持

- `Cmd+K / Ctrl+K / Ctrl+F` - 打开全局搜索
- `Ctrl+S / Cmd+S` - 保存文档
- `Escape` - 关闭弹窗
- `Shift+?` - 显示快捷键帮助

---

## 快速开始

### 安装

#### 全局安装（推荐）

```bash
npm install -g @superying/speckit-enhancer-cli
```

安装后可使用 `speckit-enhancer` 或缩写 `ske` 命令。

#### 项目内安装

```bash
npm install @superying/speckit-enhancer-cli

# 使用 npx 运行
npx ske dashboard
```

### 使用

在任意 Spec-Kit 项目根目录运行：

```bash
# 启动 Dashboard
ske dashboard

# 自定义端口
ske dashboard --port 8080

# 查看帮助
ske --help
```

服务启动后，浏览器自动打开 `http://localhost:3000`

---

## 主要功能

### 查看特性统计

点击首页的特性卡片，进入统计面板查看：

- **任务进度** - 完成率、状态分布、按用户故事分组
- **文档健康度** - 文档完整性和质量评估
- **协作活跃度** - 评论数量和贡献者统计
- **风险预警** - 识别长期未完成任务和高讨论区域
- **时间线** - 按阶段可视化任务进度

### 编辑文档

1. 点击文档右上角的"编辑"按钮
2. 实时预览编辑效果
3. 使用 `Ctrl+S` / `Cmd+S` 保存
4. 自动检测文件冲突

### 添加评论

1. 在文档预览模式下，选中任意文本
2. 评论表单自动弹出
3. 输入评论内容并提交
4. 被评论的文本显示高亮
5. 点击高亮标记查看和管理评论

### 搜索文档

- 按 `Cmd+K` / `Ctrl+K` / `Ctrl+F` 打开搜索
- 输入关键词，使用 ↑↓ 导航结果
- 按 Enter 跳转到目标文档
- 关键词在文档中自动高亮

---

## CLI 命令

```bash
# Dashboard 管理
ske dashboard [options]           # 启动 Dashboard
  -p, --port <port>                # 指定端口（默认：3000）
  -h, --host <host>                # 指定主机（默认：localhost）
  --no-open                        # 不自动打开浏览器
  -v, --verbose                    # 详细日志

# 文档操作
ske docs list                     # 列出项目文档
ske docs read <file-path>         # 读取文档
ske docs write <file-path> <content>  # 写入文档
ske docs watch <file-path>        # 监听文档变化

# 评论管理
ske comment list -d <doc> -f <feature>     # 列出评论
ske comment add [options]                   # 添加评论
ske comment update <id> [options]           # 更新评论
ske comment delete <id> [options]           # 删除评论
```

完整命令文档请参考 [CLI README](./cli/README.md)

---

## 常见问题

### Q: 如何安装？

**A:** 推荐使用 npm 全局安装：
```bash
npm install -g @superying/speckit-enhancer-cli
```

### Q: 端口被占用怎么办？

**A:** 使用 `--port` 参数指定其他端口：
```bash
ske dashboard --port 8080
```

### Q: 为什么看不到特性列表？

**A:** 确保：
1. 在 Spec-Kit 项目根目录运行
2. 项目包含 `.specify/` 和 `specs/` 目录

### Q: 评论数据存在哪里？

**A:** 评论存储在项目的 `.specify/memory/comments/` 目录，以 JSON 格式保存，可以提交到 Git 与团队共享。

### Q: 如何团队共享评论？

**A:** 将 `.specify/memory/comments/` 目录提交到版本控制系统，团队成员拉取最新代码即可看到评论。

---

## 开发

### 从源码安装

```bash
# 克隆仓库
git clone https://github.com/dulaoban925/speckit-enhancer.git
cd speckit-enhancer

# 安装并链接 CLI
cd cli
npm install
npm link

# 安装 Dashboard
cd ../dashboard
npm install
```

### 开发模式

```bash
# CLI 开发（支持热重载）
cd cli && npm run dev

# Dashboard 开发（Vite HMR）
cd dashboard && npm run dev
```

---

## 文档

- **[CLI 详细文档](./cli/README.md)** - 完整的 CLI 命令参考
- **[Feature Dashboard 指标说明](./docs/FEATURE_DASHBOARD_METRICS.md)** - 统计面板指标详解
- **[发布指南](./docs/PUBLISHING_GUIDE.md)** - 发布流程和使用指南
- **[功能规格](./specs/001-speckit-ui-viewer/spec.md)** - 完整的功能需求
- **[实施计划](./specs/001-speckit-ui-viewer/plan.md)** - 技术栈和架构设计

---

## 贡献

欢迎贡献！提交 PR 前请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

---

## 许可证

MIT License

---

## 相关链接

- [npm 包](https://www.npmjs.com/package/@superying/speckit-enhancer-cli)
- [GitHub 仓库](https://github.com/dulaoban925/speckit-enhancer)
- [问题反馈](https://github.com/dulaoban925/speckit-enhancer/issues)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star！**

Made with ❤️ by [dulaoban925](https://github.com/dulaoban925)

</div>
