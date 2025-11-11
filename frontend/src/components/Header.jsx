import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { 
  FlaskConical, 
  User, 
  LogOut, 
  Menu,
  ChevronDown
} from 'lucide-react'

function Header({ onMenuToggle, isSidebarCollapsed }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  // Get current page title based on route
  const getPageTitle = () => {
    const path = location.pathname
    switch(path) {
      case '/dashboard':
        return 'Dashboard'
      case '/items':
        return 'Items'
      case '/borrowed':
        return 'Borrowed Logs'
      case '/categories':
        return 'Categories'
      case '/users':
        return 'Users'
      case '/reports':
        return 'Reports'
      case '/profile':
        return 'Profile'
      default:
        return 'Dashboard'
    }
  }

  return (
    <header className={`header ${isSidebarCollapsed ? 'header-expanded' : ''}`}>
      <div className="header-container">
        <div className="header-left">
          <button 
            className="mobile-menu-btn"
            onClick={onMenuToggle}
          >
            <Menu size={24} />
          </button>
          
          {/* Show brand icon when sidebar is collapsed */}
          {isSidebarCollapsed && (
            <div className="header-brand-collapsed">
              <FlaskConical className="brand-icon" />
            </div>
          )}
          
          {/* Page Title - Shows when sidebar is collapsed */}
          {isSidebarCollapsed && (
            <div className="page-title">
              <span>{getPageTitle()}</span>
            </div>
          )}
        </div>

        <div className="header-actions">
          {/* Page Title for larger screens when sidebar is expanded */}
          {!isSidebarCollapsed && (
            <div className="page-title-desktop">
              <span>{getPageTitle()}</span>
            </div>
          )}

          {/* User Profile Dropdown */}
          <div className="user-profile-dropdown">
            <button 
              className="profile-trigger"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            >
              <div className="user-avatar">
                {user?.profile_picture ? (
                  <img 
                    src={`http://localhost:8000${user.profile_picture}`} 
                    alt="Profile" 
                    className="profile-image"
                  />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.full_name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
              <ChevronDown size={16} className={`dropdown-chevron ${isProfileDropdownOpen ? 'rotate' : ''}`} />
            </button>

            {isProfileDropdownOpen && (
              <div className="profile-dropdown-menu">
                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  <User size={16} />
                  <span>View Profile</span>
                </Link>
                
                <div className="dropdown-divider"></div>
                
                <button 
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header