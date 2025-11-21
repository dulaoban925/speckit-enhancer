import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import chalk from 'chalk'
import { ValidationService } from '../services/validation.js'
import { FileSystemService } from '../services/fileSystem.js'
import { CommentModel, Comment, CommentStatus, CommentAnchor } from '../models/comment.js'

/**
 * 评论命令选项
 */
export interface CommentOptions {
  format?: 'json' | 'text'
  projectRoot?: string
}

/**
 * 添加评论选项
 */
export interface AddCommentOptions extends CommentOptions {
  documentPath: string
  featureId: string
  content: string
  author: string
  startLine: number
  endLine: number
  textFragment: string
  contextBefore?: string
  contextAfter?: string
  parentId?: string
}

/**
 * 列出评论选项
 */
export interface ListCommentsOptions extends CommentOptions {
  documentPath: string
  featureId: string
  status?: CommentStatus
}

/**
 * 更新评论选项
 */
export interface UpdateCommentOptions extends CommentOptions {
  documentPath: string
  featureId: string
  commentId: string
  content?: string
  status?: CommentStatus
}

/**
 * 删除评论选项
 */
export interface DeleteCommentOptions extends CommentOptions {
  documentPath: string
  featureId: string
  commentId: string
}

/**
 * comment add 命令实现
 * 添加新评论到文档
 */
export async function addCommentCommand(options: AddCommentOptions): Promise<void> {
  const { format = 'json', projectRoot = process.cwd() } = options

  try {
    // 解析文档路径为绝对路径
    const absoluteDocPath = FileSystemService.resolvePath(options.documentPath, projectRoot)

    // 验证文档路径
    const validation = ValidationService.validateFilePath(absoluteDocPath, projectRoot)
    if (!validation.success) {
      const response = {
        success: false,
        error: {
          code: 'INVALID_PATH',
          message: validation.error || '文档路径无效',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`错误: ${response.error.message}`))
      }
      process.exit(1)
    }

    // 检查文档是否存在
    const readResult = FileSystemService.readFile(absoluteDocPath)
    if (!readResult.success) {
      const response = {
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: '文档不存在',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red('错误: 文档不存在'))
      }
      process.exit(1)
    }

    // 构建评论对象
    const anchor: CommentAnchor = {
      startLine: options.startLine,
      endLine: options.endLine,
      textFragment: options.textFragment,
      contextBefore: options.contextBefore,
      contextAfter: options.contextAfter,
    }

    const comment: Comment = {
      id: uuidv4(),
      documentPath: absoluteDocPath,
      anchor,
      content: options.content,
      author: options.author,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: CommentStatus.Open,
      parentId: options.parentId,
      replies: [],
    }

    // 获取文档名称 (用于存储)
    const documentName = path.basename(absoluteDocPath)

    // 添加评论
    const addResult = await CommentModel.addComment(
      projectRoot,
      options.featureId,
      documentName,
      absoluteDocPath,
      comment
    )

    if (!addResult.success) {
      const response = {
        success: false,
        error: {
          code: 'ADD_COMMENT_ERROR',
          message: addResult.error || '添加评论失败',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`添加评论失败: ${response.error.message}`))
      }
      process.exit(1)
    }

    // 返回成功响应
    const response = {
      success: true,
      data: {
        comment: {
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
        },
      },
    }

    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      console.log(chalk.green('✓ 评论添加成功'))
      console.log(`  评论 ID: ${comment.id}`)
      console.log(`  作者: ${comment.author}`)
      console.log(`  位置: 第 ${comment.anchor.startLine}-${comment.anchor.endLine} 行`)
    }
  } catch (error) {
    const response = {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    }

    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      console.error(chalk.red(`未知错误: ${response.error.message}`))
    }
    process.exit(1)
  }
}

/**
 * comment list 命令实现
 * 列出文档的所有评论
 */
