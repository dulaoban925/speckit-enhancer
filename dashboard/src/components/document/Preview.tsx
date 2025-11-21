import React, { useEffect, useRef } from 'react'
import { MarkdownService } from '../../services/markdownService'

/**
 * Preview 组件属性
 */
interface PreviewProps {
  content: string
  onLinkClick?: (href: string) => void
}

/**
 * 预览组件
 * 实时渲染编辑器中的 Markdown 内容
 */
const Preview: React.FC<PreviewProps> = ({ content, onLinkClick }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isRendering = useRef(false)

  useEffect(() => {
    if (!containerRef.current || isRendering.current) return

    // 防止重复渲染
    isRendering.current = true

    try {
      // 渲染 Markdown
      const html = MarkdownService.render(content)
      containerRef.current.innerHTML = html

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

      // 语法高亮
      const applyHighlighting = async () => {
        try {
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

          if (containerRef.current) {
            Prism.highlightAllUnder(containerRef.current)
          }
        } catch (error) {
          console.warn('Prism.js 加载失败:', error)
        }
      }

      applyHighlighting()
    } catch (error) {
      console.error('Markdown 渲染失败:', error)
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="p-4 text-gh-danger-fg">
            <p class="font-semibold mb-2">渲染错误</p>
            <p class="text-sm">${error instanceof Error ? error.message : String(error)}</p>
          </div>
        `
      }
    } finally {
      isRendering.current = false
    }
  }, [content, onLinkClick])

  return (
    <div className="h-full flex flex-col bg-gh-canvas-default">
      {/* 预览标题栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gh-border-default bg-gh-canvas-subtle">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gh-fg-default">预览</span>
          <span className="text-xs text-gh-fg-muted">实时同步</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gh-success-emphasis rounded-full animate-pulse" title="实时预览"></div>
        </div>
      </div>

      {/* 预览内容 */}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={containerRef}
          className="markdown-body prose prose-invert max-w-none p-8"
        />
      </div>
    </div>
  )
}

export default Preview
