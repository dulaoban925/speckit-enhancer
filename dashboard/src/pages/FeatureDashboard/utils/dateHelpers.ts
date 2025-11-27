/**
 * 日期处理工具函数
 * 使用 date-fns
 */

import { differenceInDays, formatDistanceToNow, subWeeks } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 计算距今天数
 */
export function calculateDaysSince(date: Date): number {
  return differenceInDays(new Date(), date)
}

/**
 * 格式化相对时间
 * 例如: "3天前", "2小时前"
 */
export function formatRelativeTime(date: Date | string): string {
  // 验证日期是否有效
  if (!date) return '未知'

  const dateObj = date instanceof Date ? date : new Date(date)

  // 检查日期是否有效
  if (isNaN(dateObj.getTime())) {
    return '无效日期'
  }

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: zhCN,
  })
}

/**
 * 获取一周前的日期
 */
export function getOneWeekAgo(): Date {
  return subWeeks(new Date(), 1)
}

/**
 * 计算周增长率
 */
export function calculateWeeklyGrowth(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}
