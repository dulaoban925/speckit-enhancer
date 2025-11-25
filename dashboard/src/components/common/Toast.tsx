import React, { useEffect } from 'react'

/**
 * Toast 类型
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/**
 * Toast 配置
 */
export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

/**
 * Toast 组件属性
 */
export interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

/**
 * 单个 Toast 组件
 */
export const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onClose])

  // 图标和颜色映射
  const config = {
    success: {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: 'bg-gh-success-subtle',
      borderColor: 'border-gh-success-emphasis',
      textColor: 'text-gh-success-fg',
      iconColor: 'text-gh-success-emphasis',
    },
    error: {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: 'bg-gh-danger-subtle',
      borderColor: 'border-gh-danger-emphasis',
      textColor: 'text-gh-danger-fg',
      iconColor: 'text-gh-danger-emphasis',
    },
    warning: {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      bgColor: 'bg-gh-attention-subtle',
      borderColor: 'border-gh-attention-emphasis',
      textColor: 'text-gh-attention-fg',
      iconColor: 'text-gh-attention-emphasis',
    },
    info: {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: 'bg-gh-accent-subtle',
      borderColor: 'border-gh-accent-emphasis',
      textColor: 'text-gh-accent-fg',
      iconColor: 'text-gh-accent-emphasis',
    },
  }

  const style = config[toast.type]

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${style.bgColor} ${style.borderColor} ${style.textColor}
        animate-slide-in-right
        min-w-[300px] max-w-[500px]
      `}
      role="alert"
    >
      <div className={style.iconColor}>{style.icon}</div>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gh-fg-muted hover:text-gh-fg-default transition-colors"
        aria-label="关闭"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

/**
 * Toast 容器组件属性
 */
export interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

/**
 * Toast 容器组件
 * 用于显示所有活跃的 Toast
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}
