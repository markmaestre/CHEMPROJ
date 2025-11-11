import React, { useState, useEffect } from 'react'
import { Plus, Edit, User, UserCheck, UserX, Search, Trash2, Shield } from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Pagination,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Tooltip
} from '@mui/material'
import { userService } from '../services/api'
import UserForm from './UserForm'
import '../styles/design-system.css'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })
  const [currentUser] = useState(JSON.parse(localStorage.getItem('user')))
  const rowsPerPage = 8

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers()
      setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const canModifyUser = (user) => {
    return user.id !== currentUser?.id
  }

  const canDeleteUser = (user) => {
    return user.id !== currentUser?.id && user.role !== 'admin'
  }

  const handleCreateUser = async (formData) => {
    try {
      const newUser = await userService.createUser(formData)
      loadUsers()
      return newUser
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  const handleUpdateUser = async (formData, userId) => {
    try {
      await userService.updateUser(userId, formData)
      loadUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  const handleToggleStatus = async (user) => {
    if (!canModifyUser(user)) {
      alert('Cannot modify your own account')
      return
    }

    const newStatus = !user.is_active
    if (window.confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${user.full_name}?`)) {
      try {
        await userService.updateUser(user.id, { is_active: newStatus })
        loadUsers()
      } catch (error) {
        console.error('Error updating user status:', error)
        alert('Error updating user status')
      }
    }
  }

  const handleDelete = async (user) => {
    if (!canDeleteUser(user)) {
      alert(user.role === 'admin' ? 'Cannot delete admin users' : 'Cannot delete your own account')
      return
    }
    
    setDeleteDialog({ open: true, user })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.user) return
    
    try {
      await userService.deleteUser(deleteDialog.user.id)
      setDeleteDialog({ open: false, user: null })
      loadUsers()
      alert(`User ${deleteDialog.user.full_name} has been deleted successfully.`)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(error.response?.data?.detail || 'Error deleting user')
    }
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setShowForm(true)
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.course?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const tableHeaders = ['Profile', 'User Information', 'Role', 'Status', 'Joined', 'Actions']

  const getRoleChip = (role) => {
    const config = {
      admin: { color: 'error', label: 'Admin', icon: <Shield size={14} /> },
      viewer: { color: 'primary', label: 'Viewer', icon: <User size={14} /> }
    }[role] || { color: 'default', label: role, icon: <User size={14} /> }
    
    return (
      <Chip 
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="filled"
        sx={{ color: 'white !important', fontWeight: '600' }}
      />
    )
  }

  const getStatusChip = (isActive) => {
    return isActive ? (
      <Chip 
        icon={<UserCheck size={14} />}
        label="Active"
        color="success"
        size="small"
        variant="filled"
        sx={{ color: 'white !important', fontWeight: '600' }}
      />
    ) : (
      <Chip 
        icon={<UserX size={14} />}
        label="Inactive"
        color="error"
        size="small"
        variant="filled"
        sx={{ color: 'white !important', fontWeight: '600' }}
      />
    )
  }

  return (
    <div className="page text-white">
      <div className="page-header mb-4">
        <div className="page-title">
          <h1 className="mb-2 text-white">User Management</h1>
          <p className="text-light mb-0">Manage system users and their permissions</p>
        </div>
        <div className="page-actions">
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      <div className="alert alert-info mb-4 d-flex align-items-center gap-2">
        <Shield size={18} />
        <span><strong>Note:</strong> Admin users cannot be deactivated or deleted</span>
      </div>

      <div className="card bg-dark border-secondary">
        <div className="card-header px-4 py-3 bg-dark border-secondary">
          <TextField
            placeholder="Search users by name, username, or course..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#ffffff" />
                </InputAdornment>
              ),
            }}
            sx={{
              width: '100%',
              maxWidth: '400px',
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'var(--tertiary-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                color: '#ffffff',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: '2px solid var(--accent-primary)' },
              },
              '& .MuiInputBase-input': {
                color: '#ffffff',
                padding: '12px 14px',
                '&::placeholder': { color: 'var(--text-muted)', opacity: 1 },
              },
            }}
          />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-light mt-2 mb-0">Loading users...</p>
          </div>
        ) : (
          <>
            <TableContainer 
              component={Paper}
              sx={{
                backgroundColor: 'var(--secondary-bg)',
                border: 'none',
                borderRadius: '0',
                boxShadow: 'none',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'var(--tertiary-bg)' }}>
                    {tableHeaders.map(header => (
                      <TableCell key={header} sx={{ 
                        color: '#ffffff', 
                        fontWeight: 600, 
                        borderBottom: '1px solid var(--border-color)',
                        padding: '16px 20px',
                        fontSize: '0.875rem'
                      }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map(user => (
                    <TableRow 
                      key={user.id} 
                      sx={{ 
                        backgroundColor: 'var(--secondary-bg)',
                        borderBottom: '1px solid var(--border-color)',
                        '&:last-child': { borderBottom: 'none' },
                        '&:hover': { backgroundColor: 'var(--tertiary-bg)' },
                        opacity: !user.is_active ? 0.6 : 1
                      }}
                    >
                      <TableCell sx={{ padding: '16px 20px' }}>
                        <div className="user-avatar-wrapper">
                          {user.profile_picture ? (
                            <img 
                              src={`http://localhost:8000${user.profile_picture}`} 
                              alt={user.full_name}
                              className="user-avatar-image"
                            />
                          ) : (
                            <div className="user-avatar-placeholder">
                              <User size={20} />
                            </div>
                          )}
                          {user.role === 'admin' && (
                            <div className="admin-badge">
                              <Shield size={12} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell sx={{ padding: '16px 20px' }}>
                        <div className="user-info">
                          <strong className="text-white d-block mb-1">
                            {user.full_name}
                            {user.id === currentUser?.id && (
                              <span className="badge bg-info ms-2">You</span>
                            )}
                          </strong>
                          <small className="text-light d-block mb-1">@{user.username}</small>
                          {user.course && (
                            <span className="user-course badge bg-secondary">
                              {user.course}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell sx={{ padding: '16px 20px' }}>
                        {getRoleChip(user.role)}
                      </TableCell>
                      <TableCell sx={{ padding: '16px 20px' }}>
                        {getStatusChip(user.is_active)}
                      </TableCell>
                      <TableCell sx={{ padding: '16px 20px' }}>
                        <span className="text-light">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell sx={{ padding: '16px 20px' }}>
                        <div className="d-flex gap-2 align-items-center">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="btn btn-outline-light btn-sm d-flex align-items-center gap-1 px-3"
                          >
                            <Edit size={14} />
                            Edit
                          </button>

                          <Tooltip title={!canModifyUser(user) ? "Cannot modify your own account" : ""}>
                            <span>
                              <button 
                                onClick={() => handleToggleStatus(user)}
                                disabled={!canModifyUser(user)}
                                className={`btn btn-sm px-3 ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                              >
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </span>
                          </Tooltip>

                          <Tooltip title={!canDeleteUser(user) ? (user.role === 'admin' ? "Cannot delete admin users" : "Cannot delete your own account") : ""}>
                            <span>
                              <button 
                                onClick={() => handleDelete(user)}
                                disabled={!canDeleteUser(user)}
                                className={`btn btn-sm d-flex align-items-center gap-1 px-3 ${canDeleteUser(user) ? 'btn-danger' : 'btn-outline-secondary'}`}
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </span>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredUsers.length > 0 && (
              <div className="card-footer px-4 py-3 border-top border-secondary d-flex justify-content-between align-items-center bg-dark">
                <div className="text-light">
                  Showing <strong>{(page - 1) * rowsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(page * rowsPerPage, filteredUsers.length)}</strong> of{' '}
                  <strong>{filteredUsers.length}</strong> users
                </div>
                <Pagination
                  count={Math.ceil(filteredUsers.length / rowsPerPage)}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#ffffff',
                      backgroundColor: 'var(--tertiary-bg)',
                      border: '1px solid var(--border-color)',
                      '&:hover': { backgroundColor: 'var(--border-color)', color: '#ffffff' },
                      '&.Mui-selected': {
                        backgroundColor: 'var(--accent-primary)',
                        color: '#ffffff',
                        '&:hover': { backgroundColor: 'var(--accent-hover)', color: '#ffffff' },
                      },
                    },
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <UserForm
        user={selectedUser}
        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
        onCancel={() => {
          setShowForm(false)
          setSelectedUser(null)
        }}
        isOpen={showForm}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--secondary-bg)',
            color: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', borderBottom: '1px solid var(--border-color)' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '20px !important' }}>
          <DialogContentText sx={{ color: 'var(--text-muted)' }}>
            Are you sure you want to delete user <strong className="text-white">"{deleteDialog.user?.full_name}"</strong>?
            <br /><br />
            This action will permanently delete:
            <ul className="text-light mt-2">
              <li>User account</li>
              <li>All items created by this user</li>
              <li>All borrow logs associated with this user</li>
            </ul>
            <strong className="text-warning">This action cannot be undone.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px' }}>
          <Button 
            onClick={() => setDeleteDialog({ open: false, user: null })}
            sx={{ 
              color: '#ffffff',
              border: '1px solid var(--border-color)',
              '&:hover': { backgroundColor: 'var(--tertiary-bg)' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Users