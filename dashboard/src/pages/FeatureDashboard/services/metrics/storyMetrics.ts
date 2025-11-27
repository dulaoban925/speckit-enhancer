/**
 * 用户故事指标计算器
 */

import type { UserStoryMetrics, PriorityGroup, Priority } from '../../types/metrics'
import type { UserStory } from '../../types/entities'

/**
 * 计算用户故事指标
 * TODO: 完整实现计算逻辑
 */
export function calculateUserStoryMetrics(
  userStories: UserStory[],
  totalScenarios: number,
  passedScenarios: number
): UserStoryMetrics {
  const total = userStories.length

  // 按优先级分组
  const byPriority: { [key in Priority]: PriorityGroup } = {
    P1: createPriorityGroup(userStories, 'P1'),
    P2: createPriorityGroup(userStories, 'P2'),
    P3: createPriorityGroup(userStories, 'P3'),
  }

  // 计算验收场景通过率
  const passRate = totalScenarios > 0 ? (passedScenarios / totalScenarios) * 100 : 0

  return {
    total,
    byPriority,
    acceptanceScenarios: {
      passed: passedScenarios,
      total: totalScenarios,
      passRate: Math.round(passRate * 10) / 10,
    },
  }
}

/**
 * 创建优先级组
 */
function createPriorityGroup(userStories: UserStory[], priority: Priority): PriorityGroup {
  const stories = userStories.filter((s) => s.priority === priority)
  const completed = stories.filter((s) => s.isCompleted).length
  const total = stories.length
  const percentage = total > 0 ? (completed / total) * 100 : 0

  return {
    total,
    completed,
    percentage: Math.round(percentage * 10) / 10,
    stories,
  }
}
