/**
 * TaskDistribution 组件
 * 使用 Recharts PieChart 显示任务状态分布
 * 展示已完成/进行中/待处理/阻塞的任务占比
 */

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useState } from 'react'
import type { ProgressMetrics } from '../types/metrics'

interface TaskDistributionProps {
  metrics: ProgressMetrics
  onStatusClick?: (status: string) => void
}

/**
 * TaskDistribution 组件
 */
export default function TaskDistribution({ metrics, onStatusClick }: TaskDistributionProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  // 从 metrics 提取分布数据
  const distributionData = extractDistributionData(metrics)

  const handlePieClick = (_: any, index: number) => {
    const status = distributionData[index].name
    if (onStatusClick) {
      onStatusClick(status)
    }
  }

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const handleMouseLeave = () => {
    setActiveIndex(undefined)
  }

  return (
    <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gh-fg-default">任务分布</h2>
        <span className="text-sm text-gh-fg-muted">按状态统计</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={distributionData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            innerRadius={60}
            dataKey="value"
            onClick={handlePieClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            cursor="pointer"
          >
            {distributionData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={activeIndex === undefined || activeIndex === index ? 1 : 0.6}
                stroke="#0d1117"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span style={{ color: '#c9d1d9', fontSize: '12px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {distributionData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-gh-canvas-default rounded border border-gh-border-muted hover:border-gh-accent-fg transition-colors cursor-pointer"
            onClick={() => onStatusClick && onStatusClick(item.name)}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gh-fg-default">{item.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gh-fg-default">{item.value}</div>
              <div className="text-xs text-gh-fg-muted">{item.percentage.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gh-fg-muted text-center">
        点击图表或卡片可查看对应状态的任务列表
      </div>
    </div>
  )
}

/**
 * 分布数据类型
 */
interface DistributionData {
  name: string
  value: number
  percentage: number
  color: string
}

/**
 * 从 metrics 提取分布数据
 */
function extractDistributionData(metrics: ProgressMetrics): DistributionData[] {
  const { completedTasks, totalTasks } = metrics

  // 计算各状态任务数 (模拟数据,实际应该从 tasksParser 获取)
  const completed = completedTasks
  const inProgress = Math.floor((totalTasks - completedTasks) * 0.3)
  const pending = Math.floor((totalTasks - completedTasks) * 0.6)
  const blocked = totalTasks - completedTasks - inProgress - pending

  const total = totalTasks

  const data: DistributionData[] = [
    {
      name: '已完成',
      value: completed,
      percentage: (completed / total) * 100,
      color: '#238636',
    },
    {
      name: '进行中',
      value: inProgress,
      percentage: (inProgress / total) * 100,
      color: '#1f6feb',
    },
    {
      name: '待处理',
      value: pending,
      percentage: (pending / total) * 100,
      color: '#6e7681',
    },
  ]

  // 只在有阻塞任务时添加
  if (blocked > 0) {
    data.push({
      name: '阻塞',
      value: blocked,
      percentage: (blocked / total) * 100,
      color: '#da3633',
    })
  }

  return data
}

/**
 * 自定义标签渲染
 */
interface LabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}

function renderCustomizedLabel(props: LabelProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) {
    // 占比小于 5% 不显示标签
    return null
  }

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

/**
 * 自定义 Tooltip 组件
 */
interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: DistributionData
  }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0].payload

  return (
    <div className="bg-gh-canvas-default border border-gh-border-default rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="font-semibold text-gh-fg-default">{data.name}</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-6">
          <span className="text-gh-fg-muted">任务数量</span>
          <span className="text-gh-fg-default font-bold">{data.value}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-gh-fg-muted">占比</span>
          <span className="text-gh-fg-default font-bold">{data.percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
