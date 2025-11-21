import React, { useState } from 'react'
import { Button } from '../common/Button'

interface CommentFormProps {
  onSubmit: (content: string) => void | Promise<void>
  onCancel?: () => void
  initialContent?: string
  placeholder?: string
  submitLabel?: string
  isReply?: boolean
  isLoading?: boolean
}

/**
 * 评论表单组件
 * 用于创建新评论或回复现有评论
 */
export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  initialContent = '',
  placeholder = '输入您的评论...',
  submitLabel = '提交评论',
  isReply = false,
  isLoading = false,
}) => {
  const [content, setContent] = useState(initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('') // 清空输入框
    } catch (error) {
      console.error('提交评论失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setContent(initialContent)
    onCancel?.()
  }

  const isDisabled = isSubmitting || isLoading || !content.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 文本输入区 */}
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={isReply ? 3 : 4}
          disabled={isLoading}
          className="
            w-full
            px-3 py-2
            text-sm
            border border-gray-300 dark:border-gray-600
            rounded-lg
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500 dark:focus:ring-blue-400
            focus:border-transparent
            disabled:opacity-50
            disabled:cursor-not-allowed
            resize-none
          "
        />

        {/* 字符计数 */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {content.length} 字符
          </span>

          {/* 提示信息 */}
          {content.trim() && content.length < 10 && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              建议至少输入 10 个字符
            </span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            onClick={handleCancel}
            variant="secondary"
            size="sm"
            disabled={isSubmitting || isLoading}
          >
            取消
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isDisabled}
          isLoading={isSubmitting}
        >
          {isSubmitting ? '提交中...' : submitLabel}
        </Button>
      </div>

      {/* 键盘快捷键提示 */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        💡 提示: 按 <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Enter</kbd> 快速提交
      </div>
    </form>
  )
}
