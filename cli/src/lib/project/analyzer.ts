/**
 * 项目统计分析功能
 * 参考: specs/004-project-cli-commands/data-model.md
 */

import path from 'path';
import {
  ProjectInfo,
  ProjectStatistics,
  HealthMetrics,
  HealthGrade,
  FeatureStatus,
  DocumentType,
  HealthIssue,
} from '../../types/project.js';
import { fileExists, readProjectFile } from '../fs.js';

/**
 * 计算项目统计数据
 */
export async function calculateStatistics(project: ProjectInfo): Promise<ProjectStatistics> {
  const features = project.features;
  const totalFeatures = features.length;

  // 按状态分组
  const featuresByStatus = {
    [FeatureStatus.Draft]: features.filter((f) => f.status === FeatureStatus.Draft).length,
    [FeatureStatus.InProgress]: features.filter((f) => f.status === FeatureStatus.InProgress)
      .length,
    [FeatureStatus.Completed]: features.filter((f) => f.status === FeatureStatus.Completed)
      .length,
    [FeatureStatus.Archived]: features.filter((f) => f.status === FeatureStatus.Archived).length,
  };

  // 按优先级分组
  const featuresByPriority = {
    P1: features.filter((f) => f.priority === 'P1').length,
    P2: features.filter((f) => f.priority === 'P2').length,
    P3: features.filter((f) => f.priority === 'P3').length,
    Unknown: features.filter((f) => !f.priority).length,
  };

  // 计算提交数
  const totalCommits = features.reduce((sum, f) => sum + (f.commitCount || 0), 0);
  const avgCommitsPerFeature = totalFeatures > 0 ? totalCommits / totalFeatures : 0;

  // 计算文档数
  const totalDocuments = features.reduce((sum, f) => sum + f.documents.length, 0);

  // 按文档类型分组
  const documentsByType: Partial<Record<DocumentType, number>> = {};
  features.forEach((f) => {
    f.documents.forEach((doc) => {
      documentsByType[doc.type] = (documentsByType[doc.type] || 0) + 1;
    });
  });

  // 最近更新的特性(按更新时间排序,取前5个)
  const mostRecentFeatures = features
    .filter((f) => f.updatedAt)
    .sort((a, b) => (b.updatedAt!.getTime() - a.updatedAt!.getTime()))
    .slice(0, 5)
    .map((f) => f.id);

  return {
    totalFeatures,
    featuresByStatus,
    featuresByPriority,
    totalCommits,
    avgCommitsPerFeature,
    totalDocuments,
    documentsByType,
    mostRecentFeatures,
  };
}

/**
 * 计算项目健康度指标
 */
export async function calculateHealthMetrics(project: ProjectInfo): Promise<HealthMetrics> {
  // 1. 结构完整性(40%)
  const structureIntegrity = await calculateStructureIntegrity(project);

  // 2. 文档覆盖率(30%)
  const documentationCoverage = calculateDocumentationCoverage(project);

  // 3. 分支一致性(20%)
  const branchConsistency = calculateBranchConsistency(project);

  // 4. 宪章遵循度(10%)
  const constitutionCompliance = await calculateConstitutionCompliance(project);

  // 加权总分
  const overallScore = Math.round(
    structureIntegrity * 0.4 +
      documentationCoverage * 0.3 +
      branchConsistency * 0.2 +
      constitutionCompliance * 0.1
  );

  // 评级
  const grade = getHealthGrade(overallScore);

  // 收集问题
  const issues = await collectHealthIssues(project);

  return {
    overallScore,
    metrics: {
      structureIntegrity,
      documentationCoverage,
      branchConsistency,
      constitutionCompliance,
    },
    grade,
    issues,
  };
}

/**
 * 计算结构完整性评分
 */
async function calculateStructureIntegrity(project: ProjectInfo): Promise<number> {
  let score = 100;

  // 必需目录检查
  const requiredDirs = ['.specify', '.claude', 'specs'];
  const missingDirs = [];

  for (const dir of requiredDirs) {
    const dirPath = path.join(project.root, dir);
    if (!(await fileExists(dirPath))) {
      missingDirs.push(dir);
      score -= 20; // 每缺少一个必需目录扣20分
    }
  }

  // 特性目录结构检查
  for (const feature of project.features) {
    if (!feature.documents.some((d) => d.type === DocumentType.Spec)) {
      score -= 5; // 缺少 spec.md 扣5分
    }
  }

  return Math.max(0, score);
}

/**
 * 计算文档覆盖率评分
 */
function calculateDocumentationCoverage(project: ProjectInfo): number {
  if (project.features.length === 0) return 100;

  let totalScore = 0;

  for (const feature of project.features) {
    let featureScore = 0;

    // spec.md (必需,40%)
    if (feature.documents.some((d) => d.type === DocumentType.Spec)) {
      featureScore += 40;
    }

    // plan.md (推荐,30%)
    if (feature.documents.some((d) => d.type === DocumentType.Plan)) {
      featureScore += 30;
    }

    // tasks.md (推荐,20%)
    if (feature.documents.some((d) => d.type === DocumentType.Tasks)) {
      featureScore += 20;
    }

    // 其他文档(可选,10%)
    const optionalDocs = [DocumentType.Research, DocumentType.DataModel, DocumentType.Quickstart];
    const hasOptional = optionalDocs.some((type) => feature.documents.some((d) => d.type === type));
    if (hasOptional) {
      featureScore += 10;
    }

    totalScore += featureScore;
  }

  return Math.round(totalScore / project.features.length);
}

