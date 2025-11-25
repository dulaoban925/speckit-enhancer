import { useEffect } from 'react'

/**
 * 全局键盘快捷键定义
 */
export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean // Cmd on Mac
  shift?: boolean
  alt?: boolean
  description: string
  category: 'global' | 'search' | 'editor' | 'navigation'
}

/**
 * 应用所有可用的键盘快捷键
 */
export const ALL_SHORTCUTS: KeyboardShortcut[] = [
  // 全局快捷键
  {
    key: 'k',
    ctrl: true,
    meta: true,
    description: '打开全局搜索',
    category: 'global',
  },
  {
    key: 'f',
    ctrl: true,
    description: '打开全局搜索',
    category: 'global',
  },
  {
    key: 'Escape',
    description: '关闭弹窗/搜索',
    category: 'global',
  },
  {
    key: '?',
    shift: true,
    description: '显示快捷键帮助',
    category: 'global',
  },

  // 搜索快捷键
  {
    key: 'ArrowUp',
    description: '上一个搜索结果',
    category: 'search',
  },
  {
    key: 'ArrowDown',
    description: '下一个搜索结果',
    category: 'search',
  },
  {
    key: 'Enter',
    description: '打开选中的搜索结果',
    category: 'search',
  },

  // 编辑器快捷键
  {
    key: 's',
    ctrl: true,
    meta: true,
    description: '保存文档',
    category: 'editor',
  },
  {
    key: 'Tab',
    description: '插入缩进',
    category: 'editor',
  },
]

/**
 * 格式化快捷键显示文本
 * @param shortcut 快捷键定义
 * @returns 格式化的快捷键文本，如 "Cmd+K" 或 "Ctrl+S"
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const keys: string[] = []

  // 判断是否是 Mac
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  if (shortcut.ctrl && !isMac) {
    keys.push('Ctrl')
  }
  if (shortcut.meta && isMac) {
    keys.push('Cmd')
  }
  if (shortcut.ctrl && isMac && !shortcut.meta) {
    keys.push('Ctrl')
  }
  if (shortcut.shift) {
    keys.push('Shift')
  }
  if (shortcut.alt) {
    keys.push('Alt')
  }

  // 处理特殊键名
  const keyName = shortcut.key === 'Escape' ? 'Esc' : shortcut.key.toUpperCase()
  keys.push(keyName)

  return keys.join('+')
}

/**
 * 按类别分组快捷键
 */
export function getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
  return ALL_SHORTCUTS.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = []
      }
      acc[shortcut.category].push(shortcut)
      return acc
    },
    {} as Record<string, KeyboardShortcut[]>
  )
}

/**
 * 键盘快捷键 Hook 配置
 */
export interface UseKeyboardShortcutsOptions {
  /** 是否启用全局搜索快捷键（Ctrl+F） */
  enableSearch?: boolean
  /** 搜索打开回调 */
  onSearchOpen?: () => void
  /** 是否启用快捷键帮助（Shift+?） */
  enableHelp?: boolean
  /** 快捷键帮助回调 */
  onHelpOpen?: () => void
}

/**
 * 全局键盘快捷键 Hook
 *
 * 用于注册和管理全局键盘快捷键，主要用于：
 * 1. Ctrl+F 作为打开搜索的备选快捷键
 * 2. Shift+? 显示快捷键帮助
 *
 * 注意：其他快捷键已在各自组件中实现：
 * - Cmd+K/Ctrl+K: 在 Layout 组件中
 * - Escape: 在 Modal 和 Search 组件中
 * - Ctrl+S: 在 Editor 组件中
 * - 方向键/Enter: 在 Search 组件中
 *
 * @param options 配置选项
 *
 * @example
 * ```tsx
 * const [showHelp, setShowHelp] = useState(false)
 *
 * useKeyboardShortcuts({
 *   enableSearch: true,
 *   onSearchOpen: () => setSearchOpen(true),
 *   enableHelp: true,
 *   onHelpOpen: () => setShowHelp(true),
 * })
 * ```
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    enableSearch = false,
    onSearchOpen,
    enableHelp = false,
    onHelpOpen,
  } = options

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F 打开搜索
      if (enableSearch && e.ctrlKey && e.key === 'f' && onSearchOpen) {
        e.preventDefault()
        onSearchOpen()
        return
      }

      // Shift+? 显示快捷键帮助
      if (enableHelp && e.shiftKey && e.key === '?' && onHelpOpen) {
        e.preventDefault()
        onHelpOpen()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableSearch, onSearchOpen, enableHelp, onHelpOpen])
}

/**
 * 类别显示名称映射
 */
export const CATEGORY_NAMES: Record<string, string> = {
  global: '全局',
  search: '搜索',
  editor: '编辑器',
  navigation: '导航',
}
