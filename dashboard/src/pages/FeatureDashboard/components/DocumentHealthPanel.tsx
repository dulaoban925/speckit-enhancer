/**
 * DocumentHealthPanel 组件
 * 显示文档健康度和核心文档列表
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DocumentMetrics, DocumentInfo } from '../types/metrics'
import { formatRelativeTime } from '../utils/dateHelpers'

interface DocumentHealthPanelProps {
  metrics: DocumentMetrics
}

/**
 * 文档状态图标
 */
function getDocStatusIcon(status: string): string {
  switch (status) {
    case 'ok':
      return '✅'
    case 'missing':
      return '⚠️'
    case 'stale':
      return '🔄'
    default:
      return '❓'
  }
}

/**
 * 文档状态文本
 */
function getDocStatusText(status: string): string {
  switch (status) {
    case 'ok':
      return '正常'
    case 'missing':
      return '缺失'
    case 'stale':
      return '陈旧'
    default:
      return '未知'
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/**
 * DocumentHealthPanel 组件
 */
export default function DocumentHealthPanel({ metrics }: DocumentHealthPanelProps) {
  const { coverage, documents } = metrics
  const [isExpanded, setIsExpanded] = useState(false)

  // 按状态分类
  const okDocs = documents.filter((d) => d.status === 'ok')
  const missingDocs = documents.filter((d) => d.status === 'missing')
  const staleDocs = documents.filter((d) => d.status === 'stale')

  return (
    <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gh-fg-default">文档健康度</h2>
        <div className="text-right">
          <div className="text-3xl font-bold text-gh-fg-default">{coverage}%</div>
          <div className="text-sm text-gh-fg-muted">覆盖率</div>
        </div>
      </div>

      {/* 状态摘要 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{okDocs.length}</div>
          <div className="text-sm text-green-700">正常</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{staleDocs.length}</div>
          <div className="text-sm text-yellow-700">陈旧</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{missingDocs.length}</div>
          <div className="text-sm text-red-700">缺失</div>
        </div>
      </div>

      {/* 文档列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gh-fg-muted">核心文档列表</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 text-sm text-gh-accent-fg hover:bg-gh-canvas-default rounded transition-colors"
          >
            <span>{isExpanded ? '收起' : '展开'}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        {isExpanded && (
          <div className="divide-y divide-gh-border-muted">
            {documents.map((doc) => (
              <DocumentRow key={doc.path} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 文档行组件
 */
function DocumentRow({ doc }: { doc: DocumentInfo }) {
  const navigate = useNavigate()

  const statusColor =
    doc.status === 'ok'
      ? 'text-gh-success-emphasis'
      : doc.status === 'stale'
      ? 'text-yellow-600'
      : 'text-gh-danger-emphasis'

  const handleViewDocument = () => {
    // 导航到文档查看器，使用文档路径
    navigate(`/document/${doc.path}`)
  }

  return (
    <div className="py-3 flex items-center justify-between hover:bg-gh-canvas-default px-2 rounded transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-xl">{getDocStatusIcon(doc.status)}</span>
        <div>
          <div className="font-medium text-gh-fg-default">{doc.name}</div>
          <div className="text-xs text-gh-fg-muted flex items-center gap-3">
            <span className={`font-medium ${statusColor}`}>
              {getDocStatusText(doc.status)}
            </span>
            {doc.exists && (
              <>
                <span>{formatFileSize(doc.size)}</span>
                <span>{formatRelativeTime(doc.lastModified)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {doc.exists && (
        <button
          onClick={handleViewDocument}
          className="px-3 py-1 text-sm text-gh-accent-fg hover:bg-gh-canvas-default rounded transition-colors"
        >
          查看
        </button>
      )}
    </div>
  )
}
