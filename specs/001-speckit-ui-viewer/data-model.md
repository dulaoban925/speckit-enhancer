# Data Model: Spec-Kit UI Viewer

**Feature**: Spec-Kit UI Viewer
**Date**: 2025-11-19
**Phase**: 1 - Design & Data Modeling

## Overview

本文档定义了 Spec-Kit UI Viewer 的数据模型,包括核心实体、关系、验证规则和状态转换。数据模型基于规格文档中定义的 6 个关键实体。

---

## Entity 1: Project (项目)

### Description
表示一个 Spec-Kit 项目,是所有文档和配置的根容器。

### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `rootPath` | string | ✅ | 项目根目录的绝对路径 | 必须是有效的目录路径,包含 `.specify/` 或 `specs/` |
| `name` | string | ✅ | 项目名称 | 从目录名或 package.json 提取 |
| `constitution` | DocumentFile | ❌ | 宪章文档 (.specify/memory/constitution.md) | 如果文件存在则加载 |
| `features` | Feature[] | ✅ | 项目中的所有特性 (specs/###-feature-name/) | 数组可为空 |
| `createdAt` | Date | ✅ | 项目首次加载时间 | 自动生成 |
| `lastAccessed` | Date | ✅ | 项目最后访问时间 | 自动更新 |

### Relationships
- 一个 Project 包含多个 Feature (1:N)
- 一个 Project 包含一个 Constitution 文档 (1:1, optional)

### TypeScript Definition
```typescript
interface Project {
  rootPath: string;
  name: string;
  constitution?: DocumentFile;
  features: Feature[];
  createdAt: Date;
  lastAccessed: Date;
}
```

---

## Entity 2: Feature (特性/规格)

### Description
表示一个 Spec-Kit 特性,对应 `specs/###-feature-name/` 目录。

### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string | ✅ | 特性编号 (e.g., "001") | 3 位数字 |
| `name` | string | ✅ | 特性名称 (e.g., "speckit-ui-viewer") | kebab-case 命名 |
| `displayName` | string | ✅ | 显示名称 (从 spec.md 标题提取) | 任意字符 |
| `path` | string | ✅ | 特性目录的绝对路径 | 有效的目录路径 |
| `nodes` | DocumentNode[] | ✅ | 特性包含的文档节点 | 至少包含 spec 节点 |
| `status` | FeatureStatus | ✅ | 特性状态 | enum: Draft, InProgress, Completed |

### Enums
```typescript
enum FeatureStatus {
  Draft = 'draft',           // spec.md 存在,plan.md 不存在
  InProgress = 'in-progress', // plan.md 或 tasks.md 存在,但未完成
  Completed = 'completed'     // 所有核心文档存在且标记为完成
}
```

### Relationships
- 一个 Feature 属于一个 Project (N:1)
- 一个 Feature 包含多个 DocumentNode (1:N)

### TypeScript Definition
```typescript
interface Feature {
  id: string;
  name: string;
  displayName: string;
  path: string;
  nodes: DocumentNode[];
  status: FeatureStatus;
}
```

---

## Entity 3: DocumentNode (文档节点)

### Description
表示 Spec-Kit 工作流中的一个阶段,如宪章、规格、计划、任务等。

### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `name` | string | ✅ | 节点名称 | enum: Constitution, Specification, Plan, Tasks, Research, DataModel, Contracts, Quickstart |
| `displayName` | string | ✅ | 显示名称 (中文) | e.g., "宪章", "规格", "计划" |
| `icon` | string | ✅ | 节点图标 (emoji) | e.g., "📜", "📋", "🗓️" |
| `documents` | DocumentFile[] | ✅ | 节点包含的文档文件 | 数组可为空 |
| `order` | number | ✅ | 显示顺序 | 1-10 |

### Enums
```typescript
enum DocumentNodeType {
  Constitution = 'constitution',
  Specification = 'specification',
  Plan = 'plan',
  Tasks = 'tasks',
  Research = 'research',
  DataModel = 'data-model',
  Contracts = 'contracts',
  Quickstart = 'quickstart'
}

const NODE_DISPLAY_CONFIG: Record<DocumentNodeType, { displayName: string; icon: string; order: number }> = {
  constitution: { displayName: '宪章', icon: '📜', order: 1 },
  specification: { displayName: '规格', icon: '📋', order: 2 },
  plan: { displayName: '计划', icon: '🗓️', order: 3 },
  tasks: { displayName: '任务', icon: '✓', order: 4 },
  research: { displayName: '研究', icon: '🔬', order: 5 },
  'data-model': { displayName: '数据模型', icon: '📊', order: 6 },
  contracts: { displayName: '合约', icon: '📁', order: 7 },
  quickstart: { displayName: '快速入门', icon: '🚀', order: 8 }
};
```

### Relationships
- 一个 DocumentNode 属于一个 Feature (N:1)
- 一个 DocumentNode 包含多个 DocumentFile (1:N)

### TypeScript Definition
```typescript
interface DocumentNode {
  name: DocumentNodeType;
  displayName: string;
  icon: string;
  documents: DocumentFile[];
  order: number;
}
```

---

## Entity 4: DocumentFile (文档文件)

### Description
表示一个具体的 Markdown 文档或文件夹。

### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `path` | string | ✅ | 文件的绝对路径 | 有效的文件路径,以 .md 结尾或是目录 |
| `relativePath` | string | ✅ | 相对于项目根目录的路径 | e.g., "specs/001-feature/spec.md" |
| `name` | string | ✅ | 文件名 (含扩展名) | e.g., "spec.md", "contracts/" |
| `displayName` | string | ✅ | 显示名称 | 从文件名或首个 H1 标题提取 |
| `content` | string | ❌ | 文件的原始 Markdown 内容 | 延迟加载,仅在打开时读取 |
| `renderedHtml` | string | ❌ | Markdown 渲染后的 HTML | 延迟计算,缓存结果 |
| `lastModified` | Date | ✅ | 文件最后修改时间 | 从文件系统 mtime 读取 |
| `size` | number | ✅ | 文件大小 (bytes) | 从文件系统 stat 读取 |
| `lineCount` | number | ❌ | 文件行数 | 仅在内容加载后计算 |
| `comments` | Comment[] | ✅ | 关联的评论 | 从 .specify/memory/comments/ 加载 |
| `isDirectory` | boolean | ✅ | 是否为目录 (如 contracts/) | 用于处理文件夹节点 |

### Relationships
- 一个 DocumentFile 属于一个 DocumentNode (N:1)
- 一个 DocumentFile 包含多个 Comment (1:N)

### State Transitions
```
[未加载] --open()--> [加载中] --success--> [已加载]
                            |
                            +--error--> [加载失败]

[已加载] --edit()--> [编辑中] --save()--> [保存中] --success--> [已保存]
                                                    |
                                                    +--error--> [保存失败]

[已保存] --externalChange()--> [冲突] --reload()/discard()--> [已加载]
```

### TypeScript Definition
```typescript
interface DocumentFile {
  path: string;
  relativePath: string;
  name: string;
  displayName: string;
  content?: string;
  renderedHtml?: string;
  lastModified: Date;
  size: number;
  lineCount?: number;
  comments: Comment[];
  isDirectory: boolean;
}
```

---

## Entity 5: Comment (评论)

### Description
表示用户对文档特定位置的批注。

### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string | ✅ | 评论唯一标识 | UUID v4 |
| `documentPath` | string | ✅ | 关联的文档路径 (相对路径) | e.g., "specs/001-feature/spec.md" |
| `anchor` | CommentAnchor | ✅ | 评论锚定位置 | 必须包含行号和文本片段 |
| `content` | string | ✅ | 评论内容 | 1-5000 字符 |
| `author` | string | ✅ | 评论作者 | 从系统用户名或 Git config 获取 |
| `createdAt` | Date | ✅ | 创建时间 | ISO 8601 格式 |
| `updatedAt` | Date | ✅ | 最后更新时间 | ISO 8601 格式 |
| `status` | CommentStatus | ✅ | 评论状态 | enum: Open, Resolved, Archived |
| `parentId` | string | ❌ | 父评论 ID (用于回复线程) | UUID v4, null 表示顶级评论 |
| `replies` | Comment[] | ✅ | 回复评论列表 | 数组可为空 |

### Nested Type: CommentAnchor
```typescript
interface CommentAnchor {
  startLine: number;        // 起始行号 (1-based)
  endLine: number;          // 结束行号
  textFragment: string;     // 选中的文本片段 (最多 200 字符)
  contextBefore?: string;   // 前文上下文 (50 字符)
  contextAfter?: string;    // 后文上下文 (50 字符)
}
```

### Enums
```typescript
enum CommentStatus {
  Open = 'open',         // 未解决
  Resolved = 'resolved', // 已解决
  Archived = 'archived'  // 已归档 (不再显示)
}
```

### Validation Rules
- `content`: 长度 1-5000 字符,不允许纯空白字符
- `anchor.startLine`: >= 1, <= endLine
- `anchor.textFragment`: 长度 1-200 字符
- `anchor.contextBefore/After`: 长度 0-50 字符
- `parentId`: 如果非 null,必须是存在的评论 ID

### Relationships
- 一个 Comment 属于一个 DocumentFile (N:1)
- 一个 Comment 可以有多个回复 Comment (1:N, 递归)

### State Transitions
```
[创建] --save()--> [Open]
                    |
                    +--resolve()--> [Resolved]
                    |
                    +--archive()--> [Archived]

[Resolved] --reopen()--> [Open]
[Archived] --reopen()--> [Open]
```

### TypeScript Definition
```typescript
interface Comment {
  id: string;
  documentPath: string;
  anchor: CommentAnchor;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  status: CommentStatus;
  parentId?: string;
  replies: Comment[];
}
```

---

## Entity 6: CLIConfiguration (CLI 配置)

### Description
表示 CLI 命令的启动参数和运行时配置。

### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `projectPath` | string | ✅ | 项目目录路径 | 有效的目录路径 |
| `port` | number | ✅ | 服务端口 | 1024-65535, 默认 3000 |
| `host` | string | ✅ | 服务主机 | 默认 "localhost" |
| `open` | boolean | ✅ | 启动后自动打开浏览器 | 默认 true |
| `verbose` | boolean | ✅ | 详细日志输出 | 默认 false |

### Validation Rules
- `projectPath`: 必须存在且包含 `.specify/` 或 `specs/` 目录
- `port`: 1024 <= port <= 65535
- `host`: 有效的 hostname 或 IP 地址

### TypeScript Definition
```typescript
interface CLIConfiguration {
  projectPath: string;
  port: number;
  host: string;
  open: boolean;
  verbose: boolean;
}
```

---

## Entity 7: UserSession (用户会话)

### Description
表示浏览器中的用户会话,存储在前端状态管理中。

### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `sessionId` | string | ✅ | 会话唯一标识 | UUID v4 |
| `currentDocument` | DocumentFile | ❌ | 当前查看的文档 | null 表示首页 |
| `editingDocument` | DocumentFile | ❌ | 当前编辑的文档 | null 表示查看模式 |
| `editContent` | string | ❌ | 编辑器中的内容 | 仅在编辑模式下存在 |
| `isDirty` | boolean | ✅ | 是否有未保存的更改 | 默认 false |
| `userName` | string | ✅ | 用户名 (用于评论作者) | 从系统或 Git config 获取 |
| `theme` | 'light' \| 'dark' | ✅ | UI 主题 | 默认 'dark' |

### Relationships
- 一个 UserSession 关联零个或一个 DocumentFile (当前查看/编辑)

### TypeScript Definition
```typescript
interface UserSession {
  sessionId: string;
  currentDocument?: DocumentFile;
  editingDocument?: DocumentFile;
  editContent?: string;
  isDirty: boolean;
  userName: string;
  theme: 'light' | 'dark';
}
```

---

## Storage Format

### Comment Storage (JSON)
评论存储在 `.specify/memory/comments/<feature-id>/<document-name>.json`:

```json
{
  "version": "1.0",
  "documentPath": "specs/001-speckit-ui-viewer/spec.md",
  "comments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "documentPath": "specs/001-speckit-ui-viewer/spec.md",
      "anchor": {
        "startLine": 42,
        "endLine": 42,
        "textFragment": "系统必须在没有传统后端服务器的情况下运行",
        "contextBefore": "### I. 无服务端架构 (NON-NEGOTIABLE)\n\n",
        "contextAfter": "。所有状态和数据持久化通过 CLI 命令访问的本地文件系统进行。"
      },
      "content": "这个架构设计非常合理,完全符合我们的需求。",
      "author": "张三",
      "createdAt": "2025-11-19T10:30:00.000Z",
      "updatedAt": "2025-11-19T10:30:00.000Z",
      "status": "open",
      "parentId": null,
      "replies": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "documentPath": "specs/001-speckit-ui-viewer/spec.md",
          "anchor": {
            "startLine": 42,
            "endLine": 42,
            "textFragment": "系统必须在没有传统后端服务器的情况下运行",
            "contextBefore": "",
            "contextAfter": ""
          },
          "content": "同意,建议在实现阶段加入性能优化。",
          "author": "李四",
          "createdAt": "2025-11-19T11:00:00.000Z",
          "updatedAt": "2025-11-19T11:00:00.000Z",
          "status": "open",
          "parentId": "550e8400-e29b-41d4-a716-446655440000",
          "replies": []
        }
      ]
    }
  ]
}
```

---

## Data Flow

### Document Loading Flow
```
用户打开文档
  ↓
前端调用 CLI 命令: speckit-ui read <file-path>
  ↓
CLI 读取文件内容并输出 JSON
  ↓
前端接收 JSON 并解析为 DocumentFile
  ↓
Marked.js 渲染 Markdown 为 HTML
  ↓
Prism.js 高亮代码块
  ↓
加载关联的评论 (从 .specify/memory/comments/)
  ↓
显示文档和评论
```

### Comment Creation Flow
```
用户选择文本并点击"添加评论"
  ↓
前端捕获选中文本和行号信息
  ↓
前端显示评论表单
  ↓
用户输入评论内容并提交
  ↓
前端构造 Comment 对象 (生成 UUID, 获取用户名)
  ↓
前端调用 CLI 命令: speckit-ui comment add <document-path> <comment-json>
  ↓
CLI 验证输入并写入 .specify/memory/comments/<feature-id>/<document-name>.json
  ↓
CLI 返回成功 (JSON 格式)
  ↓
前端更新状态并显示新评论
```

### File Watch & Conflict Detection Flow
```
用户在 UI 中打开文档进行编辑
  ↓
前端调用 CLI 命令: speckit-ui watch <file-path>
  ↓
CLI 启动 fs.watch 监听文件变化
  ↓
外部程序 (IDE/Git) 修改文件
  ↓
fs.watch 触发 'change' 事件
  ↓
CLI 输出 JSON 事件: { "event": "file-changed", "file": "spec.md" }
  ↓
前端轮询或接收事件通知
  ↓
前端显示冲突提示: "文件已被外部修改,是否重新加载?"
  ↓
用户选择: 重新加载 (放弃编辑) 或 保留当前编辑 (覆盖外部修改)
```

---

## Constraints & Invariants

### Constraints
1. **唯一性约束**:
   - Comment.id 在全局范围内唯一
   - Feature.id 在项目范围内唯一
   - DocumentFile.path 在项目范围内唯一

2. **引用完整性**:
   - Comment.documentPath 必须对应存在的 DocumentFile
   - Comment.parentId 必须对应存在的 Comment (如果非 null)

3. **路径安全**:
   - 所有文件路径必须在项目根目录内 (防止路径遍历攻击)
   - 不允许路径中包含 `..` 序列

### Invariants
1. **Feature 必须包含至少一个 DocumentNode (Specification)**
2. **DocumentFile.content 仅在需要时加载 (延迟加载)**
3. **Comment.updatedAt >= Comment.createdAt**
4. **Comment.anchor.startLine <= Comment.anchor.endLine**

---

## Performance Considerations

### Caching Strategy
- **DocumentFile.renderedHtml**: 缓存渲染结果,仅在内容变化时重新渲染
- **Project.features**: 缓存特性列表,仅在目录变化时重新扫描
- **Comment 索引**: 在内存中建立 documentPath → Comment[] 映射,加速查询

### Lazy Loading
- **DocumentFile.content**: 仅在用户打开文档时加载
- **Comment 数据**: 仅在用户打开文档时加载关联评论
- **Project.features**: 首屏仅加载特性列表,文档内容按需加载

### Memory Management
- 关闭文档时释放 DocumentFile.content 和 renderedHtml
- 限制同时打开的文档数量 (最多 10 个,LRU 淘汰)

---

## Next Steps

- ✅ 数据模型设计完成
- ⏳ 生成 CLI 命令合约 (contracts/)
- ⏳ 生成快速入门指南 (quickstart.md)
- ⏳ 更新 Agent 上下文

---

**Data Model Completed**: 2025-11-19
**Status**: ✅ Ready for contract definition
