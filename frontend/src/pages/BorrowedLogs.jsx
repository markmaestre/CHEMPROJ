import React, { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Filter,
  Download,
  X
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Box
} from '@mui/material'
import { useAuth } from '../services/AuthContext'
import { useToast } from '../services/ToastContext'
import { borrowService, userService, itemService } from '../services/api'
import '../styles/design-system.css'

function BorrowedLogs() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [borrowLogs, setBorrowLogs] = useState([])
  const [users, setUsers] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filters, setFilters] = useState({
    status: '',
    user_id: '',
    item_id: '',
    overdue_only: false
  })

  useEffect(() => {
    loadBorrowLogs()
    if (user?.role === 'admin') {
      loadUsers()
      loadItems()
    }
  }, [filters, user])

  const loadBorrowLogs = async () => {
    try {
      setLoading(true)
      const params = { 
        ...filters,
        user_id: filters.user_id || undefined,
        item_id: filters.item_id || undefined,
        status: filters.status || undefined
      }
      
      const data = await borrowService.getBorrowLogs(params)
      setBorrowLogs(data)
    } catch (error) {
      console.error('Error loading borrow logs:', error)
      toast.error('Failed to load borrow logs')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers()
      setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadItems = async () => {
    try {
      const data = await itemService.getItems()
      setItems(data)
    } catch (error) {
      console.error('Error loading items:', error)
    }
  }

  const handleReturnItem = async (borrowLogId) => {
    try {
      await borrowService.returnItem(borrowLogId)
      loadBorrowLogs()
      toast.success('Item marked as returned successfully!')
    } catch (error) {
      console.error('Error returning item:', error)
      toast.error('Failed to mark item as returned')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      user_id: '',
      item_id: '',
      overdue_only: false
    })
    setPage(0)
  }

  const getStatusConfig = (status, expectedReturnDate) => {
    const statusUpper = status?.toUpperCase()
    const isOverdue = statusUpper === 'BORROWED' && new Date(expectedReturnDate) < new Date()
    
    if (isOverdue || statusUpper === 'OVERDUE') {
      return {
        icon: AlertTriangle,
        color: 'error',
        text: 'OVERDUE',
        chipColor: 'error'
      }
    }
    
    switch (statusUpper) {
      case 'BORROWED':
        return {
          icon: Clock,
          color: 'warning',
          text: 'BORROWED',
          chipColor: 'warning'
        }
      case 'RETURNED':
        return {
          icon: CheckCircle,
          color: 'success',
          text: 'RETURNED',
          chipColor: 'success'
        }
      default:
        return {
          icon: Clock,
          color: 'default',
          text: 'UNKNOWN',
          chipColor: 'default'
        }
    }
  }

  const exportBorrowLogs = () => {
    const csvContent = [
      ['Item', 'User', 'Quantity', 'Borrow Date', 'Expected Return', 'Actual Return', 'Status'],
      ...borrowLogs.map(log => [
        log.item?.name,
        log.user?.full_name,
        log.quantity_borrowed,
        new Date(log.borrow_date).toLocaleDateString(),
        new Date(log.expected_return_date).toLocaleDateString(),
        log.actual_return_date ? new Date(log.actual_return_date).toLocaleDateString() : 'N/A',
        log.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'borrow-logs.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Borrow logs exported successfully!')
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const paginatedLogs = borrowLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const hasActiveFilters = filters.status || filters.user_id || filters.item_id || filters.overdue_only

  return (
    <div className="ds-component">
      <div className="page-header">
        <div className="page-title">
          <h1>Borrowed Items</h1>
          <p>Track borrowed laboratory items and returns</p>
        </div>
        <div className="page-actions">
          <button 
            onClick={exportBorrowLogs}
            className="ds-btn ds-btn-secondary"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      {user?.role === 'admin' && (
        <div className="filters-container">
          <div className="filters-header">
            <div className="filters-title">
              <Filter size={20} />
              <h3>Filters</h3>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="ds-btn ds-btn-ghost">
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>

          <div className="filters-grid">
            <div className="ds-form-group">
              <label className="ds-form-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="ds-select"
              >
                <option value="">All Status</option>
                <option value="BORROWED">Borrowed</option>
                <option value="RETURNED">Returned</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">User</label>
              <select
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
                className="ds-select"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">Item</label>
              <select
                value={filters.item_id}
                onChange={(e) => handleFilterChange('item_id', e.target.value)}
                className="ds-select"
              >
                <option value="">All Items</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="ds-form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.overdue_only}
                  onChange={(e) => handleFilterChange('overdue_only', e.target.checked)}
                />
                Show Overdue Only
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="ds-card">
        <TableContainer component={Paper} sx={{ backgroundColor: 'var(--secondary-bg)', boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'var(--tertiary-bg)' }}>
              <TableRow>
                <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>Item</TableCell>
                {user?.role === 'admin' && <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>User</TableCell>}
                <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>Quantity</TableCell>
                <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>Borrow Date</TableCell>
                <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>Expected Return</TableCell>
                <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>Actual Return</TableCell>
                <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>Status</TableCell>
                {user?.role === 'admin' && <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={user?.role === 'admin' ? 8 : 7} align="center" sx={{ color: 'var(--text-secondary)', py: 4 }}>
                    Loading borrow logs...
                  </TableCell>
                </TableRow>
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => {
                  const statusConfig = getStatusConfig(log.status, log.expected_return_date)
                  const StatusIcon = statusConfig.icon
                  const isOverdue = statusConfig.chipColor === 'error'

                  return (
                    <TableRow 
                      key={log.id}
                      sx={{ 
                        backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                        '&:hover': { backgroundColor: 'var(--tertiary-bg)' }
                      }}
                    >
                      <TableCell sx={{ color: 'var(--text-primary)' }}>
                        <Box>
                          <div style={{ fontWeight: 600 }}>{log.item?.name}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {log.item?.category?.name}
                          </div>
                        </Box>
                      </TableCell>
                      {user?.role === 'admin' && (
                        <TableCell sx={{ color: 'var(--text-primary)' }}>
                          <Box>
                            <div style={{ fontWeight: 600 }}>{log.user?.full_name}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {log.user?.student_id}
                            </div>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell sx={{ color: 'var(--text-primary)' }}>
                        {log.quantity_borrowed} {log.item?.unit}
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)' }}>
                        {new Date(log.borrow_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)' }}>
                        {new Date(log.expected_return_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)' }}>
                        {log.actual_return_date 
                          ? new Date(log.actual_return_date).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<StatusIcon size={16} />}
                          label={statusConfig.text}
                          color={statusConfig.chipColor}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      {user?.role === 'admin' && (
                        <TableCell>
                          {log.status?.toUpperCase() === 'BORROWED' && (
                            <Tooltip title="Mark as returned">
                              <IconButton
                                onClick={() => handleReturnItem(log.id)}
                                size="small"
                                sx={{ 
                                  color: 'var(--success-color)',
                                  '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                                }}
                              >
                                <CheckCircle size={18} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={user?.role === 'admin' ? 8 : 7} align="center" sx={{ color: 'var(--text-secondary)', py: 4 }}>
                    No borrow logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={borrowLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color: 'var(--text-primary)',
            backgroundColor: 'var(--secondary-bg)',
            borderTop: '1px solid var(--border-color)',
            '& .MuiTablePagination-selectIcon': {
              color: 'var(--text-primary)'
            }
          }}
        />
      </div>

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-2xl);
        }

        .page-title h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-xs);
        }

        .page-title p {
          color: var(--text-secondary);
          margin: 0;
        }

        .page-actions {
          display: flex;
          gap: var(--space-md);
        }

        .filters-container {
          background: var(--secondary-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-2xl);
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .filters-title {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--text-primary);
        }

        .filters-title h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-lg);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.875rem 0;
        }

        .checkbox-label input {
          margin: 0;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: var(--space-lg);
          }

          .page-actions {
            width: 100%;
          }

          .page-actions .ds-btn {
            flex: 1;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default BorrowedLogs