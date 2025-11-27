/**
 * 特性统计面板 - 实体类型定义
 */

/**
 * 用户故事实体
 * 已在 metrics.ts 中定义,这里导出以保持一致性
 */
export type { UserStory, Priority } from './metrics'

/**
 * 文档信息实体
 * 已在 metrics.ts 中定义,这里导出以保持一致性
 */
export type { DocumentInfo } from './metrics'

/**
 * 风险项实体
 * 已在 metrics.ts 中定义,这里导出以保持一致性
 */
export type { RiskItem, RiskType } from './metrics'

/**
 * 贡献者实体
 * 已在 metrics.ts 中定义,这里导出以保持一致性
 */
export type { Contributor } from './metrics'

/**
 * 关键路径实体
 * 已在 metrics.ts 中定义,这里导出以保持一致性
 */
export type { CriticalPath } from './metrics'

/**
 * 任务状态
 */
export type TaskStatus = 'completed' | 'in-progress' | 'pending' | 'blocked'

/**
 * 任务实体 (从 tasks.md 解析)
 */
export interface Task {
  id: string // 如 "T001"
  phase: string // 所属阶段
  description: string
  status: TaskStatus
  parallel: boolean // 是否可并行 [P]
  userStory?: string // 关联的用户故事 [US1]
}

/**
 * 评论状态
 */
export type CommentStatus = 'open' | 'resolved'

/**
 * 评论实体 (从评论 JSON 文件解析)
 */
export interface Comment {
  id: string
  documentPath: string // 关联文档路径
  author: string
  content: string
  createdAt: Date
  updatedAt?: Date
  status: CommentStatus
  tags?: string[] // 如 ["blocker", "question"]
  replies?: CommentReply[]
}

/**
 * 评论回复
 */
export interface CommentReply {
  id: string
  author: string
  content: string
  createdAt: Date
}
