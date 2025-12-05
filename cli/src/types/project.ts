/**
 * 项目管理相关的类型定义
 * 参考: specs/004-project-cli-commands/data-model.md
 */

/** 特性状态枚举 */
export enum FeatureStatus {
  /** 草稿:仅有 spec.md */
  Draft = 'draft',
  /** 进行中:有 plan.md 或 tasks.md */
  InProgress = 'in-progress',
  /** 已完成:有 .completed 标记文件或已合并到主分支 */
  Completed = 'completed',
  /** 已归档:特性目录在 .archived/ 或分支被删除 */
  Archived = 'archived',
}

/** 文档类型枚举 */
export enum DocumentType {
  Spec = 'spec.md',
  Plan = 'plan.md',
  Tasks = 'tasks.md',
  Research = 'research.md',
  DataModel = 'data-model.md',
  Quickstart = 'quickstart.md',
  Contract = 'contracts/*.md',
  Checklist = 'checklists/*.md',
}

/** 健康度等级 */
export enum HealthGrade {
  Excellent = 'excellent', // 90-100
  Good = 'good',          // 70-89
  Fair = 'fair',          // 50-69
  Poor = 'poor',          // 0-49
}

/** 验证问题类型 */
export enum ValidationIssueType {
  // 结构性问题(可自动修复)
  MissingDirectory = 'missing-directory',
  MissingRequiredFile = 'missing-required-file',
  InvalidDirectoryStructure = 'invalid-directory-structure',

  // 格式问题(需要手动修复)
  InvalidFrontmatter = 'invalid-frontmatter',
  InvalidMarkdown = 'invalid-markdown',
  MissingHeadings = 'missing-headings',
  InvalidFileNaming = 'invalid-file-naming',

  // 内容问题(需要手动修复)
  EmptyFile = 'empty-file',
  IncompleteSections = 'incomplete-sections',
  BrokenLinks = 'broken-links',

  // Git 问题
  BranchMismatch = 'branch-mismatch',
  UncommittedChanges = 'uncommitted-changes',

  // 宪章问题
  ConstitutionViolation = 'constitution-violation',
  MissingConstitutionReference = 'missing-constitution-reference',
}

/** 特性文档信息 */
export interface FeatureDocument {
  /** 文档类型 */
  type: DocumentType;
  /** 文档路径(相对于特性目录) */
  path: string;
  /** 文件大小(字节) */
  size: number;
  /** 是否存在 */
  exists: boolean;
  /** 最后修改时间 */
  modifiedAt?: Date;
}

/** 特性信息 */
export interface FeatureInfo {
  /** 特性 ID(如 "001-speckit-ui-viewer") */
  id: string;
  /** 特性编号(如 1) */
  number: number;
  /** 特性名称(如 "speckit-ui-viewer") */
  name: string;
  /** 特性标题(从 spec.md 提取) */
  title?: string;
  /** 特性状态 */
  status: FeatureStatus;
  /** 特性目录路径 */
  path: string;
  /** Git 分支名称(如果存在) */
  branch?: string;
  /** 是否有对应的 Git 分支 */
  hasBranch: boolean;
  /** 分支提交数(相对于主分支) */
  commitCount?: number;
  /** 已有文档列表 */
  documents: FeatureDocument[];
  /** 优先级(P1/P2/P3,从 spec.md frontmatter 提取) */
  priority?: 'P1' | 'P2' | 'P3';
  /** 创建时间(从 Git 或文件系统) */
  createdAt?: Date;
  /** 最后更新时间 */
  updatedAt?: Date;
}

/** 项目统计数据 */
export interface ProjectStatistics {
  /** 特性总数 */
  totalFeatures: number;
  /** 按状态分组的特性数量 */
  featuresByStatus: Record<FeatureStatus, number>;
  /** 按优先级分组的特性数量 */
  featuresByPriority: Record<'P1' | 'P2' | 'P3' | 'Unknown', number>;
  /** 总提交数(所有特性分支) */
  totalCommits: number;
  /** 平均每个特性的提交数 */
  avgCommitsPerFeature: number;
  /** 总文档数 */
  totalDocuments: number;
  /** 按文档类型分组的数量 */
  documentsByType: Partial<Record<DocumentType, number>>;
  /** 最活跃的特性(按最近更新排序) */
  mostRecentFeatures: string[]; // Feature IDs
}

/** 健康度问题 */
export interface HealthIssue {
  /** 问题严重性 */
  severity: 'error' | 'warning' | 'info';
  /** 问题类别 */
  category: 'structure' | 'documentation' | 'branch' | 'constitution';
  /** 问题描述 */
  message: string;
  /** 受影响的特性 ID(如果适用) */
  featureId?: string;
  /** 是否可自动修复 */
  autoFixable: boolean;
  /** 修复建议 */
  suggestion?: string;
}

/** 健康度指标 */
export interface HealthMetrics {
  /** 整体健康度评分(0-100) */
  overallScore: number;
  /** 子指标 */
  metrics: {
    /** 结构完整性(0-100) */
    structureIntegrity: number;
    /** 文档覆盖率(0-100) */
    documentationCoverage: number;
    /** 分支一致性(0-100) */
    branchConsistency: number;
    /** 宪章遵循度(0-100) */
    constitutionCompliance: number;
  };
  /** 健康度等级 */
  grade: HealthGrade;
  /** 问题列表 */
  issues: HealthIssue[];
}

