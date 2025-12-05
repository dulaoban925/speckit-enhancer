/**
 * Git 操作封装
 * 参考: specs/004-project-cli-commands/research.md
 */

import { execa } from 'execa';

/**
 * 检查目录是否为 Git 仓库
 */
export async function isGitRepository(dir: string = process.cwd()): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--git-dir'], { cwd: dir });
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取当前分支名称
 */
export async function getCurrentBranch(cwd: string = process.cwd()): Promise<string | null> {
  try {
    const { stdout } = await execa('git', ['branch', '--show-current'], { cwd });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * 获取主分支名称
 */
export async function getMainBranch(cwd: string = process.cwd()): Promise<string> {
  try {
    // 尝试获取远程 HEAD 指向的分支
    const { stdout } = await execa('git', ['symbolic-ref', 'refs/remotes/origin/HEAD'], { cwd });
    // 输出格式: refs/remotes/origin/main
    const parts = stdout.split('/');
    return parts[parts.length - 1].trim();
  } catch {
    // 后备方案:检查 main 和 master 是否存在
    try {
      await execa('git', ['rev-parse', '--verify', 'main'], { cwd });
      return 'main';
    } catch {
      try {
        await execa('git', ['rev-parse', '--verify', 'master'], { cwd });
        return 'master';
      } catch {
        // 默认返回 main
        return 'main';
      }
    }
  }
}

/**
 * 列出所有特性分支
 */
export async function listFeatureBranches(
  prefix: string = '',
  cwd: string = process.cwd()
): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['branch', '--list', '--format=%(refname:short)'], {
      cwd,
    });
    const branches = stdout.split('\n').filter(Boolean);

    if (prefix) {
      return branches.filter((b) => b.startsWith(prefix));
    }

    // 过滤掉主分支
    const mainBranches = ['main', 'master', 'develop'];
    return branches.filter((b) => !mainBranches.includes(b));
  } catch {
    return [];
  }
}

/**
 * 获取分支提交数(相对于主分支)
 */
export async function getBranchCommitCount(
  branch: string,
  cwd: string = process.cwd()
): Promise<number> {
  try {
    const mainBranch = await getMainBranch(cwd);
    const { stdout } = await execa('git', ['rev-list', '--count', `${mainBranch}..${branch}`], {
      cwd,
    });
    return parseInt(stdout.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * 列出所有分支
 */
export async function listAllBranches(cwd: string = process.cwd()): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['branch', '--list', '--format=%(refname:short)'], {
      cwd,
    });
    return stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * 检查分支是否存在
 */
export async function branchExists(
  branch: string,
  cwd: string = process.cwd()
): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--verify', branch], { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取文件的最后修改时间(Git 提交时间)
 */
export async function getFileLastModifiedTime(
  filePath: string,
  cwd: string = process.cwd()
): Promise<Date | null> {
  try {
    const { stdout } = await execa(
      'git',
      ['log', '-1', '--format=%aI', '--', filePath],
      { cwd }
    );
    return stdout.trim() ? new Date(stdout.trim()) : null;
  } catch {
    return null;
  }
}

/**
 * 获取文件的创建时间(首次提交时间)
 */
export async function getFileCreatedTime(
  filePath: string,
  cwd: string = process.cwd()
): Promise<Date | null> {
  try {
    const { stdout } = await execa(
      'git',
      ['log', '--diff-filter=A', '--format=%aI', '--', filePath],
      { cwd }
    );
    const lines = stdout.trim().split('\n').filter(Boolean);
    return lines.length > 0 ? new Date(lines[lines.length - 1]) : null;
  } catch {
    return null;
  }
}

/**
 * 检查是否有未提交的更改
 */
export async function hasUncommittedChanges(cwd: string = process.cwd()): Promise<boolean> {
  try {
    const { stdout } = await execa('git', ['status', '--porcelain'], { cwd });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * 获取 Git 配置
 */
export async function getGitConfig(
  key: string,
  cwd: string = process.cwd()
): Promise<string | null> {
  try {
    const { stdout } = await execa('git', ['config', '--get', key], { cwd });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * 安全执行 Git 操作(带错误处理)
 */
export async function safeGitOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn(`${errorMessage}: ${error}`);
    return fallback;
  }
}
