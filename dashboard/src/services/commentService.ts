import type { Comment, CommentAnchor, CommentStatus, CLIResponse } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { CLIService } from './cliService'

/**
 * 评论服务
 * 负责评论的创建、更新、删除、CLI 交互和锚定位置计算
 */
export class CommentService {
  /**
   * 通过 CLI 添加评论到文件系统
   */
  static async addCommentToCLI(params: {
    documentPath: string
    featureId: string
    content: string
    author: string
    anchor: CommentAnchor
    parentId?: string
    projectRoot?: string
  }): Promise<CLIResponse<{ comment: Comment }>> {
    try {
      console.log('[CommentService] 添加评论到 CLI, params:', params)

      const args: Record<string, unknown> = {
        action: 'add',
        documentPath: params.documentPath,
        featureId: params.featureId,
        content: params.content,
        author: params.author,
        startLine: params.anchor.startLine,
        endLine: params.anchor.endLine,
        textFragment: params.anchor.textFragment,
      }

      if (params.anchor.contextBefore) {
        args.contextBefore = params.anchor.contextBefore
      }

      if (params.anchor.contextAfter) {
        args.contextAfter = params.anchor.contextAfter
      }

      if (params.parentId) {
        args.parentId = params.parentId
      }

      if (params.projectRoot) {
        args.projectRoot = params.projectRoot
      }

      console.log('[CommentService] CLI 命令参数:', args)

      const response = await CLIService.executeCommentCommand<{ comment: Comment }>(args)
      console.log('[CommentService] CLI 响应:', response)

      return response
    } catch (error) {
      console.error('[CommentService] CLI 调用失败:', error)
      return {
        success: false,
        error: {
          code: 'ADD_COMMENT_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  /**
   * 通过 CLI 列出文档的所有评论
   */
  static async listCommentsFromCLI(params: {
    documentPath: string
    featureId: string
    status?: CommentStatus
    projectRoot?: string
  }): Promise<CLIResponse<{ comments: Comment[]; total: number; totalWithReplies: number }>> {
    try {
      const args: Record<string, unknown> = {
        action: 'list',
        documentPath: params.documentPath,
        featureId: params.featureId,
      }

      if (params.status) {
        args.status = params.status
      }

      if (params.projectRoot) {
        args.projectRoot = params.projectRoot
      }

      const response = await CLIService.executeCommentCommand<{
        comments: Comment[]
        total: number
        totalWithReplies: number
      }>(args)

      return response
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIST_COMMENTS_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  /**
   * 通过 CLI 更新评论
   */
  static async updateCommentInCLI(params: {
    documentPath: string
    featureId: string
    commentId: string
    content?: string
    status?: CommentStatus
    projectRoot?: string
  }): Promise<CLIResponse<{ comment: Comment }>> {
    try {
      const args: Record<string, unknown> = {
        action: 'update',
        documentPath: params.documentPath,
        featureId: params.featureId,
        commentId: params.commentId,
      }

      if (params.content) {
        args.content = params.content
      }

      if (params.status) {
        args.status = params.status
      }

      if (params.projectRoot) {
        args.projectRoot = params.projectRoot
      }

      const response = await CLIService.executeCommentCommand<{ comment: Comment }>(args)
      return response
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_COMMENT_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  /**
   * 通过 CLI 删除评论
   */
  static async deleteCommentFromCLI(params: {
    documentPath: string
    featureId: string
    commentId: string
    projectRoot?: string
  }): Promise<CLIResponse<{ deletedCount: number; commentId: string }>> {
    try {
      const args: Record<string, unknown> = {
        action: 'delete',
        documentPath: params.documentPath,
        featureId: params.featureId,
        commentId: params.commentId,
      }

      if (params.projectRoot) {
        args.projectRoot = params.projectRoot
      }

      const response = await CLIService.executeCommentCommand<{
        deletedCount: number
        commentId: string
      }>(args)

      return response
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_COMMENT_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }
  /**
   * 创建新评论
   */
  static createComment(
    documentPath: string,
    anchor: CommentAnchor,
    content: string,
    author: string,
    parentId?: string
  ): Comment {
    const now = new Date()

    return {
      id: uuidv4(),
      documentPath,
      anchor,
      content,
      author,
      createdAt: now,
      updatedAt: now,
      status: 'open' as CommentStatus,
      parentId,
      replies: [],
    }
  }

  /**
   * 从选中的文本创建评论锚点
   */
  static createAnchor(
    selectedText: string,
    startLine: number,
    endLine: number,
    documentLines: string[]
  ): CommentAnchor {
    // 提取前后文上下文 (各 50 字符)
    const contextBefore = documentLines
      .slice(Math.max(0, startLine - 3), startLine)
      .join('\n')
      .slice(-50)

    const contextAfter = documentLines
      .slice(endLine, Math.min(documentLines.length, endLine + 3))
      .join('\n')
      .slice(0, 50)

    return {
      startLine,
      endLine,
      textFragment: selectedText.slice(0, 200), // 限制长度
      contextBefore,
      contextAfter,
    }
  }

  /**
   * 重定位评论锚点
   * 当文档被编辑后,尝试找到评论的新位置
   */
  static relocateComment(anchor: CommentAnchor, currentLines: string[]): number | null {
    // 1. 检查原行号位置是否仍然匹配
    const originalText = currentLines
      .slice(anchor.startLine - 1, anchor.endLine)
      .join('\n')

    if (originalText.includes(anchor.textFragment)) {
      return anchor.startLine
    }

    // 2. 在原位置附近搜索 (前后 10 行)
    for (let offset = 1; offset <= 10; offset++) {
      const lineAbove = anchor.startLine - offset
      const lineBelow = anchor.startLine + offset

      if (lineAbove > 0 && currentLines[lineAbove - 1]?.includes(anchor.textFragment)) {
        return lineAbove
      }
      if (
        lineBelow <= currentLines.length &&
        currentLines[lineBelow - 1]?.includes(anchor.textFragment)
      ) {
        return lineBelow
      }
    }

    // 3. 全文搜索
    for (let i = 0; i < currentLines.length; i++) {
      if (currentLines[i].includes(anchor.textFragment)) {
        return i + 1
      }
    }

    // 4. 无法重定位
    return null
  }

  /**
   * 更新评论状态
   */
  static updateCommentStatus(comment: Comment, newStatus: CommentStatus): Comment {
    return {
      ...comment,
      status: newStatus,
      updatedAt: new Date(),
    }
  }

  /**
   * 添加回复
   */
  static addReply(parentComment: Comment, reply: Comment): Comment {
    return {
      ...parentComment,
      replies: [...parentComment.replies, reply],
      updatedAt: new Date(),
    }
  }
}

// 注意: 需要安装 uuid 包
// npm install uuid
// npm install -D @types/uuid
