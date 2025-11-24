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
  .name('speckit-enhancer')
  .description('Speckit Enhancer - CLI 工具用于启动 Dashboard 和管理项目文档')
  .version('1.0.0')
  .alias('ske')

// ==================== Dashboard 命令组 ====================
const dashboardCmd = program
  .command('dashboard')
  .description('Dashboard UI 管理')
  .alias('dash')

dashboardCmd
  .command('start')
  .description('启动 Dashboard UI')
  .argument('[project-path]', '项目根目录路径', '.')
  .option('-p, --port <port>', '服务端口', '3000')
  .option('-h, --host <host>', '服务主机', 'localhost')
  .option('-o, --open', '自动打开浏览器', true)
  .option('--no-open', '不自动打开浏览器')
  .option('-v, --verbose', '详细日志输出', false)
  .action(serveCommand)

// dashboard 默认 action 为 start
dashboardCmd
  .argument('[project-path]', '项目根目录路径', '.')
  .option('-p, --port <port>', '服务端口', '3000')
  .option('-h, --host <host>', '服务主机', 'localhost')
  .option('-o, --open', '自动打开浏览器', true)
  .option('--no-open', '不自动打开浏览器')
  .option('-v, --verbose', '详细日志输出', false)
  .action(serveCommand)

// ==================== Docs 命令组 ====================
const docsCmd = program.command('docs').description('文档管理')

docsCmd
  .command('list')
  .description('列出项目结构和文档')
  .argument('[project-path]', '项目根目录路径', '.')
  .option('-f, --format <format>', '输出格式 (json|text)', 'json')
  .option('-v, --verbose', '详细输出', false)
  .action(listCommand)

docsCmd
  .command('read')
  .description('读取文档内容')
  .argument('<file-path>', '文档文件路径')
  .option('-f, --format <format>', '输出格式 (json|text)', 'json')
  .option('-r, --project-root <path>', '项目根目录', process.cwd())
  .action(readCommand)

docsCmd
  .command('write')
  .description('写入文档内容')
  .argument('<file-path>', '文档文件路径')
  .argument('<content>', '文档内容')
  .option('-f, --format <format>', '输出格式 (json|text)', 'json')
  .option('-r, --project-root <path>', '项目根目录', process.cwd())
  .option('-e, --expected-mtime <timestamp>', '预期的最后修改时间 (用于冲突检测)', (value) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      throw new Error(`无效的时间戳: ${value}`)
    }
    return num
  })
  .option('-F, --force', '强制写入,忽略冲突检测', false)
  .action(writeCommand)

docsCmd
  .command('watch')
  .description('监听文件变化')
  .argument('<file-path>', '要监听的文件路径')
  .option('-f, --format <format>', '输出格式 (json|text)', 'json')
  .option('-r, --project-root <path>', '项目根目录', process.cwd())
  .option('-v, --verbose', '详细输出', false)
  .action(watchCommand)

// ==================== Comment 命令组 ====================
const commentCmd = program.command('comment').description('评论管理')

commentCmd
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
  .option('-F, --format <format>', '输出格式 (json|text)', 'json')
  .option('-r, --project-root <path>', '项目根目录', process.cwd())
  .action((options) => {
    addCommentCommand(options)
  })

commentCmd
  .command('list')
  .description('列出文档的所有评论')
  .requiredOption('-d, --document-path <path>', '文档路径')
  .requiredOption('-f, --feature-id <id>', '特性 ID')
  .option('-S, --status <status>', '按状态过滤 (open|resolved|archived)')
  .option('-F, --format <format>', '输出格式 (json|text)', 'json')
  .option('-r, --project-root <path>', '项目根目录', process.cwd())
  .action((options) => {
    listCommentsCommand(options)
  })

commentCmd
  .command('update')
  .description('更新评论内容或状态')
  .argument('<comment-id>', '评论 ID')
  .requiredOption('-d, --document-path <path>', '文档路径')
  .requiredOption('-f, --feature-id <id>', '特性 ID')
  .option('-c, --content <text>', '新的评论内容')
  .option('-S, --status <status>', '新的评论状态 (open|resolved|archived)')
  .option('-F, --format <format>', '输出格式 (json|text)', 'json')
  .option('-r, --project-root <path>', '项目根目录', process.cwd())
  .action((commentId, options) => {
    updateCommentCommand({ ...options, commentId })
  })

commentCmd
  .command('delete')
  .description('删除评论 (包括其所有回复)')
  .argument('<comment-id>', '评论 ID')
  .requiredOption('-d, --document-path <path>', '文档路径')
  .requiredOption('-f, --feature-id <id>', '特性 ID')
  .option('-F, --format <format>', '输出格式 (json|text)', 'json')
  .option('-r, --project-root <path>', '项目根目录', process.cwd())
  .action((commentId, options) => {
    deleteCommentCommand({ ...options, commentId })
  })

// ==================== Project 命令组 ====================
const projectCmd = program.command('project').description('项目管理')

projectCmd
  .command('init')
  .description('初始化 Speckit 项目')
  .argument('[project-path]', '项目路径', '.')
  .option('-t, --template <name>', '项目模板', 'default')
  .action((projectPath, options) => {
    console.log(`正在初始化项目: ${projectPath}`)
    console.log(`使用模板: ${options.template}`)
    console.log('此功能即将推出...')
  })

projectCmd
  .command('info')
  .description('显示项目信息')
  .argument('[project-path]', '项目路径', '.')
  .option('-f, --format <format>', '输出格式 (json|text)', 'json')
  .action((projectPath, options) => {
    console.log(`正在查看项目信息: ${projectPath}`)
    console.log(`输出格式: ${options.format}`)
    console.log('此功能即将推出...')
  })

projectCmd
  .command('validate')
  .description('验证项目结构')
  .argument('[project-path]', '项目路径', '.')
  .option('-s, --strict', '严格验证模式', false)
  .action((projectPath, options) => {
    console.log(`正在验证项目: ${projectPath}`)
    console.log(`严格模式: ${options.strict}`)
    console.log('此功能即将推出...')
  })

// 解析命令行参数
program.parse()
