# Technical Research: Spec-Kit UI Viewer

**Feature**: Spec-Kit UI Viewer
**Date**: 2025-11-19
**Phase**: 0 - Research & Technology Selection

## Research Overview

本文档记录了 Spec-Kit UI Viewer 特性实施前的技术研究和决策过程。研究重点包括:前端框架选择、CLI 框架选择、Markdown 渲染方案、状态管理方案、文件系统监控、评论锚定策略和端口管理策略。

---

## Decision 1: 前端框架选择

### Decision
选择 **React 18 + TypeScript**

### Rationale
1. **生态系统成熟**: React 拥有庞大的组件库和工具链,Vite 对 React 支持优秀
2. **Hooks 简化状态管理**: useState, useEffect, useCallback 等 Hooks 简化了组件逻辑
3. **TypeScript 支持优秀**: React 18 对 TypeScript 的类型定义完善,提供良好的开发体验
4. **团队熟悉度**: React 是最广泛使用的前端框架,降低学习曲线
5. **性能表现**: React 18 的并发特性 (Concurrent Features) 提升了大文档渲染性能

### Alternatives Considered
- **Vue 3 (Composition API)**:
  - 优点: 更简洁的语法,更好的性能
  - 缺点: 生态系统相对较小,团队熟悉度可能较低
- **Svelte**:
  - 优点: 编译时优化,运行时体积小
  - 缺点: 生态系统最小,工具链不够成熟,团队可能不熟悉

**选择 React 是因为其生态系统和团队熟悉度优势超过了其他框架的性能优势。**

---

## Decision 2: CLI 框架选择

### Decision
选择 **Commander.js**

### Rationale
1. **成熟稳定**: Commander.js 是 Node.js 生态中最成熟的 CLI 框架,被广泛使用
2. **简洁的 API**: 提供直观的命令定义和参数解析 API
3. **自动生成帮助文档**: 支持 `--help` 自动生成,符合宪章要求
4. **TypeScript 支持**: 提供完整的 TypeScript 类型定义
5. **子命令支持**: 支持 `speckit-ui serve`, `speckit-ui read` 等子命令结构

### Alternatives Considered
- **Yargs**:
  - 优点: 更灵活的参数解析,支持复杂的验证规则
  - 缺点: API 较复杂,学习曲线较陡
- **oclif**:
  - 优点: 更强大的插件系统,适合大型 CLI 工具
  - 缺点: 过于复杂,不符合"Development Simplicity"原则

**选择 Commander.js 是因为其简洁性和成熟度符合宪章的"Development Simplicity"原则。**

---

## Decision 3: Markdown 渲染方案

### Decision
选择 **Marked.js + Prism.js**

### Rationale
1. **Marked.js 优势**:
   - 轻量级 (9KB gzipped)
   - 快速渲染 (符合 <100ms 性能要求)
   - 符合 CommonMark 和 GFM (GitHub Flavored Markdown) 规范
   - 易于扩展 (支持自定义渲染器)
2. **Prism.js 优势**:
   - 支持 200+ 编程语言
   - 轻量级 (2KB core + 按需加载语言包)
   - 主题丰富 (适配暗色主题)
   - 支持行号和代码高亮

### Alternatives Considered
- **Remark (unified)**:
  - 优点: 更强大的插件系统,支持 MDX
  - 缺点: 体积较大 (30KB+),性能略慢,学习曲线陡
- **markdown-it**:
  - 优点: 插件丰富,性能优秀
  - 缺点: API 较复杂,体积略大于 Marked.js
- **Shiki (语法高亮)**:
  - 优点: 使用 VS Code 主题,高亮质量更高
  - 缺点: 体积大 (需要加载语言 grammars),渲染慢

**选择 Marked.js + Prism.js 是因为其轻量级和性能表现最佳,符合性能要求。**

---

## Decision 4: 状态管理方案

### Decision
选择 **Zustand**

### Rationale
1. **极简 API**: 无需 Provider,无 boilerplate,代码简洁
2. **性能优秀**: 基于 React Hooks,自动优化重渲染
3. **TypeScript 友好**: 完整的 TypeScript 支持,类型推断优秀
4. **体积小**: 仅 1.2KB gzipped
5. **DevTools 支持**: 支持 Redux DevTools 调试

### Alternatives Considered
- **Context API + useReducer**:
  - 优点: React 内置,无需额外依赖
  - 缺点: Boilerplate 多,性能优化需要手动处理 (useMemo, useCallback)
- **Redux Toolkit**:
  - 优点: 生态系统最成熟,调试工具强大
  - 缺点: Boilerplate 多,学习曲线陡,体积大 (20KB+)
- **Jotai/Recoil**:
  - 优点: 原子化状态管理,适合复杂场景
  - 缺点: 学习曲线陡,生态系统较小

**选择 Zustand 是因为其简洁性和性能表现符合"Development Simplicity"原则。**

---

## Decision 5: 文件系统监控方案

### Decision
使用 **Node.js fs.watch**

