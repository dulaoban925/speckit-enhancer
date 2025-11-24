import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useProject } from '../hooks/useProject'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Button from '../components/common/Button'

const Home: React.FC = () => {
  const { project, loading, error } = useProject()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gh-canvas-default flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl">
            {/* 页面标题 */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gh-fg-default mb-2">
                {project?.name || 'Speckit Enhancer'}
              </h1>
              <p className="text-gh-fg-muted">
                Spec-Kit 增强工具 - 文档可视化和管理
              </p>
            </header>

            {/* 加载状态 */}
            {loading && (
              <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gh-accent-fg"></div>
                  <span className="text-gh-fg-muted">正在加载项目数据...</span>
                </div>
              </div>
            )}

            {/* 错误状态 */}
            {error && !loading && (
              <div className="bg-gh-canvas-subtle border border-gh-danger-emphasis rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gh-danger-emphasis mb-2">
                  加载失败
                </h2>
                <p className="text-gh-fg-muted mb-4">{error}</p>
                <div className="text-sm text-gh-fg-subtle">
                  <p className="mb-2">可能的原因:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>CLI 服务未启动或无法连接</li>
                    <li>不是有效的 Speckit 项目目录</li>
                    <li>缺少 .specify/ 或 specs/ 目录</li>
                  </ul>
                  <p className="mt-4">
                    提示: 确保在 Speckit 项目根目录运行{' '}
                    <code className="bg-gh-canvas-default px-2 py-1 rounded">
                      ske dashboard
                    </code>
                  </p>
                </div>
              </div>
            )}

            {/* 项目信息 */}
            {project && !loading && !error && (
              <div className="space-y-6">
                {/* 宪章信息 */}
                {project.constitution && (
                  <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-gh-fg-default mb-2 flex items-center gap-2">
                          📜 项目宪章
                        </h2>
                        <p className="text-gh-fg-muted">
                          定义项目的核心原则和架构约束
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/document/${project.constitution?.relativePath}`)}
                      >
                        查看宪章
                      </Button>
                    </div>
                  </div>
                )}

                {/* 特性列表 */}
                <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6">
                  <h2 className="text-2xl font-semibold text-gh-fg-default mb-4">
                    特性列表
                  </h2>

                  {project.features.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.features.map((feature) => (
                        <div
                          key={feature.id}
                          className="bg-gh-canvas-default border border-gh-border-default rounded-lg p-4 hover:border-gh-accent-fg transition-colors cursor-pointer"
                          onClick={() => navigate(`/feature/${feature.id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-gh-fg-muted bg-gh-canvas-subtle px-2 py-1 rounded">
                                #{feature.id}
                              </span>
                              <span className="inline-block px-2 py-1 text-xs rounded bg-gh-success-emphasis text-white">
                                {feature.status}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-gh-fg-default mb-1">
                            {feature.displayName}
                          </h3>
                          <p className="text-sm text-gh-fg-muted mb-3">
                            {feature.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gh-fg-subtle">
                            <span>{feature.nodes.length} 个文档节点</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gh-fg-muted mb-4">暂无特性</p>
                      <p className="text-sm text-gh-fg-subtle">
                        在 specs/ 目录中创建特性目录以开始
                      </p>
                    </div>
                  )}
                </div>

                {/* 快速操作 */}
                <div className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-6">
                  <h2 className="text-2xl font-semibold text-gh-fg-default mb-4">
                    快速操作
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center gap-3 p-4 bg-gh-canvas-default border border-gh-border-default rounded-lg hover:border-gh-accent-fg transition-colors text-left">
                      <span className="text-2xl">📋</span>
                      <div>
                        <div className="font-semibold text-gh-fg-default">浏览规格</div>
                        <div className="text-sm text-gh-fg-muted">查看所有特性规格</div>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 bg-gh-canvas-default border border-gh-border-default rounded-lg hover:border-gh-accent-fg transition-colors text-left">
                      <span className="text-2xl">✓</span>
                      <div>
                        <div className="font-semibold text-gh-fg-default">任务跟踪</div>
                        <div className="text-sm text-gh-fg-muted">查看实施任务</div>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 p-4 bg-gh-canvas-default border border-gh-border-default rounded-lg hover:border-gh-accent-fg transition-colors text-left">
                      <span className="text-2xl">🔍</span>
                      <div>
                        <div className="font-semibold text-gh-fg-default">搜索文档</div>
                        <div className="text-sm text-gh-fg-muted">全文搜索</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Home
