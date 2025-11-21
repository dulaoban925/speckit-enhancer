import { useState, useEffect, useCallback } from 'react'
import type { Comment, CommentStatus, CommentAnchor } from '../types'
import { CommentService } from '../services/commentService'

interface UseCommentsOptions {
  documentPath: string
  featureId: string
  projectRoot?: string
  autoLoad?: boolean
}

/**
 * 评论管理 Hook
 * 管理文档的所有评论,包括加载、添加、更新、删除等操作
 */
export function useComments(options: UseCommentsOptions) {
  const { documentPath, featureId, projectRoot, autoLoad = true } = options

  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 加载评论列表
   */
  const loadComments = useCallback(
    async (status?: CommentStatus) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await CommentService.listCommentsFromCLI({
          documentPath,
          featureId,
          status,
          projectRoot,
        })

        if (response.success && response.data) {
          setComments(response.data.comments)
        } else {
          setError(response.error?.message || '加载评论失败')
          setComments([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载评论失败')
        setComments([])
      } finally {
        setIsLoading(false)
      }
    },
    [documentPath, featureId, projectRoot]
  )

  /**
   * 添加新评论
   */
  const addComment = useCallback(
    async (params: { content: string; author: string; anchor: CommentAnchor; parentId?: string }) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await CommentService.addCommentToCLI({
          documentPath,
          featureId,
          content: params.content,
          author: params.author,
          anchor: params.anchor,
          parentId: params.parentId,
          projectRoot,
        })

        if (response.success && response.data) {
          // 重新加载评论列表
          await loadComments()
          return response.data.comment
        } else {
          setError(response.error?.message || '添加评论失败')
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '添加评论失败')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [documentPath, featureId, projectRoot, loadComments]
  )

  /**
   * 更新评论
   */
  const updateComment = useCallback(
    async (commentId: string, params: { content?: string; status?: CommentStatus }) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await CommentService.updateCommentInCLI({
          documentPath,
          featureId,
          commentId,
          content: params.content,
          status: params.status,
          projectRoot,
        })

        if (response.success && response.data) {
          // 重新加载评论列表
          await loadComments()
          return response.data.comment
        } else {
          setError(response.error?.message || '更新评论失败')
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新评论失败')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [documentPath, featureId, projectRoot, loadComments]
  )

  /**
   * 删除评论
   */
  const deleteComment = useCallback(
    async (commentId: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await CommentService.deleteCommentFromCLI({
          documentPath,
          featureId,
          commentId,
          projectRoot,
        })

        if (response.success) {
          // 重新加载评论列表
          await loadComments()
          return true
        } else {
          setError(response.error?.message || '删除评论失败')
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '删除评论失败')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [documentPath, featureId, projectRoot, loadComments]
  )

  /**
   * 标记评论为已解决
   */
  const resolveComment = useCallback(
    async (commentId: string) => {
      return await updateComment(commentId, { status: CommentStatus.Resolved })
    },
    [updateComment]
  )

  /**
   * 重新打开已解决的评论
   */
  const reopenComment = useCallback(
    async (commentId: string) => {
      return await updateComment(commentId, { status: CommentStatus.Open })
    },
    [updateComment]
  )

  /**
   * 归档评论
   */
  const archiveComment = useCallback(
    async (commentId: string) => {
      return await updateComment(commentId, { status: CommentStatus.Archived })
    },
    [updateComment]
  )

  /**
   * 根据行号查找评论
   */
  const findCommentsByLine = useCallback(
    (lineNumber: number): Comment[] => {
      return comments.filter(
        (comment) =>
          lineNumber >= comment.anchor.startLine && lineNumber <= comment.anchor.endLine
      )
    },
    [comments]
  )

  /**
   * 获取评论统计信息
   */
  const getStats = useCallback(() => {
    const flatComments = [...comments]
    comments.forEach((c) => {
      if (c.replies) {
        flatComments.push(...c.replies)
      }
    })

    return {
      total: comments.length,
      totalWithReplies: flatComments.length,
      open: comments.filter((c) => c.status === CommentStatus.Open).length,
      resolved: comments.filter((c) => c.status === CommentStatus.Resolved).length,
      archived: comments.filter((c) => c.status === CommentStatus.Archived).length,
    }
  }, [comments])

  // 自动加载评论
  useEffect(() => {
    if (autoLoad) {
      loadComments()
    }
  }, [autoLoad, loadComments])

  return {
    comments,
    isLoading,
    error,
    loadComments,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    reopenComment,
    archiveComment,
    findCommentsByLine,
    getStats,
  }
}
