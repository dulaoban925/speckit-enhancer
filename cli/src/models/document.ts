import path from 'path'
import { existsSync, statSync } from 'fs'
import { FileSystemService } from '../services/fileSystem.js'

/**
 * 文档节点类型
 */
export enum DocumentNodeType {
  Constitution = 'constitution',
  Specification = 'specification',
  Plan = 'plan',
  Tasks = 'tasks',
  Research = 'research',
  DataModel = 'data-model',
  Contracts = 'contracts',
  Quickstart = 'quickstart',
}

/**
 * 文档节点显示配置
 */
export const NODE_DISPLAY_CONFIG: Record<
  DocumentNodeType,
  { displayName: string; icon: string; order: number }
> = {
  constitution: { displayName: '宪章', icon: '📜', order: 1 },
  specification: { displayName: '规格', icon: '📋', order: 2 },
  plan: { displayName: '计划', icon: '🗓️', order: 3 },
  tasks: { displayName: '任务', icon: '✓', order: 4 },
  research: { displayName: '研究', icon: '🔬', order: 5 },
  'data-model': { displayName: '数据模型', icon: '📊', order: 6 },
  contracts: { displayName: '合约', icon: '📁', order: 7 },
  quickstart: { displayName: '快速入门', icon: '🚀', order: 8 },
}

/**
 * 文档节点
 */
export interface DocumentNode {
  name: DocumentNodeType
  displayName: string
  icon: string
  documents: DocumentFile[]
  order: number
}

/**
 * 文档文件
 */
export interface DocumentFile {
  path: string
  relativePath: string
  name: string
  displayName: string
  lastModified: Date
  size: number
  isDirectory: boolean
}

/**
 * 文档模型操作类
 */
export class DocumentModel {
  /**
   * 扫描特性目录,识别所有文档节点
   */
  static scanFeatureDocuments(
    featurePath: string,
    projectRoot: string
  ): DocumentNode[] {
    const nodes: DocumentNode[] = []

    // 定义文档文件映射
    const documentMapping: Record<string, DocumentNodeType> = {
      'constitution.md': DocumentNodeType.Constitution,
      'spec.md': DocumentNodeType.Specification,
      'plan.md': DocumentNodeType.Plan,
      'tasks.md': DocumentNodeType.Tasks,
      'research.md': DocumentNodeType.Research,
      'data-model.md': DocumentNodeType.DataModel,
      'quickstart.md': DocumentNodeType.Quickstart,
    }

    // 扫描文件
    for (const [filename, nodeType] of Object.entries(documentMapping)) {
      const filePath = path.join(featurePath, filename)
      if (existsSync(filePath)) {
        const config = NODE_DISPLAY_CONFIG[nodeType]
        const stats = statSync(filePath)

        nodes.push({
          name: nodeType,
          displayName: config.displayName,
          icon: config.icon,
          order: config.order,
          documents: [
            {
              path: filePath,
              relativePath: path.relative(projectRoot, filePath),
              name: filename,
              displayName: config.displayName,
              lastModified: stats.mtime,
              size: stats.size,
              isDirectory: false,
            },
          ],
        })
      }
    }

    // 扫描 contracts 目录
    const contractsDir = path.join(featurePath, 'contracts')
    if (existsSync(contractsDir)) {
      const listResult = FileSystemService.listDirectory(contractsDir)
      if (listResult.success && listResult.data) {
        const config = NODE_DISPLAY_CONFIG[DocumentNodeType.Contracts]
        const contractFiles = listResult.data
          .filter((entry) => entry.name.endsWith('.md'))
          .map((entry) => ({
            path: path.join(contractsDir, entry.name),
            relativePath: path.relative(projectRoot, path.join(contractsDir, entry.name)),
            name: entry.name,
            displayName: entry.name.replace('.md', ''),
            lastModified: entry.mtime,
            size: entry.size,
            isDirectory: false,
          }))

        if (contractFiles.length > 0) {
          nodes.push({
            name: DocumentNodeType.Contracts,
            displayName: config.displayName,
            icon: config.icon,
            order: config.order,
            documents: contractFiles,
          })
        }
      }
    }

    // 按顺序排序
    return nodes.sort((a, b) => a.order - b.order)
  }

  /**
   * 读取文档内容
   */
  static readDocument(filePath: string): {
    success: boolean
    data?: {
      content: string
      metadata: {
        lastModified: Date
        size: number
        lineCount: number
      }
    }
    error?: string
  } {
    const readResult = FileSystemService.readFile(filePath)
    if (!readResult.success) {
      return { success: false, error: readResult.error }
    }

    const metadataResult = FileSystemService.getMetadata(filePath)
    if (!metadataResult.success) {
      return { success: false, error: metadataResult.error }
    }

    const lineCount = readResult.data?.split('\n').length || 0

    return {
      success: true,
      data: {
        content: readResult.data!,
        metadata: {
          lastModified: metadataResult.data!.mtime,
          size: metadataResult.data!.size,
          lineCount,
        },
      },
    }
  }
}
