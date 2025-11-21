import { existsSync, statSync } from 'fs'
import path from 'path'
import { PathResolver } from '../utils/pathResolver.js'

/**
 * 输入验证服务
 * 提供各种输入验证功能,确保安全性和正确性
 */
export class ValidationService {
  /**
   * 验证项目目录是否有效
   * 项目目录必须包含 .specify/ 或 specs/ 目录
   */
  static validateProjectDirectory(projectPath: string): {
    success: boolean
    error?: string
  } {
    const absolutePath = PathResolver.resolve(projectPath)

    // 检查目录是否存在
    if (!existsSync(absolutePath)) {
      return {
        success: false,
        error: `目录不存在: ${projectPath}`,
      }
    }

    // 检查是否为目录
    const stats = statSync(absolutePath)
    if (!stats.isDirectory()) {
      return {
        success: false,
        error: `路径不是目录: ${projectPath}`,
      }
    }

    // 检查是否包含 .specify/ 或 specs/ 目录
    const specifyDir = path.join(absolutePath, '.specify')
    const specsDir = path.join(absolutePath, 'specs')

    if (!existsSync(specifyDir) && !existsSync(specsDir)) {
      return {
        success: false,
        error: `无效的 Spec-Kit 项目目录。目录必须包含 .specify/ 或 specs/ 文件夹。\n提示: 请确保在 Spec-Kit 项目根目录中运行此命令。`,
      }
    }

    return { success: true }
  }

  /**
   * 验证端口号是否有效
   * 端口必须在 1024-65535 范围内
   */
  static validatePort(port: number): { success: boolean; error?: string } {
    if (!Number.isInteger(port)) {
      return {
        success: false,
        error: '端口必须是整数',
      }
    }

    if (port < 1024 || port > 65535) {
      return {
        success: false,
        error: '端口必须在 1024-65535 范围内 (1024 以下为系统保留端口)',
      }
    }

    return { success: true }
  }

  /**
   * 验证文件路径是否安全 (防止路径遍历攻击)
   */
  static validateFilePath(
    filePath: string,
    projectRoot: string
  ): { success: boolean; error?: string } {
    const absolutePath = PathResolver.resolve(filePath)
    const absoluteRoot = PathResolver.resolve(projectRoot)

    // 检查路径是否包含 .. 序列
    if (filePath.includes('..')) {
      return {
        success: false,
        error: '路径不能包含 ".." 序列 (路径遍历检测)',
      }
    }

    // 检查路径是否在项目根目录内
    if (!PathResolver.isSafe(absolutePath, absoluteRoot)) {
      return {
        success: false,
        error: '路径必须在项目根目录内',
      }
    }

    return { success: true }
  }

  /**
   * 验证主机名是否有效
   */
  static validateHost(host: string): { success: boolean; error?: string } {
    // 简单的主机名验证
    const validHostPattern = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$|^localhost$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/

    if (!validHostPattern.test(host)) {
      return {
        success: false,
        error: '无效的主机名或 IP 地址',
      }
    }

    return { success: true }
  }
}
