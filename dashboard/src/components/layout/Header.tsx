import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'

const Header: React.FC = () => {
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

      <div className="flex items-center gap-2">
        <span className="text-sm text-gh-fg-muted">
          {project?.features.length || 0} 个特性
        </span>
      </div>
    </header>
  )
}

export default Header
