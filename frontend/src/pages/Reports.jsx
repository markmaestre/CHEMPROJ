import React, { useState, useEffect } from 'react'
import { Download, Filter, Calendar, BarChart3, Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { dashboardService, itemService, borrowService } from '../services/api'
import { useAuth } from '../services/AuthContext'

function Reports() {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [lowStockItems, setLowStockItems] = useState([])
  const [expiredItems, setExpiredItems] = useState([])
  const [overdueBorrows, setOverdueBorrows] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const loadReportData = async () => {
    try {
      setLoading(true)
      const [statsData, lowStockData, expiredData, overdueData] = await Promise.all([
        dashboardService.getStats(),
        itemService.getItems({ low_stock: true }),
        itemService.getItems({ condition: 'expired' }),
        borrowService.getBorrowLogs({ overdue_only: true })
      ])

      setStats(statsData)
      setLowStockItems(lowStockData)
      setExpiredItems(expiredData)
      setOverdueBorrows(overdueData)
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = (type) => {
    let csvContent = []
    let filename = ''

    switch (type) {
      case 'inventory':
        csvContent = [
          ['Name', 'Category', 'Quantity', 'Available', 'Unit', 'Location', 'Condition', 'Status'],
          ...lowStockItems.map(item => [
            item.name,
            item.category?.name,
            item.quantity,
            item.available_quantity,
            item.unit,
            item.storage_location,
            item.condition,
            item.available_quantity <= item.min_stock_level ? 'LOW STOCK' : 'OK'
          ])
        ]
        filename = 'inventory-report.csv'
        break

      case 'expired':
        csvContent = [
          ['Name', 'Category', 'Quantity', 'Unit', 'Location', 'Expiry Date'],
          ...expiredItems.map(item => [
            item.name,
            item.category?.name,
            item.quantity,
            item.unit,
            item.storage_location,
            new Date(item.expiry_date).toLocaleDateString()
          ])
        ]
        filename = 'expired-items-report.csv'
        break

      case 'borrowed':
        csvContent = [
          ['Item', 'User', 'Quantity', 'Borrow Date', 'Expected Return', 'Status'],
          ...overdueBorrows.map(log => [
            log.item?.name,
            log.user?.full_name,
            log.quantity_borrowed,
            new Date(log.borrow_date).toLocaleDateString(),
            new Date(log.expected_return_date).toLocaleDateString(),
            log.status
          ])
        ]
        filename = 'borrowed-items-report.csv'
        break

      default:
        return
    }

    const csvString = csvContent.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="page text-white">
        <div className="page-header">
          <h1 className="text-white">Reports & Analytics</h1>
        </div>
        <div className="loading text-white">Loading report data...</div>
      </div>
    )
  }

  return (
    <div className="page text-white">
      {/* Page Header */}
      <div className="page-header mb-4">
        <div className="page-title">
          <h1 className="mb-2 text-white">Reports & Analytics</h1>
          <p className="text-light mb-0">Generate reports and view laboratory analytics</p>
        </div>
        <div className="page-actions">
          <div className="date-range-filter d-flex align-items-center gap-3 bg-dark p-3 rounded">
            <div className="d-flex align-items-center gap-2">
              <Calendar size={18} className="text-light" />
              <span className="text-light">Date Range:</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="form-control bg-dark text-white border-secondary"
                style={{ maxWidth: '150px' }}
              />
              <span className="text-light">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="form-control bg-dark text-white border-secondary"
                style={{ maxWidth: '150px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="ds-card h-100">
            <div className="d-flex align-items-center">
              <div className="stat-icon-wrapper bg-primary me-3">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white mb-1">{stats.total_items || 0}</h3>
                <p className="text-light mb-0">Total Items</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="ds-card h-100">
            <div className="d-flex align-items-center">
              <div className="stat-icon-wrapper bg-warning me-3">
                <AlertTriangle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white mb-1">{stats.low_stock_items || 0}</h3>
                <p className="text-light mb-0">Low Stock</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="ds-card h-100">
            <div className="d-flex align-items-center">
              <div className="stat-icon-wrapper bg-danger me-3">
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white mb-1">{stats.expired_items || 0}</h3>
                <p className="text-light mb-0">Expired Items</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="ds-card h-100">
            <div className="d-flex align-items-center">
              <div className="stat-icon-wrapper bg-info me-3">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white mb-1">{stats.overdue_borrows || 0}</h3>
                <p className="text-light mb-0">Overdue Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Low Stock Report */}
        <div className="col-12">
          <div className="card bg-dark border-secondary">
            <div className="card-header bg-dark border-secondary d-flex justify-content-between align-items-center">
              <div>
                <h4 className="text-white mb-0">Low Stock Items</h4>
                <p className="text-light mb-0 mt-1">Items below minimum stock level</p>
              </div>
              <button 
                onClick={() => generateReport('inventory')}
                className="btn btn-outline-light d-flex align-items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
            <div className="card-body">
              {lowStockItems.length > 0 ? (
                <div className="list-group">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="list-group-item bg-secondary border-secondary">
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <h6 className="text-white mb-1">{item.name}</h6>
                          <p className="text-light mb-1">
                            {item.category?.name} • {item.storage_location}
                          </p>
                        </div>
                        <div className="col-md-4">
                          <div className="d-flex align-items-center gap-3">
                            <span className="text-warning">
                              {item.available_quantity} / {item.quantity} {item.unit}
                            </span>
                            <span className="badge bg-warning text-dark">
                              Min: {item.min_stock_level}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-2 text-end">
                          <span className="badge bg-danger">LOW STOCK</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Package size={48} className="text-light mb-3" />
                  <h5 className="text-light">No Low Stock Items</h5>
                  <p className="text-light mb-0">All items are sufficiently stocked</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expired Items Report */}
        <div className="col-12">
          <div className="card bg-dark border-secondary">
            <div className="card-header bg-dark border-secondary d-flex justify-content-between align-items-center">
              <div>
                <h4 className="text-white mb-0">Expired Items</h4>
                <p className="text-light mb-0 mt-1">Items that have passed their expiry date</p>
              </div>
              <button 
                onClick={() => generateReport('expired')}
                className="btn btn-outline-light d-flex align-items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
            <div className="card-body">
              {expiredItems.length > 0 ? (
                <div className="list-group">
                  {expiredItems.map(item => (
                    <div key={item.id} className="list-group-item bg-secondary border-secondary">
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <h6 className="text-white mb-1">{item.name}</h6>
                          <p className="text-light mb-1">
                            {item.category?.name} • {item.storage_location}
                          </p>
                          {item.expiry_date && (
                            <small className="text-danger">
                              Expired: {new Date(item.expiry_date).toLocaleDateString()}
                            </small>
                          )}
                        </div>
                        <div className="col-md-4">
                          <span className="text-light">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <div className="col-md-2 text-end">
                          <span className="badge bg-danger">EXPIRED</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock size={48} className="text-light mb-3" />
                  <h5 className="text-light">No Expired Items</h5>
                  <p className="text-light mb-0">All items are within their expiry dates</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Borrows Report */}
        {user?.role === 'admin' && (
          <div className="col-12">
            <div className="card bg-dark border-secondary">
              <div className="card-header bg-dark border-secondary d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="text-white mb-0">Overdue Returns</h4>
                  <p className="text-light mb-0 mt-1">Items that are overdue for return</p>
                </div>
                <button 
                  onClick={() => generateReport('borrowed')}
                  className="btn btn-outline-light d-flex align-items-center gap-2"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
              <div className="card-body">
                {overdueBorrows.length > 0 ? (
                  <div className="list-group">
                    {overdueBorrows.map(borrow => (
                      <div key={borrow.id} className="list-group-item bg-secondary border-secondary">
                        <div className="row align-items-center">
                          <div className="col-md-6">
                            <h6 className="text-white mb-1">{borrow.item?.name}</h6>
                            <p className="text-light mb-1">
                              Borrowed by: {borrow.user?.full_name}
                            </p>
                            <small className="text-warning">
                              Due: {new Date(borrow.expected_return_date).toLocaleDateString()}
                            </small>
                          </div>
                          <div className="col-md-4">
                            <div className="d-flex align-items-center gap-3">
                              <span className="text-light">
                                {borrow.quantity_borrowed} {borrow.item?.unit}
                              </span>
                              <span className="badge bg-warning text-dark">
                                {borrow.status}
                              </span>
                            </div>
                          </div>
                          <div className="col-md-2 text-end">
                            <span className="badge bg-danger">OVERDUE</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <TrendingUp size={48} className="text-light mb-3" />
                    <h5 className="text-light">No Overdue Returns</h5>
                    <p className="text-light mb-0">All items have been returned on time</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports