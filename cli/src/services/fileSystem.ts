import { readFileSync, writeFileSync, readdirSync, statSync, watch } from 'fs'
import { mkdir } from 'fs/promises'
import path from 'path'
import { PathResolver } from '../utils/pathResolver.js'

/**
 * 文件系统服务
 * 提供文件和目录的读写、列表、监听等操作
 */
export class FileSystemService {
  /**
   * 读取文件内容
   */
  static readFile(filePath: string): { success: boolean; data?: string; error?: string } {
    try {
      const content = readFileSync(filePath, 'utf-8')
      return { success: true, data: content }
    } catch (error) {
      return {
        success: false,
        error: `读取文件失败: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * 写入文件内容
   * @param checkMtime 是否检查文件修改时间以检测冲突
   * @param expectedMtime 预期的文件修改时间
   */
  static writeFile(
    filePath: string,
    content: string,
    options?: { checkMtime?: boolean; expectedMtime?: Date }
  ): { success: boolean; conflict?: boolean; error?: string } {
    try {
      // 检查文件冲突
      if (options?.checkMtime && options?.expectedMtime) {
        const stats = statSync(filePath)
        const currentMtime = stats.mtime

        if (currentMtime.getTime() !== options.expectedMtime.getTime()) {
          return {
            success: false,
            conflict: true,
            error: '文件已被外部修改,存在冲突。请先重新加载文件。',
          }
        }
      }

      writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `写入文件失败: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * 列出目录中的文件和子目录
   */
  static listDirectory(dirPath: string): {
    success: boolean
    data?: Array<{ name: string; isDirectory: boolean; size: number; mtime: Date }>
    error?: string
  } {
    try {
      const entries = readdirSync(dirPath)
      const results = entries.map((name) => {
        const fullPath = path.join(dirPath, name)
        const stats = statSync(fullPath)
        return {
          name,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          mtime: stats.mtime,
        }
      })

      return { success: true, data: results }
    } catch (error) {
      return {
        success: false,
        error: `列出目录失败: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * 获取文件或目录的元数据
   */
  static getMetadata(targetPath: string): {
    success: boolean
    data?: {
      size: number
      mtime: Date
      isDirectory: boolean
      isFile: boolean
    }
    error?: string
  } {
    try {
      const stats = statSync(targetPath)
      return {
        success: true,
        data: {
          size: stats.size,
          mtime: stats.mtime,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `获取元数据失败: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * 监听文件变化
   * @returns 返回一个清理函数,用于停止监听
   */
  static watchFile(
    filePath: string,
    callback: (event: 'change' | 'rename', filename: string) => void
  ): () => void {
    const watcher = watch(filePath, (eventType, filename) => {
      if (filename) {
        callback(eventType, filename)
      }
    })

    return () => {
      watcher.close()
    }
  }

  /**
   * 确保目录存在 (如果不存在则创建)
   */
  static async ensureDirectory(dirPath: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      await mkdir(dirPath, { recursive: true })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `创建目录失败: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * 解析路径为绝对路径
   */
  static resolvePath(filePath: string, basePath: string = process.cwd()): string {
    return path.isAbsolute(filePath) ? filePath : path.resolve(basePath, filePath)
  }

  /**
   * 获取相对路径
   */
  static getRelativePath(absolutePath: string, basePath: string = process.cwd()): string {
    return path.relative(basePath, absolutePath)
  }
}
