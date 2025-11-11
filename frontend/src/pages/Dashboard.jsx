import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'
import { dashboardService } from '../services/api'
import AdminDashboard from '../components/AdminDashboard'
import UserDashboard from '../components/UserDashboard'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    total_items: 0,
    total_categories: 0,
    low_stock_items: 0,
    expired_items: 0,
    items_for_disposal: 0,
    total_borrowed_items: 0,
    overdue_borrows: 0,
    total_users: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const data = await dashboardService.getStats()
      console.log('Dashboard stats:', data)
      setStats(data)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page text-white">
        <div className="page-header">
          <h1 className="text-white">Dashboard</h1>
        </div>
        <div className="loading text-white d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-2">Loading dashboard data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page text-white">
      <div className="page-header mb-4">
        <div className="page-title">
          <h1 className="mb-2 text-white">Dashboard</h1>
          <p className="text-light mb-0">
            Welcome back, {user?.full_name}! {user?.role === 'admin' ? "Here's the lab overview." : "Here's your personal overview."}
          </p>
        </div>
      </div>

      {/* Render appropriate dashboard based on user role */}
      {user?.role === 'admin' ? (
        <AdminDashboard stats={stats} user={user} />
      ) : (
        <UserDashboard stats={stats} user={user} />
      )}
    </div>
  )
}

export default Dashboard