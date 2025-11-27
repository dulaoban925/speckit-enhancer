/**
 * useMultiFileWatch Hook
 * 扩展现有 useFileWatch,支持监视多个文件
 * 基于 research.md 中的设计
 */

import { useEffect, useRef, useCallback } from 'react'

/**
 * 文件变化事件
 */
export interface FileChangeEvent {
  path: string
  lastModified: number
  size: number
}

/**
 * 多文件监视选项
 */
export interface MultiFileWatchOptions {
  /** 轮询间隔 (毫秒),默认 1000ms */
  interval?: number
  /** 是否启用监听,默认 true */
  enabled?: boolean
  /** 文件变化回调 */
  onChange?: (changes: FileChangeEvent[]) => void
}

/**
 * 多文件监视 Hook
 * TODO: 完整实现文件监视逻辑
 */
export function useMultiFileWatch(
  filePaths: string[],
  options: MultiFileWatchOptions = {}
) {
  const { interval = 1000, enabled = true, onChange } = options
  const lastModifiedMap = useRef<Map<string, number>>(new Map())
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)

  const checkFilesChange = useCallback(async () => {
    // TODO: 实现文件变化检测逻辑
    // 1. 并行检查所有文件
    // 2. 对比 lastModified 时间戳
    // 3. 触发 onChange 回调
    console.log('[useMultiFileWatch] Checking files:', filePaths)
  }, [filePaths, enabled, onChange])

  useEffect(() => {
    if (!enabled) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
      return
    }

    // 启动轮询
    checkFilesChange()
    intervalIdRef.current = setInterval(checkFilesChange, interval)

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [filePaths, enabled, interval, checkFilesChange])

  return {
    refresh: checkFilesChange,
    reset: () => lastModifiedMap.current.clear(),
  }
}
