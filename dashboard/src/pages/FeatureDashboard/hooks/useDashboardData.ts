/**
 * useDashboardData Hook
 * 数据加载和聚合的主 Hook
 */

import { useEffect } from 'react'
import { useDashboardStore } from '../store'
import type { FeatureDashboardMetrics } from '../types/metrics'
import type { CommentsResponse, Comment } from '../services/parsers/commentsParser'

/**
 * Dashboard 数据加载 Hook
 * TODO: 完整实现数据加载和聚合逻辑
 */
export function useDashboardData(featureId: string) {
  const {
    metrics,
    loading,
    error,
    setMetrics,
    setLoading,
    setError,
    getFromCache,
    setCache,
  } = useDashboardStore()

  useEffect(() => {
    // 尝试从缓存加载 (30秒 TTL)
    const cached = getFromCache(featureId, 30000)
    if (cached) {
      setMetrics(cached)
      return
    }

    // 加载新数据
    loadDashboardData()
  }, [featureId])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. 导入服务和解析器
      const { CLIService } = await import('../../../services/cliService')
      const { parseTasksFile } = await import('../services/parsers/tasksParser')
      const { parseSpecFile } = await import('../services/parsers/specParser')
      const { parseCommentsData } = await import('../services/parsers/commentsParser')

      // 2. 读取文件
      const [tasksResponse, specResponse] = await Promise.all([
        CLIService.readDocument(`specs/${featureId}/tasks.md`),
        CLIService.readDocument(`specs/${featureId}/spec.md`),
      ])

      if (!tasksResponse.success || !specResponse.success) {
        throw new Error('读取文档失败')
      }

      // 3. 解析文件
      const tasksData = parseTasksFile(tasksResponse.data?.content ?? '')
      const specData = parseSpecFile(specResponse.data?.content ?? '')

      // 4. 获取评论数据
      // 从特性的所有核心文档中获取评论
      const documentsToFetchComments = [
        `specs/${featureId}/spec.md`,
        `specs/${featureId}/tasks.md`,
        `specs/${featureId}/plan.md`,
        `specs/${featureId}/research.md`,
        `specs/${featureId}/data-model.md`,
        `specs/${featureId}/quickstart.md`,
      ]

      const commentsResponses = await Promise.all(
        documentsToFetchComments.map(async (docPath) => {
          try {
            // 从featureId中提取数字部分作为feature-id参数
            const featureNumber = featureId.match(/^(\d+)/)?.[1] || '000'
            const response = await CLIService.executeCommentCommand<CommentsResponse>({
              action: 'list',
              documentPath: docPath,
              featureId: featureNumber,
            })
            return {
              documentPath: docPath,
              data: response.success && response.data ? response.data : { comments: [], total: 0, totalWithReplies: 0 },
            }
          } catch {
            return {
              documentPath: docPath,
              data: { comments: [], total: 0, totalWithReplies: 0 } as CommentsResponse,
            }
          }
        })
      )

      // 解析评论数据
      const collaborationData = parseCommentsData(commentsResponses as Array<{ documentPath: string; data: CommentsResponse }>)

      // 5. 扫描文档并计算覆盖率
      const coreDocuments = [
        'spec.md',
        'plan.md',
        'tasks.md',
        'research.md',
        'data-model.md',
        'quickstart.md',
      ]

      const documentResults = await Promise.all(
        coreDocuments.map(async (docName) => {
          try {
            const response = await CLIService.readDocument(`specs/${featureId}/${docName}`)
            if (response.success && response.data && response.data.metadata) {
              const size = response.data.metadata.size || 0
              const lastModifiedTimestamp = response.data.metadata.lastModified

              // 验证时间戳是否有效
              if (!lastModifiedTimestamp || typeof lastModifiedTimestamp !== 'number') {
                console.warn(`Invalid lastModified timestamp for ${docName}:`, lastModifiedTimestamp)
                return {
                  name: docName,
                  exists: false,
                  size: 0,
                  lastModified: new Date(),
                  ageInDays: 999,
                  status: 'missing' as const,
                }
              }

              const lastModified = new Date(lastModifiedTimestamp)
              const ageInDays = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24)

              return {
                name: docName,
                exists: true,
                size,
                lastModified,
                ageInDays,
                status: size > 100 && ageInDays < 30 ? 'ok' : size > 100 ? 'stale' : 'missing',
              }
            }
          } catch (error) {
            console.warn(`Failed to read document ${docName}:`, error)
            // 文件不存在或读取失败
          }
          return {
            name: docName,
            exists: false,
            size: 0,
            lastModified: new Date(),
            ageInDays: 999,
            status: 'missing' as const,
          }
        })
      )

      const existingDocs = documentResults.filter(doc => doc.exists)
      const documentCoverage = (existingDocs.length / coreDocuments.length) * 100
      const averageAge = existingDocs.length > 0
        ? existingDocs.reduce((sum, doc) => sum + doc.ageInDays, 0) / existingDocs.length
        : 0

      // 6. 计算进度指标
      const progressPercentage =
        tasksData.totalTasks > 0
          ? (tasksData.completedTasks / tasksData.totalTasks) * 100
          : 0

      // 按优先级分组用户故事
      const byPriority = {
        P1: { total: 0, completed: 0, percentage: 0, stories: [] as any[] },
        P2: { total: 0, completed: 0, percentage: 0, stories: [] as any[] },
        P3: { total: 0, completed: 0, percentage: 0, stories: [] as any[] },
      }

      specData.userStories.forEach((story) => {
        const group = byPriority[story.priority]
        group.total++
        group.stories.push(story)
        if (story.isCompleted) {
          group.completed++
        }
      })

      // 计算每组完成百分比
      Object.values(byPriority).forEach((group) => {
        group.percentage = group.total > 0 ? (group.completed / group.total) * 100 : 0
      })

      // 7. 计算验收场景通过率
      // 简化逻辑：如果用户故事完成，则其所有验收场景通过
      const passedScenarios = specData.userStories
        .filter(story => story.isCompleted)
        .reduce((sum, story) => sum + story.acceptanceScenarios, 0)

      const totalScenarios = specData.totalScenarios
      const passRate = totalScenarios > 0 ? (passedScenarios / totalScenarios) * 100 : 0

      // 8. 计算风险指标
      // 8.1 提取阻塞问题（从评论中）
      const blockingIssuesFromComments = (commentsResponses as Array<{ documentPath: string; data: CommentsResponse }>).flatMap(({ documentPath, data }) => {
        const blockingKeywords = ['阻塞', 'blocked', 'urgent', '紧急', 'critical']
        return data.comments
          .filter((comment: Comment) =>
            comment.status === 'open' &&
            blockingKeywords.some(keyword => comment.content.toLowerCase().includes(keyword.toLowerCase()))
          )
          .map((comment: Comment) => {
            const createdAt = new Date(comment.createdAt)
            const ageInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

            return {
              id: comment.id,
              type: 'blocking-issue' as const,
              title: comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : ''),
              age: ageInDays,
              impact: 1, // 简化：每个阻塞问题影响 1 个任务
              source: documentPath,
              details: comment.content,
            }
          })
      })

      // 8.2 提取陈旧文档
      const staleDocsList = documentResults
        .filter(doc => doc.status === 'stale')
        .map(doc => ({
          id: doc.name,
          type: 'stale-document' as const,
          title: doc.name,
          age: Math.floor(doc.ageInDays),
          impact: 1,
          source: `specs/${featureId}/${doc.name}`,
          details: `文档已 ${Math.floor(doc.ageInDays)} 天未更新`,
        }))

      // 8.3 计算关键路径（简化版本）
      // 基于任务分布，假设阻塞任务和进行中任务形成关键路径
      const criticalPathsList = []
      if (tasksData.blockedTasks > 0 || tasksData.inProgressTasks > 0) {
        criticalPathsList.push({
          length: tasksData.blockedTasks + tasksData.inProgressTasks,
          tasks: [], // 简化：不提供具体任务列表
          estimatedDuration: Math.ceil((tasksData.blockedTasks + tasksData.inProgressTasks) * 2), // 假设每个任务 2 天
        })
      }

      // 9. 聚合成 FeatureDashboardMetrics
      const metrics: FeatureDashboardMetrics = {
        featureId,
        featureName: `Feature ${featureId}`,
        lastUpdated: new Date(),
        progress: {
          totalTasks: tasksData.totalTasks,
          completedTasks: tasksData.completedTasks,
          inProgressTasks: tasksData.inProgressTasks,
          pendingTasks: tasksData.pendingTasks,
          blockedTasks: tasksData.blockedTasks,
          percentage: progressPercentage,
          currentPhase: tasksData.currentPhase,
          estimatedRemaining: tasksData.totalTasks - tasksData.completedTasks,
          status:
            progressPercentage === 0
              ? 'not-started'
              : progressPercentage === 100
              ? 'active' // 100% 完成仍然视为 active 状态
              : 'active',
        },
        documents: {
          coverage: documentCoverage,
          documents: documentResults.map(doc => ({
            name: doc.name,
            path: `specs/${featureId}/${doc.name}`,
            size: doc.size,
            lastModified: doc.lastModified,
            status: doc.status as 'ok' | 'missing' | 'stale',
            exists: doc.exists,
          })),
          averageUpdateAge: averageAge,
        },
        userStories: {
          total: specData.userStories.length,
          byPriority,
          acceptanceScenarios: {
            passed: passedScenarios,
            total: totalScenarios,
            passRate,
          },
        },
        collaboration: {
          totalComments: collaborationData.totalComments,
          newThisWeek: collaborationData.newThisWeek,
          weeklyGrowth: collaborationData.weeklyGrowth,
          unresolvedIssues: collaborationData.unresolvedIssues,
          blockingIssues: collaborationData.blockingIssues,
          participantCount: collaborationData.participantCount,
          topContributors: collaborationData.topContributors,
          averageResponseTime: collaborationData.averageResponseTime,
          byDocument: collaborationData.byDocument,
        },
        risks: {
          blockingIssues: blockingIssuesFromComments,
          staleDocuments: staleDocsList,
          criticalPaths: criticalPathsList,
        },
      }

      setMetrics(metrics)
      setCache(featureId, metrics)
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载数据失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return {
    metrics,
    loading,
    error,
    reload: loadDashboardData,
  }
}
