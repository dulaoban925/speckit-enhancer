import React from 'react'
import { Link } from 'react-router-dom'

interface BreadcrumbProps {
  items: Array<{
    label: string
    path?: string
    /** 是否为首页 */
    isHome?: boolean
  }>
  /** 自定义类名 */
  className?: string
  /** 分隔符，默认为 '/' */
  separator?: string | React.ReactNode
  /** 是否显示首页图标 */
  showHomeIcon?: boolean
}

/**
 * 面包屑导航组件
 * 显示文档的完整路径层级，支持点击跳转
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = '',
  separator,
  showHomeIcon = true,
}) => {
  // 默认分隔符
  const defaultSeparator = separator ?? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )

  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="面包屑导航">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isFirst = index === 0

        return (
          <React.Fragment key={index}>
            {/* 分隔符 */}
            {index > 0 && (
              <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">
                {defaultSeparator}
              </span>
            )}

            {/* 导航项 */}
            {item.path ? (
              <Link
                to={item.path}
                className={`
                  flex items-center gap-1.5
                  hover:text-blue-600 dark:hover:text-blue-400
                  hover:underline transition-colors
                  ${
                    isLast
                      ? 'text-gray-900 dark:text-gray-100 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }
                `}
                aria-current={isLast ? 'page' : undefined}
              >
                {/* 首页图标 */}
                {isFirst && showHomeIcon && item.isHome && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                )}
                <span className="truncate max-w-xs">{item.label}</span>
              </Link>
            ) : (
              <span
                className={`
                  flex items-center gap-1.5
                  ${
                    isLast
                      ? 'text-gray-900 dark:text-gray-100 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }
                `}
                aria-current={isLast ? 'page' : undefined}
              >
                {/* 首页图标 */}
                {isFirst && showHomeIcon && item.isHome && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                )}
                <span className="truncate max-w-xs">{item.label}</span>
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
