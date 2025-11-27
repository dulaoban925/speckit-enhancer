import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { CLIService } from '../services/cliService'

/**
 * 项目加载 Hook
 * 负责在应用启动时加载项目数据
 * 只会在 project 为 null 时加载一次，避免重复请求
 */
export function useProject() {
  const { project, setProject, setLoading, setError, loading } = useAppStore()
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // 如果项目已加载或正在加载，跳过
    if (project || loading || hasLoadedRef.current) {
      return
    }

    hasLoadedRef.current = true
    loadProject()
  }, [project, loading])

  const loadProject = async () => {
    try {
      setLoading(true)
      setError(null)

      // 调用 CLI list 命令获取项目结构
      const response = await CLIService.listProject()

      if (response.success && response.data) {
        setProject(response.data)
      } else {
        setError(response.error?.message || '加载项目失败')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const refreshProject = async () => {
    hasLoadedRef.current = false
    await loadProject()
  }

  return {
    project,
    loading: useAppStore((state) => state.loading),
    error: useAppStore((state) => state.error),
    refreshProject,
  }
}
