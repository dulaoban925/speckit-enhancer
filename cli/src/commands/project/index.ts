/**
 * ske project 命令组
 * 参考: specs/004-project-cli-commands/contracts/project-commands.md
 */

import { Command } from 'commander';
import { createInitCommand } from './init.js';

/**
 * 创建 project 命令组
 */
export function createProjectCommand(): Command {
  const project = new Command('project')
    .description('增强版 Spec-Kit 项目管理命令')
    .summary('管理 Spec-Kit 项目的初始化、验证和配置');

  // 注册子命令
  project.addCommand(createInitCommand());

  // TODO: 注册其他子命令
  // project.addCommand(createInfoCommand());
  // project.addCommand(createValidateCommand());
  // project.addCommand(createExportCommand());
  // project.addCommand(createImportCommand());

  return project;
}
