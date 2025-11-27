/**
 * 特性统计面板 - 图表配置类型定义
 */

/**
 * 图表数据点 (通用)
 */
export interface ChartDataPoint {
  name: string // X轴标签
  value: number // Y轴数值
  [key: string]: string | number // 额外字段(如多系列数据)
}

/**
 * Tooltip 配置
 */
export interface TooltipConfig {
  formatter?: (value: number, name: string) => string
  labelFormatter?: (label: string) => string
  showLabel?: boolean
  showValue?: boolean
}

/**
 * 导出格式
 */
export type ExportFormat = 'pdf' | 'csv' | 'png'

/**
 * 导出选项
 */
export interface ExportOptions {
  format: ExportFormat
  includeComments: boolean // 是否包含评论
  includeUserInfo: boolean // 是否包含用户信息
  sections: PDFSection[] // 要包含的章节
}

/**
 * PDF 导出章节
 */
export type PDFSection =
  | 'overview' // 概览卡片
  | 'progress-timeline' // 进度时间线
  | 'task-distribution' // 任务分布
  | 'user-stories' // 用户故事
  | 'collaboration' // 协作指标
  | 'risks' // 风险列表

/**
 * CSV 导出数据行
 */
export interface CSVRow {
  name: string
  value: string | number
  unit?: string
}

/**
 * 图表颜色配置
 */
export interface ChartColors {
  completed: string // 已完成 - 绿色
  inProgress: string // 进行中 - 蓝色
  pending: string // 未开始 - 灰色
  blocked: string // 阻塞 - 红色
  warning: string // 警告 - 黄色
  success: string // 成功 - 绿色
  error: string // 错误 - 红色
}

/**
 * 默认图表颜色
 */
export const DEFAULT_CHART_COLORS: ChartColors = {
  completed: '#10b981', // green-500
  inProgress: '#3b82f6', // blue-500
  pending: '#94a3b8', // gray-400
  blocked: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  success: '#10b981', // green-500
  error: '#ef4444', // red-500
}

/**
 * 进度时间线数据点
 */
export interface ProgressTimelineDataPoint {
  phase: string // 阶段名称
  completed: number
  inProgress: number
  pending: number
  blocked: number
  total: number
  percentage: number
}

/**
 * 任务分布数据点
 */
export interface TaskDistributionDataPoint {
  status: string // 状态名称
  count: number
  percentage: number
  color: string
}
