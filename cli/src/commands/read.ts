import { logger } from '../utils/logger.js'
import { PathResolver } from '../utils/pathResolver.js'
import { ValidationService } from '../services/validation.js'
import { DocumentModel } from '../models/document.js'

interface ReadOptions {
  format?: 'json' | 'text'
  projectRoot?: string
}

/**
 * read 命令 - 读取文档内容
 */
export async function readCommand(
  filePath: string,
  options: ReadOptions = {}
): Promise<void> {
  try {
    const format = options.format || 'json'
    const projectRoot = options.projectRoot
      ? PathResolver.resolve(options.projectRoot)
      : process.cwd()

    // 解析文件路径
    const absolutePath = PathResolver.resolve(filePath)

    // 验证文件路径安全性
    const validation = ValidationService.validateFilePath(absolutePath, projectRoot)
    if (!validation.success) {
      const error = {
        success: false,
        error: {
          code: 'INVALID_PATH',
          message: validation.error || '无效的文件路径',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(error, null, 2))
      } else {
        logger.error(validation.error || '无效的文件路径')
      }
      process.exit(1)
    }

    // 读取文档
    const result = DocumentModel.readDocument(absolutePath)
    if (!result.success || !result.data) {
      const error = {
        success: false,
        error: {
          code: 'READ_FAILED',
          message: result.error || '读取文档失败',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(error, null, 2))
      } else {
        logger.error(result.error || '读取文档失败')
      }
      process.exit(1)
    }

    // 构建响应
    const response = {
      success: true,
      data: {
        path: absolutePath,
        relativePath: PathResolver.relative(absolutePath, projectRoot),
        name: absolutePath.split('/').pop() || '',
        content: result.data.content,
        metadata: {
          lastModified: result.data.metadata.lastModified.getTime(), // 返回时间戳（毫秒），避免时区问题
          size: result.data.metadata.size,
          lineCount: result.data.metadata.lineCount,
        },
      },
    }

    // 输出结果
    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      // 文本格式输出
      logger.info(`文件: ${response.data.name}`)
      logger.info(`路径: ${response.data.path}`)
      logger.info(`大小: ${response.data.metadata.size} bytes`)
      logger.info(`行数: ${response.data.metadata.lineCount}`)
      logger.info(`最后修改: ${response.data.metadata.lastModified}`)
      logger.info('')
      logger.info('--- 内容 ---')
      console.log(result.data.content)
    }
  } catch (error) {
    const errorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    }

    if (options.format === 'json') {
      console.log(JSON.stringify(errorResponse, null, 2))
    } else {
      logger.error('读取文档失败:', error)
    }
    process.exit(1)
  }
}
