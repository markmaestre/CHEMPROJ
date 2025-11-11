import React, { useState, useEffect } from 'react'
import { X, Tag, FileText } from 'lucide-react'
import '../styles/design-system.css'

function CategoryForm({ category, onSubmit, onCancel, isOpen }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || ''
      })
    }
    setErrors({})
  }, [category, isOpen])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Category name cannot exceed 50 characters'
    }

    if (formData.description.length > 200) {
      newErrors.description = 'Description cannot exceed 200 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
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
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim()
      }, category?.id)
      handleClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors(prev => ({ 
        ...prev, 
        submit: error.response?.data?.detail || `Error ${category ? 'updating' : 'creating'} category` 
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: ''
    })
    setErrors({})
    onCancel()
  }

  if (!isOpen) return null

  return (
    <div className="ds-modal-overlay">
      <div className="ds-modal">
        <div className="ds-modal-header">
          <div className="ds-modal-title">
            <Tag size={24} className="ds-modal-title-icon" />
            <h2>{category ? 'Edit Category' : 'Create New Category'}</h2>
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

            <div className="ds-form-group">
              <label className="ds-form-label">
                <Tag size={16} />
                Category Name *
              </label>
              <div className="ds-input-wrapper">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`ds-input ${errors.name ? 'error' : ''}`}
                  required
                  disabled={loading}
                  placeholder="Enter category name"
                  maxLength={50}
                />
              </div>
              {errors.name && (
                <span className="ds-error-message">{errors.name}</span>
              )}
              <span className="ds-helper-text">
                {formData.name.length}/50 characters
                {formData.name.length >= 45 && (
                  <span style={{ color: 'var(--warning-color)' }}> - Approaching limit</span>
                )}
              </span>
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">
                <FileText size={16} />
                Description
              </label>
              <div className="ds-input-wrapper">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className={`ds-textarea ${errors.description ? 'error' : ''}`}
                  disabled={loading}
                  placeholder="Enter category description (optional)"
                  maxLength={200}
                />
              </div>
              {errors.description && (
                <span className="ds-error-message">{errors.description}</span>
              )}
              <span className="ds-helper-text">
                {formData.description.length}/200 characters
                {formData.description.length >= 180 && (
                  <span style={{ color: 'var(--warning-color)' }}> - Approaching limit</span>
                )}
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
                    {category ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <>
                    <Tag size={18} />
                    {category ? 'Update Category' : 'Create Category'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CategoryForm