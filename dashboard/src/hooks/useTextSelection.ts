import { useState, useEffect, useCallback } from 'react'
import type { CommentAnchor } from '../types'

export interface TextSelection {
  text: string
  startLine: number
  endLine: number
  x: number
  y: number
  width: number
  height: number
}

interface UseTextSelectionOptions {
  containerRef?: React.RefObject<HTMLElement>
  onSelectionChange?: (selection: TextSelection | null) => void
  enabled?: boolean
}

/**
 * 文本选择 Hook
 * 捕获用户在文档中选中的文本并计算行号、位置等信息
 */
export function useTextSelection(options: UseTextSelectionOptions = {}) {
  const { containerRef, onSelectionChange, enabled = true } = options
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  /**
   * 计算选中文本所在的行号
   */
  const calculateLineNumbers = useCallback((range: Range): { startLine: number; endLine: number } => {
    const startContainer = range.startContainer
    const endContainer = range.endContainer

    // 查找包含选中文本的所有行元素
    const getLineElement = (node: Node): HTMLElement | null => {
      let current: Node | null = node

      while (current && current !== containerRef?.current) {
        if (
          current instanceof HTMLElement &&
          (current.hasAttribute('data-line') || current.tagName === 'PRE' || current.tagName === 'CODE')
        ) {
          return current
        }
        current = current.parentNode
      }

      return null
    }

    const startLineElement = getLineElement(startContainer)
    const endLineElement = getLineElement(endContainer)

    // 从 data-line 属性获取行号,或者通过计算获取
    const startLine = startLineElement
      ? parseInt(startLineElement.getAttribute('data-line') || '1', 10)
      : 1

    const endLine = endLineElement
      ? parseInt(endLineElement.getAttribute('data-line') || startLine.toString(), 10)
      : startLine

    return { startLine, endLine }
  }, [containerRef])

  /**
   * 处理文本选择事件
   */
  const handleSelectionChange = useCallback(() => {
    if (!enabled) {
      return
    }

    const windowSelection = window.getSelection()
    if (!windowSelection || windowSelection.rangeCount === 0) {
      setSelection(null)
      setIsSelecting(false)
      onSelectionChange?.(null)
      return
    }

    const text = windowSelection.toString().trim()
    if (!text) {
      setSelection(null)
      setIsSelecting(false)
      onSelectionChange?.(null)
      return
    }

    // 检查选中的文本是否在指定的容器内
    if (containerRef?.current) {
      const range = windowSelection.getRangeAt(0)
      const container = containerRef.current

      if (!container.contains(range.commonAncestorContainer)) {
        setSelection(null)
        setIsSelecting(false)
        onSelectionChange?.(null)
        return
      }

      // 计算行号
      const { startLine, endLine } = calculateLineNumbers(range)

      // 获取选中文本的位置信息
      const rect = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      const newSelection: TextSelection = {
        text,
        startLine,
        endLine,
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
      }

      setSelection(newSelection)
      setIsSelecting(false)
      onSelectionChange?.(newSelection)
    } else {
      // 没有指定容器,使用默认行号
      const range = windowSelection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      const newSelection: TextSelection = {
        text,
        startLine: 1,
        endLine: 1,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      }

      setSelection(newSelection)
      setIsSelecting(false)
      onSelectionChange?.(newSelection)
    }
  }, [enabled, containerRef, calculateLineNumbers, onSelectionChange])

  /**
   * 处理鼠标按下事件
   */
  const handleMouseDown = useCallback(() => {
    setIsSelecting(true)
  }, [])

  /**
   * 处理鼠标松开事件
   */
  const handleMouseUp = useCallback(() => {
    // 延迟一点执行,确保选择已经完成
    setTimeout(() => {
      handleSelectionChange()
    }, 50)
  }, [handleSelectionChange])

  /**
   * 清除当前选择
   */
  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges()
    setSelection(null)
    setIsSelecting(false)
    onSelectionChange?.(null)
  }, [onSelectionChange])

  /**
   * 从选择创建评论锚点
   */
  const createAnchorFromSelection = useCallback(
    (documentContent: string): CommentAnchor | null => {
      if (!selection) {
        return null
      }

      const lines = documentContent.split('\n')

      // 获取上下文 (前后各 1 行)
      const contextBefore =
        selection.startLine > 1 ? lines[selection.startLine - 2] : undefined

      const contextAfter =
        selection.endLine < lines.length ? lines[selection.endLine] : undefined

      return {
        startLine: selection.startLine,
        endLine: selection.endLine,
        textFragment: selection.text,
        contextBefore,
        contextAfter,
      }
    },
    [selection]
  )

  // 监听选择变化事件
  useEffect(() => {
    if (!enabled) {
      return
    }

    const container = containerRef?.current || document

    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [enabled, containerRef, handleMouseDown, handleMouseUp, handleSelectionChange])

  return {
    selection,
    isSelecting,
    clearSelection,
    createAnchorFromSelection,
  }
}
