import React, { useEffect, useRef } from 'react'
import Mark from 'mark.js'
import { MarkdownService } from '../../services/markdownService'

interface ViewerProps {
  content: string
  onLinkClick?: (href: string) => void
  /** 需要滚动到的目标行号 */
  targetLine?: number
  /** 需要高亮的目标文本（搜索匹配的文本） */
  targetText?: string
}

const Viewer: React.FC<ViewerProps> = ({ content, onLinkClick, targetLine, targetText }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const markInstanceRef = useRef<Mark | null>(null)
  const scrollAttempted = useRef(false)

  useEffect(() => {
    if (!containerRef.current) return

    // 渲染 Markdown
    const html = MarkdownService.render(content)
    containerRef.current.innerHTML = html

    // 初始化 mark.js 实例
    markInstanceRef.current = new Mark(containerRef.current)

    // 处理链接点击
    if (onLinkClick) {
      const links = containerRef.current.querySelectorAll('a')
      links.forEach((link) => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href')
          if (href && !href.startsWith('http://') && !href.startsWith('https://')) {
            e.preventDefault()
            onLinkClick(href)
          }
        })
      })
    }

    // 语法高亮 (使用 Prism.js)
    const applyHighlighting = async () => {
      try {
        // 动态导入 Prism.js
        const Prism = await import('prismjs')

        // 按需加载常用语言包
        await Promise.all([
          import('prismjs/components/prism-typescript'),
          import('prismjs/components/prism-javascript'),
          import('prismjs/components/prism-jsx'),
          import('prismjs/components/prism-tsx'),
          import('prismjs/components/prism-json'),
          import('prismjs/components/prism-bash'),
          import('prismjs/components/prism-python'),
          import('prismjs/components/prism-markdown'),
          import('prismjs/components/prism-yaml'),
          import('prismjs/components/prism-css'),
          import('prismjs/components/prism-scss'),
        ])

        // 应用高亮
        if (containerRef.current) {
          Prism.highlightAllUnder(containerRef.current)
        }
      } catch (error) {
        console.warn('Prism.js 加载失败:', error)
      }
    }

    applyHighlighting()

    // 重置滚动尝试标记
    scrollAttempted.current = false
  }, [content, onLinkClick])

  // 滚动到目标行（独立的 effect，在渲染完成后执行）
  useEffect(() => {
    if (!containerRef.current || !targetLine || !markInstanceRef.current) {
      return
    }

    // 重置滚动尝试标记，允许每次 targetLine 变化时都能滚动
    scrollAttempted.current = false

    // 延迟执行，确保 Markdown 渲染和语法高亮都已完成
    const scrollTimer = setTimeout(() => {
      if (!containerRef.current || !markInstanceRef.current) return

      try {
        // 清除之前的高亮标记
        markInstanceRef.current.unmark({
          className: 'search-target-line',
        })

        // 从原始内容中提取目标行的文本
        const lines = content.split('\n')
        if (targetLine <= 0 || targetLine > lines.length) {
          console.warn(`[Viewer] 目标行号 ${targetLine} 超出范围 (1-${lines.length})`)
          return
        }

        const lineText = lines[targetLine - 1].trim()
        if (!lineText) {
          console.warn(`[Viewer] 目标行 ${targetLine} 为空`)
          return
        }

        // 优先使用 targetText（搜索匹配的文本），否则提取关键词
        let textToHighlight: string
        let accuracy: 'partially' | 'complementary' | 'exactly'

        if (targetText) {
          // 清理 targetText 中的 Markdown 语法（因为渲染后的 HTML 中已转换）
          const cleanedTargetText = targetText
            .replace(/^[-*+]\s*\[[ xX]\]\s*/, '') // 移除任务列表标记
            .replace(/`[^`]*`/g, '') // 移除内联代码标记
            .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
            .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接语法，保留文本
            .replace(/^#+\s*/, '') // 移除标题标记
            .trim()

          textToHighlight = cleanedTargetText
          accuracy = 'complementary' // 更精确的匹配模式
          console.log(`[Viewer] 尝试滚动到第 ${targetLine} 行，高亮搜索文本（已清理）: "${textToHighlight.substring(0, 50)}..."`)
        } else {
          // 后备方案：从行文本提取关键词（移除 Markdown 语法）
          const cleanText = lineText
            .replace(/^[-*+]\s*\[[ xX]\]\s*/, '') // 移除任务列表标记
            .replace(/`[^`]*`/g, '') // 移除内联代码标记
            .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
            .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
            .trim()

          textToHighlight = cleanText.split(/\s+/).slice(0, 3).join(' ')
          accuracy = 'partially'
          console.log(`[Viewer] 尝试滚动到第 ${targetLine} 行，提取关键词: "${textToHighlight}"`)
        }

        // 使用 mark.js 高亮文本
        markInstanceRef.current.mark(textToHighlight, {
          element: 'mark',
          className: 'search-target-line',
          accuracy: accuracy,
          separateWordSearch: false,
          done: (counter: number) => {
            if (counter > 0) {
              // 获取所有高亮元素
              const allMarks = containerRef.current!.querySelectorAll('mark.search-target-line')

              if (allMarks.length > 0) {
                // 根据目标行号，找到最接近的高亮元素
                let targetMark: Element | null = null

                if (allMarks.length === 1) {
                  // 只有一个匹配，直接使用
                  targetMark = allMarks[0]
                } else {
                  // 多个匹配，找到最接近目标行的那个
                  // 计算目标行在文档中的大致位置（百分比）
                  const targetPosition = targetLine / lines.length
                  const containerHeight = containerRef.current!.scrollHeight
                  const estimatedY = targetPosition * containerHeight

                  let minDistance = Infinity
                  allMarks.forEach((mark) => {
                    const rect = mark.getBoundingClientRect()
                    const containerRect = containerRef.current!.getBoundingClientRect()
                    const markY = rect.top - containerRect.top + containerRef.current!.scrollTop
                    const distance = Math.abs(markY - estimatedY)

                    if (distance < minDistance) {
                      minDistance = distance
                      targetMark = mark
                    }
                  })
                }

                if (targetMark) {
                  targetMark.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest',
                  })

                  console.log(`[Viewer] 成功滚动到目标行并高亮（文本: "${textToHighlight.substring(0, 30)}..."，共 ${allMarks.length} 个匹配）`)
                }
              }
            } else {
              // 方法2: 如果关键词匹配失败，尝试直接定位到大致位置
              console.warn(`[Viewer] 关键词未找到，尝试按行号估算位置`)

              // 获取容器的所有块级元素
              const blockElements = containerRef.current!.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, pre, blockquote')

              // 假设每个块级元素平均对应原始文本的若干行
              // 这只是一个粗略的估算，可能不准确
              if (blockElements.length > 0) {
                const estimatedIndex = Math.min(
                  Math.floor((targetLine / lines.length) * blockElements.length),
                  blockElements.length - 1
                )
                const targetElement = blockElements[estimatedIndex]

                if (targetElement) {
                  // 高亮整个元素（保持高亮，不自动移除）
                  targetElement.classList.add('search-target-fallback')

                  targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest',
                  })

                  console.log(`[Viewer] 使用后备方案滚动到估算位置（元素索引: ${estimatedIndex}）`)
                }
              }
            }
          },
        })

        scrollAttempted.current = true
      } catch (error) {
        console.error('[Viewer] 滚动到目标行时出错:', error)
      }
    }, 600) // 等待渲染和高亮完成

    return () => clearTimeout(scrollTimer)
  }, [content, targetLine, targetText])

  return (
    <>
      <div ref={containerRef} className="markdown-body prose prose-invert max-w-none p-8" />
      <style>{`
        mark.search-target-line {
          background-color: rgba(250, 219, 20, 0.4);
          padding: 2px 4px;
          border-radius: 2px;
          transition: background-color 0.5s ease;
        }

        .search-target-fallback {
          background-color: rgba(250, 219, 20, 0.2) !important;
          padding: 8px !important;
          border-left: 4px solid rgba(250, 219, 20, 0.8) !important;
          border-radius: 4px !important;
          transition: all 0.5s ease !important;
        }
      `}</style>
    </>
  )
}

export default Viewer
