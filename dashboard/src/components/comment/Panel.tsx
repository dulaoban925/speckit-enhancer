import React, { useState, useMemo } from 'react'
import { Comment, CommentStatus } from '../../types'
import { CommentItem } from './Item'
import { CommentForm } from './Form'

interface CommentPanelProps {
  isOpen: boolean
  onClose: () => void
  comments: Comment[]
  onAddComment?: (content: string, parentId?: string) => void | Promise<void>
  onEditComment?: (commentId: string, content: string) => void | Promise<void>
  onDeleteComment?: (commentId: string) => void | Promise<void>
  onResolveComment?: (commentId: string) => void | Promise<void>
  onReopenComment?: (commentId: string) => void | Promise<void>
  isLoading?: boolean
  documentName?: string
}

type FilterStatus = 'all' | CommentStatus

/**
 * 评论面板组件
 * 侧边栏滑出面板,显示文档的所有评论
 */
export const CommentPanel: React.FC<CommentPanelProps> = ({
  isOpen,
  onClose,
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onResolveComment,
  onReopenComment,
  isLoading = false,
  documentName,
}) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showNewCommentForm, setShowNewCommentForm] = useState(false)

  // 过滤评论
  const filteredComments = useMemo(() => {
    if (filterStatus === 'all') {
      return comments
    }
    return comments.filter((c) => c.status === filterStatus)
  }, [comments, filterStatus])

  // 统计信息
  const stats = useMemo(() => {
    return {
      total: comments.length,
      open: comments.filter((c) => c.status === CommentStatus.Open).length,
      resolved: comments.filter((c) => c.status === CommentStatus.Resolved).length,
      archived: comments.filter((c) => c.status === CommentStatus.Archived).length,
    }
  }, [comments])

  const handleAddComment = async (content: string) => {
    if (onAddComment) {
      await onAddComment(content)
      setShowNewCommentForm(false)
    }
  }

  const handleReply = async (content: string, parentId: string) => {
    if (onAddComment) {
      await onAddComment(content, parentId)
      setReplyingTo(null)
    }
  }

  const handleResolve = async (commentId: string) => {
    if (onResolveComment) {
      await onResolveComment(commentId)
    }
  }

  const handleReopen = async (commentId: string) => {
    if (onReopenComment) {
      await onReopenComment(commentId)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (window.confirm('确定要删除这条评论吗?此操作无法撤销。')) {
      if (onDeleteComment) {
        await onDeleteComment(commentId)
      }
    }
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

      {/* 评论面板 */}
      <div
        className="
          fixed right-0 top-0 h-full w-full md:w-[480px]
          bg-white dark:bg-gray-900
          shadow-2xl
          z-50
          flex flex-col
          animate-slide-in-right
        "
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              💬 评论
            </h2>
            {documentName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {documentName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 过滤器和统计 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`
                p-2 rounded-lg text-center transition-colors
                ${filterStatus === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="text-lg font-bold">{stats.total}</div>
              <div className="text-xs">全部</div>
            </button>
            <button
              onClick={() => setFilterStatus(CommentStatus.Open)}
              className={`
                p-2 rounded-lg text-center transition-colors
                ${filterStatus === CommentStatus.Open
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="text-lg font-bold">{stats.open}</div>
              <div className="text-xs">进行中</div>
            </button>
            <button
              onClick={() => setFilterStatus(CommentStatus.Resolved)}
              className={`
                p-2 rounded-lg text-center transition-colors
                ${filterStatus === CommentStatus.Resolved
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="text-lg font-bold">{stats.resolved}</div>
              <div className="text-xs">已解决</div>
            </button>
            <button
              onClick={() => setFilterStatus(CommentStatus.Archived)}
              className={`
                p-2 rounded-lg text-center transition-colors
                ${filterStatus === CommentStatus.Archived
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="text-lg font-bold">{stats.archived}</div>
              <div className="text-xs">已归档</div>
            </button>
          </div>

          {/* 新建评论按钮 */}
          {onAddComment && !showNewCommentForm && (
            <button
              onClick={() => setShowNewCommentForm(true)}
              className="
                w-full py-2 px-4
                bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600
                text-white font-medium
                rounded-lg
                transition-colors
              "
            >
              ➕ 新建评论
            </button>
          )}
        </div>

        {/* 评论列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* 新评论表单 */}
          {showNewCommentForm && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                新建评论
              </h3>
              <CommentForm
                onSubmit={handleAddComment}
                onCancel={() => setShowNewCommentForm(false)}
                placeholder="请先选择文档中的文本,然后输入评论内容..."
                submitLabel="发布评论"
                isLoading={isLoading}
              />
            </div>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
            </div>
          )}

          {/* 空状态 */}
          {!isLoading && filteredComments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {filterStatus === 'all' ? '还没有评论' : `没有${filterStatus === CommentStatus.Open ? '进行中' : filterStatus === CommentStatus.Resolved ? '已解决' : '已归档'}的评论`}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                选择文档中的文本来添加第一条评论
              </p>
            </div>
          )}

          {/* 评论列表 */}
          {!isLoading && filteredComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                onReply={(commentId) => setReplyingTo(commentId)}
                onDelete={handleDelete}
                onResolve={handleResolve}
                onReopen={handleReopen}
              />

              {/* 回复表单 */}
              {replyingTo === comment.id && (
                <div className="ml-8 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    回复 {comment.author}
                  </h4>
                  <CommentForm
                    onSubmit={(content) => handleReply(content, comment.id)}
                    onCancel={() => setReplyingTo(null)}
                    placeholder="输入回复内容..."
                    submitLabel="发布回复"
                    isReply={true}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
