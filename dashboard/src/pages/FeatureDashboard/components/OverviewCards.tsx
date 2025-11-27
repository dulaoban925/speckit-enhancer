/**
 * OverviewCards 组件
 * 显示4个核心指标卡片: 进度、文档覆盖率、评论数、本周增长
 */

import type { FeatureDashboardMetrics } from '../types/metrics'

interface OverviewCardsProps {
  metrics: FeatureDashboardMetrics
}

/**
 * 项目状态图标
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'active':
      return '🟢'
    case 'delayed':
      return '🔴'
    case 'at-risk':
      return '🟡'
    case 'not-started':
      return '⚪'
    default:
      return '⚪'
  }
}

/**
 * OverviewCards 组件
 */
export default function OverviewCards({ metrics }: OverviewCardsProps) {
  const { progress, documents, collaboration } = metrics

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 进度卡片 */}
      <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6 hover:border-gh-accent-fg transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gh-fg-muted">完成进度</h3>
          <span className="text-2xl">{getStatusIcon(progress.status)}</span>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gh-fg-default">
            {progress.percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gh-fg-muted">
            {progress.completedTasks} / {progress.totalTasks} 任务
          </div>
          <div className="text-xs text-gh-fg-subtle">
            当前阶段: {progress.currentPhase}
          </div>
        </div>
      </div>

      {/* 文档覆盖率卡片 */}
      <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6 hover:border-gh-accent-fg transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gh-fg-muted">文档覆盖率</h3>
          <span className="text-2xl">📄</span>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gh-fg-default">
            {documents.coverage}%
          </div>
          <div className="text-sm text-gh-fg-muted">
            {documents.documents.filter((d) => d.exists).length} / {documents.documents.length} 文档
          </div>
          <div className="text-xs text-gh-fg-subtle">
            平均更新: {documents.averageUpdateAge.toFixed(0)} 天前
          </div>
        </div>
      </div>

      {/* 评论数卡片 */}
      <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6 hover:border-gh-accent-fg transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gh-fg-muted">评论总数</h3>
          <span className="text-2xl">💬</span>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gh-fg-default">
            {collaboration.totalComments}
          </div>
          <div className="text-sm text-gh-fg-muted">
            本周新增: {collaboration.newThisWeek}
          </div>
          <div className="text-xs text-gh-fg-subtle">
            未解决: {collaboration.unresolvedIssues}
          </div>
        </div>
      </div>

      {/* 本周增长卡片 */}
      <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6 hover:border-gh-accent-fg transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gh-fg-muted">本周活跃度</h3>
          <span className="text-2xl">📈</span>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gh-fg-default">
            {collaboration.weeklyGrowth >= 0 ? '+' : ''}
            {collaboration.weeklyGrowth.toFixed(1)}%
          </div>
          <div className="text-sm text-gh-fg-muted">
            参与人数: {collaboration.participantCount}
          </div>
          <div className="text-xs text-gh-fg-subtle">
            阻塞问题: {collaboration.blockingIssues}
          </div>
        </div>
      </div>
    </div>
  )
}
