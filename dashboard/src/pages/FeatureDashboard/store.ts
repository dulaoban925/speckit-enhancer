/**
 * 特性统计面板 - 独立状态管理 Store
 * 使用 Zustand + Redux DevTools
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { FeatureDashboardMetrics } from './types/metrics'

/**
 * 缓存条目
 */
interface CacheEntry {
  data: FeatureDashboardMetrics
  timestamp: number
}

/**
 * Dashboard 状态接口
 */
interface DashboardState {
  // 数据状态
  metrics: FeatureDashboardMetrics | null
  loading: boolean
  error: string | null
  lastRefresh: Date | null

  // 缓存 (30秒 TTL)
  cache: Map<string, CacheEntry>

  // UI 状态
  exportDialogOpen: boolean
  performancePanelOpen: boolean

  // Actions - 数据操作
  setMetrics: (metrics: FeatureDashboardMetrics | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  refresh: () => void
  clear: () => void

  // Actions - 缓存操作
  getFromCache: (featureId: string, maxAge: number) => FeatureDashboardMetrics | null
  setCache: (featureId: string, data: FeatureDashboardMetrics) => void
  clearCache: () => void

  // Actions - UI 操作
  setExportDialogOpen: (open: boolean) => void
  setPerformancePanelOpen: (open: boolean) => void
}

/**
 * 创建 Dashboard Store
 */
export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      metrics: null,
      loading: false,
      error: null,
      lastRefresh: null,
      cache: new Map(),
      exportDialogOpen: false,
      performancePanelOpen: false,

      // 数据操作
      setMetrics: (metrics) =>
        set(
          {
            metrics,
            lastRefresh: new Date(),
            error: null,
            loading: false,
          },
          false,
          'setMetrics'
        ),

      setLoading: (loading) => set({ loading }, false, 'setLoading'),

      setError: (error) =>
        set({ error, loading: false }, false, 'setError'),

      refresh: () => set({ lastRefresh: new Date() }, false, 'refresh'),

      clear: () =>
        set(
          {
            metrics: null,
            loading: false,
            error: null,
            lastRefresh: null,
          },
          false,
          'clear'
        ),

      // 缓存操作
      getFromCache: (featureId, maxAge) => {
        const cached = get().cache.get(featureId)
        if (!cached) return null

        const age = Date.now() - cached.timestamp
        if (age > maxAge) {
          // 缓存过期,清除
          const cache = new Map(get().cache)
          cache.delete(featureId)
          set({ cache }, false, 'clearExpiredCache')
          return null
        }

        return cached.data
      },

      setCache: (featureId, data) => {
        const cache = new Map(get().cache)
        cache.set(featureId, { data, timestamp: Date.now() })
        set({ cache }, false, 'setCache')
      },

      clearCache: () => set({ cache: new Map() }, false, 'clearCache'),

      // UI 操作
      setExportDialogOpen: (open) =>
        set({ exportDialogOpen: open }, false, 'setExportDialogOpen'),

      setPerformancePanelOpen: (open) =>
        set({ performancePanelOpen: open }, false, 'setPerformancePanelOpen'),
    }),
    { name: 'dashboard-store' }
  )
)
