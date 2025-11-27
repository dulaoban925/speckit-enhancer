/**
 * 风险指标计算器
 */

import type { RiskMetrics, RiskItem, CriticalPath } from '../../types/metrics'
import type { Comment, DocumentInfo } from '../../types/entities'

/**
 * 计算风险指标
 * TODO: 完整实现计算逻辑
 */
export function calculateRiskMetrics(
  comments: Comment[],
  documents: DocumentInfo[],
  tasks: any[]
): RiskMetrics {
  // 识别阻塞问题
  const blockingIssues = identifyBlockingIssues(comments)

  // 识别陈旧文档
  const staleDocuments = identifyStaleDocuments(documents)

  // 识别关键路径 (简化版:最长依赖链)
  const criticalPaths = identifyCriticalPaths(tasks)

  return {
    blockingIssues,
    staleDocuments,
    criticalPaths,
  }
}

/**
 * 识别阻塞问题
 */
function identifyBlockingIssues(comments: Comment[]): RiskItem[] {
  return comments
    .filter((c) => c.status === 'open' && isBlocking(c))
    .map((c) => {
      const age = Math.floor((Date.now() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: c.id,
        type: 'blocking-issue' as const,
        title: c.content.split('\n')[0].slice(0, 50), // 取第一行前50字符
        age,
        impact: 0, // TODO: 计算受影响的任务数
        source: c.id,
        details: c.content,
      }
    })
    .sort((a, b) => b.age - a.age)
}

/**
 * 识别陈旧文档
 */
function identifyStaleDocuments(documents: DocumentInfo[]): RiskItem[] {
  return documents
    .filter((d) => d.status === 'stale')
    .map((d) => {
      const age = Math.floor((Date.now() - d.lastModified.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: d.path,
        type: 'stale-document' as const,
        title: d.name,
        age,
        impact: 0,
        source: d.path,
      }
    })
    .sort((a, b) => b.age - a.age)
}

/**
 * 识别关键路径
 */
function identifyCriticalPaths(_tasks: any[]): CriticalPath[] {
  // TODO: 实现依赖链分析
  // 这里返回空数组作为占位符
  return []
}

/**
 * 检查评论是否为阻塞问题
 */
function isBlocking(comment: Comment): boolean {
  if (comment.tags?.includes('blocker')) return true
  if (/阻塞|blocker|blocking/i.test(comment.content)) return true
  return false
}
