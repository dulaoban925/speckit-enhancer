/**
 * 文档健康度指标计算器
 */

import type { DocumentMetrics, DocumentInfo, DocStatus } from '../../types/metrics'

/**
 * 核心文档列表
 */
const CORE_DOCUMENTS = [
  'spec.md',
  'plan.md',
  'tasks.md',
  'research.md',
  'data-model.md',
  'contracts/',
  'quickstart.md',
]

/**
 * 计算文档健康度指标
 * TODO: 完整实现计算逻辑
 */
export function calculateDocumentMetrics(
  featureDir: string,
  fileStats: Record<string, { exists: boolean; size: number; lastModified: Date }>
): DocumentMetrics {
  const documents: DocumentInfo[] = CORE_DOCUMENTS.map((name) => {
    const stats = fileStats[name] || { exists: false, size: 0, lastModified: new Date() }
    const status = determineDocStatus(stats.exists, stats.size, stats.lastModified)

    return {
      name,
      path: `${featureDir}/${name}`,
      ...stats,
      status,
    }
  })

  // 计算覆盖率
  const existingDocs = documents.filter((d) => d.exists && d.size >= 100)
  const coverage = (existingDocs.length / CORE_DOCUMENTS.length) * 100

  // 计算平均更新间隔
  const totalAge = existingDocs.reduce((sum, doc) => {
    const age = (Date.now() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24)
    return sum + age
  }, 0)
  const averageUpdateAge = existingDocs.length > 0 ? totalAge / existingDocs.length : 0

  return {
    coverage: Math.round(coverage),
    documents,
    averageUpdateAge: Math.round(averageUpdateAge),
  }
}

/**
 * 确定文档状态
 */
function determineDocStatus(exists: boolean, size: number, lastModified: Date): DocStatus {
  if (!exists || size < 100) return 'missing'

  const daysSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceModified > 30) return 'stale'

  return 'ok'
}
