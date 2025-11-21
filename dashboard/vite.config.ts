import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { spawn } from 'child_process'

// 执行命令并返回输出
function execCommand(command: string, args: string[], options: { cwd: string }): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, options)

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('error', (error) => {
      reject(error)
    })

    proc.on('close', (code) => {
      // CLI 总是在 stdout 输出 JSON（即使失败），所以不管退出码如何都返回 stdout
      // 前端会根据 JSON 中的 success 字段判断是否成功
      resolve({ stdout, stderr })
    })
  })
}

// API 中间件插件
const cliApiPlugin = () => ({
  name: 'cli-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
            // 只处理 /api 路径
            if (!req.url?.startsWith('/api/')) {
              return next()
            }

            // 设置响应头
            res.setHeader('Content-Type', 'application/json')

            try {
              const url = new URL(req.url, `http://${req.headers.host}`)
              const command = url.pathname.replace('/api/', '')
              const projectRoot = process.env.SPECKIT_PROJECT_PATH || process.cwd()

              let cliCommand = ''
              let cliArgs: string[] = []

              // 根据 API 路径构建 CLI 命令
              if (command === 'list') {
                cliCommand = 'speckit-ui'
                cliArgs = ['list', '-f', 'json', projectRoot]
              } else if (command === 'read') {
                const filePath = url.searchParams.get('filePath')
                if (!filePath) {
                  res.statusCode = 400
                  res.end(JSON.stringify({ success: false, error: { code: 'INVALID_REQUEST', message: '缺少 filePath 参数' } }))
                  return
                }
                cliCommand = 'speckit-ui'
                cliArgs = ['read', '-f', 'json', filePath]
              } else if (command === 'write') {
                // 处理 POST 请求
                if (req.method !== 'POST') {
                  res.statusCode = 405
                  res.end(JSON.stringify({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '只支持 POST 请求' } }))
                  return
                }

                // 读取请求体
                let body = ''
                req.on('data', chunk => { body += chunk })
                req.on('end', async () => {
                  try {
                    const { filePath, content, expectedMtime } = JSON.parse(body)
                    if (!filePath || content === undefined) {
                      res.statusCode = 400
                      res.end(JSON.stringify({ success: false, error: { code: 'INVALID_REQUEST', message: '缺少 filePath 或 content 参数' } }))
                      return
                    }

                    cliCommand = 'speckit-ui'
                    cliArgs = ['write', '-f', 'json', filePath, content]
                    if (expectedMtime !== undefined) {
                      console.error(`[API] expectedMtime 接收值: ${expectedMtime} (类型: ${typeof expectedMtime})`)
                      cliArgs.push('--expected-mtime', String(expectedMtime))
                    }

                    console.log(`执行命令: speckit-ui ${cliArgs.slice(0, 4).join(' ')} [content...]`)
                    console.error(`[API] CLI 参数:`, cliArgs.slice(0, 4), `--expected-mtime ${expectedMtime}`)
                    const { stdout, stderr } = await execCommand(cliCommand, cliArgs, { cwd: projectRoot })

                    if (stderr) {
                      console.error('CLI stderr:', stderr)
                    }

                    console.error(`[API] CLI stdout (前200字符):`, stdout.substring(0, 200))
                    console.error(`[API] 返回给前端的响应`)

                    res.end(stdout)
                  } catch (error) {
                    console.error('写入失败:', error)
                    res.statusCode = 500
                    res.end(JSON.stringify({ success: false, error: { code: 'EXECUTION_ERROR', message: error instanceof Error ? error.message : String(error) } }))
                  }
                })
                return
              } else {
                res.statusCode = 404
                res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: `未知的 API 命令: ${command}` } }))
                return
              }

              // 执行 CLI 命令
              console.log(`执行命令: ${cliCommand} ${cliArgs.join(' ')}`)
              const { stdout, stderr } = await execCommand(cliCommand, cliArgs, { cwd: projectRoot })

              if (stderr) {
                console.error('CLI stderr:', stderr)
              }

              // 返回 CLI 输出
              res.end(stdout)
            } catch (error) {
              console.error('API 错误:', error)
              res.statusCode = 500
              res.end(JSON.stringify({
                success: false,
                error: {
                  code: 'EXECUTION_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              }))
            }
          })
        },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cliApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: 'localhost',
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'markdown-vendor': ['marked', 'prism-react-renderer'],
        },
      },
    },
  },
})
