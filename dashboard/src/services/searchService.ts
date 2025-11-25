import Fuse from 'fuse.js'
import type { DocumentFile } from '../types'

/**
 * 搜索结果项
 */
export interface SearchResult {
  /** 文档文件信息 */
  document: DocumentFile
  /** 匹配的文本片段 */
  matches: SearchMatch[]
  /** 总匹配数 */
  matchCount: number
  /** 相关性评分 (0-1，越小越相关) */
  score: number
  /** 是否完全匹配 */
  isExactMatch: boolean
}

/**
 * 搜索匹配项
 */
export interface SearchMatch {
  /** 匹配的行号（从 1 开始） */
  lineNumber: number
  /** 匹配的文本内容（包含上下文） */
  text: string
  /** 高亮的起始位置（相对于 text） */
  highlightStart: number
  /** 高亮的结束位置（相对于 text） */
  highlightEnd: number
}

/**
 * Fuse.js 匹配结果
 */
interface FuseMatch {
  indices: [number, number][]
  value?: string
  key?: string
  refIndex?: number
}

/**
 * 搜索服务
 * 基于 Fuse.js 实现模糊搜索和智能匹配
 */
export class SearchService {
  private static fuse: Fuse<DocumentFile> | null = null
  private static documents: DocumentFile[] = []

  /**
   * 初始化或更新搜索索引
   * @param documents - 文档列表
   */
  static initializeIndex(documents: DocumentFile[]): void {
    this.documents = documents

    // 配置 Fuse.js - 精准匹配模式（使用 Extended Search）
    this.fuse = new Fuse(documents, {
      keys: [
        { name: 'relativePath', weight: 0.2 },
        { name: 'name', weight: 0.3 },
        { name: 'content', weight: 0.5 },
      ],
      includeScore: true,
      includeMatches: true,
      threshold: 0.0, // 完全精准匹配
      minMatchCharLength: 1,
      ignoreLocation: true, // 忽略匹配位置，搜索整个文档
      useExtendedSearch: true, // 启用扩展搜索，支持精确匹配操作符
      isCaseSensitive: false, // 保持大小写不敏感
    })

    console.log(`[SearchService] 索引已建立，包含 ${documents.length} 个文档`)
  }

  /**
   * 搜索文档
   * @param query - 搜索关键词
   * @param maxResults - 最大返回结果数，默认 20
   * @returns 搜索结果列表
   */
  static search(query: string, maxResults: number = 20): SearchResult[] {
    if (!query.trim()) {
      return []
    }

    if (!this.fuse) {
      console.warn('[SearchService] 索引未初始化，无法搜索')
      return []
    }

    // 使用 Extended Search 的精确匹配操作符 'term
    // 这会进行包含匹配（类似 String.includes()）
    const extendedQuery = `'${query.trim()}`

    // 使用 Fuse.js 搜索（获取更多结果用于排序）
    const fuseResults = this.fuse.search(extendedQuery, { limit: maxResults * 2 })

    // 转换为自定义格式并检测完全匹配
    const queryLower = query.toLowerCase()
    const results: SearchResult[] = fuseResults.map((result) => {
      const document = result.item
      const matches = this.extractMatches(document, result.matches || [], query)

      // 检测是否完全匹配（忽略大小写）
      const isExactMatch = this.isExactMatch(document, queryLower)

      return {
        document,
        matches,
        matchCount: matches.length,
        score: result.score || 0,
        isExactMatch,
      }
    })

    // 排序：完全匹配优先，然后按 score 排序
    results.sort((a, b) => {
      // 完全匹配的排在前面
      if (a.isExactMatch && !b.isExactMatch) return -1
      if (!a.isExactMatch && b.isExactMatch) return 1

      // 都是完全匹配或都不是，按 score 排序（score 越小越相关）
      return a.score - b.score
    })

    // 限制返回结果数量
    const limitedResults = results.slice(0, maxResults)

    console.log(
      `[SearchService] 搜索 "${query}" 找到 ${limitedResults.length} 个结果（完全匹配: ${limitedResults.filter((r) => r.isExactMatch).length}）`
    )
    return limitedResults
  }

  /**
   * 检测是否完全匹配
   */
  private static isExactMatch(document: DocumentFile, queryLower: string): boolean {
    const name = document.name?.toLowerCase() || ''
    const relativePath = document.relativePath?.toLowerCase() || ''
    const content = document.content?.toLowerCase() || ''

    // 检查文件名或路径中是否包含完全匹配的词
    if (name.includes(queryLower) || relativePath.includes(queryLower)) {
      return true
    }

    // 检查内容中是否有完全匹配的词（作为独立单词）
    const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(queryLower)}\\b`, 'i')
    if (wordBoundaryRegex.test(content)) {
      return true
    }

    return false
  }

  /**
   * 转义正则表达式特殊字符
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * 从 Fuse.js 匹配结果中提取行级匹配信息
   */
  private static extractMatches(
    document: DocumentFile,
    fuseMatches: readonly FuseMatch[],
    query: string
  ): SearchMatch[] {
    const matches: SearchMatch[] = []
    const content = document.content || ''
    const lines = content.split('\n')

    // 找到所有在 content 中的匹配
    const contentMatches = fuseMatches.filter((m) => m.key === 'content')

    if (contentMatches.length === 0) {
      // 如果没有内容匹配，但文件名匹配了，返回前几行作为预览
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const text = lines[i]
        if (text.trim()) {
          matches.push({
            lineNumber: i + 1,
            text: text.trim(),
            highlightStart: 0,
            highlightEnd: 0,
          })
        }
      }
      return matches.slice(0, 5)
    }

    // 处理内容匹配
    const matchedLines = new Set<number>()

    for (const match of contentMatches) {
      if (!match.indices || !match.value) continue

      // 对于每个匹配范围
      for (const [start, end] of match.indices) {
        const beforeMatch = content.substring(0, start)
        const lineNumber = beforeMatch.split('\n').length

        // 避免重复添加同一行
        if (matchedLines.has(lineNumber)) continue
        matchedLines.add(lineNumber)

        if (lineNumber > 0 && lineNumber <= lines.length) {
          const lineText = lines[lineNumber - 1]
          const lineStartIndex = beforeMatch.lastIndexOf('\n') + 1
          const matchStartInLine = start - lineStartIndex
          const matchEndInLine = Math.min(end - lineStartIndex + 1, lineText.length)

          matches.push({
            lineNumber,
            text: lineText.trim(),
            highlightStart: Math.max(0, matchStartInLine),
            highlightEnd: Math.max(0, matchEndInLine),
          })
        }

        // 最多返回 5 个匹配
        if (matches.length >= 5) break
      }

      if (matches.length >= 5) break
    }

    return matches
  }

  /**
   * 清除索引
   */
  static clearIndex(): void {
    this.fuse = null
    this.documents = []
    console.log('[SearchService] 索引已清除')
  }

  /**
   * 获取统计信息
   */
  static getStats() {
    return {
      documentCount: this.documents.length,
      isIndexed: this.fuse !== null,
    }
  }

  /**
   * 高亮匹配文本
   * @param text - 原始文本
   * @param highlightStart - 高亮起始位置
   * @param highlightEnd - 高亮结束位置
   * @returns 包含高亮标记的文本片段
   */
  static highlightMatch(text: string, highlightStart: number, highlightEnd: number): {
    before: string
    match: string
    after: string
  } {
    return {
      before: text.substring(0, highlightStart),
      match: text.substring(highlightStart, highlightEnd),
      after: text.substring(highlightEnd),
    }
  }
}
