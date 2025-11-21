import React, { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Editor 组件属性
 */
interface EditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
  readonly?: boolean
  placeholder?: string
}

/**
 * 编辑器组件
 * 提供 Markdown 编辑功能,支持快捷键和自动保存
 */
const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  onSave,
  readonly = false,
  placeholder = '在此输入 Markdown 内容...',
}) => {
  const [localContent, setLocalContent] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 同步外部内容变化
  useEffect(() => {
    setLocalContent(content)
  }, [content])

  // 处理内容变化 (带防抖)
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setLocalContent(newContent)

      // 防抖处理 (300ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        onChange(newContent)
      }, 300)
    },
    [onChange]
  )

  // 处理快捷键
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl+S / Cmd+S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (onSave) {
          // 立即触发 onChange (取消防抖)
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
          }
          onChange(localContent)
          // 触发保存
          setTimeout(() => {
            onSave()
          }, 0)
        }
      }

      // Tab 键处理 (插入两个空格)
      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = localContent.substring(0, start) + '  ' + localContent.substring(end)

        setLocalContent(newContent)
        onChange(newContent)

        // 设置光标位置
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        }, 0)
      }
    },
    [localContent, onChange, onSave]
  )

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-gh-canvas-default">
      {/* 编辑器工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gh-border-default bg-gh-canvas-subtle">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gh-fg-default">编辑器</span>
          <span className="text-xs text-gh-fg-muted">
            {localContent.length} 字符, {localContent.split('\n').length} 行
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSave && (
            <div className="text-xs text-gh-fg-muted">
              <kbd className="px-2 py-1 text-xs font-mono bg-gh-canvas-default border border-gh-border-default rounded">
                {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+S
              </kbd>
              <span className="ml-1">保存</span>
            </div>
          )}
        </div>
      </div>

      {/* 编辑区域 */}
      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        readOnly={readonly}
        placeholder={placeholder}
        className="
          flex-1 w-full px-4 py-3 resize-none
          bg-gh-canvas-default text-gh-fg-default
          font-mono text-sm leading-relaxed
          focus:outline-none
          placeholder:text-gh-fg-muted
        "
        style={{
          tabSize: 2,
        }}
      />

      {/* 状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gh-border-default bg-gh-canvas-subtle text-xs text-gh-fg-muted">
        <div>Markdown</div>
        <div>UTF-8</div>
      </div>
    </div>
  )
}

export default Editor
