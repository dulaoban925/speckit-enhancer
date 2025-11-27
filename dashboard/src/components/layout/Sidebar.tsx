import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import DocumentList from '../document/DocumentList'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const { project, sidebarCollapsed, currentDocument, expandedFeatures, toggleFeatureExpansion } = useAppStore()

  if (sidebarCollapsed) {
    return null
  }

  const handleDocumentClick = (documentPath: string) => {
    navigate(`/document/${encodeURIComponent(documentPath)}`)
  }

  return (
    <aside className="w-64 h-full bg-gh-canvas-default border-r border-gh-border-default flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gh-fg-default mb-4">项目文档</h2>

        {/* 宪章 */}
        {project?.constitution && (
          <div className="mb-4">
            <button
              onClick={() => handleDocumentClick(project.constitution!.relativePath)}
              className={`
                w-full text-left px-3 py-2 rounded-md text-sm
                transition-colors flex items-center gap-2
                ${
                  currentDocument?.relativePath === project.constitution.relativePath
                    ? 'bg-gh-accent-emphasis text-white'
                    : 'text-gh-fg-default hover:bg-gh-canvas-subtle'
                }
              `}
            >
              <span className="text-lg">📜</span>
              <span className="font-semibold">宪章</span>
            </button>
          </div>
        )}

        {/* 特性列表 */}
        {project?.features && project.features.length > 0 ? (
          <div className="space-y-2">
            {project.features.map((feature) => {
              const isExpanded = expandedFeatures.has(feature.id)

              return (
                <div key={feature.id} className="space-y-1">
                  {/* 特性标题 */}
                  <button
                    onClick={() => toggleFeatureExpansion(feature.id)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gh-canvas-subtle rounded-md transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-mono text-gh-fg-muted bg-gh-canvas-subtle px-2 py-1 rounded flex-shrink-0">
                        #{feature.id}
                      </span>
                      <span className="text-sm text-gh-fg-default font-semibold truncate">
                        {feature.displayName}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gh-fg-muted transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {/* 文档节点 */}
                  {isExpanded && feature.nodes && (
                    <div className="pl-2">
                      <DocumentList
                        nodes={feature.nodes}
                        onDocumentClick={handleDocumentClick}
                        activeDocumentPath={currentDocument?.relativePath}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gh-fg-muted text-sm">暂无特性</p>
        )}
      </div>
      </div>
    </aside>
  )
}

export default Sidebar
