import { useEffect, useState, useRef } from 'react'

/**
 * useDeferredLoading Hook 配置
 */
interface UseDeferredLoadingOptions {
  /** 延迟显示时间（毫秒），默认 200ms */
  delay?: number
  /** 最小显示时间（毫秒），默认 300ms */
  minDuration?: number
}

/**
 * useDeferredLoading Hook
 *
 * 用于优化加载状态的显示，避免快速加载时的闪烁问题
 *
 * 工作原理：
 * 1. 如果加载时间小于 delay，不显示 loading
 * 2. 如果显示了 loading，至少显示 minDuration 时间
 *
 * @param isLoading - 实际的加载状态
 * @param options - 配置选项
 * @returns 经过延迟处理的加载状态
 *
 * @example
 * ```tsx
 * const { loading } = useProject()
 * const deferredLoading = useDeferredLoading(loading)
 *
 * if (deferredLoading) {
 *   return <Loading />
 * }
 * ```
 */
export function useDeferredLoading(
  isLoading: boolean,
  options: UseDeferredLoadingOptions = {}
): boolean {
  const { delay = 200, minDuration = 300 } = options

  const [deferredLoading, setDeferredLoading] = useState(false)
  const delayTimerRef = useRef<NodeJS.Timeout | null>(null)
  const minDurationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const showTimeRef = useRef<number | null>(null)

  useEffect(() => {
    // 清理之前的定时器
    const cleanup = () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }
      if (minDurationTimerRef.current) {
        clearTimeout(minDurationTimerRef.current)
        minDurationTimerRef.current = null
      }
    }

    if (isLoading) {
      // 开始加载：延迟显示 loading
      delayTimerRef.current = setTimeout(() => {
        setDeferredLoading(true)
        showTimeRef.current = Date.now()
      }, delay)
    } else {
      // 停止加载
      cleanup()

      if (deferredLoading && showTimeRef.current) {
        // 如果 loading 已显示，确保至少显示 minDuration 时间
        const elapsedTime = Date.now() - showTimeRef.current
        const remainingTime = Math.max(0, minDuration - elapsedTime)

        if (remainingTime > 0) {
          minDurationTimerRef.current = setTimeout(() => {
            setDeferredLoading(false)
            showTimeRef.current = null
          }, remainingTime)
        } else {
          setDeferredLoading(false)
          showTimeRef.current = null
        }
      } else {
        // loading 还未显示，直接取消
        setDeferredLoading(false)
        showTimeRef.current = null
      }
    }

    return cleanup
  }, [isLoading, delay, minDuration, deferredLoading])

  return deferredLoading
}
