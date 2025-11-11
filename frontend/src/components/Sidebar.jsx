import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { 
  FlaskConical,
  Package,
  ClipboardList,
  Tags,
  Users,
  BarChart3,
  LayoutDashboard,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { user } = useAuth()
  const location = useLocation()

  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Items', href: '/items', icon: Package },
    { name: 'Borrowed Logs', href: '/borrowed', icon: ClipboardList },
  ]

  const adminNavigation = [
    { name: 'Categories', href: '/categories', icon: Tags },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ]

  const navigation = user?.role === 'admin' 
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <FlaskConical className="brand-icon" />
            {!isCollapsed && <span className="brand-text">ChemLab Inventory</span>}
          </div>
          <div className="sidebar-header-actions">
            <button 
              className="sidebar-toggle-btn" 
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button className="sidebar-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? item.name : ''}
              >
                <Icon size={20} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-role-badge">
            {!isCollapsed && <span>Role: {user?.role}</span>}
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar