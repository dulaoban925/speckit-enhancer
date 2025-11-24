import React from 'react'
import { Comment, CommentStatus } from '../../types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface CommentItemProps {
  comment: Comment
  onReply?: (commentId: string) => void
  onEdit?: (commentId: string) => void
  onDelete?: (commentId: string) => void
  onResolve?: (commentId: string) => void
  onReopen?: (commentId: string) => void
  isReply?: boolean
}

/**
 * 评论项组件
 * 显示单个评论的内容、作者、时间、状态和操作按钮
 */
export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onReopen,
  isReply = false,
}) => {
  const getStatusBadge = (status: CommentStatus) => {
    switch (status) {
      case CommentStatus.Open:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            进行中
          </span>
        )
      case CommentStatus.Resolved:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            已解决
          </span>
        )
      case CommentStatus.Archived:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            已归档
          </span>
        )
    }
  }

  const formatTime = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: zhCN,
      })
    } catch {
      return '未知时间'
    }
  }

  return (
    <div
      className={`
        ${isReply ? 'ml-8 mt-2' : 'mt-4'}
        p-4
        rounded-lg
        border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800
        hover:border-gray-300 dark:hover:border-gray-600
        transition-colors
      `}
    >
      {/* 评论头部: 作者、时间、状态 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {/* 作者头像 (使用首字母) */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
            {comment.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {comment.author}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {formatTime(comment.createdAt)}
            </span>
          </div>
        </div>
        {getStatusBadge(comment.status)}
      </div>

      {/* 锚点位置信息 */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        📍 第 {comment.anchor.startLine}
        {comment.anchor.endLine !== comment.anchor.startLine &&
          `-${comment.anchor.endLine}`}{' '}
        行
      </div>

      {/* 引用的文本片段 */}
      {comment.anchor.textFragment && (
        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 dark:text-gray-300 italic line-clamp-2">
            "{comment.anchor.textFragment}"
          </p>
        </div>
      )}

      {/* 评论内容 */}
      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
        {comment.content}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        {!isReply && onReply && (
          <button
            onClick={() => onReply(comment.id)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            💬 回复
          </button>
        )}

        {comment.status === CommentStatus.Open && onResolve && (
          <button
            onClick={() => onResolve(comment.id)}
            className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium"
          >
            ✓ 标记为已解决
          </button>
        )}

        {comment.status === CommentStatus.Resolved && onReopen && (
          <button
            onClick={() => onReopen(comment.id)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            ↺ 重新打开
          </button>
        )}

        {onEdit && (
          <button
            onClick={() => onEdit(comment.id)}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-medium"
          >
            ✏️ 编辑
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(comment.id)}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
          >
            🗑️ 删除
          </button>
        )}
      </div>

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {comment.replies.length} 条回复
          </div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply={true}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onResolve={onResolve}
              onReopen={onReopen}
            />
          ))}
        </div>
      )}
    </div>
  )
}
