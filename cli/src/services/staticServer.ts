import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFile, stat } from 'fs/promises'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'

/**
 * 静态文件服务器
 * 用于生产模式下提供 Dashboard 的静态文件
 */
export class StaticServer {
  /**
   * 获取静态文件目录路径
   */
  static getPublicDir(): string {
    // 在发布后，public 目录应该在 CLI 包的根目录
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    // 从 dist/services/staticServer.js 回到包根目录的 public
    return path.resolve(__dirname, '../../public')
  }

  /**
   * 获取 MIME 类型
   */
  static getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
    }
    return mimeTypes[ext] || 'application/octet-stream'
  }

  /**
   * 执行 CLI 命令并返回输出
   */
  private static execCommand(
    command: string,
    args: string[],
    cwd: string
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { cwd })

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('error', (error) => {
        reject(error)
      })

      proc.on('close', () => {
        // CLI 总是在 stdout 输出 JSON（即使失败），所以返回 stdout
        resolve({ stdout, stderr })
      })
    })
  }

  /**
   * 处理 API 请求
   */
  static async handleApiRequest(
    req: IncomingMessage,
    res: ServerResponse,
    projectPath: string
  ): Promise<boolean> {
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const command = url.pathname.replace('/api/', '')

    // 设置响应头
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')

    try {
      let cliCommand = 'ske'
      let cliArgs: string[] = []

      // 根据 API 路径构建 CLI 命令
      if (command === 'list') {
        cliArgs = ['docs', 'list', '-f', 'json', projectPath]
      } else if (command === 'read') {
        const filePath = url.searchParams.get('filePath')
        if (!filePath) {
          res.writeHead(400)
          res.end(
            JSON.stringify({
              success: false,
              error: { code: 'INVALID_REQUEST', message: '缺少 filePath 参数' },
            })
          )
          return true
        }
        cliArgs = ['docs', 'read', '-f', 'json', filePath]
      } else if (command === 'write') {
        // 处理 POST 请求
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end(
            JSON.stringify({
              success: false,
              error: { code: 'METHOD_NOT_ALLOWED', message: '只支持 POST 请求' },
            })
          )
          return true
        }

        // 读取请求体
        return new Promise((resolve) => {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              const { filePath, content, expectedMtime } = JSON.parse(body)
              if (!filePath || content === undefined) {
                res.writeHead(400)
                res.end(
                  JSON.stringify({
                    success: false,
                    error: { code: 'INVALID_REQUEST', message: '缺少 filePath 或 content 参数' },
                  })
                )
                resolve(true)
                return
              }

              cliArgs = ['docs', 'write', '-f', 'json', filePath, content]
              if (expectedMtime !== undefined) {
                cliArgs.push('-e', String(expectedMtime))
              }

              const { stdout, stderr } = await this.execCommand(cliCommand, cliArgs, projectPath)

              if (stderr) {
                console.error('CLI stderr:', stderr)
              }

              res.writeHead(200)
              res.end(stdout)
              resolve(true)
            } catch (error) {
              console.error('写入失败:', error)
              res.writeHead(500)
              res.end(
                JSON.stringify({
                  success: false,
                  error: {
                    code: 'EXECUTION_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                  },
                })
              )
              resolve(true)
            }
          })
        })
      } else if (command === 'comment') {
        // 处理评论命令
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end(
            JSON.stringify({
              success: false,
              error: { code: 'METHOD_NOT_ALLOWED', message: '只支持 POST 请求' },
            })
          )
          return true
        }

        // 读取请求体
        return new Promise((resolve) => {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              const params = JSON.parse(body)
              const { action } = params

              cliArgs = []

              if (action === 'add') {
                const {
                  documentPath: docPath,
                  featureId,
                  content,
                  author,
                  startLine,
                  endLine,
                  textFragment,
                  contextBefore,
                  contextAfter,
                  parentId,
                  projectRoot: pr,
                } = params
                cliArgs = [
                  'comment',
                  'add',
                  '--document-path',
                  docPath,
                  '--feature-id',
                  featureId,
                  '--content',
                  content,
                  '--author',
                  author,
                  '--start-line',
                  String(startLine),
                  '--end-line',
                  String(endLine),
                  '--text-fragment',
                  textFragment,
                ]
                if (contextBefore) cliArgs.push('--context-before', contextBefore)
                if (contextAfter) cliArgs.push('--context-after', contextAfter)
                if (parentId) cliArgs.push('--parent-id', parentId)
                if (pr) cliArgs.push('--project-root', pr)
              } else if (action === 'list') {
                const { documentPath: docPath, featureId, status, projectRoot: pr } = params
                cliArgs = ['comment', 'list', '--document-path', docPath, '--feature-id', featureId]
                if (status) cliArgs.push('--status', status)
                if (pr) cliArgs.push('--project-root', pr)
              } else if (action === 'update') {
                const {
                  documentPath: docPath,
                  featureId,
                  commentId,
                  content,
                  status,
                  projectRoot: pr,
                } = params
                cliArgs = [
                  'comment',
                  'update',
                  commentId,
                  '--document-path',
                  docPath,
                  '--feature-id',
                  featureId,
                ]
                if (content) cliArgs.push('--content', content)
                if (status) cliArgs.push('--status', status)
                if (pr) cliArgs.push('--project-root', pr)
              } else if (action === 'delete') {
                const { documentPath: docPath, featureId, commentId, projectRoot: pr } = params
                cliArgs = [
                  'comment',
                  'delete',
                  commentId,
                  '--document-path',
                  docPath,
                  '--feature-id',
                  featureId,
                ]
                if (pr) cliArgs.push('--project-root', pr)
              } else {
                res.writeHead(400)
                res.end(
                  JSON.stringify({
                    success: false,
                    error: { code: 'INVALID_ACTION', message: `未知的评论操作: ${action}` },
                  })
                )
                resolve(true)
                return
              }

              const { stdout, stderr } = await this.execCommand(cliCommand, cliArgs, projectPath)

              if (stderr) {
                console.error('CLI stderr:', stderr)
              }

              res.writeHead(200)
              res.end(stdout)
              resolve(true)
            } catch (error) {
              console.error('评论操作失败:', error)
              res.writeHead(500)
              res.end(
                JSON.stringify({
                  success: false,
                  error: {
                    code: 'EXECUTION_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                  },
                })
              )
              resolve(true)
            }
          })
        })
      } else {
        res.writeHead(404)
        res.end(
          JSON.stringify({
            success: false,
            error: { code: 'NOT_FOUND', message: `未知的 API 命令: ${command}` },
          })
        )
        return true
      }

      // 执行 CLI 命令
      const { stdout, stderr } = await this.execCommand(cliCommand, cliArgs, projectPath)

      if (stderr) {
        console.error('CLI stderr:', stderr)
      }

      res.writeHead(200)
      res.end(stdout)
      return true
    } catch (error) {
      logger.error('API 请求处理失败:', error)
      res.writeHead(500)
      res.end(
        JSON.stringify({
          success: false,
          error: {
            code: 'EXECUTION_ERROR',
            message: error instanceof Error ? error.message : String(error),
          },
        })
      )
      return true
    }
  }

  /**
   * 启动静态文件服务器
   */
  static async start(port: number, host: string, projectPath: string): Promise<void> {
    const publicDir = this.getPublicDir()

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      try {
        // 处理 API 请求
        if (req.url?.startsWith('/api/')) {
          const handled = await this.handleApiRequest(req, res, projectPath)
          if (handled) return
        }

        // 解析请求路径
        let filePath = req.url === '/' ? '/index.html' : req.url || '/index.html'

        // 移除查询参数
        const queryIndex = filePath.indexOf('?')
        if (queryIndex !== -1) {
          filePath = filePath.substring(0, queryIndex)
        }

        // 完整文件路径
        const fullPath = path.join(publicDir, filePath)

        // 检查文件是否存在
        try {
          const stats = await stat(fullPath)

          if (stats.isDirectory()) {
            // 如果是目录，返回 index.html
            const indexPath = path.join(fullPath, 'index.html')
            const indexContent = await readFile(indexPath)
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(indexContent)
            return
          }

          // 读取文件内容
          const content = await readFile(fullPath)
          const mimeType = this.getMimeType(fullPath)

          res.writeHead(200, {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=3600'
          })
          res.end(content)

        } catch (error) {
          // 文件不存在，返回 index.html (SPA 路由)
          const indexPath = path.join(publicDir, 'index.html')
          try {
            const indexContent = await readFile(indexPath)
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(indexContent)
          } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end('404 Not Found')
          }
        }
      } catch (error) {
        logger.error('服务器错误:', error)
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('500 Internal Server Error')
      }
    })

    return new Promise((resolve, reject) => {
      server.listen(port, host, () => {
        logger.success(`✓ 服务器已启动`)
        logger.info(`  - 本地访问: http://${host}:${port}`)
        logger.info(`  - 项目路径: ${projectPath}`)
        resolve()
      })

      server.on('error', (error) => {
        reject(error)
      })

      // 监听 Ctrl+C 退出
      process.on('SIGINT', () => {
        logger.info('\n⏹ 正在停止服务器...')
        server.close(() => {
          process.exit(0)
        })
      })
    })
  }
}
