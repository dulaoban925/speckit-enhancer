import type { CLIResponse, Project, DocumentFile } from '../types'

/**
 * CLI 服务
 * 负责调用 CLI 命令并解析 JSON 响应
 *
 * 通过 Vite 开发服务器的 API 中间件与 CLI 通信
 */
export class CLIService {
  private static baseUrl = '/api' // API 中间件路径

  /**
   * 执行 CLI 命令并解析响应
   */
  private static async executeCommand<T>(
    command: string,
    args: Record<string, unknown> = {},
    method: 'GET' | 'POST' = 'GET'
  ): Promise<CLIResponse<T>> {
    try {
      console.log(`执行 CLI 命令: ${command}`, args)

      let url = `${this.baseUrl}/${command}`
      let fetchOptions: RequestInit = { method }

      if (method === 'GET') {
        // GET 请求: 将参数添加到查询字符串
        const params = new URLSearchParams()
        Object.entries(args).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
        const queryString = params.toString()
        if (queryString) {
          url += `?${queryString}`
        }
      } else {
        // POST 请求: 将参数放在请求体中
        fetchOptions.headers = { 'Content-Type': 'application/json' }
        fetchOptions.body = JSON.stringify(args)
      }

      const response = await fetch(url, fetchOptions)
      const data = await response.json()

      return data as CLIResponse<T>
    } catch (error) {
      console.error('CLI 命令执行失败:', error)
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  /**
   * 列出项目结构
   */
  static async listProject(projectPath?: string): Promise<CLIResponse<Project>> {
    return await this.executeCommand<Project>('list', { projectPath })
  }

  /**
   * 读取文档内容
   */
  static async readDocument(filePath: string): Promise<CLIResponse<DocumentFile>> {
    return await this.executeCommand<DocumentFile>('read', { filePath })
  }

  /**
   * 写入文档内容
   */
  static async writeDocument(
    filePath: string,
    content: string,
    expectedMtime?: number
  ): Promise<CLIResponse<{
    path: string
    relativePath: string
    bytesWritten: number
    lastModified: number
  }>> {
    return await this.executeCommand('write', {
      filePath,
      content,
      expectedMtime,
    }, 'POST')
  }

  /**
   * 监听文件变化
   * @returns 返回一个清理函数
   */
  static watchFile(
    filePath: string,
    callback: (event: 'change' | 'rename') => void
  ): () => void {
    // TODO: 实现文件监听
    console.log(`开始监听文件: ${filePath}`)

    // 返回清理函数
    return () => {
      console.log(`停止监听文件: ${filePath}`)
    }
  }
}
