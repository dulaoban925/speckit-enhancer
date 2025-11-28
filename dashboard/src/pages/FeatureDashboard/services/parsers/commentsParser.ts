/**
 * 评论解析器
 * 从CLI返回的评论数据计算协作统计指标
 */

import type { CollaborationMetrics } from '../../types/metrics'

export interface Comment {
  id: string
  documentPath: string
  content: string
  author: string
  createdAt: string
  updatedAt: string
  status: 'open' | 'resolved' | 'archived'
  parentId?: string
  replies: Comment[]
}

export interface CommentsResponse {
  comments: Comment[]
  total: number
  totalWithReplies: number
}

/**
 * 解析评论数据并计算协作指标
 */
export function parseCommentsData(
  commentsDataArray: Array<{ documentPath: string; data: CommentsResponse }>
): Omit<CollaborationMetrics, 'byDocument'> & { byDocument: Record<string, number> } {
  // 扁平化所有评论（包括回复）
  const allComments: Array<Comment & { documentPath: string }> = []

  commentsDataArray.forEach(({ documentPath, data }) => {
    data.comments.forEach((comment) => {
      allComments.push({ ...comment, documentPath })

      // 递归添加回复
      const addReplies = (replies: Comment[]) => {
        replies.forEach((reply) => {
          allComments.push({ ...reply, documentPath })
          if (reply.replies && reply.replies.length > 0) {
            addReplies(reply.replies)
          }
        })
      }

      if (comment.replies && comment.replies.length > 0) {
        addReplies(comment.replies)
      }
    })
  })

  // 统计总评论数
  const totalComments = allComments.length

  // 统计本周新增评论（7天内）
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const newThisWeek = allComments.filter(
    (comment) => new Date(comment.createdAt) > oneWeekAgo
  ).length

  // 统计上周新增评论（用于计算周增长）
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const newLastWeek = allComments.filter((comment) => {
    const createdAt = new Date(comment.createdAt)
    return createdAt > twoWeeksAgo && createdAt <= oneWeekAgo
  }).length

  // 计算周增长率
  // 如果上周有评论，计算增长百分比
  // 如果上周没有评论但本周有，显示100%增长
  // 如果上周和本周都没有，显示0
  const weeklyGrowth = newLastWeek > 0
    ? ((newThisWeek - newLastWeek) / newLastWeek) * 100
    : newThisWeek > 0
      ? 100
      : 0

  // 统计未解决问题
  const unresolvedIssues = allComments.filter((comment) => comment.status === 'open').length

  // 阻塞问题（包含 "阻塞"、"blocked"、"urgent" 等关键词的开放评论）
  const blockingKeywords = ['阻塞', 'blocked', 'urgent', '紧急', 'critical']
  const blockingIssues = allComments.filter(
    (comment) =>
      comment.status === 'open' &&
      blockingKeywords.some((keyword) => comment.content.toLowerCase().includes(keyword))
  ).length

  // 统计参与人数（去重）
  const participants = new Set(allComments.map((comment) => comment.author))
  const participantCount = participants.size

  // 统计每个作者的评论数（用于计算贡献者排名）
  const authorCounts: Record<string, number> = {}
  allComments.forEach((comment) => {
    authorCounts[comment.author] = (authorCounts[comment.author] || 0) + 1
  })

  // 生成 Top 贡献者列表
  const topContributors = Object.entries(authorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([author, count]) => ({
      author,
      commentCount: count,
      lastActive: new Date(
        Math.max(
          ...allComments
            .filter((c) => c.author === author)
            .map((c) => new Date(c.updatedAt).getTime())
        )
      ),
    }))

  // 计算平均响应时间（父评论到第一条回复的时间差，单位：小时）
  let totalResponseTime = 0
  let responseCount = 0

  commentsDataArray.forEach(({ data }) => {
    data.comments.forEach((comment) => {
      if (comment.replies && comment.replies.length > 0) {
        const parentTime = new Date(comment.createdAt).getTime()
        const firstReplyTime = new Date(comment.replies[0].createdAt).getTime()
        totalResponseTime += (firstReplyTime - parentTime) / (1000 * 60 * 60) // 转换为小时
        responseCount++
      }
    })
  })

  const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0

  // 按文档统计评论数
  const byDocument: Record<string, number> = {}
  commentsDataArray.forEach(({ documentPath, data }) => {
    byDocument[documentPath] = data.totalWithReplies
  })

  return {
    totalComments,
    newThisWeek,
    weeklyGrowth,
    unresolvedIssues,
    blockingIssues,
    participantCount,
    topContributors,
    averageResponseTime,
    byDocument,
  }
}
