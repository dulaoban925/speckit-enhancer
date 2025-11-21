import React from 'react'
import type { DocumentNode } from '../../types'

interface DocumentListProps {
  nodes: DocumentNode[]
  onDocumentClick: (documentPath: string) => void
  activeDocumentPath?: string
}

const DocumentList: React.FC<DocumentListProps> = ({
  nodes,
  onDocumentClick,
  activeDocumentPath,
}) => {
  return (
    <div className="space-y-4">
      {nodes.map((node) => (
        <div key={node.name} className="space-y-2">
          {/* 节点标题 */}
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-lg">{node.icon}</span>
            <span className="text-sm font-semibold text-gh-fg-default">
              {node.displayName}
            </span>
            <span className="text-xs text-gh-fg-muted">
              ({node.documents.length})
            </span>
          </div>

          {/* 文档列表 */}
          <div className="pl-4 space-y-1">
            {node.documents.map((doc) => {
              const isActive = doc.path === activeDocumentPath || doc.relativePath === activeDocumentPath

              return (
                <button
                  key={doc.path}
                  onClick={() => onDocumentClick(doc.relativePath)}
                  className={`
                    w-full text-left px-3 py-2 rounded-md text-sm
                    transition-colors
                    ${
                      isActive
                        ? 'bg-gh-accent-emphasis text-white'
                        : 'text-gh-fg-default hover:bg-gh-canvas-subtle'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{doc.displayName}</span>
                    {doc.isDirectory && (
                      <svg
                        className="w-4 h-4 flex-shrink-0"
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
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default DocumentList
