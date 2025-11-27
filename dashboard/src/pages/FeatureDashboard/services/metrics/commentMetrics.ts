/**
 * 协作活跃度指标计算器
 */

import type { CollaborationMetrics, Contributor } from '../../types/metrics'
import type { Comment } from '../../types/entities'

/**
 * 计算协作指标
 * TODO: 完整实现计算逻辑
 */
export function calculateCollaborationMetrics(comments: Comment[]): CollaborationMetrics {
  const totalComments = comments.length

  // 计算本周新增评论
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const newThisWeek = comments.filter((c) => c.createdAt.getTime() > oneWeekAgo).length

  // 计算周增长率
  const weeklyGrowth =
    totalComments - newThisWeek > 0
      ? (newThisWeek / (totalComments - newThisWeek)) * 100
      : 0

  // 统计未解决问题
  const unresolvedIssues = comments.filter((c) => c.status === 'open').length

  // 统计阻塞问题
  const blockingIssues = comments.filter(
    (c) => c.status === 'open' && (c.tags?.includes('blocker') || /阻塞|blocker/i.test(c.content))
  ).length

  // 统计参与人数
  const participants = new Set(comments.map((c) => c.author))
  const participantCount = participants.size

  // 计算最活跃贡献者
  const topContributors = calculateTopContributors(comments, 5)

  // 计算平均响应时间
  const averageResponseTime = calculateAverageResponseTime(comments)

  // 按文档统计评论数
  const byDocument: Record<string, number> = {}
  comments.forEach((c) => {
    const docName = c.documentPath.split('/').pop() || 'unknown'
    byDocument[docName] = (byDocument[docName] || 0) + 1
  })

  return {
    totalComments,
    newThisWeek,
    weeklyGrowth: Math.round(weeklyGrowth * 10) / 10,
    unresolvedIssues,
    blockingIssues,
    participantCount,
    topContributors,
    averageResponseTime: Math.round(averageResponseTime * 10) / 10,
    byDocument,
  }
}

/**
 * 计算最活跃贡献者
 */
function calculateTopContributors(comments: Comment[], limit: number): Contributor[] {
  const authorCounts = new Map<string, number>()

  comments.forEach((c) => {
    authorCounts.set(c.author, (authorCounts.get(c.author) || 0) + 1)
  })

  return Array.from(authorCounts.entries())
    .map(([author, commentCount]) => ({ author, commentCount }))
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, limit)
}

/**
 * 计算平均响应时间 (小时)
 */
function calculateAverageResponseTime(comments: Comment[]): number {
  const responseTimes: number[] = []

  comments.forEach((c) => {
    if (c.replies && c.replies.length > 0) {
      const firstReply = c.replies[0]
      const responseTime =
        (firstReply.createdAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60)
      responseTimes.push(responseTime)
    }
  })

  if (responseTimes.length === 0) return 0

  const sum = responseTimes.reduce((a, b) => a + b, 0)
  return sum / responseTimes.length
}
