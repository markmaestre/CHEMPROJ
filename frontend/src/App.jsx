import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './services/AuthContext'
import { ToastProvider, useToast } from './services/ToastContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import BorrowedLogs from './pages/BorrowedLogs'
import Categories from './pages/Categories'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Profile from './components/Profile'
import Toast from './components/Toast'
import 'bootstrap/dist/css/bootstrap.min.css';

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" />
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" />

  return children
}

// Public Route Component
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" /> : children
}

// Layout for authenticated users
function AuthenticatedLayout({ children, isSidebarOpen, setIsSidebarOpen, isSidebarCollapsed, handleToggleCollapse }) {
  return (
    <>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <Header 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      {children}
      <Footer />
    </>
  )
}

// Main App Content
function AppContent() {
  const { isAuthenticated } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <AuthenticatedLayout
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          handleToggleCollapse={handleToggleCollapse}
        >
          <main className={`main-content-authenticated ${isSidebarCollapsed ? 'main-content-expanded' : ''}`}>
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
              <Route path="/borrowed" element={<ProtectedRoute><BorrowedLogs /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute adminOnly><Categories /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </AuthenticatedLayout>
      ) : (
        // Public routes - completely separate from authenticated layout
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
      
      <Toast />
    </div>
  )
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App