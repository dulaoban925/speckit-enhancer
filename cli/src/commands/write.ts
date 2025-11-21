import { ValidationService } from '../services/validation.js'
import { FileSystemService } from '../services/fileSystem.js'
import chalk from 'chalk'

/**
 * write 命令选项
 */
export interface WriteOptions {
  format?: 'json' | 'text'
  projectRoot?: string
  expectedMtime?: number // 预期的最后修改时间 (用于冲突检测)
  force?: boolean // 强制写入,忽略冲突检测
}

/**
 * write 命令实现
 * 写入文件内容,支持冲突检测
 */
export async function writeCommand(
  filePath: string,
  content: string,
  options: WriteOptions = {}
): Promise<void> {
  const {
    format = 'json',
    projectRoot = process.cwd(),
    expectedMtime,
    force = false,
  } = options

  try {
    // 解析为绝对路径
    const absolutePath = FileSystemService.resolvePath(filePath, projectRoot)

    // 验证文件路径
    const validation = ValidationService.validateFilePath(absolutePath, projectRoot)
    if (!validation.success) {
      const response = {
        success: false,
        error: {
          code: 'INVALID_PATH',
          message: validation.error || '文件路径无效',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`错误: ${response.error.message}`))
      }
      process.exit(1)
      return
    }

    // 冲突检测 (如果提供了 expectedMtime)
    if (expectedMtime !== undefined && !force) {
      const metadataResult = FileSystemService.getMetadata(absolutePath)
      if (metadataResult.success && metadataResult.data) {
        const actualMtime = metadataResult.data.mtime.getTime()

        // 详细调试日志
        console.error(`[WRITE] 冲突检测:`)
        console.error(`  expectedMtime: ${expectedMtime} (类型: ${typeof expectedMtime})`)
        console.error(`  actualMtime: ${actualMtime} (类型: ${typeof actualMtime})`)
        console.error(`  相等: ${actualMtime === expectedMtime}`)
        console.error(`  差异: ${actualMtime - expectedMtime} 毫秒`)

        if (actualMtime !== expectedMtime) {
          const response = {
            success: false,
            error: {
              code: 'CONFLICT',
              message: '文件已被外部修改,存在冲突',
              details: {
                expectedMtime,
                actualMtime,
                lastModified: metadataResult.data.mtime,
              },
            },
          }

          if (format === 'json') {
            console.log(JSON.stringify(response, null, 2))
          } else {
            console.error(chalk.yellow('警告: 文件已被外部修改'))
            console.error(`  预期修改时间: ${new Date(expectedMtime).toISOString()}`)
            console.error(`  实际修改时间: ${new Date(actualMtime).toISOString()}`)
            console.error(chalk.red('请使用 --force 强制写入,或刷新后重新编辑'))
          }
          process.exit(1)
          return
        }
      }
    }

    console.error(`[WRITE] 冲突检测通过，开始写入文件...`)

    // 写入文件
    const writeResult = FileSystemService.writeFile(absolutePath, content)
    if (!writeResult.success) {
      const response = {
        success: false,
        error: {
          code: 'WRITE_ERROR',
          message: writeResult.error || '写入文件失败',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red(`写入失败: ${response.error.message}`))
      }
      process.exit(1)
      return
    }

    // 获取更新后的元数据
    const metadataResult = FileSystemService.getMetadata(absolutePath)
    if (!metadataResult.success || !metadataResult.data) {
      const response = {
        success: false,
        error: {
          code: 'METADATA_ERROR',
          message: '无法获取文件元数据',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red('错误: 无法获取文件元数据'))
      }
      process.exit(1)
      return
    }

    // 返回成功响应
    const response = {
      success: true,
      data: {
        path: absolutePath,
        relativePath: FileSystemService.getRelativePath(absolutePath, projectRoot),
        bytesWritten: content.length,
        lastModified: metadataResult.data.mtime.getTime(),
      },
    }

    console.error(`[WRITE] 写入成功，返回响应: success=${response.success}, lastModified=${response.data.lastModified}`)

    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      console.log(chalk.green('✓ 文件写入成功'))
      console.log(`  路径: ${response.data.relativePath}`)
      console.log(`  字节数: ${response.data.bytesWritten}`)
      console.log(`  修改时间: ${new Date(response.data.lastModified).toLocaleString('zh-CN')}`)
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
