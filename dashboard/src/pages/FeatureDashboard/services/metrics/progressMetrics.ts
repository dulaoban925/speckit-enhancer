/**
 * 进度指标计算器
 */

import type { ProgressMetrics, ProjectStatus } from '../../types/metrics'

/**
 * 计算进度指标
 * TODO: 完整实现计算逻辑
 */
export function calculateProgressMetrics(data: {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  blockedTasks: number
  currentPhase: string
  blockingIssuesAge: number[] // 阻塞问题的天数列表
}): ProgressMetrics {
  const { totalTasks, completedTasks } = data

  // 计算完成百分比
  const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // 计算剩余任务
  const estimatedRemaining = totalTasks - completedTasks

  // 确定项目状态
  const status = determineProjectStatus(percentage, data.blockingIssuesAge)

  return {
    ...data,
    percentage: Math.round(percentage * 10) / 10, // 保留1位小数
    estimatedRemaining,
    status,
  }
}

/**
 * 确定项目状态
 */
function determineProjectStatus(
  percentage: number,
  blockingIssuesAge: number[]
): ProjectStatus {
  if (percentage === 0) return 'not-started'

  // 检查是否有超过7天的阻塞问题
  const hasOldBlockers = blockingIssuesAge.some((age) => age > 7)
  if (hasOldBlockers) return 'delayed'

  // 检查是否有1-7天的阻塞问题
  const hasRecentBlockers = blockingIssuesAge.some((age) => age >= 1 && age <= 7)
  if (hasRecentBlockers) return 'at-risk'

  return 'active'
}
