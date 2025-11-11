import React, { useState, useEffect } from 'react'
import { X, Calendar, Package, User, Hash, FileText, AlertCircle } from 'lucide-react'
import { userService, itemService } from '../services/api'
import '../styles/design-system.css'

function BorrowLogForm({ item, onSubmit, onCancel, isOpen, currentUser }) {
  const [formData, setFormData] = useState({
    item_id: '',
    user_id: '',
    quantity_borrowed: 1,
    expected_return_date: '',
    notes: ''
  })
  const [users, setUsers] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (item) {
      setFormData(prev => ({
        ...prev,
        item_id: item.id.toString(),
        quantity_borrowed: 1
      }))
    }
  }, [item])

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      if (!item) {
        loadBorrowableItems()
      }
      setErrors({})
    }
  }, [isOpen, item])

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers()
      setUsers(data.filter(user => user.role === 'viewer' && user.is_active))
    } catch (error) {
      console.error('Error loading users:', error)
      setErrors(prev => ({ ...prev, users: 'Failed to load users' }))
    }
  }

  const loadBorrowableItems = async () => {
    try {
      const data = await itemService.getItems({ borrowable_only: true })
      setItems(data.filter(item => item.available_quantity > 0))
    } catch (error) {
      console.error('Error loading items:', error)
      setErrors(prev => ({ ...prev, items: 'Failed to load items' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.item_id) newErrors.item_id = 'Item is required'
    if (!formData.user_id) newErrors.user_id = 'User is required'
    if (!formData.expected_return_date) newErrors.expected_return_date = 'Return date is required'
    
    if (formData.quantity_borrowed < 1) {
      newErrors.quantity_borrowed = 'Quantity must be at least 1'
    } else if (formData.quantity_borrowed > getMaxQuantity()) {
      newErrors.quantity_borrowed = `Cannot exceed available quantity (${getMaxQuantity()})`
    }

    // Check if borrowing would go below minimum stock
    const selectedItem = item || items.find(i => i.id === parseInt(formData.item_id))
    if (selectedItem) {
      const remainingAfterBorrow = selectedItem.available_quantity - formData.quantity_borrowed
      if (remainingAfterBorrow < selectedItem.min_stock_level) {
        newErrors.quantity_borrowed = `Would leave ${remainingAfterBorrow} items (below minimum of ${selectedItem.min_stock_level})`
      }
    }

    const selectedDate = new Date(formData.expected_return_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (formData.expected_return_date && selectedDate < today) {
      newErrors.expected_return_date = 'Return date cannot be in the past'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity_borrowed' ? parseInt(value) || 1 : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const submitData = {
        ...formData,
        item_id: parseInt(formData.item_id),
        user_id: parseInt(formData.user_id),
        admin_id: currentUser.id,
        expected_return_date: new Date(formData.expected_return_date).toISOString()
      }

      await onSubmit(submitData)
      handleClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors(prev => ({ 
        ...prev, 
        submit: error.response?.data?.detail || 'Error creating borrow log' 
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      item_id: '',
      user_id: '',
      quantity_borrowed: 1,
      expected_return_date: '',
      notes: ''
    })
    setErrors({})
    onCancel()
  }

  const getMaxQuantity = () => {
    if (item) {
      return item.available_quantity
    }
    const selectedItem = items.find(i => i.id === parseInt(formData.item_id))
    return selectedItem ? selectedItem.available_quantity : 1
  }

  const getSafeMaxQuantity = () => {
    const selectedItem = item || items.find(i => i.id === parseInt(formData.item_id))
    if (!selectedItem) return 1
    
    // Calculate maximum quantity that won't go below minimum stock
    const maxWithoutMinStockViolation = selectedItem.available_quantity - selectedItem.min_stock_level
    return Math.max(0, maxWithoutMinStockViolation)
  }

  const getStockInfo = () => {
    const selectedItem = item || items.find(i => i.id === parseInt(formData.item_id))
    if (!selectedItem) return null

    const remainingAfterBorrow = selectedItem.available_quantity - formData.quantity_borrowed
    const isBelowMinStock = remainingAfterBorrow < selectedItem.min_stock_level
    const isAtMinStock = remainingAfterBorrow === selectedItem.min_stock_level

    return {
      selectedItem,
      remainingAfterBorrow,
      isBelowMinStock,
      isAtMinStock
    }
  }

  if (!isOpen) return null

  const stockInfo = getStockInfo()

  return (
    <div className="ds-modal-overlay">
      <div className="ds-modal">
        <div className="ds-modal-header">
          <div className="ds-modal-title">
            <Package size={24} className="ds-modal-title-icon" />
            <h2>Borrow Laboratory Item</h2>
          </div>
          <button onClick={handleClose} className="ds-modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="ds-modal-content">
          <form onSubmit={handleSubmit} className="ds-form">
            {errors.submit && (
              <div className="ds-alert ds-alert-error">
                <div className="ds-alert-content">
                  <span className="ds-alert-message">{errors.submit}</span>
                </div>
              </div>
            )}

            <div className="ds-form-grid">
              {!item && (
                <div className="ds-form-group">
                  <label className="ds-form-label">
                    <Package size={16} />
                    Item *
                  </label>
                  <div className="ds-input-wrapper">
                    <select
                      name="item_id"
                      value={formData.item_id}
                      onChange={handleChange}
                      className={`ds-select ${errors.item_id ? 'error' : ''}`}
                      required
                    >
                      <option value="">Select Laboratory Item</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} - {item.category} (Available: {item.available_quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.item_id && <span className="ds-error-message">{errors.item_id}</span>}
                  {items.length === 0 && !errors.items && (
                    <span className="ds-helper-text">No borrowable items available</span>
                  )}
                  {errors.items && <span className="ds-error-message">{errors.items}</span>}
                </div>
              )}

              <div className="ds-form-group">
                <label className="ds-form-label">
                  <User size={16} />
                  Borrower *
                </label>
                <div className="ds-input-wrapper">
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    className={`ds-select ${errors.user_id ? 'error' : ''}`}
                    required
                  >
                    <option value="">Select Borrower</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.student_id || user.username}) - {user.department || 'No department'}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.user_id && <span className="ds-error-message">{errors.user_id}</span>}
                {users.length === 0 && !errors.users && (
                  <span className="ds-helper-text">No active viewers available</span>
                )}
                {errors.users && <span className="ds-error-message">{errors.users}</span>}
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label">
                  <Hash size={16} />
                  Quantity *
                </label>
                <div className="ds-input-wrapper">
                  <input
                    type="number"
                    name="quantity_borrowed"
                    value={formData.quantity_borrowed}
                    onChange={handleChange}
                    min="1"
                    max={getMaxQuantity()}
                    className={`ds-input ${errors.quantity_borrowed ? 'error' : ''}`}
                    required
                    placeholder="Enter quantity"
                  />
                </div>
                {errors.quantity_borrowed && (
                  <span className="ds-error-message">{errors.quantity_borrowed}</span>
                )}
                
                {/* Subtle stock information */}
                {stockInfo && (
                  <div className="stock-info mt-2">
                    <div className="d-flex justify-content-between text-sm text-light">
                      <span>Available: <strong>{stockInfo.selectedItem.available_quantity}</strong></span>
                      <span>Min stock: <strong>{stockInfo.selectedItem.min_stock_level}</strong></span>
                    </div>
                    
                    {formData.quantity_borrowed > 0 && (
                      <div className={`stock-warning mt-1 ${stockInfo.isBelowMinStock ? 'text-warning' : 'text-success'}`}>
                        <div className="d-flex align-items-center gap-1">
                          {stockInfo.isBelowMinStock && <AlertCircle size={12} />}
                          <small>
                            After borrow: <strong>{stockInfo.remainingAfterBorrow}</strong> remaining
                            {stockInfo.isBelowMinStock && ' (below minimum)'}
                            {stockInfo.isAtMinStock && ' (at minimum)'}
                          </small>
                        </div>
                      </div>
                    )}
                    
                    {getSafeMaxQuantity() > 0 && (
                      <div className="safe-limit mt-1">
                        <small className="text-info">
                          Safe to borrow up to: <strong>{getSafeMaxQuantity()}</strong>
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label">
                  <Calendar size={16} />
                  Expected Return Date *
                </label>
                <div className="ds-input-wrapper">
                  <Calendar size={18} className="ds-input-icon" />
                  <input
                    type="date"
                    name="expected_return_date"
                    value={formData.expected_return_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`ds-input ${errors.expected_return_date ? 'error' : ''}`}
                    required
                  />
                </div>
                {errors.expected_return_date && (
                  <span className="ds-error-message">{errors.expected_return_date}</span>
                )}
                <span className="ds-helper-text">
                  Select the expected return date
                </span>
              </div>
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">
                <FileText size={16} />
                Notes
              </label>
              <div className="ds-input-wrapper">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="ds-textarea"
                  placeholder="Additional notes about this borrowing transaction..."
                />
              </div>
              <span className="ds-helper-text">
                Optional: Purpose of borrowing, special instructions, etc.
              </span>
            </div>

            <div className="ds-form-actions">
              <button 
                type="button" 
                onClick={handleClose}
                className="ds-btn ds-btn-secondary"
                disabled={loading}
              >
                <X size={18} />
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="ds-btn ds-btn-primary"
              >
                {loading ? (
                  <div className="ds-loading-spinner">
                    <div className="ds-spinner"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <Package size={18} />
                    Borrow Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <style jsx>{`
          .stock-info {
            background: var(--tertiary-bg);
            padding: var(--space-sm);
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
          }
          
          .stock-warning {
            font-size: 0.75rem;
          }
          
          .safe-limit {
            font-size: 0.75rem;
          }
          
          .text-sm {
            font-size: 0.875rem;
          }
          
          @media (max-width: 768px) {
            .stock-info {
              padding: var(--space-xs);
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default BorrowLogForm