import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SearchResult } from '../../services/searchService'
import { SearchService } from '../../services/searchService'
import { useDeferredLoading } from '../../hooks/useDeferredLoading'
import { Spinner } from './Loading'

interface SearchProps {
  /** 搜索查询 */
  query: string
  /** 查询变化回调 */
  onQueryChange: (query: string) => void
  /** 搜索结果 */
  results: SearchResult[]
  /** 是否正在搜索 */
  isSearching: boolean
  /** 是否显示搜索框 */
  isOpen: boolean
  /** 关闭搜索回调 */
  onClose: () => void
  /** 自定义类名 */
  className?: string
}

/**
 * 搜索组件
 * 提供全局搜索功能，包含搜索框和结果列表
 */
export const Search: React.FC<SearchProps> = ({
  query,
  onQueryChange,
  results,
  isSearching,
  isOpen,
  onClose,
  className = '',
}) => {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const deferredSearching = useDeferredLoading(isSearching, { delay: 150, minDuration: 250 })

  // 当搜索框打开时，自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // 当结果变化时，重置选中索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, getTotalItems() - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelectItem(selectedIndex)
    }
  }

  // 获取总项目数（文档数 + 匹配数）
  const getTotalItems = (): number => {
    return results.reduce((sum, result) => sum + 1 + result.matches.length, 0)
  }

  // 处理选择项目
  const handleSelectItem = (index: number) => {
    let currentIndex = 0

    for (const result of results) {
      // 文档本身
      if (currentIndex === index) {
        navigateToDocument(result.document.relativePath)
        return
      }
      currentIndex++

      // 文档的匹配项
      for (const match of result.matches) {
        if (currentIndex === index) {
          // 提取实际匹配的文本（不是整行）
          const { match: matchText } = SearchService.highlightMatch(
            match.text,
            match.highlightStart,
            match.highlightEnd
          )
          navigateToDocument(result.document.relativePath, match.lineNumber, matchText)
          return
        }
        currentIndex++
      }
    }
  }

  // 导航到文档
  const navigateToDocument = (path: string, lineNumber?: number, matchText?: string) => {
    const encodedPath = encodeURIComponent(path)
    let url = `/document/${encodedPath}`

    if (lineNumber) {
      url += `#L${lineNumber}`
      // 如果有匹配文本，添加到 hash 中
      if (matchText) {
        const encodedText = encodeURIComponent(matchText.trim())
        url += `:text=${encodedText}`
      }
    }

    navigate(url)
    onClose()
  }

  // 渲染搜索结果项
  const renderResults = () => {
    if (deferredSearching) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )
    }

    if (!query.trim()) {
      return (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p>输入关键词开始搜索</p>
        </div>
      )
    }

    if (results.length === 0) {
      return (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>未找到匹配的结果</p>
          <p className="text-sm mt-1">试试其他关键词</p>
        </div>
      )
    }

    let currentIndex = 0

    return (
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {results.map((result) => {
          const documentIndex = currentIndex++
          const matchIndices = result.matches.map(() => currentIndex++)

          return (
            <div key={result.document.relativePath} className="p-4">
              {/* 文档标题 */}
              <button
                onClick={() => navigateToDocument(result.document.relativePath)}
                className={`
                  w-full text-left p-2 rounded-lg transition-colors
                  ${
                    documentIndex === selectedIndex
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {result.document.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {result.document.relativePath}
                    </p>
                  </div>
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {result.matchCount} 处匹配
                  </span>
                </div>
              </button>

              {/* 匹配项列表 */}
              {result.matches.length > 0 && (
                <div className="mt-2 space-y-1 ml-4">
                  {result.matches.map((match, matchIdx) => {
                    const { before, match: matchText, after } = SearchService.highlightMatch(
                      match.text,
                      match.highlightStart,
                      match.highlightEnd
                    )

                    return (
                      <button
                        key={matchIdx}
                        onClick={() => navigateToDocument(result.document.relativePath, match.lineNumber, matchText)}
                        className={`
                          w-full text-left p-2 rounded-lg transition-colors text-sm
                          ${
                            matchIndices[matchIdx] === selectedIndex
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }
                        `}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                            L{match.lineNumber}
                          </span>
                          <p className="text-xs text-gray-600 dark:text-gray-300 flex-1 line-clamp-2">
                            {before}
                            <mark className="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded">
                              {matchText}
                            </mark>
                            {after}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 搜索框 */}
      <div
        className={`
          fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl
          bg-white dark:bg-gray-900 rounded-lg shadow-2xl
          z-50 max-h-[80vh] flex flex-col
          ${className}
        `}
        onKeyDown={handleKeyDown}
      >
        {/* 输入框 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="搜索文档内容..."
              className="
                w-full pl-10 pr-4 py-3
                bg-gray-50 dark:bg-gray-800
                border border-gray-300 dark:border-gray-600
                rounded-lg
                text-gray-900 dark:text-gray-100
                placeholder-gray-500 dark:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
              "
            />
            {query && (
              <button
                onClick={() => onQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {query && results.length > 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              找到 {results.length} 个文档，共 {results.reduce((sum, r) => sum + r.matchCount, 0)} 处匹配
            </p>
          )}
        </div>

        {/* 结果列表 */}
        <div className="overflow-y-auto flex-1">{renderResults()}</div>

        {/* 快捷键提示 */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
                ↑↓
              </kbd>{' '}
              导航
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
                Enter
              </kbd>{' '}
              选择
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
                Esc
              </kbd>{' '}
              关闭
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
