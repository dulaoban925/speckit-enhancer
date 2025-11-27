import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/layout/Layout'
import { useAppStore } from '../../store'
import { useDashboardData } from './hooks/useDashboardData'
import { useMultiFileWatch } from './hooks/useFileWatcher'
import { useSmartRefresh } from './hooks/useSmartRefresh'
import OverviewCards from './components/OverviewCards'
import RefreshBanner from './components/RefreshBanner'
import DocumentHealthPanel from './components/DocumentHealthPanel'
import CollaborationPanel from './components/CollaborationPanel'
import UserStoryProgress from './components/UserStoryProgress'
import RiskPanel from './components/RiskPanel'
import ProgressTimeline from './components/ProgressTimeline'
import TaskDistribution from './components/TaskDistribution'

/**
 * 特性统计面板页面
 * 显示特性的多维度统计指标和可视化图表
 */
function FeatureDashboard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const setCurrentDocument = useAppStore((state) => state.setCurrentDocument)

  // 进入统计面板时清空当前文档选中状态
  useEffect(() => {
    setCurrentDocument(null)
  }, [])

  // 加载数据
  const { metrics, loading, error, reload } = useDashboardData(id || '')

  // 文件监视
  const filesToWatch = id
    ? [
        `specs/${id}/tasks.md`,
        `specs/${id}/spec.md`,
        `.specify/memory/comments/${id}/`,
      ]
    : []

  useMultiFileWatch(filesToWatch, {
    enabled: !!id,
    onChange: () => {
      console.log('[FeatureDashboard] Files changed, triggering refresh')
      triggerUpdate()
    },
  })

  // 智能刷新
  const { hasUpdate, triggerUpdate, manualRefresh } = useSmartRefresh(reload, {
    enabled: !!id,
  })

  // 加载状态
  if (loading) {
    return (
      <Layout showSidebar={true} enableSearch={true}>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gh-fg-muted">加载中...</div>
          </div>
        </div>
      </Layout>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Layout showSidebar={true} enableSearch={true}>
        <div className="p-8">
          <div className="bg-gh-canvas-subtle border border-gh-danger-emphasis rounded-lg p-6">
            <h3 className="text-gh-danger-emphasis font-semibold mb-2">加载失败</h3>
            <p className="text-gh-fg-muted text-sm mb-4">{error}</p>
            <button
              onClick={reload}
              className="px-4 py-2 bg-gh-danger-emphasis text-white rounded-md hover:opacity-90 transition-opacity"
            >
              重试
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // 无数据
  if (!metrics) {
    return (
      <Layout showSidebar={true} enableSearch={true}>
        <div className="p-8">
          <div className="text-center text-gh-fg-muted">
            <p>未找到特性数据</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout showSidebar={true} enableSearch={true}>
      {/* 更新提示横幅 */}
      <RefreshBanner
        show={hasUpdate}
        onRefresh={manualRefresh}
        onDismiss={() => triggerUpdate()}
      />

      {/* 使用 flex 布局，让顶部固定，内容可滚动 */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* 固定顶部区域 */}
        <div className="flex-shrink-0 border-b border-gh-border-default bg-gh-canvas-default">
          <div className="px-8 pt-8 max-w-7xl mx-auto">
            {/* 面包屑导航 */}
            <nav className="flex items-center gap-2 text-sm mb-6">
              <button
                onClick={() => navigate('/')}
                className="text-gh-accent-fg hover:underline"
              >
                首页
              </button>
              <span className="text-gh-fg-muted">/</span>
              <span className="text-gh-fg-muted">特性列表</span>
              <span className="text-gh-fg-muted">/</span>
              <span className="text-gh-fg-default font-medium">{metrics.featureId}</span>
            </nav>

            {/* 页面标题 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gh-fg-default mb-2">
                  {metrics.featureName}
                </h1>
                <p className="text-gh-fg-muted text-sm">
                  特性编号: {metrics.featureId} | 最后更新:{' '}
                  {metrics.lastUpdated.toLocaleString('zh-CN')}
                </p>
              </div>
              <button
                onClick={reload}
                className="px-4 py-2 bg-gh-accent-emphasis text-white rounded-md hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                手动刷新
              </button>
            </div>
          </div>
        </div>

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {/* 概览卡片 */}
            <OverviewCards metrics={metrics} />

            {/* 主内容区 - 优化的两栏布局 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧主要内容栏 */}
              <div className="space-y-6">
                {/* 文档健康度面板 */}
                <DocumentHealthPanel metrics={metrics.documents} />

                {/* 用户故事进度面板 */}
                <UserStoryProgress metrics={metrics.userStories} />

                {/* 任务分布图表 */}
                <TaskDistribution
                  metrics={metrics.progress}
                  onStatusClick={(status) => {
                    console.log('Show tasks with status:', status)
                    // TODO: 显示对应状态的任务列表
                  }}
                />
              </div>

              {/* 右侧辅助内容栏 */}
              <div className="space-y-6">
                {/* 协作活跃度面板 */}
                <CollaborationPanel metrics={metrics.collaboration} />

                {/* 风险识别面板 */}
                <RiskPanel metrics={metrics.risks} />
              </div>
            </div>

            {/* 底部全宽图表区域 */}
            <div className="mt-6">
              {/* 进度时间线图表 */}
              <ProgressTimeline
                metrics={metrics}
                onPhaseClick={(phaseName) => {
                  console.log('Navigate to phase:', phaseName)
                  // TODO: 导航到 tasks.md 对应阶段
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default FeatureDashboard
