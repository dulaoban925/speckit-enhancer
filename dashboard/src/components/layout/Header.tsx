import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'

interface HeaderProps {
  /** 搜索按钮点击回调 */
  onSearchClick?: () => void
}

const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  const navigate = useNavigate()
  const { project, toggleSidebar, sidebarCollapsed } = useAppStore()

  const handleHomeClick = () => {
    navigate('/')
  }

  return (
    <header className="bg-gh-canvas-subtle border-b border-gh-border-default px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gh-canvas-default rounded-md transition-colors"
          aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          <svg
            className="w-5 h-5 text-gh-fg-default"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <button
          onClick={handleHomeClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <svg
            className="w-6 h-6 text-gh-accent-emphasis"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <h1 className="text-xl font-semibold text-gh-fg-default">
            {project?.name || 'Speckit Enhancer'}
          </h1>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* 搜索按钮 */}
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="
              flex items-center gap-2 px-3 py-1.5
              bg-gh-canvas-default border border-gh-border-default
              rounded-md
              text-gh-fg-muted hover:text-gh-fg-default
              hover:border-gh-border-emphasis
              transition-colors
            "
            title="搜索文档 (Ctrl+K)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-sm">搜索</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-gh-canvas-subtle border border-gh-border-default rounded">
              ⌘K
            </kbd>
          </button>
        )}

        <span className="text-sm text-gh-fg-muted">
          {project?.features.length || 0} 个特性
        </span>
      </div>
    </header>
  )
}

export default Header
