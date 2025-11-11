import React, { useState, useEffect } from 'react'
import { Package, Folder, Book, TrendingUp, Clock, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react'
import { borrowService } from '../services/api'
import { useToast } from '../services/ToastContext'

function UserDashboard({ stats, user }) {
  const { toast } = useToast()
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const statCards = [
    {
      value: stats.total_items,
      label: "Total Items",
      icon: Package,
      color: "primary",
      description: "Available laboratory items"
    },
    {
      value: stats.total_categories,
      label: "Categories",
      icon: Folder,
      color: "success",
      description: "Item categories"
    },
    {
      value: stats.total_borrowed_items,
      label: "My Borrowed Items",
      icon: Book,
      color: "info",
      description: "Currently borrowed by me"
    },
    {
      value: stats.overdue_borrows,
      label: "My Overdue Items",
      icon: Clock,
      color: "warning",
      description: "My overdue returns"
    }
  ]

  useEffect(() => {
    loadRecentActivity()
  }, [])

  const loadRecentActivity = async () => {
    try {
      setLoading(true)
      // Use the same API as borrowed logs page
      const data = await borrowService.getBorrowLogs({ 
        user_id: user.id,
        limit: 3, // Only get first 3 most recent
        ordering: '-borrow_date' // Sort by most recent first
      })
      console.log('Recent activity data:', data) // Debug log
      setRecentActivity(Array.isArray(data) ? data.slice(0, 3) : [])
    } catch (error) {
      console.error('Error loading recent activity:', error)
      toast.error('Failed to load recent activity')
      setRecentActivity([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (activity) => {
    const today = new Date()
    const expectedReturn = new Date(activity.expected_return_date)
    
    // If item has been returned (actual_return_date exists)
    if (activity.actual_return_date) {
      return {
        icon: <CheckCircle size={14} className="text-success" />,
        text: 'Returned',
        color: 'success',
        isReturned: true
      }
    }
    
    // Check if overdue (expected return date has passed and not returned)
    if (expectedReturn < today) {
      return {
        icon: <XCircle size={14} className="text-danger" />,
        text: 'Overdue',
        color: 'danger',
        isReturned: false
      }
    }
    
    // Check status field from database
    switch (activity.status) {
      case 'returned':
        return {
          icon: <CheckCircle size={14} className="text-success" />,
          text: 'Returned',
          color: 'success',
          isReturned: true
        }
      case 'overdue':
        return {
          icon: <XCircle size={14} className="text-danger" />,
          text: 'Overdue',
          color: 'danger',
          isReturned: false
        }
      case 'borrowed':
      default:
        return {
          icon: <ClockIcon size={14} className="text-warning" />,
          text: 'Borrowed',
          color: 'warning',
          isReturned: false
        }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getFullDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div>
      {/* Statistics Grid */}
      <div className="row g-3 mb-4">
        {statCards.map((stat, index) => (
          <div key={index} className="col-xl-3 col-lg-6">
            <StatCard stat={stat} />
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Recent Activity */}
        <div className="col-12">
          <SectionCard title="My Recent Activity" icon={TrendingUp}>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-light mt-2 mb-0">Loading recent activity...</p>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="recent-activity-list">
                {recentActivity.map((activity, index) => {
                  const statusInfo = getStatusInfo(activity)
                  return (
                    <ActivityItem 
                      key={activity.id} 
                      activity={activity} 
                      statusInfo={statusInfo}
                      isLast={index === recentActivity.length - 1}
                      formatDate={formatDate}
                      getFullDate={getFullDate}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <Book size={48} className="text-light mb-3" />
                <h5 className="text-light">No Recent Activity</h5>
                <p className="text-light mb-0">You haven't borrowed any items yet.</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

// Activity Item Component
function ActivityItem({ activity, statusInfo, isLast, formatDate, getFullDate }) {
  return (
    <div className={`activity-item d-flex align-items-start py-3 ${!isLast ? 'border-bottom border-secondary' : ''}`}>
      <div className="activity-icon me-3">
        {statusInfo.icon}
      </div>
      
      <div className="activity-content flex-grow-1">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h6 className="text-white mb-0">{activity.item?.name}</h6>
          <span className={`badge bg-${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
        
        <div className="activity-details">
          <div className="d-flex flex-wrap gap-3 text-light small">
            <span>
              <strong>Qty:</strong> {activity.quantity_borrowed} {activity.item?.unit}
            </span>
            <span title={getFullDate(activity.borrow_date)}>
              <strong>Borrowed:</strong> {formatDate(activity.borrow_date)}
            </span>
            
            {/* Show due date if not returned */}
            {!statusInfo.isReturned && (
              <span title={getFullDate(activity.expected_return_date)}>
                <strong>Due:</strong> {formatDate(activity.expected_return_date)}
              </span>
            )}
            
            {/* Show return date if returned */}
            {statusInfo.isReturned && activity.actual_return_date && (
              <span title={getFullDate(activity.actual_return_date)}>
                <strong>Returned:</strong> {formatDate(activity.actual_return_date)}
              </span>
            )}
          </div>
          
          {activity.notes && (
            <p className="text-muted small mt-1 mb-0">
              <em>{activity.notes}</em>
            </p>
          )}
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-1">
              <small className="text-info">
                Status: {activity.status} | 
                Returned: {activity.actual_return_date ? 'Yes' : 'No'} 
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ stat }) {
  const Icon = stat.icon
  
  const getColorClass = () => {
    switch (stat.color) {
      case 'primary': return 'bg-primary'
      case 'success': return 'bg-success'
      case 'warning': return 'bg-warning'
      case 'info': return 'bg-info'
      default: return 'bg-primary'
    }
  }

  return (
    <div className="ds-card h-100">
      <div className="d-flex align-items-start">
        <div className={`stat-icon-wrapper ${getColorClass()} me-3`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="flex-grow-1">
          <h3 className="text-white mb-1">{stat.value || 0}</h3>
          <p className="text-light mb-1 fw-semibold">{stat.label}</p>
          <p className="text-muted small mb-0">{stat.description}</p>
        </div>
      </div>
    </div>
  )
}

// Section Card Component
function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="card bg-dark border-secondary h-100">
      <div className="card-header bg-dark border-secondary d-flex align-items-center">
        {Icon && <Icon size={20} className="text-light me-2" />}
        <h5 className="text-white mb-0">{title}</h5>
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  )
}

export default UserDashboard