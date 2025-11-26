import { marked } from 'marked'

/**
 * Markdown 渲染服务
 * 使用 Marked.js 渲染 Markdown 为 HTML
 */
export class MarkdownService {
  private static renderer: InstanceType<typeof marked.Renderer>

  /**
   * 初始化 Marked 配置
   */
  static initialize() {
    // 配置 Marked.js
    marked.setOptions({
      gfm: true, // 启用 GitHub Flavored Markdown
      breaks: true, // 支持换行符转换为 <br>
      pedantic: false,
    })

    // 自定义渲染器
    this.renderer = new marked.Renderer()

    // 自定义代码块渲染 (添加语言标签)
    this.renderer.code = (code: string, language: string | undefined) => {
      const lang = language || 'text'
      return `<pre><code class="language-${lang}">${this.escapeHtml(code)}</code></pre>`
    }

    // 自定义链接渲染 (添加 target="_blank" 用于外部链接)
    this.renderer.link = (href: string, title: string | null | undefined, text: string) => {
      const isExternal = href.startsWith('http://') || href.startsWith('https://')
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''
      const titleAttr = title ? ` title="${title}"` : ''
      return `<a href="${href}"${titleAttr}${target}>${text}</a>`
    }

    // 自定义表格渲染 (添加 GitHub 样式类)
    this.renderer.table = (header: string, body: string) => {
      return `<table class="markdown-table">
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>`
    }

    // 自定义列表项渲染 (支持任务列表)
    this.renderer.listitem = (text: string, task: boolean, checked: boolean) => {
      if (task) {
        const checkbox = checked
          ? '<input type="checkbox" checked disabled class="task-list-item-checkbox">'
          : '<input type="checkbox" disabled class="task-list-item-checkbox">'
        return `<li class="task-list-item">${checkbox} ${text}</li>`
      }
      return `<li>${text}</li>`
    }

    // 自定义列表渲染 (添加任务列表类)
    this.renderer.list = (body: string, ordered: boolean, start: number) => {
      const type = ordered ? 'ol' : 'ul'
      const startAttr = ordered && start !== 1 ? ` start="${start}"` : ''
      const hasTaskList = body.includes('task-list-item')
      const taskListClass = hasTaskList ? ' class="task-list"' : ''
      return `<${type}${startAttr}${taskListClass}>${body}</${type}>`
    }
  }

  /**
   * 渲染 Markdown 为 HTML
   */
  static render(markdown: string): string {
    if (!this.renderer) {
      this.initialize()
    }

    try {
      return marked(markdown, { renderer: this.renderer })
    } catch (error) {
      console.error('Markdown 渲染失败:', error)
      return `<pre>渲染错误: ${error instanceof Error ? error.message : String(error)}</pre>`
    }
  }

  /**
   * 转义 HTML 特殊字符
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (char) => map[char])
  }

  /**
   * 提取 Markdown 中的标题 (用于生成目录)
   */
  static extractHeadings(markdown: string): Array<{
    level: number
    text: string
    slug: string
  }> {
    const headings: Array<{ level: number; text: string; slug: string }> = []
    const lines = markdown.split('\n')

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const text = match[2].trim()
        const slug = text
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
          .replace(/^-+|-+$/g, '')

        headings.push({ level, text, slug })
      }
    }

    return headings
  }

  /**
   * 计算文档行数
   */
  static getLineCount(content: string): number {
    return content.split('\n').length
  }
}