export async function listCommentsCommand(options: ListCommentsOptions): Promise<void> {
  const { format = 'json', projectRoot = process.cwd() } = options

  try {
    // 解析文档路径为绝对路径
    const absoluteDocPath = FileSystemService.resolvePath(options.documentPath, projectRoot)

    // 验证文档路径
    const validation = ValidationService.validateFilePath(absoluteDocPath, projectRoot)
    if (!validation.success) {
      const response = {
        success: false,
        error: {
          code: 'INVALID_PATH',
          message: validation.error || '文档路径无效',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`错误: ${response.error.message}`))
      }
      process.exit(1)
    }

    // 获取文档名称
    const documentName = path.basename(absoluteDocPath)

    // 加载评论
    const loadResult = CommentModel.loadComments(projectRoot, options.featureId, documentName)
    if (!loadResult.success) {
      const response = {
        success: false,
        error: {
          code: 'LOAD_COMMENTS_ERROR',
          message: loadResult.error || '加载评论失败',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`加载评论失败: ${response.error.message}`))
      }
      process.exit(1)
    }

    let comments = loadResult.data || []

    // 根据状态过滤
    if (options.status) {
      comments = comments.filter((c) => c.status === options.status)
    }

    // 构建评论树结构 (顶级评论 + 回复)
    const topLevelComments = comments.filter((c) => !c.parentId)

    // 为每个顶级评论添加回复
    topLevelComments.forEach((comment) => {
      comment.replies = comments.filter((c) => c.parentId === comment.id)
    })

    // 返回成功响应
    const response = {
      success: true,
      data: {
        comments: topLevelComments.map((c) => ({
          ...c,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
          updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
          replies: c.replies.map((r) => ({
            ...r,
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
          })),
        })),
        total: topLevelComments.length,
        totalWithReplies: comments.length,
      },
    }

    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      console.log(chalk.blue(`评论列表 (共 ${response.data.total} 条顶级评论, ${response.data.totalWithReplies} 条总评论)`))
      topLevelComments.forEach((comment) => {
        console.log(`\n  [${comment.id.slice(0, 8)}] ${comment.author} - ${comment.status}`)
        console.log(`  位置: 第 ${comment.anchor.startLine}-${comment.anchor.endLine} 行`)
        console.log(`  内容: ${comment.content}`)
        if (comment.replies.length > 0) {
          console.log(`  回复 (${comment.replies.length} 条):`)
          comment.replies.forEach((reply) => {
            console.log(`    [${reply.id.slice(0, 8)}] ${reply.author}: ${reply.content}`)
          })
        }
      })
    }
  } catch (error) {
    const response = {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    }

    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      console.error(chalk.red(`未知错误: ${response.error.message}`))
    }
    process.exit(1)
  }
}

/**
 * comment update 命令实现
 * 更新评论内容或状态
 */
