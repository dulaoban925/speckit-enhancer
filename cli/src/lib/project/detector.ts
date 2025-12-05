/**
 * 项目状态检测功能
 * 参考: specs/004-project-cli-commands/data-model.md
 */

import path from 'path';
import fs from 'fs-extra';
import matter from 'gray-matter';
import {
  ProjectInfo,
  FeatureInfo,
  FeatureStatus,
  FeatureDocument,
  DocumentType,
  HealthGrade,
} from '../../types/project.js';
import * as git from '../git.js';
import { fileExists, getFileStats, readDirectory, readProjectFile } from '../fs.js';

/**
 * 检测项目基本信息
 */
export async function detectProjectInfo(projectRoot: string): Promise<ProjectInfo> {
  const isGitRepo = await git.isGitRepository(projectRoot);
  const currentBranch = isGitRepo ? (await git.getCurrentBranch(projectRoot)) || undefined : undefined;
  const mainBranch = isGitRepo ? (await git.getMainBranch(projectRoot)) || undefined : undefined;

  // 检测项目名称
  const name = await detectProjectName(projectRoot);

  // 检测 Speckit 和 Enhancer 状态
  const hasSpeckit = await fileExists(path.join(projectRoot, '.specify'));
  const hasEnhancer = hasSpeckit; // 暂时简化:有 .specify 就认为有 enhancer

  // 检测宪章文件
  const constitutionPaths = [
    path.join(projectRoot, '.specify/memory/constitution.md'),
    path.join(projectRoot, 'constitution.md'),
  ];
  let constitutionPath: string | undefined;
  let hasConstitution = false;

  for (const p of constitutionPaths) {
    if (await fileExists(p)) {
      constitutionPath = p;
      hasConstitution = true;
      break;
    }
  }

  // 扫描特性
  const features = await scanFeatures(projectRoot);

  // 计算统计数据(在 analyzer.ts 中实现,这里先返回空对象)
  const statistics = {
    totalFeatures: features.length,
    featuresByStatus: {
      [FeatureStatus.Draft]: 0,
      [FeatureStatus.InProgress]: 0,
      [FeatureStatus.Completed]: 0,
      [FeatureStatus.Archived]: 0,
    },
    featuresByPriority: {
      P1: 0,
      P2: 0,
      P3: 0,
      Unknown: 0,
    },
    totalCommits: 0,
    avgCommitsPerFeature: 0,
    totalDocuments: 0,
    documentsByType: {},
    mostRecentFeatures: [],
  };

  // 计算健康度(在 analyzer.ts 中实现,这里先返回空对象)
  const health = {
    overallScore: 100,
    metrics: {
      structureIntegrity: 100,
      documentationCoverage: 100,
      branchConsistency: 100,
      constitutionCompliance: 100,
    },
    grade: HealthGrade.Excellent,
    issues: [],
  };

  return {
    name,
    root: projectRoot,
    isGitRepo,
    currentBranch,
    mainBranch,
    hasSpeckit,
    hasEnhancer,
    hasConstitution,
    constitutionPath,
    features,
    statistics,
    health,
  };
}

/**
 * 检测项目名称
 */
async function detectProjectName(projectRoot: string): Promise<string> {
  // 尝试从 package.json 读取
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (await fileExists(packageJsonPath)) {
    try {
      const content = await readProjectFile(packageJsonPath, projectRoot);
      const pkg = JSON.parse(content);
      if (pkg.name) {
        return pkg.name;
      }
    } catch {
      // 忽略解析错误
    }
  }

  // 后备方案:使用目录名
  return path.basename(projectRoot);
}

/**
 * 扫描所有特性
 */
export async function scanFeatures(projectRoot: string): Promise<FeatureInfo[]> {
  const specsDir = path.join(projectRoot, 'specs');

  if (!(await fileExists(specsDir))) {
    return [];
  }

  const entries = await readDirectory(specsDir);
  const features: FeatureInfo[] = [];

  for (const entry of entries) {
    const featurePath = path.join(specsDir, entry);
    const stats = await getFileStats(featurePath);

    // 跳过非目录或隐藏目录
    if (!stats?.isDirectory() || entry.startsWith('.')) {
      continue;
    }

    // 解析特性 ID
    const match = entry.match(/^(\d+)-(.+)$/);
    if (!match) {
      continue; // 跳过不符合命名规范的目录
    }

    const [, numberStr, name] = match;
    const number = parseInt(numberStr, 10);
    const id = entry;

    // 检测特性状态
    const status = await detectFeatureStatus(featurePath);

    // 检测分支
    const branch = await detectFeatureBranch(id, projectRoot);
    const hasBranch = branch !== undefined;
    const commitCount = hasBranch ? await git.getBranchCommitCount(branch!, projectRoot) : undefined;

    // 扫描文档
    const documents = await scanFeatureDocuments(featurePath);

    // 提取优先级和标题
    const specPath = path.join(featurePath, 'spec.md');
    let priority: 'P1' | 'P2' | 'P3' | undefined;
    let title: string | undefined;

    if (await fileExists(specPath)) {
      try {
        const content = await readProjectFile(specPath, projectRoot);
        const parsed = matter(content);
        priority = parsed.data.priority as 'P1' | 'P2' | 'P3' | undefined;
        title = parsed.data.title as string | undefined;
      } catch {
        // 忽略解析错误
      }
    }

    // 获取创建和更新时间
    const createdAt = await git.getFileCreatedTime(featurePath, projectRoot);
    const updatedAt = await git.getFileLastModifiedTime(featurePath, projectRoot);

    features.push({
      id,
      number,
      name,
      title,
      status,
      path: featurePath,
      branch,
      hasBranch,
      commitCount,
      documents,
      priority,
      createdAt: createdAt || undefined,
      updatedAt: updatedAt || undefined,
    });
  }

  // 按编号排序
  features.sort((a, b) => a.number - b.number);

  return features;
}

