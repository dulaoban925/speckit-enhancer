/**
 * useSmartRefresh Hook
 * 智能刷新策略: 检测用户交互,避免在用户操作时刷新
 */

import { useState, useEffect } from 'react'

/**
 * 智能刷新选项
 */
export interface SmartRefreshOptions {
  /** 无交互阈值 (毫秒),默认 5000ms */
  idleThreshold?: number
  /** 是否启用,默认 true */
  enabled?: boolean
}

/**
 * 智能刷新 Hook
 * TODO: 完整实现用户交互检测逻辑
 */
export function useSmartRefresh(
  onRefresh: () => void,
  options: SmartRefreshOptions = {}
) {
  const { idleThreshold = 5000, enabled = true } = options
  const [hasUpdate, setHasUpdate] = useState(false)
  const [lastInteraction, setLastInteraction] = useState(Date.now())

  // 检测用户交互
  useEffect(() => {
    if (!enabled) return

    // TODO: 实现交互检测
    // 1. 监听 mousemove, click, scroll, keypress
    // 2. 更新 lastInteraction 时间戳
    // 3. 防抖处理

    const handleInteraction = () => {
      setLastInteraction(Date.now())
    }

    const events = ['mousemove', 'click', 'scroll', 'keypress']
    events.forEach((event) => {
      document.addEventListener(event, handleInteraction)
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction)
      })
    }
  }, [enabled])

  // 检查是否可以自动刷新
  useEffect(() => {
    if (!hasUpdate || !enabled) return

    const checkInterval = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastInteraction
      if (timeSinceInteraction > idleThreshold) {
        onRefresh()
        setHasUpdate(false)
      }
    }, 1000)

    return () => clearInterval(checkInterval)
  }, [hasUpdate, lastInteraction, idleThreshold, onRefresh, enabled])

  return {
    hasUpdate,
    triggerUpdate: () => setHasUpdate(true),
    manualRefresh: () => {
      onRefresh()
      setHasUpdate(false)
    },
  }
}
