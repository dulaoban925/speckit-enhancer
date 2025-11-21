import { useEffect, useRef, useCallback } from 'react'
import { CLIService } from '../services/cliService'

/**
 * 文件变化回调
 */
export interface FileChangeEvent {
  path: string
  lastModified: number
  size: number
}

/**
 * 文件监听 Hook 选项
 */
export interface UseFileWatchOptions {
  /** 轮询间隔 (毫秒),默认 2000ms */
  interval?: number
  /** 是否启用监听,默认 true */
  enabled?: boolean
  /** 文件变化回调 */
  onChange?: (event: FileChangeEvent) => void
}

/**
 * 文件监听 Hook
 * 通过轮询检测文件变化
 */
export function useFileWatch(
  filePath: string | undefined,
  options: UseFileWatchOptions = {}
) {
  const { interval = 2000, enabled = true, onChange } = options

  const lastModifiedRef = useRef<number | null>(null)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
  const isCheckingRef = useRef(false)

  // 检查文件变化
  const checkFileChange = useCallback(async () => {
    if (!filePath || !enabled || isCheckingRef.current) return

    isCheckingRef.current = true

    try {
      // 调用 CLI read 命令获取文件元数据
      const response = await CLIService.readDocument(filePath)

      if (response.success && response.data) {
        const currentModified = response.data.metadata.lastModified

        // 初始化或检测变化
        if (lastModifiedRef.current === null) {
          // 首次检查,仅记录时间
          lastModifiedRef.current = currentModified
        } else if (currentModified !== lastModifiedRef.current) {
          // 文件已变化
          lastModifiedRef.current = currentModified

          if (onChange) {
            onChange({
              path: response.data.path,
              lastModified: currentModified,
              size: response.data.metadata.size,
            })
          }
        }
      }
    } catch (error) {
      console.warn('文件监听检查失败:', error)
    } finally {
      isCheckingRef.current = false
    }
  }, [filePath, enabled, onChange])

  // 启动轮询
  useEffect(() => {
    if (!filePath || !enabled) {
      // 清理
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
      lastModifiedRef.current = null
      return
    }

    // 首次检查
    checkFileChange()

    // 启动定时轮询
    intervalIdRef.current = setInterval(() => {
      checkFileChange()
    }, interval)

    // 清理函数
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [filePath, enabled, interval, checkFileChange])

  // 手动触发检查
  const refresh = useCallback(() => {
    checkFileChange()
  }, [checkFileChange])

  // 重置监听状态
  const reset = useCallback(() => {
    lastModifiedRef.current = null
  }, [])

  return {
    refresh,
    reset,
  }
}
