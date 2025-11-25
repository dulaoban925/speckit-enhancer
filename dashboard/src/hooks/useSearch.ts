import { useState, useEffect, useCallback, useRef } from 'react'
import { SearchService, type SearchResult } from '../services/searchService'
import type { DocumentFile } from '../types'

/**
 * 搜索 Hook 配置
 */
export interface UseSearchOptions {
  /** 防抖延迟（毫秒），默认 300 */
  debounceDelay?: number
  /** 最大返回结果数，默认 20 */
  maxResults?: number
}

/**
 * 搜索 Hook
 * 提供搜索功能，包含防抖、自动索引更新等
 */
export function useSearch(documents: DocumentFile[], options: UseSearchOptions = {}) {
  const { debounceDelay = 300, maxResults = 20 } = options

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const documentsRef = useRef<DocumentFile[]>([])

  // 文档变化时，更新索引
  useEffect(() => {
    if (documents.length === 0) {
      SearchService.clearIndex()
      documentsRef.current = []
      return
    }

    // 检查文档是否真的变化了（避免不必要的重建索引）
    const hasChanged =
      documents.length !== documentsRef.current.length ||
      documents.some((doc, idx) => doc.relativePath !== documentsRef.current[idx]?.relativePath)

    if (hasChanged) {
      console.log('[useSearch] 文档列表已变化，重建索引')
      SearchService.initializeIndex(documents)
      documentsRef.current = documents

      // 如果有查询，重新搜索
      if (query.trim()) {
        performSearch(query)
      }
    }
  }, [documents]) // eslint-disable-line react-hooks/exhaustive-deps

  // 执行搜索（不防抖）
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)

      try {
        const searchResults = SearchService.search(searchQuery, maxResults)
        setResults(searchResults)
      } catch (error) {
        console.error('[useSearch] 搜索失败:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [maxResults]
  )

  // 设置查询（带防抖）
  const handleSetQuery = useCallback(
    (newQuery: string) => {
      setQuery(newQuery)

      // 清除之前的定时器
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      if (!newQuery.trim()) {
        setResults([])
        setIsSearching(false)
        return
      }

      // 设置新的定时器
      setIsSearching(true)
      debounceTimer.current = setTimeout(() => {
        performSearch(newQuery)
      }, debounceDelay)
    },
    [debounceDelay, performSearch]
  )

  // 清除搜索
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setIsSearching(false)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
  }, [])

  // 获取统计信息
  const getStats = useCallback(() => {
    return {
      ...SearchService.getStats(),
      queryLength: query.length,
      resultCount: results.length,
      isSearching,
    }
  }, [query, results.length, isSearching])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return {
    query,
    setQuery: handleSetQuery,
    results,
    isSearching,
    clearSearch,
    getStats,
  }
}
