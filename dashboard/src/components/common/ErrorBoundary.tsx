import React, { Component, ErrorInfo, ReactNode } from 'react'

/**
 * ErrorBoundary 属性
 */
interface ErrorBoundaryProps {
  children: ReactNode
  /** 自定义错误回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** 自定义 Fallback UI */
  fallback?: (error: Error, resetError: () => void) => ReactNode
}

/**
 * ErrorBoundary 状态
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary 组件
 * 捕获子组件树中的 JavaScript 错误，显示备用 UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新 state，下次渲染将显示降级 UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // 调用自定义错误处理
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 可以将错误日志上报给服务器
    // logErrorToService(error, errorInfo)
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // 使用自定义 fallback 或默认错误 UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen bg-gh-canvas-default flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-gh-canvas-subtle border border-gh-border-default rounded-lg p-8">
            <div className="flex items-start gap-4">
              {/* 错误图标 */}
              <svg
                className="w-12 h-12 text-gh-danger-fg flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>

              <div className="flex-1">
                {/* 标题 */}
                <h1 className="text-2xl font-bold text-gh-fg-default mb-2">
                  应用程序遇到错误
                </h1>

                {/* 错误描述 */}
                <p className="text-gh-fg-muted mb-4">
                  抱歉，应用程序遇到了一个错误。你可以尝试重新加载页面，或者联系支持团队。
                </p>

                {/* 错误详情 */}
                <details className="mb-6">
                  <summary className="cursor-pointer text-gh-accent-fg hover:underline mb-2">
                    查看错误详情
                  </summary>
                  <div className="bg-gh-canvas-default p-4 rounded-md border border-gh-border-default overflow-hidden">
                    <div className="text-sm font-mono">
                      <div className="text-gh-danger-fg font-semibold mb-2 break-words overflow-wrap-anywhere">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <pre className="text-gh-fg-muted overflow-x-auto text-xs whitespace-pre-wrap break-words max-w-full">
                          {this.state.error.stack}
                        </pre>
                      )}
                    </div>
                  </div>
                </details>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <button
                    onClick={this.resetError}
                    className="px-4 py-2 bg-gh-accent-emphasis text-white rounded-md hover:bg-gh-accent-emphasis/90 transition-colors"
                  >
                    重试
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-gh-btn-bg text-gh-btn-text rounded-md hover:bg-gh-btn-hover-bg transition-colors"
                  >
                    返回首页
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gh-btn-bg text-gh-btn-text rounded-md hover:bg-gh-btn-hover-bg transition-colors"
                  >
                    刷新页面
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 简化的 ErrorBoundary 高阶组件
 * 用于快速包装组件
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

export default ErrorBoundary
