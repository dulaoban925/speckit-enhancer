/**
 * UserStoryProgress 组件
 * 显示用户故事进度：按优先级分组，完成度统计，验收场景通过率
 */

import { useState } from 'react'
import type { UserStoryMetrics } from '../types/metrics'

interface UserStoryProgressProps {
  metrics: UserStoryMetrics
}

/**
 * UserStoryProgress 组件
 */
export default function UserStoryProgress({ metrics }: UserStoryProgressProps) {
  const { byPriority, acceptanceScenarios } = metrics
  const [expandedPriority, setExpandedPriority] = useState<string | null>(null)

  const toggleExpand = (priority: string) => {
    setExpandedPriority(expandedPriority === priority ? null : priority)
  }

  // 转换 byPriority 对象为数组
  const priorityGroups = Object.entries(byPriority).map(([priority, group]) => ({
    priority,
    ...group,
  }))

  return (
    <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gh-fg-default">用户故事进度</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-gh-fg-default">
            {acceptanceScenarios.passRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gh-fg-muted">验收场景通过率</div>
        </div>
      </div>

      {/* 优先级分组列表 */}
      <div className="space-y-3">
        {priorityGroups.map((priorityGroup) => (
          <PriorityGroup
            key={priorityGroup.priority}
            priorityGroup={priorityGroup}
            isExpanded={expandedPriority === priorityGroup.priority}
            onToggle={() => toggleExpand(priorityGroup.priority)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * 优先级组件
 */
interface PriorityGroupProps {
  priorityGroup: {
    priority: string
    total: number
    completed: number
    percentage: number
    stories: Array<{
      number: number
      title: string
      priority: string
      acceptanceScenarios: number
      relatedPhase: string | null
      isCompleted: boolean
    }>
  }
  isExpanded: boolean
  onToggle: () => void
}

function PriorityGroup({ priorityGroup, isExpanded, onToggle }: PriorityGroupProps) {
  const { priority, total, completed, percentage, stories } = priorityGroup

  // 优先级颜色配置
  const priorityConfig = getPriorityConfig(priority)

  return (
    <div className="border border-gh-border-default rounded-lg overflow-hidden">
      {/* 优先级头部 - 可点击展开 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gh-canvas-default transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* 优先级标签 */}
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold ${priorityConfig.bgColor} ${priorityConfig.textColor}`}
          >
            {priority}
          </span>

          {/* 完成情况 */}
          <div className="text-left">
            <div className="font-medium text-gh-fg-default">
              {completed} / {total} 完成
            </div>
            <div className="text-sm text-gh-fg-muted">完成度: {percentage.toFixed(1)}%</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 进度条 */}
          <div className="w-32 bg-gh-border-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${priorityConfig.progressColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* 展开图标 */}
          <svg
            className={`w-5 h-5 text-gh-fg-muted transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* 展开的故事列表 */}
      {isExpanded && (
        <div className="border-t border-gh-border-default bg-gh-canvas-inset p-4">
          <div className="space-y-2">
            {stories.map((story) => (
              <StoryRow key={story.number} story={story} />
            ))}
            {stories.length === 0 && (
              <div className="text-sm text-gh-fg-muted text-center py-2">
                暂无用户故事数据
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 故事行组件
 */
interface StoryRowProps {
  story: {
    number: number
    title: string
    priority: string
    acceptanceScenarios: number
    relatedPhase: string | null
    isCompleted: boolean
  }
}

function StoryRow({ story }: StoryRowProps) {
  const { title, isCompleted, acceptanceScenarios } = story

  // 简化状态判断
  const status = isCompleted ? 'completed' : 'in-progress'
  const statusConfig = getStatusConfig(status)

  // 简化通过率显示（暂时假设全部通过或未通过）
  const passRate = isCompleted ? '100' : '0'

  return (
    <div className="flex items-center justify-between p-3 bg-gh-canvas-subtle rounded border border-gh-border-default hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 flex-1">
        {/* 状态图标 */}
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.className}`}>
          {statusConfig.label}
        </span>

        {/* 故事标题 */}
        <span className="text-sm text-gh-fg-default">{title}</span>
      </div>

      {/* 验收场景统计 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gh-fg-muted">验收场景:</span>
        <span className="font-medium text-gh-fg-default">{acceptanceScenarios} 个</span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            Number(passRate) === 100
              ? 'bg-green-100 text-green-700'
              : Number(passRate) >= 50
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {passRate}%
        </span>
      </div>
    </div>
  )
}

/**
 * 获取优先级配置
 */
function getPriorityConfig(priority: string) {
  switch (priority) {
    case 'P1':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        progressColor: 'bg-red-500',
      }
    case 'P2':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        progressColor: 'bg-yellow-500',
      }
    case 'P3':
      return {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        progressColor: 'bg-blue-500',
      }
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        progressColor: 'bg-gray-500',
      }
  }
}

/**
 * 获取状态配置
 */
function getStatusConfig(status: string) {
  switch (status) {
    case 'completed':
      return { label: '已完成', className: 'bg-green-100 text-green-700' }
    case 'in-progress':
      return { label: '进行中', className: 'bg-blue-100 text-blue-700' }
    case 'blocked':
      return { label: '阻塞', className: 'bg-red-100 text-red-700' }
    case 'not-started':
      return { label: '未开始', className: 'bg-gray-100 text-gray-700' }
    default:
      return { label: '未知', className: 'bg-gray-100 text-gray-700' }
  }
}
