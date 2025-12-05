/**
 * ske project init 命令实现
 * 参考: specs/004-project-cli-commands/contracts/project-init.md
 */

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import {
  checkSpeckitAvailable,
  runSpeckitInit,
  isProjectInitialized,
  enhanceClaudeCommand,
  injectConstitutionConstraints,
} from '../../lib/project/enhancer.js';
import { fileExists } from '../../lib/fs.js';

interface InitOptions {
  verbose?: boolean;
  skipSpeckit?: boolean;
  skipEnhancement?: boolean;
  branchPrefix?: string;
}

/**
 * 创建 init 子命令
 */
export function createInitCommand(): Command {
  const init = new Command('init')
    .description('初始化增强版 Spec-Kit 项目')
    .argument('[project-path]', '项目目录路径(默认为当前目录)', '.')
    .option('-v, --verbose', '显示详细的初始化步骤')
    .option('--skip-speckit', '跳过 speckit init 调用(假设已初始化)')
    .option('--skip-enhancement', '仅运行 speckit init,跳过增强')
    .option('--branch-prefix <prefix>', '自定义分支前缀(如 "feature/")')
    .action(async (projectPath: string, options: InitOptions) => {
      await handleInit(projectPath, options);
    });

  return init;
}

/**
 * 处理 init 命令
 */
async function handleInit(projectPath: string, options: InitOptions): Promise<void> {
  const { verbose, skipSpeckit, skipEnhancement, branchPrefix } = options;

  try {
    // 解析项目路径
    const projectRoot = path.resolve(process.cwd(), projectPath);

    // 检查并创建项目目录
    if (!(await fileExists(projectRoot))) {
      if (verbose) {
        console.log(chalk.gray(`⏳ 创建项目目录: ${projectRoot}`));
      } else {
        console.log(chalk.blue(`⏳ 创建项目目录: ${projectRoot}`));
      }

      await fs.ensureDir(projectRoot);

      if (verbose) {
        console.log(chalk.green(`✅ 项目目录已创建\n`));
      }
    }

    // 前置检查
    if (verbose) {
      console.log(chalk.gray('⏳ 前置检查...'));
      console.log(chalk.gray(`  ℹ 项目目录: ${projectRoot}`));
    }

    // 检查 speckit CLI 是否可用
    if (!skipSpeckit) {
      const isAvailable = await checkSpeckitAvailable();
      if (!isAvailable) {
        console.error(chalk.red('❌ 依赖错误: 未找到 speckit CLI'));
        console.error(chalk.yellow('💡 请先安装 speckit CLI: npm install -g @speckit/cli'));
        process.exit(2);
      }

      if (verbose) {
        console.log(chalk.gray('  ℹ speckit CLI: 已安装'));
      }
    }

    // 检查是否已初始化
    const initialized = await isProjectInitialized(projectRoot);
    if (initialized && !skipSpeckit) {
      console.warn(chalk.yellow('⚠️  当前目录已经是 Spec-Kit 项目'));
      console.warn(chalk.yellow('💡 如果需要重新初始化,请删除 .specify/ 目录'));
      console.warn(chalk.yellow('💡 或使用 --skip-speckit 仅应用增强'));

      // 询问是否继续
      if (!skipEnhancement) {
        console.log(chalk.gray('\n将仅应用增强功能...'));
      } else {
        process.exit(0);
      }
    }

    if (verbose && !skipSpeckit) {
      console.log(chalk.gray('  ℹ 现有 Spec-Kit 项目: ') + (initialized ? '是' : '否'));
      console.log(chalk.green('✅ 前置检查通过\n'));
    }

    // 执行 speckit init
    if (!skipSpeckit) {
      if (!initialized) {
        console.log(chalk.blue('⏳ 初始化 Spec-Kit 项目...'));
        await runSpeckitInit(projectRoot, verbose);
        console.log(chalk.green('✅ 已初始化 Spec-Kit 项目\n'));
      }
    }

    // 应用增强
    if (!skipEnhancement) {
      console.log(chalk.blue('⏳ 应用增强...'));

      // 增强 Claude 命令
      const commandEnhanced = await enhanceClaudeCommand(projectRoot, branchPrefix);

      // 注入宪章约束
      const constitutionInjected = await injectConstitutionConstraints(projectRoot);

      if (!commandEnhanced && !constitutionInjected) {
        console.warn(chalk.yellow('\n⚠️  警告: 部分增强应用失败'));
        console.warn(chalk.gray('  某些配置文件可能不存在,请检查项目结构'));
      }

      console.log();
    }

    // 输出初始化摘要
    console.log(chalk.green.bold('✨ 项目初始化完成!\n'));

    // 显示项目位置(如果不是当前目录)
    if (path.resolve(projectRoot) !== path.resolve(process.cwd())) {
      console.log(chalk.bold('项目位置:'));
      console.log(chalk.cyan(`  ${projectRoot}\n`));
    }

    console.log(chalk.bold('项目结构:'));
    console.log(chalk.green('  ✅ .specify/          ') + chalk.gray('Spec-Kit 配置和模板'));
    console.log(chalk.green('  ✅ .claude/commands/  ') + chalk.gray('Claude 命令定义'));
    console.log(chalk.green('  ✅ specs/             ') + chalk.gray('特性规范目录'));
    console.log(chalk.green('  ✅ CLAUDE.md          ') + chalk.gray('Claude 代理配置(已增强)'));

    console.log(chalk.bold('\n下一步:'));

    // 根据项目路径调整提示
    if (path.resolve(projectRoot) !== path.resolve(process.cwd())) {
      console.log(chalk.gray(`  1. cd ${path.relative(process.cwd(), projectRoot)}`));
      console.log(chalk.gray('  2. 运行 ske project info 查看项目信息'));
      console.log(chalk.gray('  3. 运行 /speckit.specify "功能描述" 创建第一个特性'));
    } else {
      console.log(chalk.gray('  1. 运行 ske project info 查看项目信息'));
      console.log(chalk.gray('  2. 运行 /speckit.specify "功能描述" 创建第一个特性'));
    }
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 初始化失败: ${error.message}`));

    if (verbose && error.stack) {
      console.error(chalk.gray(error.stack));
    }

    process.exit(1);
  }
}
