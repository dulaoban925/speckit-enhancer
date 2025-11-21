import React, { useEffect, useRef } from 'react'
import { MarkdownService } from '../../services/markdownService'

interface ViewerProps {
  content: string
  onLinkClick?: (href: string) => void
}

const Viewer: React.FC<ViewerProps> = ({ content, onLinkClick }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

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

    // 语法高亮 (使用 Prism.js)
    // 动态导入并应用语法高亮
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
  }, [content, onLinkClick])

  return (
    <div
      ref={containerRef}
      className="markdown-body prose prose-invert max-w-none p-8"
    />
  )
}

export default Viewer
