import React from 'react'

/**
 * Spinner 加载组件属性
 */
export interface SpinnerProps {
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 颜色 */
  color?: 'default' | 'accent' | 'muted'
  /** 自定义类名 */
  className?: string
}

/**
 * Spinner 加载指示器
 * 用于表示正在加载的状态
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'accent',
  className = '',
}) => {
  // 尺寸映射
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  }

  // 颜色映射
  const colorClasses = {
    default: 'border-gh-fg-default',
    accent: 'border-gh-accent-fg',
    muted: 'border-gh-fg-muted',
  }

  return (
    <div
      className={`
        animate-spin rounded-full
        ${sizeClasses[size]}
        ${colorClasses[color]}
        border-t-transparent
        ${className}
      `}
      role="status"
      aria-label="正在加载"
    />
  )
}

/**
 * Skeleton 骨架屏组件属性
 */
export interface SkeletonProps {
  /** 宽度 */
  width?: string | number
  /** 高度 */
  height?: string | number
  /** 是否为圆形 */
  circle?: boolean
  /** 是否显示动画 */
  animate?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * Skeleton 骨架屏组件
 * 用于在内容加载时显示占位元素
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  circle = false,
  animate = true,
  className = '',
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width
  const heightStyle = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`
        bg-gh-canvas-subtle
        ${circle ? 'rounded-full' : 'rounded'}
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{ width: widthStyle, height: heightStyle }}
      aria-label="加载占位"
    />
  )
}

/**
 * 全屏加载组件属性
 */
export interface FullPageLoadingProps {
  /** 加载文本 */
  message?: string
  /** 是否显示 */
  visible?: boolean
}

/**
 * 全屏加载组件
 * 用于页面级别的加载状态
 */
export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  message = '正在加载...',
  visible = true,
}) => {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gh-canvas-default/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {message && <p className="text-gh-fg-muted">{message}</p>}
      </div>
    </div>
  )
}

/**
 * 内联加载组件属性
 */
export interface InlineLoadingProps {
  /** 加载文本 */
  message?: string
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 自定义类名 */
  className?: string
}

/**
 * 内联加载组件
 * 用于在组件内部显示加载状态
 */
export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message,
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Spinner size={size} />
      {message && <span className="text-gh-fg-muted">{message}</span>}
    </div>
  )
}

/**
 * 页面居中加载组件属性
 */
export interface PageCenterLoadingProps {
  /** 加载文本 */
  message?: string
  /** 最小高度 */
  minHeight?: string
  /** 是否占满全屏高度（用于全页面加载状态） */
  fullHeight?: boolean
}

/**
 * 页面居中加载组件
 * 用于在页面中心显示加载状态
 */
export const PageCenterLoading: React.FC<PageCenterLoadingProps> = ({
  message = '加载中...',
  minHeight = '400px',
  fullHeight = false,
}) => {
  const containerClass = fullHeight
    ? 'min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gh-canvas-default'
    : 'flex items-center justify-center'

  const style = fullHeight ? undefined : { minHeight }

  return (
    <div className={containerClass} style={style}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gh-accent-emphasis mx-auto mb-4"></div>
        <p className="text-gh-fg-muted">{message}</p>
      </div>
    </div>
  )
}

/**
 * 文档列表骨架屏
 * 用于文档列表加载时的占位
 */
export const DocumentListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <Skeleton width="60%" height="1.25rem" className="mb-2" />
              <Skeleton width="40%" height="0.875rem" />
            </div>
            <Skeleton width="4rem" height="1.5rem" circle={false} />
          </div>
          <Skeleton width="100%" height="3rem" />
        </div>
      ))}
    </div>
  )
}

/**
 * 文档内容骨架屏
 * 用于文档内容加载时的占位
 */
export const DocumentContentSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-8">
      {/* 标题 */}
      <Skeleton width="70%" height="2rem" className="mb-6" />

      {/* 段落 */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="95%" height="1rem" />
          <Skeleton width="98%" height="1rem" />
          <Skeleton width="60%" height="1rem" className="mb-4" />
        </div>
      ))}
    </div>
  )
}

/**
 * 搜索结果骨架屏
 * 用于搜索结果加载时的占位
 */
export const SearchResultsSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-3 rounded hover:bg-gh-canvas-subtle">
          <Skeleton width="50%" height="1rem" className="mb-2" />
          <Skeleton width="80%" height="0.875rem" />
        </div>
      ))}
    </div>
  )
}

// 默认导出
const Loading = {
  Spinner,
  Skeleton,
  FullPageLoading,
  InlineLoading,
  PageCenterLoading,
  DocumentListSkeleton,
  DocumentContentSkeleton,
  SearchResultsSkeleton,
}

export default Loading
