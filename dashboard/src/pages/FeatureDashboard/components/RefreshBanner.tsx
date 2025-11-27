/**
 * RefreshBanner 组件
 * 当文件变化时显示更新提示横幅
 */

interface RefreshBannerProps {
  show: boolean
  onRefresh: () => void
  onDismiss: () => void
}

/**
 * RefreshBanner 组件
 */
export default function RefreshBanner({ show, onRefresh, onDismiss }: RefreshBannerProps) {
  if (!show) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-gh-accent-emphasis text-white rounded-lg shadow-lg px-6 py-3 flex items-center gap-4 border border-gh-accent-fg">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">有更新可用</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1 bg-white text-gh-accent-emphasis rounded hover:opacity-90 transition-opacity text-sm font-medium"
          >
            立即刷新
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1 bg-gh-accent-emphasis text-white rounded hover:opacity-80 transition-opacity text-sm border border-white/20"
          >
            忽略
          </button>
        </div>
      </div>
    </div>
  )
}
