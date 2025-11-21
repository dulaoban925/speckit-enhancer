import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Project, DocumentFile, UserSession } from '../types'

/**
 * 应用状态接口
 */
interface AppState {
  // 项目数据
  project: Project | null
  setProject: (project: Project | null) => void

  // 用户会话
  session: UserSession
  setSession: (session: Partial<UserSession>) => void

  // 当前文档
  currentDocument: DocumentFile | null
  setCurrentDocument: (document: DocumentFile | null) => void

  // 编辑状态
  isEditing: boolean
  editContent: string
  isDirty: boolean
  setEditMode: (editing: boolean) => void
  setEditContent: (content: string) => void
  setDirty: (dirty: boolean) => void

  // UI 状态
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // 加载状态
  loading: boolean
  setLoading: (loading: boolean) => void

  // 错误状态
  error: string | null
  setError: (error: string | null) => void
}

/**
 * 创建应用状态 store
 * 集成 Redux DevTools 用于调试
 */
export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // 初始状态
      project: null,
      session: {
        sessionId: crypto.randomUUID(),
        isDirty: false,
        userName: 'User', // 从系统或 Git config 获取
        theme: 'dark',
      },
      currentDocument: null,
      isEditing: false,
      editContent: '',
      isDirty: false,
      sidebarCollapsed: false,
      loading: false,
      error: null,

      // Actions
      setProject: (project) => set({ project }, false, 'setProject'),

      setSession: (sessionUpdate) =>
        set(
          (state) => ({ session: { ...state.session, ...sessionUpdate } }),
          false,
          'setSession'
        ),

      setCurrentDocument: (document) =>
        set({ currentDocument: document, isEditing: false, isDirty: false }, false, 'setCurrentDocument'),

      setEditMode: (editing) =>
        set((state) => ({
          isEditing: editing,
          editContent: editing && state.currentDocument ? state.currentDocument.content || '' : '',
        }), false, 'setEditMode'),

      setEditContent: (content) =>
        set((state) => ({
          editContent: content,
          isDirty: content !== (state.currentDocument?.content || ''),
        }), false, 'setEditContent'),

      setDirty: (dirty) => set({ isDirty: dirty }, false, 'setDirty'),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }), false, 'toggleSidebar'),

      setLoading: (loading) => set({ loading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),
    }),
    {
      name: 'speckit-enhancer-store',
    }
  )
)
