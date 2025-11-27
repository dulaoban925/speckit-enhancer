/**
 * CollaborationPanel 组件
 * 显示协作活跃度指标：评论统计、问题跟踪、参与者和活跃文档
 */

import type { CollaborationMetrics } from '../types/metrics'

interface CollaborationPanelProps {
  metrics: CollaborationMetrics
}

/**
 * CollaborationPanel 组件
 */
export default function CollaborationPanel({ metrics }: CollaborationPanelProps) {
  const {
    totalComments,
    weeklyGrowth,
    unresolvedIssues,
    blockingIssues,
    participantCount,
    topContributors,
    averageResponseTime,
    byDocument,
  } = metrics

  // 转换 byDocument 为活跃文档列表
  const activeDocuments = Object.entries(byDocument)
    .map(([name, commentCount]) => ({
      name,
      path: `specs/${name}`,
      commentCount,
    }))
    .sort((a, b) => b.commentCount - a.commentCount)
    .slice(0, 5)

  // 计算本周活跃参与者（最近7天有活动）
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const activeThisWeek = topContributors.filter(
    (contributor) => contributor.lastActive > oneWeekAgo
  ).length

  return (
    <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gh-fg-default mb-6">协作活跃度</h2>

      {/* 顶部统计网格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 评论总数 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">评论总数</div>
          <div className="text-2xl font-bold text-blue-900">{totalComments}</div>
        </div>

        {/* 本周增长 */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium mb-1">本周增长</div>
          <div className="text-2xl font-bold text-green-900">
            {weeklyGrowth >= 0 ? '+' : ''}
            {weeklyGrowth.toFixed(1)}%
          </div>
        </div>

        {/* 未解决问题 */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-sm text-yellow-600 font-medium mb-1">未解决</div>
          <div className="text-2xl font-bold text-yellow-900">{unresolvedIssues}</div>
        </div>

        {/* 阻塞问题 */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm text-red-600 font-medium mb-1">阻塞中</div>
          <div className="text-2xl font-bold text-red-900">{blockingIssues}</div>
        </div>
      </div>

      {/* 参与者和贡献者 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 参与者统计 */}
        <div>
          <h3 className="text-sm font-medium text-gh-fg-muted mb-3">参与者统计</h3>
          <div className="space-y-2">
            {/* 总参与者数 */}
            <div className="flex items-center justify-between py-2 px-3 bg-gh-canvas-subtle rounded hover:bg-gh-canvas-default border border-gh-border-default transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-purple-100 text-purple-700">
                  👥
                </span>
                <span className="text-sm font-medium text-gh-fg-default">总参与者</span>
              </div>
              <span className="text-sm font-semibold text-gh-fg-muted">{participantCount} 人</span>
            </div>

            {/* 本周活跃 */}
            <div className="flex items-center justify-between py-2 px-3 bg-gh-canvas-subtle rounded hover:bg-gh-canvas-default border border-gh-border-default transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-green-100 text-green-700">
                  ⚡
                </span>
                <span className="text-sm font-medium text-gh-fg-default">本周活跃</span>
              </div>
              <span className="text-sm text-gh-fg-muted">
                <span className="font-semibold text-green-600">{activeThisWeek}</span> / {participantCount}
              </span>
            </div>

            {/* 平均响应时间 */}
            <div className="flex items-center justify-between py-2 px-3 bg-gh-canvas-subtle rounded hover:bg-gh-canvas-default border border-gh-border-default transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-blue-100 text-blue-700">
                  ⏱️
                </span>
                <span className="text-sm font-medium text-gh-fg-default">平均响应</span>
              </div>
              <span className="text-sm font-semibold text-gh-fg-muted">
                {averageResponseTime > 0 ? `${averageResponseTime.toFixed(1)}h` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* 前5名贡献者 */}
        <div>
          <h3 className="text-sm font-medium text-gh-fg-muted mb-3">Top 5 贡献者</h3>
          <div className="space-y-2">
            {topContributors.map((contributor, index) => (
              <ContributorRow
                key={contributor.author}
                contributor={contributor}
                rank={index + 1}
              />
            ))}
            {topContributors.length === 0 && (
              <div className="text-sm text-gh-fg-muted text-center py-2">
                暂无贡献者数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 活跃文档 */}
      <div>
        <h3 className="text-sm font-medium text-gh-fg-muted mb-3">活跃文档</h3>
        <div className="space-y-2">
          {activeDocuments.map((doc) => (
            <ActiveDocumentRow key={doc.path} doc={doc} />
          ))}
          {activeDocuments.length === 0 && (
            <div className="text-sm text-gh-fg-muted text-center py-2">
              暂无活跃文档数据
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 贡献者行组件
 */
interface ContributorRowProps {
  contributor: { author: string; commentCount: number }
  rank: number
}

function ContributorRow({ contributor, rank }: ContributorRowProps) {
  const rankColor =
    rank === 1
      ? 'bg-yellow-100 text-yellow-800'
      : rank === 2
      ? 'bg-gray-100 text-gray-800'
      : rank === 3
      ? 'bg-orange-100 text-orange-800'
      : 'bg-blue-50 text-blue-700'

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gh-canvas-subtle rounded hover:bg-gh-canvas-default border border-gh-border-default transition-colors">
      <div className="flex items-center gap-3">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankColor}`}>
          {rank}
        </span>
        <span className="text-sm font-medium text-gh-fg-default">
          {contributor.author}
        </span>
      </div>
      <span className="text-sm text-gh-fg-muted">
        {contributor.commentCount} 条评论
      </span>
    </div>
  )
}

/**
 * 活跃文档行组件
 */
interface ActiveDocumentRowProps {
  doc: { name: string; path: string; commentCount: number }
}

function ActiveDocumentRow({ doc }: ActiveDocumentRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gh-canvas-subtle rounded hover:bg-gh-canvas-default border border-gh-border-default transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-lg">📄</span>
        <span className="text-sm font-medium text-gh-fg-default">{doc.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gh-fg-muted">{doc.commentCount} 条评论</span>
        <button
          onClick={() => {
            // TODO: 导航到文档查看器
            console.log('Navigate to:', doc.path)
          }}
          className="px-2 py-1 text-xs text-gh-accent-fg hover:bg-gh-accent-subtle rounded transition-colors"
        >
          查看
        </button>
      </div>
    </div>
  )
}
