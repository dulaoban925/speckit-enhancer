// 项目数据模型类型定义 (基于 data-model.md)

export interface Project {
  rootPath: string
  name: string
  constitution?: DocumentFile
  features: Feature[]
  createdAt: Date
  lastAccessed: Date
}

export enum FeatureStatus {
  Draft = 'draft',
  InProgress = 'in-progress',
  Completed = 'completed',
}

export interface Feature {
  id: string
  name: string
  displayName: string
  path: string
  nodes: DocumentNode[]
  status: FeatureStatus
}

export enum DocumentNodeType {
  Constitution = 'constitution',
  Specification = 'specification',
  Plan = 'plan',
  Tasks = 'tasks',
  Research = 'research',
  DataModel = 'data-model',
  Contracts = 'contracts',
  Quickstart = 'quickstart',
}

export interface DocumentNode {
  name: DocumentNodeType
  displayName: string
  icon: string
  documents: DocumentFile[]
  order: number
}

export interface DocumentFile {
  path: string
  relativePath: string
  name: string
  displayName: string
  content?: string
  renderedHtml?: string
  lastModified: Date
  size: number
  lineCount?: number
  comments: Comment[]
  isDirectory: boolean
}

export interface CommentAnchor {
  startLine: number
  endLine: number
  textFragment: string
  contextBefore?: string
  contextAfter?: string
}

export enum CommentStatus {
  Open = 'open',
  Resolved = 'resolved',
  Archived = 'archived',
}

export interface Comment {
  id: string
  documentPath: string
  anchor: CommentAnchor
  content: string
  author: string
  createdAt: Date
  updatedAt: Date
  status: CommentStatus
  parentId?: string
  replies: Comment[]
}

export interface CLIConfiguration {
  projectPath: string
  port: number
  host: string
  open: boolean
  verbose: boolean
}

export interface UserSession {
  sessionId: string
  currentDocument?: DocumentFile
  editingDocument?: DocumentFile
  editContent?: string
  isDirty: boolean
  userName: string
  theme: 'light' | 'dark'
}

// CLI 命令响应类型
export interface CLIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

// Node 显示配置
export const NODE_DISPLAY_CONFIG: Record<
  DocumentNodeType,
  { displayName: string; icon: string; order: number }
> = {
  constitution: { displayName: '宪章', icon: '📜', order: 1 },
  specification: { displayName: '规格', icon: '📋', order: 2 },
  plan: { displayName: '计划', icon: '🗓️', order: 3 },
  tasks: { displayName: '任务', icon: '✓', order: 4 },
  research: { displayName: '研究', icon: '🔬', order: 5 },
  'data-model': { displayName: '数据模型', icon: '📊', order: 6 },
  contracts: { displayName: '合约', icon: '📁', order: 7 },
  quickstart: { displayName: '快速入门', icon: '🚀', order: 8 },
}
