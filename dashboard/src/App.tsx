import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import Home from './pages/Home'
import DocumentView from './pages/DocumentView'
import FeatureDashboard from './pages/FeatureDashboard'
import NotFound from './pages/NotFound'

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 可以在这里添加错误日志上报
        console.error('Application Error:', error, errorInfo)
      }}
    >
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/document/*" element={<DocumentView />} />
            <Route path="/feature/:id/dashboard" element={<FeatureDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
