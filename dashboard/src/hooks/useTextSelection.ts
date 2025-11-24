import { useState, useEffect, useCallback, useRef } from 'react'
import type { CommentAnchor } from '../types'

export interface TextSelection {
  text: string
  startLine: number
  endLine: number
  x: number
  y: number
  width: number
  height: number
  rects: DOMRect[] // 选中文本的所有矩形区域，用于绘制高亮
  mouseX: number // 鼠标松开时的 X 坐标
  mouseY: number // 鼠标松开时的 Y 坐标
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
  const handleSelectionChange = useCallback((mouseX: number, mouseY: number) => {
    if (!enabled) {
      return
    }

    const windowSelection = window.getSelection()
    if (!windowSelection || windowSelection.rangeCount === 0) {
      return // 不清空state，保留之前的选择
    }

    const text = windowSelection.toString().trim()
    if (!text) {
      return // 不清空state，保留之前的选择
    }

    // 检查选中的文本是否在指定的容器内
    const range = windowSelection.getRangeAt(0)

    if (containerRef?.current) {
      const container = containerRef.current

      // 检查选中的范围是否在容器内
      if (!container.contains(range.commonAncestorContainer)) {
        setSelection(null)
        setIsSelecting(false)
        onSelectionChange?.(null)
        return
      }

      // 计算行号
      const { startLine, endLine } = calculateLineNumbers(range)

      // 获取选中文本的位置信息（getBoundingClientRect 返回相对于视口的坐标）
      const rect = range.getBoundingClientRect()

      // 获取所有矩形区域（用于多行选择）
      const clientRects = range.getClientRects()
      const rects = Array.from(clientRects)

      const newSelection: TextSelection = {
        text,
        startLine,
        endLine,
        x: rect.left,  // 相对于视口
        y: rect.top,   // 相对于视口
        width: rect.width,
        height: rect.height,
        rects, // 所有矩形区域
        mouseX, // 鼠标松开位置 X
        mouseY, // 鼠标松开位置 Y
      }

      // 清除浏览器的原生选择（我们使用自定义高亮层代替）
      setTimeout(() => {
        const sel = window.getSelection()
        if (sel) {
          sel.removeAllRanges()
        }
      }, 100)

      // 先更新状态
      setSelection(newSelection)
      setIsSelecting(false)

      // 然后通知回调
      console.log('[useTextSelection] 文本选择完成，触发回调:', { text: newSelection.text, hasCallback: !!onSelectionChange })
      onSelectionChange?.(newSelection)
    } else {
      // 没有指定容器,使用默认行号
      const rect = range.getBoundingClientRect()

      // 获取所有矩形区域（用于多行选择）
      const clientRects = range.getClientRects()
      const rects = Array.from(clientRects)

      const newSelection: TextSelection = {
        text,
        startLine: 1,
        endLine: 1,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        rects,
        mouseX, // 鼠标松开位置 X
        mouseY, // 鼠标松开位置 Y
      }

      // 清除浏览器的原生选择（我们使用自定义高亮层代替）
      setTimeout(() => {
        const sel = window.getSelection()
        if (sel) {
          sel.removeAllRanges()
        }
      }, 100)

      // 先更新状态
      setSelection(newSelection)
      setIsSelecting(false)

      // 然后通知回调
      console.log('[useTextSelection] 文本选择完成，触发回调:', { text: newSelection.text, hasCallback: !!onSelectionChange })
      onSelectionChange?.(newSelection)
    }
  }, [enabled, containerRef, calculateLineNumbers, onSelectionChange])

  /**
   * 处理鼠标松开事件
   */
  const handleMouseUp = useCallback((e: MouseEvent) => {
    // 保存鼠标松开时的坐标
    const mouseX = e.clientX
    const mouseY = e.clientY

    // 延迟一点执行,确保选择已经完成
    setTimeout(() => {
      const windowSelection = window.getSelection()

      // 检查是否有有效的文本选择
      if (!windowSelection || windowSelection.rangeCount === 0 || !windowSelection.toString().trim()) {
        return
      }

      handleSelectionChange(mouseX, mouseY)
      setIsSelecting(false)
    }, 150)
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
   * 处理点击事件 - 清除选择
   */
  const handleClick = useCallback((e: MouseEvent) => {
    // 如果已有选择，检查是否点击了外部区域
    if (selection) {
      // 检查点击目标是否是"添加评论"按钮或其子元素
      const target = e.target as HTMLElement
      const isCommentButton = target.closest('[data-comment-action-button]')

      if (!isCommentButton) {
        // 点击了其他地方，清除选择
        clearSelection()
      }
    }
  }, [selection, clearSelection])

  /**
   * 从选择创建评论锚点
   */
  const createAnchorFromSelection = useCallback(
    (documentContent: string, textSelection?: TextSelection | null): CommentAnchor | null => {
      // 使用传入的 textSelection 或当前的 selection 状态
      const activeSelection = textSelection || selection

      if (!activeSelection) {
        console.warn('[useTextSelection] createAnchorFromSelection: 没有选择文本')
        return null
      }

      const lines = documentContent.split('\n')

      // 获取上下文 (前后各 1 行)
      const contextBefore =
        activeSelection.startLine > 1 ? lines[activeSelection.startLine - 2] : undefined

      const contextAfter =
        activeSelection.endLine < lines.length ? lines[activeSelection.endLine] : undefined

      return {
        startLine: activeSelection.startLine,
        endLine: activeSelection.endLine,
        textFragment: activeSelection.text,
        contextBefore,
        contextAfter,
      }
    },
    [selection]
  )

  // 监听选择变化事件和点击事件
  useEffect(() => {
    if (!enabled) {
      return
    }

    // 监听 mouseup 事件捕获文本选择
    document.addEventListener('mouseup', handleMouseUp)

    // 监听 mousedown 事件清除选择（模拟浏览器原生行为）
    document.addEventListener('mousedown', handleClick)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [enabled, handleMouseUp, handleClick])

  // 监听滚动事件，滚动时清除选中状态
  useEffect(() => {
    if (!enabled || !selection || !containerRef?.current) {
      return
    }

    const container = containerRef.current

    const handleScroll = () => {
      // 滚动时清除选中状态
      console.log('[useTextSelection] 滚动事件触发，清除选中状态')
      clearSelection()
    }

    // 检查是否需要监听容器滚动还是窗口滚动
    const isContainerScrollable = container.scrollHeight > container.clientHeight

    if (isContainerScrollable) {
      container.addEventListener('scroll', handleScroll, { passive: true })
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (isContainerScrollable) {
        container.removeEventListener('scroll', handleScroll)
      } else {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [enabled, selection, containerRef, clearSelection])

  return {
    selection,
    isSelecting,
    clearSelection,
    createAnchorFromSelection,
  }
}
