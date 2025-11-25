import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ToastContainer } from '../components/common/Toast'
import type { Toast, ToastType } from '../components/common/Toast'

/**
 * Toast 上下文类型
 */
interface ToastContextType {
  /** 显示 Toast */
  showToast: (type: ToastType, message: string, duration?: number) => void
  /** 显示成功 Toast */
  success: (message: string, duration?: number) => void
  /** 显示错误 Toast */
  error: (message: string, duration?: number) => void
  /** 显示警告 Toast */
  warning: (message: string, duration?: number) => void
  /** 显示信息 Toast */
  info: (message: string, duration?: number) => void
  /** 移除 Toast */
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * Toast Provider 属性
 */
interface ToastProviderProps {
  children: ReactNode
}

/**
 * Toast Provider 组件
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  // 生成唯一 ID
  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // 显示 Toast
  const showToast = useCallback(
    (type: ToastType, message: string, duration: number = 5000) => {
      const id = generateId()
      const toast: Toast = {
        id,
        type,
        message,
        duration,
      }

      setToasts((prev) => [...prev, toast])
    },
    [generateId]
  )

  // 便捷方法
  const success = useCallback(
    (message: string, duration?: number) => showToast('success', message, duration),
    [showToast]
  )

  const error = useCallback(
    (message: string, duration?: number) => showToast('error', message, duration),
    [showToast]
  )

  const warning = useCallback(
    (message: string, duration?: number) => showToast('warning', message, duration),
    [showToast]
  )

  const info = useCallback(
    (message: string, duration?: number) => showToast('info', message, duration),
    [showToast]
  )

  // 移除 Toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value: ToastContextType = {
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * useToast Hook
 * 用于在组件中访问 Toast 功能
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
