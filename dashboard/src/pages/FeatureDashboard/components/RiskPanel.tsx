/**
 * RiskPanel 组件
 * 显示风险识别指标：阻塞问题、陈旧文档、关键路径
 */

import type { RiskMetrics } from '../types/metrics'

interface RiskPanelProps {
  metrics: RiskMetrics
}

/**
 * RiskPanel 组件
 */
export default function RiskPanel({ metrics }: RiskPanelProps) {
  const { blockingIssues, staleDocuments, criticalPaths } = metrics

  // 计算总风险评分
  const totalRisks = blockingIssues.length + staleDocuments.length + criticalPaths.length
  const riskLevel =
    totalRisks === 0 ? 'low' : blockingIssues.length > 0 ? 'high' : totalRisks > 3 ? 'medium' : 'low'

  return (
    <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gh-fg-default">风险识别</h2>
        <RiskBadge level={riskLevel} count={totalRisks} />
      </div>

      {/* 阻塞问题 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">阻塞问题</h3>
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
            {blockingIssues.length}
          </span>
        </div>
        <div className="space-y-2">
          {blockingIssues.map((issue) => (
            <BlockingIssueRow key={issue.id} issue={issue} />
          ))}
          {blockingIssues.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded">
              ✓ 无阻塞问题
            </div>
          )}
        </div>
      </div>

      {/* 陈旧文档 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">陈旧文档</h3>
          <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
            {staleDocuments.length}
          </span>
        </div>
        <div className="space-y-2">
          {staleDocuments.map((doc) => (
            <StaleDocumentRow key={doc.id} doc={doc} />
          ))}
          {staleDocuments.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded">
              ✓ 文档都很新鲜
            </div>
          )}
        </div>
      </div>

      {/* 关键路径 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">关键路径</h3>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {criticalPaths.length}
          </span>
        </div>
        <div className="space-y-2">
          {criticalPaths.map((path, index) => (
            <CriticalPathRow key={index} path={path} />
          ))}
          {criticalPaths.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded">
              暂无关键路径数据
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 风险等级徽章
 */
interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high'
  count: number
}

function RiskBadge({ level, count }: RiskBadgeProps) {
  const config = {
    low: { label: '低风险', className: 'bg-green-100 text-green-700', icon: '✓' },
    medium: { label: '中风险', className: 'bg-yellow-100 text-yellow-700', icon: '⚠' },
    high: { label: '高风险', className: 'bg-red-100 text-red-700', icon: '⚠' },
  }[level]

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label} ({count})
    </div>
  )
}

/**
 * 阻塞问题行组件
 */
interface BlockingIssueRowProps {
  issue: {
    id: string
    type: string
    title: string
    age: number
    impact: number
    source: string
    details?: string
  }
}

function BlockingIssueRow({ issue }: BlockingIssueRowProps) {
  const { title, age, impact, source } = issue

  const handleClick = () => {
    // TODO: 导航到评论源
    console.log('Navigate to comment:', source)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start justify-between p-3 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors text-left"
    >
      <div className="flex-1">
        <div className="text-sm font-medium text-red-900 mb-1">{title}</div>
        <div className="flex items-center gap-3 text-xs text-red-700">
          <span>已持续 {age} 天</span>
          <span>影响 {impact} 个任务</span>
        </div>
      </div>
      <svg
        className="w-4 h-4 text-red-600 flex-shrink-0 mt-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  )
}

/**
 * 陈旧文档行组件
 */
interface StaleDocumentRowProps {
  doc: {
    id: string
    type: string
    title: string
    age: number
    impact: number
    source: string
    details?: string
  }
}

function StaleDocumentRow({ doc }: StaleDocumentRowProps) {
  const { title, source, age } = doc

  const handleClick = () => {
    // TODO: 导航到文档查看器
    console.log('Navigate to document:', source)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">📄</span>
        <div>
          <div className="text-sm font-medium text-yellow-900">{title}</div>
          <div className="text-xs text-yellow-700">{age} 天未更新</div>
        </div>
      </div>
      <svg
        className="w-4 h-4 text-yellow-600 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  )
}

/**
 * 关键路径行组件
 */
interface CriticalPathRowProps {
  path: {
    length: number
    tasks: string[]
    estimatedDuration?: number
  }
}

function CriticalPathRow({ path }: CriticalPathRowProps) {
  const { length, tasks, estimatedDuration } = path

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔗</span>
        <div>
          <div className="text-sm font-medium text-blue-900">路径长度: {length}</div>
          <div className="text-xs text-blue-700">{tasks.length} 个任务</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-blue-900">
          {estimatedDuration || '-'}
        </div>
        <div className="text-xs text-blue-700">天</div>
      </div>
    </div>
  )
}