### Rationale
1. **内置 API**: Node.js 原生支持,无需额外依赖
2. **跨平台支持**: 在 macOS, Linux, Windows 上均可用
3. **实时性**: 基于操作系统的文件系统事件,延迟低 (<50ms)
4. **轻量级**: 无额外性能开销

### Implementation Strategy
```typescript
// CLI 端实现文件监控
import { watch } from 'fs';

const watcher = watch(filePath, (eventType, filename) => {
  if (eventType === 'change') {
    // 通知前端文件已被外部修改
    console.log(JSON.stringify({ event: 'file-changed', file: filename }));
  }
});
```

前端通过轮询 CLI 命令或 WebSocket (未来增强) 获取文件变更通知。

### Alternatives Considered
- **chokidar**:
  - 优点: 更稳定,处理边缘情况更好 (如文件重命名、批量操作)
  - 缺点: 额外依赖 (50KB),增加复杂度
- **定时轮询文件 mtime**:
  - 优点: 简单,跨平台兼容性好
  - 缺点: 延迟高 (1-5s),性能差

**选择 fs.watch 是因为其轻量级和实时性符合性能要求,初期版本足够使用。**

---

## Decision 6: 评论锚定策略

### Decision
采用 **行号 + 文本片段组合**

### Rationale
1. **行号定位**: 快速定位到大致位置 (O(1) 复杂度)
2. **文本片段校验**: 验证内容是否匹配,处理小幅度修改
3. **智能重定位**: 当行号位置失效时,通过文本搜索重新定位 (模糊匹配)
4. **降级提示**: 当无法重定位时,显示"位置已失效"并保留原始上下文

### Data Structure
```typescript
interface CommentAnchor {
  startLine: number;        // 起始行号 (1-based)
  endLine: number;          // 结束行号
  textFragment: string;     // 选中的文本片段 (最多 200 字符)
  contextBefore?: string;   // 前后文上下文 (各 50 字符,用于重定位)
  contextAfter?: string;
}
```

### Relocation Algorithm
```typescript
function relocateComment(anchor: CommentAnchor, currentLines: string[]): number | null {
  // 1. 检查原行号位置是否仍然匹配
  const originalText = currentLines.slice(anchor.startLine - 1, anchor.endLine).join('\n');
  if (originalText.includes(anchor.textFragment)) {
    return anchor.startLine;
  }

  // 2. 在原位置附近搜索 (前后 10 行)
  for (let offset = 1; offset <= 10; offset++) {
    const lineAbove = anchor.startLine - offset;
    const lineBelow = anchor.startLine + offset;

    if (lineAbove > 0 && currentLines[lineAbove - 1]?.includes(anchor.textFragment)) {
      return lineAbove;
    }
    if (lineBelow <= currentLines.length && currentLines[lineBelow - 1]?.includes(anchor.textFragment)) {
      return lineBelow;
    }
  }

  // 3. 全文搜索
  for (let i = 0; i < currentLines.length; i++) {
    if (currentLines[i].includes(anchor.textFragment)) {
      return i + 1;
    }
  }

  // 4. 无法重定位
  return null;
}
```

### Alternatives Considered
- **仅使用行号**:
  - 优点: 简单,性能最佳
  - 缺点: 文档编辑后行号失效,评论丢失位置
- **仅使用文本选择器 (CSS selector-like)**:
  - 优点: 对 HTML 内容定位准确
  - 缺点: Markdown 为纯文本,CSS selector 不适用
- **使用 diff 算法 (类似 Git)**:
  - 优点: 最精确,能处理复杂修改
  - 缺点: 复杂度高,性能开销大,不符合"Development Simplicity"

**选择行号 + 文本片段组合是因为其在简洁性和鲁棒性之间取得了最佳平衡。**

---

## Decision 7: 端口管理策略

### Decision
采用 **自动递增查找可用端口**

### Rationale
1. **用户体验优先**: 避免端口冲突导致启动失败,自动找到可用端口
2. **清晰提示**: 在终端显示实际使用的端口,避免用户困惑
3. **限制尝试次数**: 最多尝试 10 个端口,避免无限循环

### Implementation Strategy
```typescript
import { createServer } from 'net';

async function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`无法找到可用端口 (尝试了 ${startPort}-${startPort + maxAttempts - 1})`);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}
```

### Usage Example
```bash
$ speckit-ui serve /path/to/project
✓ 端口 3000 已被占用,尝试 3001...
✓ 端口 3001 可用,服务已启动
→ 访问 http://localhost:3001
```

### Alternatives Considered
- **固定端口,失败则报错**:
  - 优点: 简单,用户明确知道端口
  - 缺点: 用户体验差,需要手动指定其他端口
- **随机端口 (0 = 让 OS 分配)**:
  - 优点: 永远不会冲突
  - 缺点: 端口不可预测,难以记忆和分享 URL

**选择自动递增查找是因为其在用户体验和可预测性之间取得了最佳平衡。**

---

