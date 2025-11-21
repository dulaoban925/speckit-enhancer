import React, { useEffect, useRef } from 'react'

/**
 * Modal 按钮配置
 */
export interface ModalButton {
  label: string
  onClick: () => void
  variant?: 'primary' | 'danger' | 'secondary'
  autoFocus?: boolean
}

/**
 * Modal 组件属性
 */
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  buttons?: ModalButton[]
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  closeOnOverlayClick?: boolean
}

/**
 * 通用 Modal 组件
 * 用于对话框、确认框、警告框等场景
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  buttons = [],
  footer,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // 尺寸映射
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  }

  // 按钮样式映射
  const buttonVariantClasses = {
    primary: 'bg-gh-accent-emphasis text-white hover:bg-gh-accent-emphasis/90',
    danger: 'bg-gh-danger-emphasis text-white hover:bg-gh-danger-emphasis/90',
    secondary: 'bg-gh-btn-bg text-gh-btn-text hover:bg-gh-btn-hover-bg',
  }

  // 处理 Overlay 点击
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose()
    }
  }

  // 处理 ESC 键
  useEffect(() => {
    if (!isOpen) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // 自动聚焦
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const autoFocusButton = modalRef.current.querySelector<HTMLButtonElement>(
      '[data-autofocus="true"]'
    )
    if (autoFocusButton) {
      autoFocusButton.focus()
    }
  }, [isOpen])

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        className={`
          ${sizeClasses[size]} w-full mx-4 max-h-[90vh]
          bg-gh-canvas-default border border-gh-border-default rounded-lg shadow-2xl
          overflow-hidden flex flex-col
          animate-in fade-in zoom-in duration-200
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gh-border-default">
          <h2 className="text-lg font-semibold text-gh-fg-default">{title}</h2>
          <button
            onClick={onClose}
            className="text-gh-fg-muted hover:text-gh-fg-default transition-colors"
            aria-label="关闭"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="px-6 py-4 overflow-y-auto flex-1 text-gh-fg-default">{children}</div>

        {/* 按钮区域 */}
        {(buttons.length > 0 || footer) && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gh-border-default bg-gh-canvas-subtle">
            {footer}
            {buttons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                data-autofocus={button.autoFocus || false}
                className={`
                  px-4 py-2 rounded-md font-medium transition-colors
                  ${buttonVariantClasses[button.variant || 'secondary']}
                `}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
