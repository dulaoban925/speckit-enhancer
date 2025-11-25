import React from 'react'
import Modal from './Modal'
import {
  ALL_SHORTCUTS,
  CATEGORY_NAMES,
  formatShortcut,
  getShortcutsByCategory,
  type KeyboardShortcut,
} from '../../hooks/useKeyboardShortcuts'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 键盘快捷键帮助组件
 * 显示所有可用的键盘快捷键及其说明
 */
const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  const shortcutsByCategory = getShortcutsByCategory()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="键盘快捷键" size="md">
      <div className="space-y-6">
        {/* 说明 */}
        <p className="text-sm text-gh-fg-muted">
          使用键盘快捷键可以更高效地操作应用。按{' '}
          <kbd className="px-2 py-1 text-xs font-semibold text-gh-fg-default bg-gh-canvas-subtle border border-gh-border-default rounded">
            Shift+?
          </kbd>{' '}
          可随时打开此帮助。
        </p>

        {/* 按类别显示快捷键 */}
        {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gh-fg-default mb-3">
              {CATEGORY_NAMES[category] || category}
            </h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-gh-canvas-subtle rounded-md hover:bg-gh-canvas-inset transition-colors"
                >
                  <span className="text-sm text-gh-fg-default">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-mono font-semibold text-gh-fg-default bg-gh-canvas-default border border-gh-border-default rounded shadow-sm">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 提示 */}
        <div className="mt-6 p-4 bg-gh-accent-subtle border border-gh-accent-muted rounded-md">
          <p className="text-sm text-gh-fg-muted">
            <strong className="text-gh-fg-default">提示：</strong> 在不同页面和组件中，部分快捷键会有不同的行为。例如，编辑器中的快捷键仅在编辑模式下生效。
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default KeyboardShortcutsHelp