export async function updateCommentCommand(options: UpdateCommentOptions): Promise<void> {
  const { format = 'json', projectRoot = process.cwd() } = options

  try {
    // 解析文档路径为绝对路径
    const absoluteDocPath = FileSystemService.resolvePath(options.documentPath, projectRoot)

    // 验证文档路径
    const validation = ValidationService.validateFilePath(absoluteDocPath, projectRoot)
    if (!validation.success) {
      const response = {
        success: false,
        error: {
          code: 'INVALID_PATH',
          message: validation.error || '文档路径无效',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`错误: ${response.error.message}`))
      }
      process.exit(1)
    }

    // 获取文档名称
    const documentName = path.basename(absoluteDocPath)

    // 加载评论
    const loadResult = CommentModel.loadComments(projectRoot, options.featureId, documentName)
    if (!loadResult.success) {
      const response = {
        success: false,
        error: {
          code: 'LOAD_COMMENTS_ERROR',
          message: loadResult.error || '加载评论失败',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`加载评论失败: ${response.error.message}`))
      }
      process.exit(1)
    }

    const comments = loadResult.data || []
    const commentIndex = comments.findIndex((c) => c.id === options.commentId)

    if (commentIndex === -1) {
      const response = {
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: '评论不存在',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red('错误: 评论不存在'))
      }
      process.exit(1)
    }

    // 更新评论
    const comment = comments[commentIndex]
    if (options.content !== undefined) {
      comment.content = options.content
    }
    if (options.status !== undefined) {
      comment.status = options.status
    }
    comment.updatedAt = new Date()

    // 保存更新后的评论列表
    const saveResult = await CommentModel.saveComments(
      projectRoot,
      options.featureId,
      documentName,
      absoluteDocPath,
      comments
    )

    if (!saveResult.success) {
      const response = {
        success: false,
        error: {
          code: 'SAVE_COMMENTS_ERROR',
          message: saveResult.error || '保存评论失败',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`保存评论失败: ${response.error.message}`))
      }
      process.exit(1)
    }

    // 返回成功响应
    const response = {
      success: true,
      data: {
        comment: {
          ...comment,
          createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt,
          updatedAt: comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : comment.updatedAt,
        },
      },
    }

    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      console.log(chalk.green('✓ 评论更新成功'))
      console.log(`  评论 ID: ${comment.id}`)
      if (options.content) {
        console.log(`  新内容: ${comment.content}`)
      }
      if (options.status) {
        console.log(`  新状态: ${comment.status}`)
      }
    }
  } catch (error) {
    const response = {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    }

    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      console.error(chalk.red(`未知错误: ${response.error.message}`))
    }
    process.exit(1)
  }
}

/**
 * comment delete 命令实现
 * 删除评论 (包括其所有回复)
 */
export async function deleteCommentCommand(options: DeleteCommentOptions): Promise<void> {
  const { format = 'json', projectRoot = process.cwd() } = options

  try {
    // 解析文档路径为绝对路径
    const absoluteDocPath = FileSystemService.resolvePath(options.documentPath, projectRoot)

    // 验证文档路径
    const validation = ValidationService.validateFilePath(absoluteDocPath, projectRoot)
    if (!validation.success) {
      const response = {
        success: false,
        error: {
          code: 'INVALID_PATH',
          message: validation.error || '文档路径无效',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`错误: ${response.error.message}`))
      }
      process.exit(1)
    }

    // 获取文档名称
    const documentName = path.basename(absoluteDocPath)

    // 加载评论
    const loadResult = CommentModel.loadComments(projectRoot, options.featureId, documentName)
    if (!loadResult.success) {
      const response = {
        success: false,
        error: {
          code: 'LOAD_COMMENTS_ERROR',
          message: loadResult.error || '加载评论失败',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`加载评论失败: ${response.error.message}`))
      }
      process.exit(1)
    }

    const comments = loadResult.data || []
    const commentExists = comments.some((c) => c.id === options.commentId)

    if (!commentExists) {
      const response = {
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: '评论不存在',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red('错误: 评论不存在'))
      }
      process.exit(1)
    }

    // 删除评论及其所有回复
    const filteredComments = comments.filter(
      (c) => c.id !== options.commentId && c.parentId !== options.commentId
    )

    // 保存更新后的评论列表
    const saveResult = await CommentModel.saveComments(
      projectRoot,
      options.featureId,
      documentName,
      absoluteDocPath,
      filteredComments
    )

    if (!saveResult.success) {
      const response = {
        success: false,
        error: {
          code: 'SAVE_COMMENTS_ERROR',
          message: saveResult.error || '保存评论失败',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`保存评论失败: ${response.error.message}`))
      }
      process.exit(1)
    }

    // 返回成功响应
    const deletedCount = comments.length - filteredComments.length
    const response = {
      success: true,
      data: {
        deletedCount,
        commentId: options.commentId,
      },
    }

    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      console.log(chalk.green(`✓ 评论删除成功 (共删除 ${deletedCount} 条评论)`))
      console.log(`  评论 ID: ${options.commentId}`)
    }
  } catch (error) {
    const response = {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    }

    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      console.error(chalk.red(`未知错误: ${response.error.message}`))
    }
    process.exit(1)
  }
}
