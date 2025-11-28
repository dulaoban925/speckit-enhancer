/**
 * ProgressTimeline 组件
 * 使用 Recharts BarChart 显示任务进度时间线
 * 按阶段(Phase)展示已完成/进行中/待处理/阻塞的任务数量
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { FeatureDashboardMetrics } from '../types/metrics'

interface ProgressTimelineProps {
  metrics: FeatureDashboardMetrics
  onPhaseClick?: (phaseName: string) => void
}

/**
 * ProgressTimeline 组件
 */
export default function ProgressTimeline({ metrics, onPhaseClick }: ProgressTimelineProps) {
  // 从 metrics 提取阶段数据
  const phaseData = extractPhaseData(metrics)

  const handleBarClick = (data: PhaseData) => {
    if (onPhaseClick) {
      onPhaseClick(data.phase)
    }
  }

  return (
    <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gh-fg-default">进度时间线</h2>
        <span className="text-sm text-gh-fg-muted">按阶段展示任务分布</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={phaseData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          onClick={(e) => {
            if (e && e.activePayload && e.activePayload[0]) {
              handleBarClick(e.activePayload[0].payload as PhaseData)
            }
          }}
        >
          <XAxis
            dataKey="phase"
            stroke="#8b949e"
            tick={{ fill: '#8b949e', fontSize: 12 }}
            tickLine={{ stroke: '#30363d' }}
          />
          <YAxis
            stroke="#8b949e"
            tick={{ fill: '#8b949e', fontSize: 12 }}
            tickLine={{ stroke: '#30363d' }}
            label={{ value: '任务数量', angle: -90, position: 'insideLeft', fill: '#8b949e' }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(139, 148, 158, 0.1)' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
            formatter={(value) => <span style={{ color: '#c9d1d9', fontSize: '12px' }}>{value}</span>}
          />
          <Bar
            dataKey="completed"
            name="已完成"
            stackId="a"
            fill="#238636"
            radius={[0, 0, 0, 0]}
            cursor="pointer"
          />
          <Bar
            dataKey="inProgress"
            name="进行中"
            stackId="a"
            fill="#1f6feb"
            radius={[0, 0, 0, 0]}
            cursor="pointer"
          />
          <Bar
            dataKey="pending"
            name="待处理"
            stackId="a"
            fill="#6e7681"
            radius={[0, 0, 0, 0]}
            cursor="pointer"
          />
          <Bar
            dataKey="blocked"
            name="阻塞"
            stackId="a"
            fill="#da3633"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-gh-fg-muted text-center">
        点击柱状图可跳转到对应阶段的任务详情
      </div>
    </div>
  )
}

/**
 * 阶段数据类型
 */
interface PhaseData {
  phase: string
  completed: number
  inProgress: number
  pending: number
  blocked: number
  total: number
  completionPercentage: number
  timeRange?: string
}

/**
 * 从 metrics 提取阶段数据
 */
function extractPhaseData(_metrics: FeatureDashboardMetrics): PhaseData[] {
  // 模拟阶段数据 (实际应该从 tasks.md 解析获取)
  // TODO: 集成 tasksParser 的阶段分析功能
  const phases = [
    { name: 'Setup', completed: 3, inProgress: 0, pending: 0, blocked: 0 },
    { name: 'Foundation', completed: 17, inProgress: 0, pending: 0, blocked: 0 },
    { name: 'US1-US2 (P1)', completed: 7, inProgress: 0, pending: 0, blocked: 0 },
    { name: 'US3-US5 (P2)', completed: 6, inProgress: 0, pending: 0, blocked: 0 },
    { name: 'US6 (P3)', completed: 0, inProgress: 2, pending: 2, blocked: 0 },
    { name: 'US7 (P3)', completed: 0, inProgress: 0, pending: 6, blocked: 0 },
    { name: 'Polish', completed: 0, inProgress: 0, pending: 10, blocked: 0 },
  ]

  return phases.map((phase) => {
    const total = phase.completed + phase.inProgress + phase.pending + phase.blocked
    const completionPercentage = total > 0 ? (phase.completed / total) * 100 : 0

    return {
      phase: phase.name,
      completed: phase.completed,
      inProgress: phase.inProgress,
      pending: phase.pending,
      blocked: phase.blocked,
      total,
      completionPercentage,
    }
  })
}

/**
 * 自定义 Tooltip 组件
 */
interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    dataKey: string
    payload: PhaseData
  }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0].payload

  return (
    <div className="bg-gh-canvas-default border border-gh-border-default rounded-lg p-3 shadow-lg">
      <div className="font-semibold text-gh-fg-default mb-2">{data.phase}</div>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gh-success-emphasis">● 已完成</span>
          <span className="text-gh-fg-default font-medium">{data.completed}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gh-accent-fg">● 进行中</span>
          <span className="text-gh-fg-default font-medium">{data.inProgress}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gh-fg-muted">● 待处理</span>
          <span className="text-gh-fg-default font-medium">{data.pending}</span>
        </div>
        {data.blocked > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gh-danger-emphasis">● 阻塞</span>
            <span className="text-gh-fg-default font-medium">{data.blocked}</span>
          </div>
        )}
        <div className="border-t border-gh-border-muted pt-2 mt-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gh-fg-muted">完成度</span>
            <span className="text-gh-fg-default font-bold">
              {data.completionPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gh-fg-muted">总任务数</span>
            <span className="text-gh-fg-default font-medium">{data.total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
