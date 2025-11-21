import fs from 'fs'
import { ValidationService } from '../services/validation.js'
import { FileSystemService } from '../services/fileSystem.js'
import chalk from 'chalk'

/**
 * watch 命令选项
 */
export interface WatchOptions {
  format?: 'json' | 'text'
  projectRoot?: string
  verbose?: boolean
}

/**
 * watch 命令实现
 * 监听文件变化,实时输出通知
 */
export async function watchCommand(
  filePath: string,
  options: WatchOptions = {}
): Promise<void> {
  const { format = 'json', projectRoot = process.cwd(), verbose = false } = options

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

    // 检查文件是否存在
    if (!fs.existsSync(absolutePath)) {
      const response = {
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: '文件不存在',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(response, null, 2))
      } else {
        console.error(chalk.red('错误: 文件不存在'))
      }
      process.exit(1)
      return
    }

    // 输出初始化消息
    const relativePath = FileSystemService.getRelativePath(absolutePath, projectRoot)
    if (format === 'text') {
      console.log(chalk.blue(`正在监听文件: ${relativePath}`))
      console.log(chalk.gray('按 Ctrl+C 停止监听'))
    } else if (verbose) {
      console.error(
        JSON.stringify(
          {
            type: 'init',
            path: absolutePath,
            relativePath,
          },
          null,
          2
        )
      )
    }

    // 创建文件监听器
    let debounceTimer: NodeJS.Timeout | null = null
    const watcher = fs.watch(absolutePath, { persistent: true }, (eventType) => {
      // 防抖处理 (避免重复通知)
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(async () => {
        try {
          // 获取最新的文件元数据
          const metadataResult = FileSystemService.getMetadata(absolutePath)
          if (!metadataResult.success || !metadataResult.data) {
            if (verbose && format === 'text') {
              console.error(chalk.yellow('警告: 无法获取文件元数据'))
            }
            return
          }

          // 输出变更通知
          const changeNotification = {
            type: 'change',
            event: eventType,
            path: absolutePath,
            relativePath,
            timestamp: Date.now(),
            metadata: {
              lastModified: metadataResult.data.mtime.getTime(),
              size: metadataResult.data.size,
            },
          }

          if (format === 'json') {
            console.log(JSON.stringify(changeNotification, null, 2))
          } else {
            console.log(
              chalk.yellow(
                `[${new Date().toLocaleTimeString('zh-CN')}] 文件已变更 (${eventType})`
              )
            )
            console.log(`  路径: ${relativePath}`)
            console.log(`  大小: ${metadataResult.data.size} 字节`)
            console.log(
              `  修改时间: ${metadataResult.data.mtime.toLocaleString('zh-CN')}`
            )
          }
        } catch (error) {
          if (verbose) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            if (format === 'json') {
              console.error(
                JSON.stringify(
                  {
                    type: 'error',
                    message: errorMsg,
                  },
                  null,
                  2
                )
              )
            } else {
              console.error(chalk.red(`错误: ${errorMsg}`))
            }
          }
        }
      }, 100) // 100ms 防抖
    })

    // 处理错误
    watcher.on('error', (error) => {
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (format === 'json') {
        console.error(
          JSON.stringify(
            {
              type: 'error',
              code: 'WATCH_ERROR',
              message: errorMsg,
            },
            null,
            2
          )
        )
      } else {
        console.error(chalk.red(`监听错误: ${errorMsg}`))
      }
      process.exit(1)
    })

    // 处理进程退出
    process.on('SIGINT', () => {
      if (format === 'text') {
        console.log(chalk.blue('\n停止监听'))
      }
      watcher.close()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      watcher.close()
      process.exit(0)
    })
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
