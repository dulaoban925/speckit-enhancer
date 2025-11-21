import path from 'path'
import { existsSync } from 'fs'
import { FileSystemService } from '../services/fileSystem.js'

/**
 * 评论锚定位置
 */
export interface CommentAnchor {
  startLine: number
  endLine: number
  textFragment: string
  contextBefore?: string
  contextAfter?: string
}

/**
 * 评论状态
 */
export enum CommentStatus {
  Open = 'open',
  Resolved = 'resolved',
  Archived = 'archived',
}

/**
 * 评论
 */
export interface Comment {
  id: string
  documentPath: string
  anchor: CommentAnchor
  content: string
  author: string
  createdAt: Date
  updatedAt: Date
  status: CommentStatus
  parentId?: string
  replies: Comment[]
}

/**
 * 评论存储格式
 */
interface CommentStorage {
  version: string
  documentPath: string
  comments: Comment[]
}

/**
 * 评论模型操作类
 */
export class CommentModel {
  /**
   * 获取评论存储文件路径
   */
  static getStoragePath(projectRoot: string, featureId: string, documentName: string): string {
    return path.join(
      projectRoot,
      '.specify',
      'memory',
      'comments',
      featureId,
      `${documentName}.json`
    )
  }

  /**
   * 加载文档的所有评论
   */
  static loadComments(
    projectRoot: string,
    featureId: string,
    documentName: string
  ): { success: boolean; data?: Comment[]; error?: string } {
    try {
      const storagePath = this.getStoragePath(projectRoot, featureId, documentName)

      if (!existsSync(storagePath)) {
        return { success: true, data: [] }
      }

      const readResult = FileSystemService.readFile(storagePath)
      if (!readResult.success) {
        return { success: false, error: readResult.error }
      }

      const storage: CommentStorage = JSON.parse(readResult.data!)
      return { success: true, data: storage.comments }
    } catch (error) {
      return {
        success: false,
        error: `加载评论失败: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * 保存评论到存储文件
   */
  static async saveComments(
    projectRoot: string,
    featureId: string,
    documentName: string,
    documentPath: string,
    comments: Comment[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const storagePath = this.getStoragePath(projectRoot, featureId, documentName)
      const storageDir = path.dirname(storagePath)

      // 确保目录存在
      const ensureResult = await FileSystemService.ensureDirectory(storageDir)
      if (!ensureResult.success) {
        return { success: false, error: ensureResult.error }
      }

      const storage: CommentStorage = {
        version: '1.0',
        documentPath,
        comments,
      }

      const writeResult = FileSystemService.writeFile(storagePath, JSON.stringify(storage, null, 2))
      if (!writeResult.success) {
        return { success: false, error: writeResult.error }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `保存评论失败: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * 添加新评论
   */
  static async addComment(
    projectRoot: string,
    featureId: string,
    documentName: string,
    documentPath: string,
    comment: Comment
  ): Promise<{ success: boolean; error?: string }> {
    const loadResult = this.loadComments(projectRoot, featureId, documentName)
    if (!loadResult.success) {
      return { success: false, error: loadResult.error }
    }

    const comments = loadResult.data || []
    comments.push(comment)

    return await this.saveComments(projectRoot, featureId, documentName, documentPath, comments)
  }
}
