/**
 * ExportDialog 组件
 * 导出报告对话框 - 支持 PDF/CSV/PNG 格式
 * 提供隐私保护选项,用户可选择排除敏感内容
 */

import { useState } from 'react'

export type ExportFormat = 'pdf' | 'csv' | 'png'

export interface ExportOptions {
  format: ExportFormat
  includeStatistics: boolean
  includeCharts: boolean
  includeComments: boolean
  includeUserInfo: boolean
}

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (options: ExportOptions) => void
  isExporting?: boolean
}

/**
 * ExportDialog 组件
 */
export default function ExportDialog({
  isOpen,
  onClose,
  onConfirm,
  isExporting = false,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [includeStatistics, setIncludeStatistics] = useState(true)
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeComments, setIncludeComments] = useState(true)
  const [includeUserInfo, setIncludeUserInfo] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm({
      format,
      includeStatistics,
      includeCharts,
      includeComments,
      includeUserInfo,
    })
  }

  const formatInfo = {
    pdf: {
      name: 'PDF',
      description: '完整的报告文档,包含所有数据和图表',
      icon: '📄',
    },
    csv: {
      name: 'CSV',
      description: '表格数据,适合在 Excel 中分析',
      icon: '📊',
    },
    png: {
      name: 'PNG',
      description: '可视化图表截图,适合分享和演示',
      icon: '🖼️',
    },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gh-canvas-default border border-gh-border-default rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gh-border-muted">
          <h2 className="text-xl font-semibold text-gh-fg-default">导出统计报告</h2>
          <button
            onClick={onClose}
            className="text-gh-fg-muted hover:text-gh-fg-default transition-colors"
            disabled={isExporting}
          >
            <svg
              className="w-6 h-6"
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

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 格式选择 */}
          <div>
            <label className="block text-sm font-medium text-gh-fg-default mb-3">
              选择导出格式
            </label>
            <div className="space-y-2">
              {(['pdf', 'csv', 'png'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  disabled={isExporting}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    format === fmt
                      ? 'border-gh-accent-emphasis bg-gh-accent-emphasis bg-opacity-10'
                      : 'border-gh-border-default hover:border-gh-border-muted'
                  }`}
                >
                  <span className="text-2xl">{formatInfo[fmt].icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gh-fg-default">
                      {formatInfo[fmt].name}
                    </div>
                    <div className="text-xs text-gh-fg-muted">
                      {formatInfo[fmt].description}
                    </div>
                  </div>
                  {format === fmt && (
                    <svg
                      className="w-5 h-5 text-gh-accent-emphasis"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 内容选项 */}
          <div>
            <label className="block text-sm font-medium text-gh-fg-default mb-3">
              包含的内容
            </label>
            <div className="space-y-2">
              <CheckboxOption
                checked={includeStatistics}
                onChange={setIncludeStatistics}
                label="统计数据"
                description="进度、文档健康度、用户故事等核心指标"
                disabled={isExporting}
              />
              <CheckboxOption
                checked={includeCharts}
                onChange={setIncludeCharts}
                label="可视化图表"
                description="进度时间线和任务分布图表"
                disabled={isExporting || format === 'csv'}
              />
              <CheckboxOption
                checked={includeComments}
                onChange={setIncludeComments}
                label="评论数据"
                description="包含所有评论和讨论内容"
                disabled={isExporting}
                warning={includeComments}
              />
              <CheckboxOption
                checked={includeUserInfo}
                onChange={setIncludeUserInfo}
                label="用户信息"
                description="包含贡献者姓名和参与者统计"
                disabled={isExporting}
                warning={includeUserInfo}
              />
            </div>
          </div>

          {/* 隐私提示 */}
          {(includeComments || includeUserInfo) && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">隐私提示</p>
                <p>
                  您选择了包含敏感信息。请确保在分享报告时已获得相关人员的同意。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gh-border-muted">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-gh-fg-default hover:bg-gh-canvas-subtle rounded-md transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isExporting}
            className="px-4 py-2 bg-gh-accent-emphasis text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                导出中...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                确认导出
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 复选框选项组件
 */
interface CheckboxOptionProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description: string
  disabled?: boolean
  warning?: boolean
}

function CheckboxOption({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  warning = false,
}: CheckboxOptionProps) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'border-gh-border-default hover:border-gh-border-muted'
      } ${warning && checked ? 'bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-10' : ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 w-4 h-4 text-gh-accent-emphasis border-gh-border-default rounded focus:ring-gh-accent-emphasis"
      />
      <div className="flex-1">
        <div className="font-medium text-gh-fg-default flex items-center gap-2">
          {label}
          {warning && checked && (
            <svg
              className="w-4 h-4 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="text-xs text-gh-fg-muted">{description}</div>
      </div>
    </label>
  )
}
