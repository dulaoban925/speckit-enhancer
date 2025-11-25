import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { Search } from '../common/Search'
import KeyboardShortcutsHelp from '../common/KeyboardShortcutsHelp'
import { useSearch } from '../../hooks/useSearch'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useAppStore } from '../../store'
import { CLIService } from '../../services/cliService'
import type { DocumentFile } from '../../types'

interface LayoutProps {
  children: React.ReactNode
  /** 是否显示侧边栏 */
  showSidebar?: boolean
  /** 是否启用搜索功能 */
  enableSearch?: boolean
}

/**
 * 布局组件
 * 提供统一的页面布局结构，包含 Header、Sidebar 和搜索功能
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  showSidebar = true,
  enableSearch = true,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [documentsWithContent, setDocumentsWithContent] = useState<DocumentFile[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const { project } = useAppStore()

  // 从 project 中提取所有文档元数据
  const documentsMeta = useMemo(() => {
    if (!project) return []

    const docs: DocumentFile[] = []

    // 添加宪章文档
    if (project.constitution) {
      docs.push(project.constitution)
    }

    // 遍历所有特性的所有节点的所有文档
    project.features.forEach((feature) => {
      feature.nodes.forEach((node) => {
        docs.push(...node.documents)
      })
    })

    return docs
  }, [project])

  // 批量加载文档内容
  const loadDocumentsContent = useCallback(async () => {
    if (isLoadingDocuments || documentsWithContent.length > 0) return

    console.log('[Layout] 开始加载文档内容，文档数量:', documentsMeta.length)
    setIsLoadingDocuments(true)

    try {
      const loadedDocs: DocumentFile[] = []

      // 批量加载文档（限制并发数量为 5）
      const batchSize = 5
      for (let i = 0; i < documentsMeta.length; i += batchSize) {
        const batch = documentsMeta.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          batch.map((doc) => CLIService.readDocument(doc.relativePath))
        )

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success && result.value.data) {
            loadedDocs.push(result.value.data)
          } else {
            console.warn(
              '[Layout] 加载文档失败:',
              batch[index].relativePath,
              result.status === 'rejected' ? result.reason : result.value.error
            )
          }
        })
      }

      console.log('[Layout] 文档内容加载完成，成功加载:', loadedDocs.length)
      setDocumentsWithContent(loadedDocs)
    } catch (error) {
      console.error('[Layout] 加载文档内容失败:', error)
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [documentsMeta, isLoadingDocuments, documentsWithContent.length])

  // 使用搜索 Hook（使用已加载内容的文档）
  const { query, setQuery, results, isSearching, clearSearch } = useSearch(documentsWithContent)

  // 打开搜索
  const handleSearchOpen = useCallback(() => {
    setIsSearchOpen(true)
    // 第一次打开搜索时，加载所有文档内容
    if (documentsWithContent.length === 0 && !isLoadingDocuments) {
      loadDocumentsContent()
    }
  }, [documentsWithContent.length, isLoadingDocuments, loadDocumentsContent])

  // 关闭搜索
  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false)
    clearSearch()
  }, [clearSearch])

  // 全局键盘快捷键（Ctrl+F 打开搜索, Shift+? 打开帮助）
  useKeyboardShortcuts({
    enableSearch,
    onSearchOpen: handleSearchOpen,
    enableHelp: true,
    onHelpOpen: () => setIsHelpOpen(true),
  })

  // 键盘快捷键：Ctrl+K 或 Cmd+K 打开搜索
  useEffect(() => {
    if (!enableSearch) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        handleSearchOpen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableSearch, handleSearchOpen])

  return (
    <div className="min-h-screen bg-gh-canvas-default flex flex-col">
      <Header onSearchClick={enableSearch ? handleSearchOpen : undefined} />

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* 搜索组件 */}
      {enableSearch && (
        <Search
          query={query}
          onQueryChange={setQuery}
          results={results}
          isSearching={isSearching || isLoadingDocuments}
          isOpen={isSearchOpen}
          onClose={handleSearchClose}
        />
      )}

      {/* 键盘快捷键帮助 */}
      <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  )
}

export default Layout
