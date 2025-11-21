import React from 'react'
import { Link } from 'react-router-dom'

interface BreadcrumbProps {
  items: Array<{
    label: string
    path?: string
  }>
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-sm text-gh-fg-muted">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-gh-fg-subtle">/</span>
          )}
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-gh-fg-default hover:underline transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gh-fg-default">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export default Breadcrumb
