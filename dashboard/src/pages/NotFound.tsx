import React from 'react'
import { Link } from 'react-router-dom'

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gh-canvas-default text-gh-fg-default flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gh-fg-muted mb-4">404</h1>
        <p className="text-xl text-gh-fg-muted mb-8">页面未找到</p>
        <Link
          to="/"
          className="inline-block bg-gh-accent-emphasis hover:bg-gh-accent-fg text-white px-6 py-3 rounded-md transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}

export default NotFound
