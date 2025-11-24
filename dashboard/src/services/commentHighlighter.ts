import type { Comment } from '../types'

/**
 * 评论高亮服务
 * 使用 DOM 注入方式在渲染后的 Markdown 中标记被评论的文本
 */
export class CommentHighlighter {
  /**
   * 将评论标记注入到 DOM 中
   * @param containerElement - Markdown 渲染容器
   * @param comments - 评论列表
   */
  static inject(containerElement: HTMLElement, comments: Comment[]): void {
    if (!containerElement || comments.length === 0) {
      return
    }

    console.log('[CommentHighlighter] 开始注入评论标记，评论数量:', comments.length)

    // 按评论创建时间排序，确保处理顺序一致
    const sortedComments = [...comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    // 遍历每个评论，找到对应的文本并包裹
    sortedComments.forEach((comment) => {
      try {
        const textNode = this.findTextNode(
          containerElement,
          comment.anchor.textFragment,
          comment.anchor.contextBefore,
          comment.anchor.contextAfter
        )

        if (textNode) {
          const highlightSpan = this.createHighlightSpan(comment)
          this.wrapTextNode(textNode, comment.anchor.textFragment, highlightSpan)
          this.bindEvents(highlightSpan, comment)
          console.log(`[CommentHighlighter] 成功标记评论: ${comment.id}`)
        } else {
          console.warn(`[CommentHighlighter] 未找到评论 ${comment.id} 的文本:`, comment.anchor.textFragment)
        }
      } catch (error) {
        console.error(`[CommentHighlighter] 处理评论 ${comment.id} 失败:`, error)
      }
    })
  }

  /**
   * 在 DOM 中查找包含目标文本的文本节点
   * 使用上下文匹配提高准确性
   */
  private static findTextNode(
    container: HTMLElement,
    targetText: string,
    contextBefore?: string,
    contextAfter?: string
  ): Text | null {
    console.log('[CommentHighlighter] 查找文本节点:', { targetText, contextBefore, contextAfter })

    // 创建 TreeWalker 遍历所有文本节点
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 跳过已经被标记的节点
          const parent = node.parentElement
          if (parent && parent.classList.contains('comment-highlight')) {
            return NodeFilter.FILTER_REJECT
          }
          // 只接受包含目标文本的节点
          if (node.textContent && node.textContent.includes(targetText)) {
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_SKIP
        },
      }
    )

    const candidates: Text[] = []
    let node: Node | null

    // 收集所有候选节点
    while ((node = walker.nextNode())) {
      candidates.push(node as Text)
    }

    console.log(`[CommentHighlighter] 找到 ${candidates.length} 个候选节点`)

    if (candidates.length === 0) {
      return null
    }

    // 如果只有一个候选节点，直接返回
    if (candidates.length === 1) {
      return candidates[0]
    }

    // 使用上下文匹配找到最佳候选节点
    if (contextBefore || contextAfter) {
      for (const candidate of candidates) {
        const text = candidate.textContent || ''
        const index = text.indexOf(targetText)

        if (index === -1) continue

        // 检查前置上下文
        if (contextBefore) {
          const beforeText = text.substring(0, index)
          const prevSibling = this.getPreviousText(candidate)
          const fullBefore = prevSibling + beforeText

          if (!fullBefore.includes(contextBefore)) {
            continue
          }
        }

        // 检查后置上下文
        if (contextAfter) {
          const afterText = text.substring(index + targetText.length)
          const nextSibling = this.getNextText(candidate)
          const fullAfter = afterText + nextSibling

          if (!fullAfter.includes(contextAfter)) {
            continue
          }
        }

        // 上下文匹配成功
        console.log('[CommentHighlighter] 通过上下文匹配找到节点')
        return candidate
      }
    }

