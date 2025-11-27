/**
 * spec.md 解析器
 * 提取用户故事和验收场景
 */

import type { UserStory, Priority } from '../../types/entities'

/**
 * 解析 spec.md 内容
 * 使用正则表达式提取用户故事
 */
export function parseSpecFile(content: string): {
  userStories: UserStory[]
  totalScenarios: number
} {
  const userStories: UserStory[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 匹配用户故事标题: ### User Story N - Title (Priority: PX)
    const storyMatch = line.match(/^###\s+User Story\s+(\d+)\s+-\s+(.+?)\s+\(Priority:\s+(P[1-3])\)/)
    if (storyMatch) {
      const number = parseInt(storyMatch[1], 10)
      const title = storyMatch[2].trim()
      const priority = storyMatch[3] as Priority

      // 统计该故事的验收场景数量 (查找接下来的 #### Acceptance Scenarios 部分)
      let scenarioCount = 0
      for (let j = i + 1; j < lines.length; j++) {
        // 如果遇到下一个用户故事，停止
        if (lines[j].match(/^###\s+User Story/)) {
          break
        }
        // 统计验收场景标记 (- **Scenario**)
        if (lines[j].match(/^-\s+\*\*Scenario/)) {
          scenarioCount++
        }
      }

      userStories.push({
        number,
        title,
        priority,
        acceptanceScenarios: scenarioCount,
        relatedPhase: null, // 需要与 tasks 关联后确定
        isCompleted: false, // 需要与 tasks 关联后确定
      })
    }
  }

  const totalScenarios = userStories.reduce((sum, story) => sum + story.acceptanceScenarios, 0)

  return {
    userStories,
    totalScenarios,
  }
}

/**
 * 从标题中提取优先级
 */
export function extractPriority(text: string): Priority | null {
  const match = text.match(/Priority:\s*(P[1-3])/i)
  return match ? (match[1] as Priority) : null
}

/**
 * 从标题中提取用户故事编号
 */
export function extractStoryNumber(text: string): number | null {
  const match = text.match(/User Story\s+(\d+)/i)
  return match ? parseInt(match[1], 10) : null
}
