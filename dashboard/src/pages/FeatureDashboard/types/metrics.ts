/**
 * 特性统计面板 - 指标数据类型定义
 * 基于 data-model.md
 */

/**
 * 项目状态枚举
 */
export type ProjectStatus = 'active' | 'delayed' | 'at-risk' | 'not-started'

/**
 * 文档状态枚举
 */
export type DocStatus = 'ok' | 'missing' | 'stale'

/**
 * 优先级枚举
 */
export type Priority = 'P1' | 'P2' | 'P3'

/**
 * 进度指标
 */
export interface ProgressMetrics {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  blockedTasks: number
  percentage: number // 0-100
  currentPhase: string
  estimatedRemaining: number
  status: ProjectStatus
}

/**
 * 文档信息
 */
export interface DocumentInfo {
  name: string
  path: string
  exists: boolean
  size: number // 字节
  lastModified: Date
  status: DocStatus
}

/**
 * 文档健康度指标
 */
export interface DocumentMetrics {
  coverage: number // 0-100
  documents: DocumentInfo[]
  averageUpdateAge: number // 天数
}

/**
 * 用户故事
 */
export interface UserStory {
  number: number
  title: string
  priority: Priority
  acceptanceScenarios: number
  relatedPhase: string | null
  isCompleted: boolean
}

/**
 * 优先级组
 */
export interface PriorityGroup {
  total: number
  completed: number
  percentage: number
  stories: UserStory[]
}

/**
 * 用户故事指标
 */
export interface UserStoryMetrics {
  total: number
  byPriority: {
    [key in Priority]: PriorityGroup
  }
  acceptanceScenarios: {
    passed: number
    total: number
    passRate: number // 0-100
  }
}

/**
 * 贡献者
 */
export interface Contributor {
  author: string
  commentCount: number
  lastActive: Date
  avatar?: string
}

/**
 * 协作活跃度指标
 */
export interface CollaborationMetrics {
  totalComments: number
  newThisWeek: number
  weeklyGrowth: number // 百分比
  unresolvedIssues: number
  blockingIssues: number
  participantCount: number
  topContributors: Contributor[] // 前5名
  averageResponseTime: number // 小时
  byDocument: {
    [docName: string]: number
  }
}

/**
 * 风险类型
 */
export type RiskType = 'blocking-issue' | 'stale-document'

/**
 * 风险项
 */
export interface RiskItem {
  id: string
  type: RiskType
  title: string
  age: number // 天数
  impact: number // 受影响任务数
  source: string // 评论ID或文档路径
  details?: string
}

/**
 * 关键路径
 */
export interface CriticalPath {
  length: number
  tasks: string[]
  estimatedDuration?: number // 天数
}

/**
 * 风险指标
 */
export interface RiskMetrics {
  blockingIssues: RiskItem[]
  staleDocuments: RiskItem[]
  criticalPaths: CriticalPath[]
}

/**
 * 特性统计面板顶层数据结构
 */
export interface FeatureDashboardMetrics {
  featureId: string
  featureName: string
  lastUpdated: Date
  progress: ProgressMetrics
  documents: DocumentMetrics
  userStories: UserStoryMetrics
  collaboration: CollaborationMetrics
  risks: RiskMetrics
}