/** 项目基本信息 */
export interface ProjectInfo {
  /** 项目名称(从 package.json 或目录名提取) */
  name: string;
  /** 项目根目录绝对路径 */
  root: string;
  /** 是否为 Git 仓库 */
  isGitRepo: boolean;
  /** 当前 Git 分支(如果在仓库中) */
  currentBranch?: string;
  /** 主分支名称(main 或 master) */
  mainBranch?: string;
  /** 是否已初始化 Spec-Kit 结构 */
  hasSpeckit: boolean;
  /** 是否已初始化 Spec-Kit Enhancer 结构 */
  hasEnhancer: boolean;
  /** 是否存在宪章文件 */
  hasConstitution: boolean;
  /** 宪章文件路径(如果存在) */
  constitutionPath?: string;
  /** 特性列表 */
  features: FeatureInfo[];
  /** 统计数据 */
  statistics: ProjectStatistics;
  /** 健康度指标 */
  health: HealthMetrics;
}

/** 验证问题 */
export interface ValidationIssue {
  /** 问题严重性 */
  severity: 'error' | 'warning' | 'info';
  /** 问题类型 */
  type: ValidationIssueType;
  /** 问题描述 */
  message: string;
  /** 受影响的路径 */
  path?: string;
  /** 受影响的特性 ID */
  featureId?: string;
  /** 是否可自动修复 */
  fixable: boolean;
  /** 是否已修复 */
  fixed: boolean;
  /** 修复建议 */
  suggestion?: string;
}

/** 验证结果 */
export interface ValidationResult {
  /** 验证是否通过 */
  passed: boolean;
  /** 验证问题列表 */
  issues: ValidationIssue[];
  /** 已自动修复的问题数量 */
  fixedCount: number;
  /** 需要手动修复的问题数量 */
  manualFixRequired: number;
  /** 验证时间 */
  validatedAt: Date;
}

/** 验证上下文 */
export interface ValidationContext {
  /** 项目根目录 */
  projectRoot: string;
  /** 特性列表 */
  features: FeatureInfo[];
  /** 当前验证的特性(如果适用) */
  currentFeature?: FeatureInfo;
}

/** 验证规则 */
export interface ValidationRule {
  /** 规则 ID */
  id: string;
  /** 规则名称 */
  name: string;
  /** 规则描述 */
  description: string;
  /** 规则严重性 */
  severity: 'error' | 'warning' | 'info';
  /** 规则类型 */
  type: ValidationIssueType;
  /** 是否可自动修复 */
  autoFixable: boolean;
  /** 验证函数 */
  validate: (context: ValidationContext) => Promise<ValidationIssue[]>;
  /** 修复函数(如果可自动修复) */
  fix?: (context: ValidationContext, issue: ValidationIssue) => Promise<void>;
}

/** 分支规则 */
export interface BranchRules {
  /** 分支前缀(如 "feature/") */
  prefix?: string;
  /** 分支命名模式(正则表达式) */
  pattern?: string;
  /** 是否自动创建分支 */
  autoCreate?: boolean;
  /** 主分支名称 */
  mainBranch?: string;
}

/** 项目配置 */
export interface ProjectConfig {
  /** 配置版本 */
  version: string;
  /** 项目元数据 */
  project: {
    name: string;
    description?: string;
    repository?: string;
  };
  /** Spec-Kit Enhancer 配置 */
  enhancer: {
    /** 是否启用 Claude 命令增强 */
    enableCommandEnhancement: boolean;
    /** 是否启用宪章约束注入 */
    enableConstitutionInjection: boolean;
    /** 自定义分支规则 */
    branchRules?: BranchRules;
    /** 自定义验证规则 */
    validationRules?: string[]; // Rule IDs to enable
  };
  /** 导出时间 */
  exportedAt: string;
  /** 导出者信息 */
  exportedBy?: {
    name?: string;
    email?: string;
  };
}

/** 导入选项 */
export interface ImportOptions {
  /** 配置文件路径 */
  configPath: string;
  /** 导入模式 */
  mode: 'merge' | 'overwrite';
  /** 是否验证配置 */
  validate: boolean;
  /** 冲突解决策略 */
  conflictResolution: 'keep' | 'replace' | 'prompt';
  /** 是否创建备份 */
  backup: boolean;
}

/** 导出选项 */
export interface ExportOptions {
  /** 输出文件路径 */
  outputPath: string;
  /** 输出格式 */
  format: 'json' | 'yaml';
  /** 是否包含敏感信息 */
  includeSensitive: boolean;
  /** 是否美化输出 */
  pretty: boolean;
}

/** Claude 命令增强配置 */
export interface ClaudeCommandEnhancement {
  /** 命令文件路径(相对于 .claude/commands/) */
  commandFile: string;
  /** 原始命令提示词 */
  originalPrompt: string;
  /** 增强后的命令提示词 */
  enhancedPrompt: string;
  /** 注入的指示列表 */
  injectedInstructions: string[];
  /** 是否已应用 */
  applied: boolean;
  /** 应用时间 */
  appliedAt?: Date;
}

/** 宪章约束注入配置 */
export interface ConstitutionInjection {
  /** 目标文件路径(通常是 CLAUDE.md) */
  targetFile: string;
  /** 宪章文件路径 */
  constitutionPath: string;
  /** 注入的约束内容 */
  injectedContent: string;
  /** 注入位置(行号或标记) */
  injectionPoint: string;
  /** 是否已注入 */
  injected: boolean;
  /** 注入时间 */
  injectedAt?: Date;
}

/** 自定义错误类型 */
export class ProjectError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ProjectError';
  }
}

export class ValidationError extends ProjectError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class DependencyError extends ProjectError {
  constructor(message: string) {
    super(message, 'DEPENDENCY_ERROR');
  }
}

export class ConfigurationError extends ProjectError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
  }
}

export class FileSystemError extends ProjectError {
  constructor(message: string) {
    super(message, 'FILE_SYSTEM_ERROR');
  }
}
