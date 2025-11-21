import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-md font-medium transition-colors focus:outline-none focus:ring-2'

  const variantClasses = {
    primary: 'bg-gh-accent-emphasis hover:bg-gh-accent-fg text-white focus:ring-gh-accent-fg',
    secondary: 'bg-gh-canvas-subtle hover:bg-gh-border-default text-gh-fg-default border border-gh-border-default focus:ring-gh-border-default',
    danger: 'bg-gh-danger-emphasis hover:bg-red-700 text-white focus:ring-gh-danger-emphasis',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
