import { spawn } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import { logger, LogLevel } from '../utils/logger.js'
import { PathResolver } from '../utils/pathResolver.js'
import { ValidationService } from '../services/validation.js'
import { PortFinderService } from '../services/portFinder.js'

interface ServeOptions {
  port: string
  host: string
  open: boolean
  verbose: boolean
}

export async function serveCommand(
  projectPath: string,
  options: ServeOptions
): Promise<void> {
  try {
    // 启用详细日志
    if (options.verbose) {
      logger.setLevel(LogLevel.DEBUG)
      logger.debug('详细日志模式已启用')
    }

    // 1. 解析和验证项目路径
    const absoluteProjectPath = PathResolver.resolve(projectPath)
    logger.debug(`项目路径: ${absoluteProjectPath}`)

    const projectValidation = ValidationService.validateProjectDirectory(absoluteProjectPath)
    if (!projectValidation.success) {
      logger.error('❌ 项目目录验证失败')
      logger.error(projectValidation.error || '')
      logger.info('\n💡 提示:')
      logger.info('- 确保在 Spec-Kit 项目根目录中运行此命令')
      logger.info('- 项目目录必须包含 .specify/ 或 specs/ 文件夹')
      logger.info('- 如果是新项目,请先运行 Spec-Kit 初始化命令')
      process.exit(2)
    }

    logger.success('✓ 项目目录验证通过')

    // 2. 验证和查找可用端口
    const requestedPort = parseInt(options.port, 10)
    const portValidation = ValidationService.validatePort(requestedPort)
    if (!portValidation.success) {
      logger.error('❌ 端口验证失败')
      logger.error(portValidation.error || '')
      process.exit(2)
    }

    logger.info(`正在查找可用端口 (起始端口: ${requestedPort})...`)
    let finalPort: number
    let attempts: number

    try {
      const result = await PortFinderService.findAvailablePort(requestedPort, 10)
      finalPort = result.port
      attempts = result.attempts

      if (attempts > 1) {
        logger.warn(`⚠ 端口 ${requestedPort} 已被占用,尝试了 ${attempts} 次`)
        logger.info(`✓ 找到可用端口: ${finalPort}`)
      } else {
        logger.success(`✓ 端口 ${finalPort} 可用`)
      }
    } catch (error) {
      logger.error('❌ 无法找到可用端口')
      if (error instanceof Error) {
        logger.error(error.message)
      }
      process.exit(1)
    }

    // 3. 检查 dashboard 目录
    const dashboardPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../../../dashboard')
    const resolvedDashboardPath = path.resolve(dashboardPath)

    if (!existsSync(resolvedDashboardPath)) {
      logger.error('❌ 找不到 dashboard 目录')
      logger.error(`预期路径: ${resolvedDashboardPath}`)
      logger.info('\n💡 提示: 请确保 CLI 和 Dashboard 正确安装')
      process.exit(1)
    }

    // 4. 启动 Vite 开发服务器
    const url = `http://${options.host}:${finalPort}`
    logger.info('\n🚀 启动 Speckit Enhancer 服务器...')
    logger.info(`📂 项目: ${absoluteProjectPath}`)
    logger.info(`🌐 地址: ${url}`)
    logger.info('')

    const viteProcess = spawn('npm', ['run', 'dev', '--', '--port', String(finalPort), '--host', options.host], {
      cwd: resolvedDashboardPath,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        SPECKIT_PROJECT_PATH: absoluteProjectPath,
      },
    })

    // 监听进程事件
    viteProcess.on('error', (error) => {
      logger.error('❌ 启动服务器失败:', error)
      process.exit(1)
    })

    viteProcess.on('exit', (code) => {
      if (code !== 0) {
        logger.error(`服务器退出,退出码: ${code}`)
        process.exit(code || 1)
      }
    })

    // 自动打开浏览器
    if (options.open) {
      setTimeout(() => {
        const openCommand = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
        spawn(openCommand, [url], { detached: true, stdio: 'ignore' }).unref()
        logger.success(`✓ 已在浏览器打开: ${url}`)
      }, 2000) // 等待 2 秒让服务器启动
    }

    // 监听 Ctrl+C 退出
    process.on('SIGINT', () => {
      logger.info('\n\n⏹ 正在停止服务器...')
      viteProcess.kill('SIGINT')
      process.exit(0)
    })

  } catch (error) {
    logger.error('❌ 启动服务失败')
    if (error instanceof Error) {
      logger.error(error.message)
      if (options.verbose) {
        logger.debug(error.stack || '')
      }
    }
    process.exit(1)
  }
}
