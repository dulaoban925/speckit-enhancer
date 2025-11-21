import { logger } from '../utils/logger.js'
import { PathResolver } from '../utils/pathResolver.js'
import { ValidationService } from '../services/validation.js'
import { ProjectModel } from '../models/project.js'
import { DocumentModel } from '../models/document.js'

interface ListOptions {
  format?: 'json' | 'text'
  verbose?: boolean
}

/**
 * list 命令 - 列出项目结构
 */
export async function listCommand(
  projectPath: string = '.',
  options: ListOptions = {}
): Promise<void> {
  try {
    const format = options.format || 'json'

    // 解析项目路径
    const absolutePath = PathResolver.resolve(projectPath)

    // 验证项目目录
    const validation = ValidationService.validateProjectDirectory(absolutePath)
    if (!validation.success) {
      const error = {
        success: false,
        error: {
          code: 'INVALID_PROJECT',
          message: validation.error || '无效的项目目录',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(error, null, 2))
      } else {
        logger.error(validation.error || '无效的项目目录')
      }
      process.exit(1)
    }

    // 加载项目
    const projectResult = ProjectModel.loadProject(absolutePath)
    if (!projectResult.success || !projectResult.data) {
      const error = {
        success: false,
        error: {
          code: 'LOAD_PROJECT_FAILED',
          message: projectResult.error || '加载项目失败',
        },
      }

      if (format === 'json') {
        console.log(JSON.stringify(error, null, 2))
      } else {
        logger.error(projectResult.error || '加载项目失败')
      }
      process.exit(1)
    }

    const project = projectResult.data

    // 扫描每个特性的文档节点
    const enrichedFeatures = project.features.map((feature) => {
      const nodes = DocumentModel.scanFeatureDocuments(feature.path, absolutePath)
      return {
        ...feature,
        displayName: feature.name, // 使用 name 作为 displayName
        status: 'in-progress', // 默认状态
        nodes,
      }
    })

    // 构建响应
    const response = {
      success: true,
      data: {
        rootPath: project.rootPath,
        name: project.name,
        constitution: project.hasConstitution
          ? {
              path: `${absolutePath}/.specify/memory/constitution.md`,
              relativePath: '.specify/memory/constitution.md',
              name: 'constitution.md',
              displayName: '宪章',
              isDirectory: false,
            }
          : undefined,
        features: enrichedFeatures,
        createdAt: new Date(),
        lastAccessed: new Date(),
      },
    }

    // 输出结果
    if (format === 'json') {
      console.log(JSON.stringify(response, null, 2))
    } else {
      // 文本格式输出
      logger.info(`项目: ${project.name}`)
      logger.info(`路径: ${project.rootPath}`)
      logger.info(`宪章: ${project.hasConstitution ? '✓' : '✗'}`)
      logger.info(`特性数量: ${enrichedFeatures.length}`)
      logger.info('')

      enrichedFeatures.forEach((feature) => {
        logger.info(`📋 ${feature.name} (#${feature.id})`)
        logger.info(`   路径: ${feature.path}`)
        logger.info(`   节点数: ${feature.nodes.length}`)
        feature.nodes.forEach((node) => {
          logger.info(`   ${node.icon} ${node.displayName} (${node.documents.length} 个文档)`)
        })
        logger.info('')
      })
    }
  } catch (error) {
    const errorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    }

    if (options.format === 'json') {
      console.log(JSON.stringify(errorResponse, null, 2))
    } else {
      logger.error('列出项目结构失败:', error)
    }
    process.exit(1)
  }
}