/**
 * 检测特性状态
 * 规则:
 * - 仅有 spec.md → draft
 * - 有 plan.md 或 tasks.md → in-progress
 * - 有 .completed 标记 → completed
 * - 目录在 .archived/ → archived
 */
export async function detectFeatureStatus(featurePath: string): Promise<FeatureStatus> {
  // 检查是否归档
  if (featurePath.includes('.archived/')) {
    return FeatureStatus.Archived;
  }

  // 检查完成标记
  if (await fileExists(path.join(featurePath, '.completed'))) {
    return FeatureStatus.Completed;
  }

  // 检查进行中
  const hasPlan = await fileExists(path.join(featurePath, 'plan.md'));
  const hasTasks = await fileExists(path.join(featurePath, 'tasks.md'));

  if (hasPlan || hasTasks) {
    return FeatureStatus.InProgress;
  }

  // 检查草稿
  const hasSpec = await fileExists(path.join(featurePath, 'spec.md'));
  if (hasSpec) {
    return FeatureStatus.Draft;
  }

  // 默认为草稿
  return FeatureStatus.Draft;
}

/**
 * 检测特性对应的分支
 * 规则:
 * 1. 完全匹配(如 "001-speckit-ui-viewer")
 * 2. 前缀匹配(如 "feature/001-speckit-ui-viewer")
 * 3. 名称匹配(如 "speckit-ui-viewer")
 */
export async function detectFeatureBranch(
  featureId: string,
  projectRoot: string
): Promise<string | undefined> {
  if (!(await git.isGitRepository(projectRoot))) {
    return undefined;
  }

  const branches = await git.listAllBranches(projectRoot);

  // 尝试完全匹配
  if (branches.includes(featureId)) {
    return featureId;
  }

  // 尝试前缀匹配
  const withPrefix = branches.find((b) => b.endsWith(featureId));
  if (withPrefix) {
    return withPrefix;
  }

  // 尝试名称匹配(去掉编号)
  const featureName = featureId.replace(/^\d+-/, '');
  const byName = branches.find((b) => b.includes(featureName));
  if (byName) {
    return byName;
  }

  return undefined;
}

/**
 * 扫描特性文档
 */
async function scanFeatureDocuments(featurePath: string): Promise<FeatureDocument[]> {
  const documents: FeatureDocument[] = [];
  const docTypes: Array<{ type: DocumentType; filename: string }> = [
    { type: DocumentType.Spec, filename: 'spec.md' },
    { type: DocumentType.Plan, filename: 'plan.md' },
    { type: DocumentType.Tasks, filename: 'tasks.md' },
    { type: DocumentType.Research, filename: 'research.md' },
    { type: DocumentType.DataModel, filename: 'data-model.md' },
    { type: DocumentType.Quickstart, filename: 'quickstart.md' },
  ];

  for (const { type, filename } of docTypes) {
    const filePath = path.join(featurePath, filename);
    const exists = await fileExists(filePath);

    if (exists) {
      const stats = await getFileStats(filePath);
      documents.push({
        type,
        path: filename,
        size: stats?.size || 0,
        exists: true,
        modifiedAt: stats?.mtime,
      });
    }
  }

  // 扫描 contracts/ 和 checklists/ 目录
  const contractsDir = path.join(featurePath, 'contracts');
  if (await fileExists(contractsDir)) {
    const files = await readDirectory(contractsDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(contractsDir, file);
        const stats = await getFileStats(filePath);
        documents.push({
          type: DocumentType.Contract,
          path: `contracts/${file}`,
          size: stats?.size || 0,
          exists: true,
          modifiedAt: stats?.mtime,
        });
      }
    }
  }

  const checklistsDir = path.join(featurePath, 'checklists');
  if (await fileExists(checklistsDir)) {
    const files = await readDirectory(checklistsDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(checklistsDir, file);
        const stats = await getFileStats(filePath);
        documents.push({
          type: DocumentType.Checklist,
          path: `checklists/${file}`,
          size: stats?.size || 0,
          exists: true,
          modifiedAt: stats?.mtime,
        });
      }
    }
  }

  return documents;
}
