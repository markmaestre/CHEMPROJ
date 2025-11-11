import React, { useState, useEffect } from 'react'
import { X, Upload, Package, FileText, Tag, Hash, MapPin, AlertTriangle, Calendar, ToggleRight } from 'lucide-react'
import { categoryService } from '../services/api'
import { useToast } from '../services/ToastContext'
import '../styles/design-system.css'

function ItemForm({ item, onSubmit, onCancel, isOpen }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '', description: '', category_id: '', quantity: 0, unit: 'pieces',
    storage_location: '', condition: 'good', min_stock_level: 5, expiry_date: '',
    is_borrowable: true, image: null
  })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors] = useState({})

  // Initialize form data
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category_id: item.category_id || '',
        quantity: item.quantity || 0,
        unit: item.unit || 'pieces',
        storage_location: item.storage_location || '',
        condition: item.condition || 'good',
        min_stock_level: item.min_stock_level || 5,
        expiry_date: item.expiry_date?.split('T')[0] || '',
        is_borrowable: item.is_borrowable !== false,
        image: null
      })
      if (item.image_url) {
        setImagePreview(`http://localhost:8000/uploads/${item.image_url}`)
      }
    }
    setErrors({})
  }, [item, isOpen])

  // Load categories
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Item name is required'
    else if (formData.name.trim().length < 2) newErrors.name = 'Item name must be at least 2 characters'
    if (!formData.category_id) newErrors.category_id = 'Category is required'
    if (formData.quantity < 0) newErrors.quantity = 'Quantity cannot be negative'
    if (formData.min_stock_level < 1) newErrors.min_stock_level = 'Minimum stock level must be at least 1'
    if (formData.expiry_date && new Date(formData.expiry_date) < new Date()) newErrors.expiry_date = 'Expiry date cannot be in the past'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    const newValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    
    setFormData(prev => ({ ...prev, [name]: newValue }))

    if (name === 'image' && files[0]) {
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(files[0])
    }

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const submitData = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key])
        }
      })

      if (!item) submitData.append('created_by', 1) // Should come from auth context

      await onSubmit(submitData, item?.id)
      handleClose()
      toast.success(`Item ${item ? 'updated' : 'created'} successfully!`)
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(error.response?.data?.detail || `Failed to ${item ? 'update' : 'create'} item`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '', description: '', category_id: '', quantity: 0, unit: 'pieces',
      storage_location: '', condition: 'good', min_stock_level: 5, expiry_date: '',
      is_borrowable: true, image: null
    })
    setImagePreview(null)
    setErrors({})
    onCancel()
  }

  if (!isOpen) return null

  const formFields = [
    { 
      label: 'Item Name *', icon: Package, name: 'name', type: 'text', 
      placeholder: 'Enter item name', required: true 
    },
    { 
      label: 'Category *', icon: Tag, name: 'category_id', type: 'select',
      options: categories.map(cat => ({ value: cat.id, label: cat.name }))
    },
    { 
      label: 'Quantity *', icon: Hash, name: 'quantity', type: 'number', 
      min: 0, required: true 
    },
    { 
      label: 'Unit', icon: Hash, name: 'unit', type: 'select',
      options: [
        { value: 'pieces', label: 'Pieces' },
        { value: 'L', label: 'Liters' },
        { value: 'mL', label: 'Milliliters' },
        { value: 'g', label: 'Grams' },
        { value: 'kg', label: 'Kilograms' },
        { value: 'bottles', label: 'Bottles' },
        { value: 'boxes', label: 'Boxes' }
      ]
    },
    { 
      label: 'Storage Location', icon: MapPin, name: 'storage_location', type: 'text',
      placeholder: 'e.g., Cabinet A, Shelf B' 
    },
    { 
      label: 'Condition', icon: AlertTriangle, name: 'condition', type: 'select',
      options: [
        { value: 'good', label: 'Good Condition' },
        { value: 'for_disposal', label: 'For Disposal' },
        { value: 'expired', label: 'Expired' }
      ]
    },
    { 
      label: 'Minimum Stock Level', icon: AlertTriangle, name: 'min_stock_level', 
      type: 'number', min: 1 
    },
    { 
      label: 'Expiry Date', icon: Calendar, name: 'expiry_date', type: 'date' 
    }
  ]

  return (
    <div className="ds-modal-overlay">
      <div className="ds-modal" style={{ maxWidth: '800px' }}>
        <div className="ds-modal-header">
          <div className="ds-modal-title">
            <Package size={24} className="ds-modal-title-icon" />
            <h2>{item ? 'Edit Item' : 'Add New Item'}</h2>
          </div>
          <button onClick={handleClose} className="ds-modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="ds-modal-content">
          <form onSubmit={handleSubmit} className="ds-form">
            <div className="ds-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {formFields.map((field, index) => (
                <FormField
                  key={field.name}
                  field={field}
                  formData={formData}
                  errors={errors}
                  loading={loading}
                  onChange={handleChange}
                />
              ))}
            </div>

            {/* Description */}
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
                  className="ds-textarea"
                  disabled={loading}
                  placeholder="Item description..."
                />
              </div>
            </div>

            {/* Image Upload */}
            <ImageUpload 
              imagePreview={imagePreview}
              loading={loading}
              onChange={handleChange}
              onRemove={() => {
                setImagePreview(null)
                setFormData(prev => ({ ...prev, image: null }))
              }}
            />

            {/* Borrowable Toggle */}
            <div className="ds-form-group">
              <label className="toggle-label">
                <div className="toggle-content">
                  <ToggleRight 
                    size={20} 
                    color={formData.is_borrowable ? 'var(--accent-primary)' : 'var(--text-muted)'} 
                  />
                  <span>Item can be borrowed</span>
                </div>
                <input
                  type="checkbox"
                  name="is_borrowable"
                  checked={formData.is_borrowable}
                  onChange={handleChange}
                  className="toggle-input"
                  disabled={loading}
                />
              </label>
              <span className="ds-helper-text">
                Allow users to borrow this item from the inventory
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
                    {item ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <>
                    <Package size={18} />
                    {item ? 'Update Item' : 'Create Item'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <style jsx>{`
          .toggle-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            padding: var(--space-md);
            background: var(--tertiary-bg);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            transition: all var(--transition-fast);
          }

          .toggle-label:hover {
            border-color: var(--border-hover);
          }

          .toggle-content {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            color: var(--text-primary);
            font-weight: 500;
          }

          .toggle-input {
            display: none;
          }

          @media (max-width: 768px) {
            .ds-form-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

// Sub-component for form fields
function FormField({ field, formData, errors, loading, onChange }) {
  const Icon = field.icon
  const hasError = errors[field.name]

  return (
    <div className="ds-form-group">
      <label className="ds-form-label">
        <Icon size={16} />
        {field.label}
      </label>
      <div className="ds-input-wrapper">
        {field.type === 'select' ? (
          <select
            name={field.name}
            value={formData[field.name]}
            onChange={onChange}
            className={`ds-select ${hasError ? 'error' : ''}`}
            required={field.required}
            disabled={loading}
          >
            <option value="">Select {field.label.replace('*', '')}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : field.type === 'date' ? (
          <>
            <Calendar size={18} className="ds-input-icon" />
            <input
              type="date"
              name={field.name}
              value={formData[field.name]}
              onChange={onChange}
              className={`ds-input ${hasError ? 'error' : ''}`}
              disabled={loading}
            />
          </>
        ) : (
          <input
            type={field.type}
            name={field.name}
            value={formData[field.name]}
            onChange={onChange}
            className={`ds-input ${hasError ? 'error' : ''}`}
            required={field.required}
            disabled={loading}
            placeholder={field.placeholder}
            min={field.min}
          />
        )}
      </div>
      {hasError && <span className="ds-error-message">{errors[field.name]}</span>}
      {field.name === 'min_stock_level' && (
        <span className="ds-helper-text">
          Low stock alert will trigger when quantity falls below this level
        </span>
      )}
    </div>
  )
}

// Sub-component for image upload
function ImageUpload({ imagePreview, loading, onChange, onRemove }) {
  return (
    <div className="ds-form-group">
      <label className="ds-form-label">
        <Upload size={16} />
        Item Image
      </label>
      <div className="image-upload-container">
        <label className="image-upload-label">
          <input
            type="file"
            name="image"
            onChange={onChange}
            accept="image/*"
            className="image-upload-input"
            disabled={loading}
          />
          <div className="image-upload-content">
            <Upload size={24} />
            <span>Choose Image</span>
            <small>PNG, JPG, JPEG up to 5MB</small>
          </div>
        </label>
        
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <button 
              type="button" 
              className="image-remove-btn"
              onClick={onRemove}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .image-upload-container {
          display: flex;
          gap: var(--space-lg);
          align-items: flex-start;
        }

        .image-upload-label {
          display: block;
          cursor: pointer;
          flex-shrink: 0;
        }

        .image-upload-input {
          display: none;
        }

        .image-upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          width: 150px;
          height: 150px;
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-lg);
          background: var(--tertiary-bg);
          transition: all var(--transition-fast);
          padding: var(--space-md);
          text-align: center;
        }

        .image-upload-content:hover {
          border-color: var(--accent-primary);
          background: var(--secondary-bg);
        }

        .image-upload-content span {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .image-upload-content small {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .image-upload-content svg {
          color: var(--text-muted);
        }

        .image-preview {
          position: relative;
          width: 150px;
          height: 150px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-remove-btn {
          position: absolute;
          top: var(--space-xs);
          right: var(--space-xs);
          width: 24px;
          height: 24px;
          background: var(--error-color);
          border: none;
          border-radius: var(--radius-md);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .image-upload-container {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}

export default ItemForm