    // 如果上下文匹配失败，返回第一个候选节点
    console.log('[CommentHighlighter] 上下文匹配失败，返回第一个候选节点')
    return candidates[0]
  }

  /**
   * 获取节点前面的文本内容（用于上下文匹配）
   */
  private static getPreviousText(node: Node, maxLength: number = 100): string {
    let text = ''
    let current: Node | null = node.previousSibling

    while (current && text.length < maxLength) {
      if (current.nodeType === Node.TEXT_NODE) {
        text = (current.textContent || '') + text
      } else if (current.nodeType === Node.ELEMENT_NODE) {
        text = (current.textContent || '') + text
      }
      current = current.previousSibling
    }

    return text.slice(-maxLength)
  }

  /**
   * 获取节点后面的文本内容（用于上下文匹配）
   */
  private static getNextText(node: Node, maxLength: number = 100): string {
    let text = ''
    let current: Node | null = node.nextSibling

    while (current && text.length < maxLength) {
      if (current.nodeType === Node.TEXT_NODE) {
        text += current.textContent || ''
      } else if (current.nodeType === Node.ELEMENT_NODE) {
        text += current.textContent || ''
      }
      current = current.nextSibling
    }

    return text.slice(0, maxLength)
  }

  /**
   * 将文本节点中的目标文本包裹在指定元素中
   */
  private static wrapTextNode(textNode: Text, targetText: string, wrapElement: HTMLElement): void {
    const text = textNode.textContent || ''
    const index = text.indexOf(targetText)

    if (index === -1) {
      console.warn('[CommentHighlighter] 文本节点中未找到目标文本')
      return
    }

    const parent = textNode.parentNode
    if (!parent) {
      console.warn('[CommentHighlighter] 文本节点没有父节点')
      return
    }

    // 分割文本节点：[before] [target] [after]
    const beforeText = text.substring(0, index)
    const afterText = text.substring(index + targetText.length)

    // 创建文本节点
    const beforeNode = beforeText ? document.createTextNode(beforeText) : null
    const targetNode = document.createTextNode(targetText)
    const afterNode = afterText ? document.createTextNode(afterText) : null

    // 将目标文本放入包裹元素
    wrapElement.appendChild(targetNode)

    // 替换原文本节点
    if (beforeNode) {
      parent.insertBefore(beforeNode, textNode)
    }
    parent.insertBefore(wrapElement, textNode)
    if (afterNode) {
      parent.insertBefore(afterNode, textNode)
    }
    parent.removeChild(textNode)

    console.log('[CommentHighlighter] 成功包裹文本节点')
  }

  /**
   * 创建评论高亮 span 元素
   */
  private static createHighlightSpan(comment: Comment): HTMLSpanElement {
    const span = document.createElement('span')
    span.className = 'comment-highlight'
    span.setAttribute('data-comment-id', comment.id)
    span.setAttribute('data-status', comment.status)
    span.setAttribute('title', '点击查看/编辑评论')

    // 根据评论状态设置样式
    let backgroundColor: string
    let borderColor: string

    switch (comment.status) {
      case 'resolved':
        backgroundColor = 'rgba(76, 175, 80, 0.2)'
        borderColor = '#4CAF50'
        break
      case 'archived':
        backgroundColor = 'rgba(158, 158, 158, 0.2)'
        borderColor = '#9E9E9E'
        span.style.opacity = '0.6'
        break
      default: // open
        backgroundColor = 'rgba(250, 219, 20, 0.3)'
        borderColor = '#fadb14'
    }

    span.style.cssText = `
      background-color: ${backgroundColor};
      border-bottom: 2px solid ${borderColor};
      padding: 1px 2px;
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.2s ease;
    `

    return span
  }

  /**
   * 绑定评论标记的事件处理
   */
  private static bindEvents(span: HTMLSpanElement, comment: Comment): void {
    // 点击事件：打开评论面板
    span.addEventListener('click', (e) => {
      e.stopPropagation()
      console.log('[CommentHighlighter] 点击评论标记:', comment.id)

      // 触发自定义事件，通知父组件打开评论面板
      const event = new CustomEvent('commentMarkerClick', {
        detail: { commentId: comment.id },
        bubbles: true,
      })
      span.dispatchEvent(event)
    })

    // 悬停事件：增强视觉效果
    span.addEventListener('mouseenter', () => {
      if (comment.status === 'open') {
        span.style.backgroundColor = 'rgba(250, 219, 20, 0.5)'
        span.style.borderBottomWidth = '3px'
      } else if (comment.status === 'resolved') {
        span.style.backgroundColor = 'rgba(76, 175, 80, 0.3)'
      }
    })

    span.addEventListener('mouseleave', () => {
      if (comment.status === 'open') {
        span.style.backgroundColor = 'rgba(250, 219, 20, 0.3)'
        span.style.borderBottomWidth = '2px'
      } else if (comment.status === 'resolved') {
        span.style.backgroundColor = 'rgba(76, 175, 80, 0.2)'
      }
    })
  }

  /**
   * 更新特定评论标记的样式（只更新颜色，不重新注入）
   */
  static updateMarkerStyle(containerElement: HTMLElement, commentId: string, status: string): void {
    if (!containerElement) return

    const marker = containerElement.querySelector(`[data-comment-id="${commentId}"]`) as HTMLSpanElement
    if (!marker) {
      console.warn(`[CommentHighlighter] 未找到评论标记: ${commentId}`)
      return
    }

    // 更新 data-status 属性
    marker.setAttribute('data-status', status)

    // 根据新状态更新样式
    let backgroundColor: string
    let borderColor: string
    let opacity = '1'

    switch (status) {
      case 'resolved':
        backgroundColor = 'rgba(76, 175, 80, 0.2)'
        borderColor = '#4CAF50'
        break
      case 'archived':
        backgroundColor = 'rgba(158, 158, 158, 0.2)'
        borderColor = '#9E9E9E'
        opacity = '0.6'
        break
      default: // open
        backgroundColor = 'rgba(250, 219, 20, 0.3)'
        borderColor = '#fadb14'
    }

    marker.style.backgroundColor = backgroundColor
    marker.style.borderBottomColor = borderColor
    marker.style.opacity = opacity

    console.log(`[CommentHighlighter] 已更新评论标记样式: ${commentId} -> ${status}`)
  }

  /**
   * 清除容器中的所有评论标记
   */
  static clear(containerElement: HTMLElement): void {
    if (!containerElement) return

    const highlights = containerElement.querySelectorAll('.comment-highlight')
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode
      if (parent) {
        // 将 span 中的文本节点移到父节点
        while (highlight.firstChild) {
          parent.insertBefore(highlight.firstChild, highlight)
        }
        parent.removeChild(highlight)
      }
    })

    console.log(`[CommentHighlighter] 已清除 ${highlights.length} 个评论标记`)
  }
}
