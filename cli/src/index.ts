#!/usr/bin/env node
import { Command } from 'commander'
import { serveCommand } from './commands/serve.js'
import { listCommand } from './commands/list.js'
import { readCommand } from './commands/read.js'
import { writeCommand } from './commands/write.js'
import { watchCommand } from './commands/watch.js'
import {
  addCommentCommand,
  listCommentsCommand,
  updateCommentCommand,
  deleteCommentCommand,
} from './commands/comment.js'

const program = new Command()

program
  .name('speckit-ui')
  .description('Spec-Kit UI Viewer - CLI 工具用于启动和管理项目文档')
  .version('1.0.0')

// 注册 serve 命令
program
  .command('serve')
  .description('启动本地开发服务器')
  .argument('[project-path]', '项目根目录路径', '.')
  .option('-p, --port <port>', '服务端口', '3000')
  .option('--host <host>', '服务主机', 'localhost')
  .option('--no-open', '不自动打开浏览器')
  .option('-v, --verbose', '详细日志输出', false)
  .action(serveCommand)

// 注册 list 命令
program
  .command('list')
  .description('列出项目结构和文档')
  .argument('[project-path]', '项目根目录路径', '.')
  .option('-f, --format <format>', '输出格式 (json|text)', 'json')
  .option('-v, --verbose', '详细输出', false)
  .action(listCommand)

// 注册 read 命令
program
  .command('read')
  .description('读取文档内容')
  .argument('<file-path>', '文档文件路径')
  .option('-f, --format <format>', '输出格式 (json|text)', 'json')
  .option('--project-root <path>', '项目根目录 (用于路径验证)', process.cwd())
  .action(readCommand)

// 注册 write 命令
program
  .command('write')
  .description('写入文档内容')
  .argument('<file-path>', '文档文件路径')
  .argument('<content>', '文档内容')
  .option('-f, --format <format>', '输出格式 (json|text)', 'json')
  .option('--project-root <path>', '项目根目录 (用于路径验证)', process.cwd())
  .option('--expected-mtime <timestamp>', '预期的最后修改时间 (用于冲突检测)', (value) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      throw new Error(`无效的时间戳: ${value}`)
    }
    return num
  })
  .option('--force', '强制写入,忽略冲突检测', false)
  .action(writeCommand)

// 注册 watch 命令
program
  .command('watch')
  .description('监听文件变化')
  .argument('<file-path>', '要监听的文件路径')
  .option('-f, --format <format>', '输出格式 (json|text)', 'json')
  .option('--project-root <path>', '项目根目录 (用于路径验证)', process.cwd())
  .option('-v, --verbose', '详细输出', false)
  .action(watchCommand)

// 注册 comment 命令
const commentCommand = program.command('comment').description('管理文档评论')

// comment add 子命令
commentCommand
  .command('add')
  .description('添加新评论')
  .requiredOption('-d, --document-path <path>', '文档路径')
  .requiredOption('-f, --feature-id <id>', '特性 ID')
  .requiredOption('-c, --content <text>', '评论内容')
  .requiredOption('-a, --author <name>', '作者名称')
  .requiredOption('-s, --start-line <number>', '起始行号', parseInt)
  .requiredOption('-e, --end-line <number>', '结束行号', parseInt)
  .requiredOption('-t, --text-fragment <text>', '选中的文本片段')
  .option('--context-before <text>', '前置上下文')
  .option('--context-after <text>', '后置上下文')
  .option('-p, --parent-id <id>', '父评论 ID (用于回复)')
  .option('--format <format>', '输出格式 (json|text)', 'json')
  .option('--project-root <path>', '项目根目录', process.cwd())
  .action((options) => {
    addCommentCommand(options)
  })

// comment list 子命令
commentCommand
  .command('list')
  .description('列出文档的所有评论')
  .requiredOption('-d, --document-path <path>', '文档路径')
  .requiredOption('-f, --feature-id <id>', '特性 ID')
  .option('--status <status>', '按状态过滤 (open|resolved|archived)')
  .option('--format <format>', '输出格式 (json|text)', 'json')
  .option('--project-root <path>', '项目根目录', process.cwd())
  .action((options) => {
    listCommentsCommand(options)
  })

// comment update 子命令
commentCommand
  .command('update')
  .description('更新评论内容或状态')
  .requiredOption('-d, --document-path <path>', '文档路径')
  .requiredOption('-f, --feature-id <id>', '特性 ID')
  .requiredOption('-i, --comment-id <id>', '评论 ID')
  .option('-c, --content <text>', '新的评论内容')
  .option('--status <status>', '新的评论状态 (open|resolved|archived)')
  .option('--format <format>', '输出格式 (json|text)', 'json')
  .option('--project-root <path>', '项目根目录', process.cwd())
  .action((options) => {
    updateCommentCommand(options)
  })

// comment delete 子命令
commentCommand
  .command('delete')
  .description('删除评论 (包括其所有回复)')
  .requiredOption('-d, --document-path <path>', '文档路径')
  .requiredOption('-f, --feature-id <id>', '特性 ID')
  .requiredOption('-i, --comment-id <id>', '评论 ID')
  .option('--format <format>', '输出格式 (json|text)', 'json')
  .option('--project-root <path>', '项目根目录', process.cwd())
  .action((options) => {
    deleteCommentCommand(options)
  })

// 解析命令行参数
program.parse()