/**
 * 计算分支一致性评分
 */
function calculateBranchConsistency(project: ProjectInfo): number {
  if (!project.isGitRepo) return 100; // 非 Git 仓库不计分

  let score = 100;

  for (const feature of project.features) {
    // 进行中或已完成的特性应该有分支
    if (
      feature.status === FeatureStatus.InProgress ||
      feature.status === FeatureStatus.Completed
    ) {
      if (!feature.hasBranch) {
        score -= 10; // 缺少分支扣10分
      }
    }

    // 草稿特性不应该有分支(可选检查)
    if (feature.status === FeatureStatus.Draft && feature.hasBranch) {
      score -= 5; // 草稿有分支扣5分
    }
  }

  return Math.max(0, score);
}

/**
 * 计算宪章遵循度评分
 */
async function calculateConstitutionCompliance(project: ProjectInfo): Promise<number> {
  let score = 100;

  // 检查宪章文件是否存在
  if (!project.hasConstitution) {
    score -= 50;
  }

  // 检查 CLAUDE.md 是否引用宪章
  const claudeMdPath = path.join(project.root, 'CLAUDE.md');
  if (await fileExists(claudeMdPath)) {
    try {
      const content = await readProjectFile(claudeMdPath, project.root);
      if (!content.toLowerCase().includes('constitution')) {
        score -= 30;
      }
    } catch {
      // 忽略读取错误
    }
  } else {
    score -= 20;
  }

  return Math.max(0, score);
}

/**
 * 获取健康度等级
 */
function getHealthGrade(score: number): HealthGrade {
  if (score >= 90) return HealthGrade.Excellent;
  if (score >= 70) return HealthGrade.Good;
  if (score >= 50) return HealthGrade.Fair;
  return HealthGrade.Poor;
}

/**
 * 收集健康度问题
 */
async function collectHealthIssues(project: ProjectInfo): Promise<HealthIssue[]> {
  const issues: HealthIssue[] = [];

  // 检查必需目录
  const requiredDirs = [
    { name: '.specify', label: '.specify 目录' },
    { name: '.claude', label: '.claude 目录' },
    { name: 'specs', label: 'specs 目录' },
  ];

  for (const dir of requiredDirs) {
    const dirPath = path.join(project.root, dir.name);
    if (!(await fileExists(dirPath))) {
      issues.push({
        severity: 'error',
        category: 'structure',
        message: `缺少 ${dir.label}`,
        autoFixable: true,
        suggestion: `运行 ske project init 创建项目结构`,
      });
    }
  }

  // 检查宪章文件
  if (!project.hasConstitution) {
    issues.push({
      severity: 'warning',
      category: 'constitution',
      message: '缺少项目宪章文件',
      autoFixable: false,
      suggestion: '运行 /speckit.constitution 创建宪章文件',
    });
  }

  // 检查 CLAUDE.md 引用
  const claudeMdPath = path.join(project.root, 'CLAUDE.md');
  if (await fileExists(claudeMdPath)) {
    try {
      const content = await readProjectFile(claudeMdPath, project.root);
      if (!content.toLowerCase().includes('constitution')) {
        issues.push({
          severity: 'warning',
          category: 'constitution',
          message: 'CLAUDE.md 未引用宪章文件',
          autoFixable: false,
          suggestion: '运行 ske project init --skip-speckit 注入宪章约束',
        });
      }
    } catch {
      // 忽略读取错误
    }
  }

  // 检查特性文档
  for (const feature of project.features) {
    if (!feature.documents.some((d) => d.type === DocumentType.Spec)) {
      issues.push({
        severity: 'error',
        category: 'documentation',
        message: `特性 ${feature.id} 缺少 spec.md 文件`,
        featureId: feature.id,
        autoFixable: true,
        suggestion: '运行 ske project validate --fix 创建空模板',
      });
    }

    // 检查进行中的特性是否有 plan.md
    if (feature.status === FeatureStatus.InProgress) {
      if (!feature.documents.some((d) => d.type === DocumentType.Plan)) {
        issues.push({
          severity: 'warning',
          category: 'documentation',
          message: `特性 ${feature.id} 处于进行中状态但缺少 plan.md`,
          featureId: feature.id,
          autoFixable: false,
          suggestion: '运行 /speckit.plan 生成实现计划',
        });
      }
    }

    // 检查分支一致性
    if (
      (feature.status === FeatureStatus.InProgress ||
        feature.status === FeatureStatus.Completed) &&
      !feature.hasBranch
    ) {
      issues.push({
        severity: 'warning',
        category: 'branch',
        message: `特性 ${feature.id} 处于${feature.status}状态但没有对应分支`,
        featureId: feature.id,
        autoFixable: false,
        suggestion: `运行 git checkout -b ${feature.id} 创建分支`,
      });
    }
  }

  return issues;
}
