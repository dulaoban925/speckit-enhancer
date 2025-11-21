import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PortFinderService } from '../../src/services/portFinder.js'
import { createServer } from 'net'

describe('PortFinderService', () => {
  describe('isPortAvailable', () => {
    it('应该在端口可用时返回 true', async () => {
      // 使用一个很可能可用的随机高位端口
      const port = 50000 + Math.floor(Math.random() * 10000)
      const result = await PortFinderService.isPortAvailable(port)
      expect(result).toBe(true)
    })

    it('应该在端口被占用时返回 false', async () => {
      // 创建一个服务器占用端口
      const testPort = 50000 + Math.floor(Math.random() * 10000)
      const server = createServer()

      await new Promise<void>((resolve) => {
        server.listen(testPort, () => resolve())
      })

      try {
        const result = await PortFinderService.isPortAvailable(testPort)
        expect(result).toBe(false)
      } finally {
        server.close()
      }
    })
  })

  describe('findAvailablePort', () => {
    it('应该找到可用端口 (第一个端口可用)', async () => {
      const startPort = 50000 + Math.floor(Math.random() * 10000)
      const result = await PortFinderService.findAvailablePort(startPort, 10)

      expect(result.port).toBeGreaterThanOrEqual(startPort)
      expect(result.port).toBeLessThan(startPort + 10)
      expect(result.attempts).toBeGreaterThan(0)
      expect(result.attempts).toBeLessThanOrEqual(10)
    })

    it('应该在第一个端口可用时返回 attempts = 1', async () => {
      const startPort = 50000 + Math.floor(Math.random() * 10000)
      const result = await PortFinderService.findAvailablePort(startPort, 10)

      // 由于我们使用随机高位端口,第一个端口应该可用
      expect(result.attempts).toBe(1)
      expect(result.port).toBe(startPort)
    })

    it('应该在端口被占用时尝试下一个端口', async () => {
      const startPort = 50000 + Math.floor(Math.random() * 10000)

      // 占用起始端口
      const server = createServer()
      await new Promise<void>((resolve) => {
        server.listen(startPort, () => resolve())
      })

      try {
        const result = await PortFinderService.findAvailablePort(startPort, 10)

        // 应该找到下一个可用端口
        expect(result.port).toBe(startPort + 1)
        expect(result.attempts).toBe(2)
      } finally {
        server.close()
      }
    })

    it('应该在达到最大尝试次数时抛出错误', async () => {
      const startPort = 50000 + Math.floor(Math.random() * 10000)
      const maxAttempts = 3

      // 占用所有要测试的端口
      const servers: any[] = []
      for (let i = 0; i < maxAttempts; i++) {
        const server = createServer()
        await new Promise<void>((resolve) => {
          server.listen(startPort + i, () => resolve())
        })
        servers.push(server)
      }

      try {
        await expect(
          PortFinderService.findAvailablePort(startPort, maxAttempts)
        ).rejects.toThrow('无法找到可用端口')

        await expect(
          PortFinderService.findAvailablePort(startPort, maxAttempts)
        ).rejects.toThrow(`已尝试端口范围: ${startPort}-${startPort + maxAttempts - 1}`)
      } finally {
        // 清理服务器
        servers.forEach((server) => server.close())
      }
    })

    it('应该在 10 次尝试后抛出错误 (边界测试)', async () => {
      const startPort = 50000 + Math.floor(Math.random() * 10000)
      const maxAttempts = 10

      // 占用所有 10 个端口
      const servers: any[] = []
      for (let i = 0; i < maxAttempts; i++) {
        const server = createServer()
        await new Promise<void>((resolve) => {
          server.listen(startPort + i, () => resolve())
        })
        servers.push(server)
      }

      try {
        await expect(
          PortFinderService.findAvailablePort(startPort, 10)
        ).rejects.toThrow()
      } finally {
        // 清理服务器
        servers.forEach((server) => server.close())
      }
    })

    it('应该使用默认的最大尝试次数 10', async () => {
      const startPort = 50000 + Math.floor(Math.random() * 10000)

      // 不传入 maxAttempts 参数,应该使用默认值 10
      const result = await PortFinderService.findAvailablePort(startPort)

      expect(result.port).toBeGreaterThanOrEqual(startPort)
      expect(result.port).toBeLessThan(startPort + 10)
    })
  })
})
