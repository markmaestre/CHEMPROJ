import React, { useState, useEffect } from 'react'
import { 
  Package, Folder, AlertTriangle, Clock, Book, Users, TrendingUp, Calendar,
  Plus, Edit, User, CheckCircle, XCircle, Clock as ClockIcon
} from 'lucide-react'
import { borrowService, itemService, userService } from '../services/api'
import { useToast } from '../services/ToastContext'

function AdminDashboard({ stats, user }) {
  const { toast } = useToast()
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const statCards = [
    {
      value: stats.total_items,
      label: "Total Items",
      icon: Package,
      color: "primary",
      description: "All laboratory items"
    },
    {
      value: stats.total_categories,
      label: "Categories",
      icon: Folder,
      color: "success",
      description: "Item categories"
    },
    {
      value: stats.low_stock_items,
      label: "Low Stock",
      icon: AlertTriangle,
      color: "warning",
      description: "Items below minimum stock"
    },
    {
      value: stats.expired_items,
      label: "Expired Items",
      icon: Clock,
      color: "danger",
      description: "Items past expiry date"
    },
    {
      value: stats.total_borrowed_items,
      label: "Borrowed Items",
      icon: Book,
      color: "info",
      description: "Currently borrowed"
    },
    {
      value: stats.overdue_borrows,
      label: "Overdue Returns",
      icon: TrendingUp,
      color: "danger",
      description: "Overdue for return"
    },
    {
      value: stats.total_users,
      label: "Total Users",
      icon: Users,
      color: "secondary",
      description: "System users"
    }
  ]

  useEffect(() => {
    loadRecentActivity()
  }, [])

  const loadRecentActivity = async () => {
    try {
      setLoading(true)
      
      // Fetch data from multiple sources
      const [recentBorrows, recentItems, recentUsers] = await Promise.all([
        borrowService.getBorrowLogs({ limit: 5, ordering: '-created_at' }),
        itemService.getItems({ limit: 5, ordering: '-created_at' }),
        userService.getUsers({ limit: 5, ordering: '-created_at' })
      ])

      // Combine and normalize all activities
      const activities = []

      // Add recent borrow activities
      if (Array.isArray(recentBorrows)) {
        recentBorrows.slice(0, 3).forEach(borrow => {
          activities.push({
            id: `borrow-${borrow.id}`,
            type: 'borrow',
            title: `${borrow.user?.full_name} borrowed ${borrow.item?.name}`,
            description: `${borrow.quantity_borrowed} ${borrow.item?.unit}`,
            date: borrow.borrow_date || borrow.created_at,
            user: borrow.user,
            item: borrow.item,
            status: borrow.status,
            actual_return_date: borrow.actual_return_date,
            expected_return_date: borrow.expected_return_date,
            icon: Book
          })
        })
      }

      // Add recent item activities
      if (Array.isArray(recentItems)) {
        recentItems.slice(0, 3).forEach(item => {
          activities.push({
            id: `item-${item.id}`,
            type: 'item',
            title: `New item: ${item.name}`,
            description: item.category?.name || 'Uncategorized',
            date: item.created_at,
            item: item,
            icon: Package
          })
        })
      }

      // Add recent user activities
      if (Array.isArray(recentUsers)) {
        recentUsers.slice(0, 2).forEach(user => {
          activities.push({
            id: `user-${user.id}`,
            type: 'user',
            title: `New user: ${user.full_name}`,
            description: `@${user.username} - ${user.role}`,
            date: user.created_at,
            user: user,
            icon: User
          })
        })
      }

      // Sort all activities by date (newest first) and take top 5
      const sortedActivities = activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)

      setRecentActivity(sortedActivities)
      
    } catch (error) {
      console.error('Error loading recent activity:', error)
      toast.error('Failed to load recent activity')
      setRecentActivity([])
    } finally {
      setLoading(false)
    }
  }

  const getBorrowStatusInfo = (activity) => {
    if (activity.type !== 'borrow') return null

    const today = new Date()
    const expectedReturn = new Date(activity.expected_return_date)
    
    // If item has been returned
    if (activity.actual_return_date) {
      return {
        icon: <CheckCircle size={12} className="text-success" />,
        text: 'Returned',
        color: 'success'
      }
    }
    
    // Check if overdue
    if (expectedReturn < today) {
      return {
        icon: <XCircle size={12} className="text-danger" />,
        text: 'Overdue',
        color: 'danger'
      }
    }
    
    // Check status field
    switch (activity.status) {
      case 'returned':
        return {
          icon: <CheckCircle size={12} className="text-success" />,
          text: 'Returned',
          color: 'success'
        }
      case 'overdue':
        return {
          icon: <XCircle size={12} className="text-danger" />,
          text: 'Overdue',
          color: 'danger'
        }
      case 'borrowed':
      default:
        return {
          icon: <ClockIcon size={12} className="text-warning" />,
          text: 'Borrowed',
          color: 'warning'
        }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (activity) => {
    switch (activity.type) {
      case 'borrow':
        return <Book size={16} className="text-info" />
      case 'item':
        return <Package size={16} className="text-primary" />
      case 'user':
        return <User size={16} className="text-success" />
      default:
        return <Calendar size={16} className="text-light" />
    }
  }

  return (
    <div>
      {/* Statistics Grid */}
      <div className="row g-3 mb-4">
        {statCards.map((stat, index) => (
          <div key={index} className="col-xl-3 col-lg-4 col-md-6">
            <StatCard stat={stat} />
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="row g-4">
        {/* Recent Activity */}
        <div className="col-lg-8">
          <SectionCard title="Recent Activity" icon={TrendingUp}>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-light mt-2 mb-0">Loading recent activity...</p>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="recent-activity-list">
                {recentActivity.map((activity, index) => (
                  <ActivityItem 
                    key={activity.id} 
                    activity={activity} 
                    isLast={index === recentActivity.length - 1}
                    getBorrowStatusInfo={getBorrowStatusInfo}
                    formatDate={formatDate}
                    getActivityIcon={getActivityIcon}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Calendar size={48} className="text-light mb-3" />
                <h5 className="text-light">No Recent Activity</h5>
                <p className="text-light mb-0">System activity will appear here.</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* System Status */}
        <div className="col-lg-4">
          <SectionCard title="System Status" icon={TrendingUp}>
            <div className="system-status">
              <div className="status-item d-flex justify-content-between align-items-center py-2">
                <span className="text-light">Items</span>
                <span className="badge bg-success">Normal</span>
              </div>
              <div className="status-item d-flex justify-content-between align-items-center py-2">
                <span className="text-light">Borrowing</span>
                <span className="badge bg-success">Active</span>
              </div>
              <div className="status-item d-flex justify-content-between align-items-center py-2">
                <span className="text-light">Users</span>
                <span className="badge bg-success">Online</span>
              </div>
              <div className="status-item d-flex justify-content-between align-items-center py-2">
                <span className="text-light">Database</span>
                <span className="badge bg-success">Connected</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

// Activity Item Component
function ActivityItem({ activity, isLast, getBorrowStatusInfo, formatDate, getActivityIcon }) {
  const borrowStatus = activity.type === 'borrow' ? getBorrowStatusInfo(activity) : null

  return (
    <div className={`activity-item d-flex align-items-start py-3 ${!isLast ? 'border-bottom border-secondary' : ''}`}>
      <div className="activity-icon me-3">
        {getActivityIcon(activity)}
      </div>
      
      <div className="activity-content flex-grow-1">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h6 className="text-white mb-0">{activity.title}</h6>
          <div className="d-flex align-items-center gap-2">
            {borrowStatus && (
              <span className={`badge bg-${borrowStatus.color}`}>
                {borrowStatus.icon}
                <span className="ms-1">{borrowStatus.text}</span>
              </span>
            )}
            <small className="text-muted">{formatDate(activity.date)}</small>
          </div>
        </div>
        
        <div className="activity-details">
          <p className="text-light small mb-1">{activity.description}</p>
          
          {/* Additional details based on activity type */}
          {activity.type === 'borrow' && activity.expected_return_date && !borrowStatus?.text === 'Returned' && (
            <small className="text-muted">
              Due: {new Date(activity.expected_return_date).toLocaleDateString()}
            </small>
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
      case 'danger': return 'bg-danger'
      case 'info': return 'bg-info'
      case 'secondary': return 'bg-secondary'
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

export default AdminDashboard