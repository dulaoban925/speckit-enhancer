import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../store'
import { CLIService } from '../services/cliService'
import type { DocumentFile } from '../types'

/**
 * 文档缓存 (简单的 LRU 缓存)
 */
const documentCache = new Map<string, DocumentFile>()
const MAX_CACHE_SIZE = 10

function addToCache(path: string, document: DocumentFile) {
  // 如果缓存已满,删除最早的条目
  if (documentCache.size >= MAX_CACHE_SIZE) {
    const firstKey = documentCache.keys().next().value
    if (firstKey) {
      documentCache.delete(firstKey)
    }
  }
  documentCache.set(path, document)
}

function getFromCache(path: string): DocumentFile | undefined {
  return documentCache.get(path)
}

/**
 * 文档加载 Hook
 * 负责加载和缓存文档内容
 */
export function useDocument(filePath: string | undefined) {
  const [document, setDocument] = useState<DocumentFile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setCurrentDocument } = useAppStore()

  const loadDocument = useCallback(async (path: string) => {
    try {
      setLoading(true)
      setError(null)

      // 检查缓存
      const cached = getFromCache(path)
      if (cached) {
        setDocument(cached)
        setCurrentDocument(cached)
        setLoading(false)
        return
      }

      // 调用 CLI read 命令
      const response = await CLIService.readDocument(path)

      if (response.success && response.data) {
        setDocument(response.data)
        setCurrentDocument(response.data)
        addToCache(path, response.data)
      } else {
        setError(response.error?.message || '加载文档失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [setCurrentDocument])

  useEffect(() => {
    if (filePath) {
      loadDocument(filePath)
    } else {
      setDocument(null)
      setCurrentDocument(null)
    }
  }, [filePath, loadDocument, setCurrentDocument])

  const refreshDocument = useCallback(async () => {
    if (filePath) {
      // 清除缓存并重新加载
      documentCache.delete(filePath)
      await loadDocument(filePath)
    }
  }, [filePath, loadDocument])

  const updateMetadata = useCallback((metadata: Partial<DocumentFile['metadata']>) => {
    if (document) {
      const updated = {
        ...document,
        metadata: {
          ...document.metadata,
          ...metadata,
        },
      }
      setDocument(updated)
      setCurrentDocument(updated)
      if (filePath) {
        addToCache(filePath, updated)
      }
    }
  }, [document, filePath, setCurrentDocument])

  const updateDocument = useCallback((updates: Partial<DocumentFile>) => {
    if (document) {
      const updated = {
        ...document,
        ...updates,
        metadata: updates.metadata ? {
          ...document.metadata,
          ...updates.metadata,
        } : document.metadata,
      }
      setDocument(updated)
      setCurrentDocument(updated)
      if (filePath) {
        addToCache(filePath, updated)
      }
    }
  }, [document, filePath, setCurrentDocument])

  return {
    document,
    loading,
    error,
    refreshDocument,
    updateMetadata,
    updateDocument,
  }
}
