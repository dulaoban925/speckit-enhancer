/**
 * 安全的文件系统操作工具
 * 参考: specs/004-project-cli-commands/research.md
 */

import fs from 'fs-extra';
import path from 'path';
import { FileSystemError } from '../types/project.js';

/**
 * 验证路径是否在项目根目录内,防止路径遍历攻击
 */
export function validatePath(targetPath: string, projectRoot: string): void {
  const resolved = path.resolve(targetPath);
  const root = path.resolve(projectRoot);

  // 防止路径遍历
  if (!resolved.startsWith(root)) {
    throw new FileSystemError(`Invalid path: ${targetPath} is outside project root`);
  }

  // 拒绝可疑模式
  if (resolved.includes('..')) {
    throw new FileSystemError(`Invalid path: ${targetPath} contains traversal sequence`);
  }
}

/**
 * 安全读取项目文件
 */
export async function readProjectFile(filePath: string, projectRoot?: string): Promise<string> {
  const root = projectRoot || process.cwd();
  validatePath(filePath, root);

  if (!(await fs.pathExists(filePath))) {
    throw new FileSystemError(`File not found: ${filePath}`);
  }

  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new FileSystemError(`Failed to read file: ${filePath}. ${error}`);
  }
}

/**
 * 安全写入项目文件
 */
export async function writeProjectFile(
  filePath: string,
  content: string,
  projectRoot?: string
): Promise<void> {
  const root = projectRoot || process.cwd();
  validatePath(filePath, root);

  try {
    // outputFile 会自动创建父目录
    await fs.outputFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new FileSystemError(`Failed to write file: ${filePath}. ${error}`);
  }
}

/**
 * 确保项目结构目录存在
 */
export async function ensureProjectStructure(projectRoot: string): Promise<void> {
  const requiredDirs = [
    path.join(projectRoot, '.specify'),
    path.join(projectRoot, '.claude/commands'),
    path.join(projectRoot, 'specs'),
  ];

  for (const dir of requiredDirs) {
    try {
      await fs.ensureDir(dir);
    } catch (error) {
      throw new FileSystemError(`Failed to create directory: ${dir}. ${error}`);
    }
  }
}

/**
 * 检查文件是否存在
 */
export async function fileExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

/**
 * 读取目录下的所有文件
 */
export async function readDirectory(dirPath: string): Promise<string[]> {
  try {
    if (!(await fs.pathExists(dirPath))) {
      return [];
    }
    return await fs.readdir(dirPath);
  } catch (error) {
    throw new FileSystemError(`Failed to read directory: ${dirPath}. ${error}`);
  }
}

/**
 * 获取文件统计信息
 */
export async function getFileStats(filePath: string): Promise<fs.Stats | null> {
  try {
    if (!(await fs.pathExists(filePath))) {
      return null;
    }
    return await fs.stat(filePath);
  } catch (error) {
    return null;
  }
}

/**
 * 复制文件或目录
 */
export async function copyPath(src: string, dest: string, projectRoot?: string): Promise<void> {
  const root = projectRoot || process.cwd();
  validatePath(src, root);
  validatePath(dest, root);

  try {
    await fs.copy(src, dest);
  } catch (error) {
    throw new FileSystemError(`Failed to copy ${src} to ${dest}. ${error}`);
  }
}

/**
 * 删除文件或目录
 */
export async function removePath(targetPath: string, projectRoot?: string): Promise<void> {
  const root = projectRoot || process.cwd();
  validatePath(targetPath, root);

  try {
    await fs.remove(targetPath);
  } catch (error) {
    throw new FileSystemError(`Failed to remove ${targetPath}. ${error}`);
  }
}

/**
 * 原子写入文件(先写临时文件再重命名)
 */
export async function atomicWriteFile(
  filePath: string,
  content: string,
  projectRoot?: string
): Promise<void> {
  const root = projectRoot || process.cwd();
  validatePath(filePath, root);

  const tempPath = `${filePath}.tmp`;

  try {
    // 写入临时文件
    await fs.outputFile(tempPath, content, 'utf-8');
    // 原子重命名
    await fs.move(tempPath, filePath, { overwrite: true });
  } catch (error) {
    // 清理临时文件
    if (await fs.pathExists(tempPath)) {
      await fs.remove(tempPath);
    }
    throw new FileSystemError(`Failed to write file atomically: ${filePath}. ${error}`);
  }
}
