import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gh-fg-default">
          {label}
        </label>
      )}

      <input
        className={`
          px-3 py-2
          bg-gh-canvas-default
          border border-gh-border-default
          rounded-md
          text-gh-fg-default
          placeholder-gh-fg-subtle
          focus:outline-none
          focus:ring-2
          focus:ring-gh-accent-fg
          focus:border-transparent
          ${error ? 'border-gh-danger-emphasis' : ''}
          ${className}
        `}
        {...props}
      />

      {error && (
        <span className="text-sm text-gh-danger-emphasis">{error}</span>
      )}

      {helperText && !error && (
        <span className="text-sm text-gh-fg-muted">{helperText}</span>
      )}
    </div>
  )
}

export default Input
