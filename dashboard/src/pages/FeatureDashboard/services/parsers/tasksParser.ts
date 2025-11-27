/**
 * tasks.md 解析器
 * 提取任务统计和状态分布
 */

import type { Task } from '../../types/entities'

/**
 * 解析 tasks.md 内容
 * 使用正则表达式提取任务列表项
 */
export function parseTasksFile(content: string): {
  tasks: Task[]
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  blockedTasks: number
  currentPhase: string
} {
  const tasks: Task[] = []
  let currentPhase = 'Unknown'

  // 按行分割
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 检测阶段标题 (## Phase N:)
    const phaseMatch = line.match(/^##\s+Phase\s+\d+:\s+(.+)/)
    if (phaseMatch) {
      currentPhase = phaseMatch[1].trim()
      continue
    }

    // 匹配任务项: - [ ] 或 - [x] 或 - [X]
    const taskMatch = line.match(/^-\s+\[([ xX])\]\s+(.+)/)
    if (taskMatch) {
      const isCompleted = taskMatch[1].toLowerCase() === 'x'
      const taskText = taskMatch[2].trim()

      // 提取任务 ID (T001, T002, etc.)
      const idMatch = taskText.match(/^(T\d+)/)
      const taskId = idMatch ? idMatch[1] : `TASK-${tasks.length + 1}`

      // 提取用户故事标签 [US1], [US2], etc.
      const storyMatch = taskText.match(/\[US(\d+)\]/)
      const userStory = storyMatch ? `US${storyMatch[1]}` : null

      // 提取并行标记 [P]
      const isParallel = /\[P\]/.test(taskText)

      tasks.push({
        id: taskId,
        title: taskText,
        status: isCompleted ? 'completed' : 'pending',
        phase: currentPhase,
        userStory,
        isParallel,
        dependencies: [],
      })
    }
  }

  // 统计各状态任务数
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const pendingTasks = tasks.filter(t => t.status === 'pending').length

  // 查找当前阶段 (第一个有待处理任务的阶段)
  const currentPhaseTask = tasks.find(t => t.status === 'pending')
  const detectedCurrentPhase = currentPhaseTask ? currentPhaseTask.phase : 'All phases completed'

  return {
    tasks,
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks: 0, // tasks.md 不区分进行中和待处理
    pendingTasks,
    blockedTasks: 0, // tasks.md 不标记阻塞状态
    currentPhase: detectedCurrentPhase,
  }
}
