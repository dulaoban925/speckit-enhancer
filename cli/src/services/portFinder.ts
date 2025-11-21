import { createServer } from 'net'

/**
 * 端口查找服务
 * 检测端口可用性并自动查找可用端口
 */
export class PortFinderService {
  /**
   * 检测端口是否可用
   */
  static async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer()

      server.once('error', () => {
        resolve(false)
      })

      server.once('listening', () => {
        server.close()
        resolve(true)
      })

      server.listen(port)
    })
  }

  /**
   * 从起始端口开始查找可用端口
   * @param startPort 起始端口
   * @param maxAttempts 最大尝试次数 (默认 10)
   * @returns 返回可用端口或抛出错误
   */
  static async findAvailablePort(
    startPort: number,
    maxAttempts: number = 10
  ): Promise<{ port: number; attempts: number }> {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i

      if (await this.isPortAvailable(port)) {
        return { port, attempts: i + 1 }
      }
    }

    throw new Error(
      `无法找到可用端口。已尝试端口范围: ${startPort}-${startPort + maxAttempts - 1}\n` +
        `建议: 请检查是否有其他服务占用了这些端口,或使用 --port 参数指定其他端口。`
    )
  }

  /**
   * 获取端口占用信息 (尝试性实现,可能在某些平台上不可用)
   */
  static async getPortInfo(port: number): Promise<string | null> {
    try {
      // 这里可以尝试调用系统命令获取端口占用信息
      // 但为了简单起见,暂时返回 null
      return null
    } catch {
      return null
    }
  }
}
