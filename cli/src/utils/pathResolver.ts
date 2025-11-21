import path from 'path'
import { existsSync } from 'fs'

/**
 * 路径解析和安全验证工具
 */
export class PathResolver {
  /**
   * 将相对路径转换为绝对路径
   */
  static resolve(inputPath: string): string {
    if (path.isAbsolute(inputPath)) {
      return inputPath
    }
    return path.resolve(process.cwd(), inputPath)
  }

  /**
   * 验证路径是否安全 (防止路径遍历攻击)
   * 确保目标路径在指定的根目录内
   */
  static isSafe(targetPath: string, rootPath: string): boolean {
    const normalizedTarget = path.normalize(targetPath)
    const normalizedRoot = path.normalize(rootPath)

    // 检查是否包含 .. 序列
    if (normalizedTarget.includes('..')) {
      return false
    }

    // 检查目标路径是否在根目录内
    const relativePath = path.relative(normalizedRoot, normalizedTarget)
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
  }

  /**
   * 验证路径是否存在
   */
  static exists(targetPath: string): boolean {
    return existsSync(targetPath)
  }

  /**
   * 获取相对于根目录的路径
   */
  static relative(targetPath: string, rootPath: string): string {
    return path.relative(rootPath, targetPath)
  }

  /**
   * 规范化路径 (统一路径分隔符,移除多余的 . 和 ..)
   */
  static normalize(targetPath: string): string {
    return path.normalize(targetPath)
  }
}