## Decision 8: 样式方案

### Decision
选择 **Tailwind CSS**

### Rationale
1. **开发效率**: Utility-first 方法减少 CSS 编写,提高开发速度
2. **无运行时开销**: 编译时生成 CSS,无 CSS-in-JS 运行时性能损失
3. **一致性**: 设计系统内置 (间距、颜色、字体),确保 UI 一致性
4. **体积可控**: PurgeCSS 自动移除未使用的样式,生产包体积小
5. **暗色主题支持**: 内置 `dark:` 变体,轻松实现暗色主题

### Alternatives Considered
- **CSS Modules**:
  - 优点: 作用域隔离,避免样式冲突
  - 缺点: 需要编写大量 CSS,开发效率低
- **Styled-components / Emotion**:
  - 优点: CSS-in-JS,组件化样式
  - 缺点: 运行时性能开销,体积大,服务端渲染复杂
- **Vanilla CSS**:
  - 优点: 无依赖,完全控制
  - 缺点: 维护困难,命名冲突风险高,开发效率低

**选择 Tailwind CSS 是因为其开发效率和无运行时开销符合性能要求。**

---

## Decision 9: 测试策略

### Decision
采用 **分层测试策略**: Vitest (单元测试) + Playwright (E2E 测试)

### Rationale
1. **Vitest 优势**:
   - Vite 原生支持,配置简单
   - 速度极快 (基于 Vite 的 HMR)
   - Jest 兼容 API,学习曲线低
   - TypeScript 支持优秀
2. **Playwright 优势**:
   - 跨浏览器测试 (Chrome, Firefox, Safari)
   - 强大的调试工具 (录制、截图、trace)
   - 稳定性高 (自动等待、重试)
   - TypeScript 支持优秀

### Test Coverage Goals
- **CLI 单元测试**: 命令解析、文件操作、验证逻辑 (目标覆盖率 80%+)
- **前端单元测试**: 组件渲染、Hook 逻辑、服务层 (目标覆盖率 70%+)
- **E2E 测试**: 核心用户流程 (启动服务、查看文档、编辑文档、添加评论)

### Alternatives Considered
- **Jest + Testing Library**:
  - 优点: 生态系统最成熟
  - 缺点: 配置复杂,速度慢,Vite 支持不佳
- **Cypress**:
  - 优点: 调试体验好,社区大
  - 缺点: 仅支持 Chromium-based 浏览器,速度较慢

**选择 Vitest + Playwright 是因为其与 Vite 的集成优势和跨浏览器支持。**

---

## Summary of Technology Stack

| Category | Technology | Rationale |
|----------|-----------|-----------|
| **Frontend Framework** | React 18 + TypeScript | 生态系统成熟,团队熟悉度高 |
| **Build Tool** | Vite 5 | 快速 HMR,开发体验优秀 |
| **CLI Framework** | Commander.js | 简洁 API,成熟稳定 |
| **Markdown Rendering** | Marked.js | 轻量级,性能优秀 |
| **Syntax Highlighting** | Prism.js | 轻量级,主题丰富 |
| **State Management** | Zustand | 极简 API,性能优秀 |
| **Styling** | Tailwind CSS | 开发效率高,无运行时开销 |
| **File Watching** | Node.js fs.watch | 内置 API,实时性好 |
| **Unit Testing** | Vitest | 速度快,Vite 原生支持 |
| **E2E Testing** | Playwright | 跨浏览器,稳定性高 |

---

## Performance Benchmarks (Expected)

| Metric | Target | Approach |
|--------|--------|----------|
| Initial Load | < 2s | Code splitting, lazy loading |
| Document Switch | < 500ms | Virtualized list, memo optimization |
| Markdown Render (10k lines) | < 100ms | Marked.js + Web Workers (if needed) |
| Comment Operations | < 200ms | Optimistic updates, debounce |
| Search (50 docs) | < 1s | IndexedDB cache, web workers |
| Memory Usage | < 100MB | Cleanup unmounted components, garbage collection |

---

## Security Checklist

- ✅ **Command Injection Prevention**: 使用参数数组而非字符串拼接
- ✅ **Path Traversal Protection**: 验证路径在项目目录内,拒绝 `..` 序列
- ✅ **XSS Prevention**: Marked.js 默认转义 HTML,Prism.js 仅高亮代码
- ✅ **Input Validation**: 验证所有用户输入 (评论文本、文件路径、行号)
- ✅ **Content Security Policy**: 生产构建中实施 CSP headers
- ✅ **Error Boundaries**: React Error Boundaries 捕获组件错误

---

## Next Steps (Phase 1)

1. ✅ 完成技术栈研究和决策
2. ⏳ 生成 data-model.md (数据模型设计)
3. ⏳ 生成 contracts/ (CLI 命令合约)
4. ⏳ 生成 quickstart.md (快速入门指南)
5. ⏳ 更新 Agent 上下文

---

**Research Completed**: 2025-11-19
**Status**: ✅ All technical decisions finalized
