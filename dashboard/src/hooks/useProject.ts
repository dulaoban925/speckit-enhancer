import { useEffect } from 'react'
import { useAppStore } from '../store'
import { CLIService } from '../services/cliService'

/**
 * 项目加载 Hook
 * 负责在应用启动时加载项目数据
 */
export function useProject() {
  const { project, setProject, setLoading, setError } = useAppStore()

  useEffect(() => {
    loadProject()
  }, [])

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
    await loadProject()
  }

  return {
    project,
    loading: useAppStore((state) => state.loading),
    error: useAppStore((state) => state.error),
    refreshProject,
  }
}
