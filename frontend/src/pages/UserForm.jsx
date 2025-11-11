import React, { useState, useEffect } from 'react'
import { X, Camera, Trash2, User, Mail, Key, Phone, BookOpen, IdCard, Shield } from 'lucide-react'
import { profileService } from '../services/api'
import { useToast } from '../services/ToastContext'
import '../styles/design-system.css'

function UserForm({ user, onSubmit, onCancel, isOpen }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    student_id: '',
    role: 'viewer',
    password: '',
    phone_number: '',
    course: '',
    profile_picture: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        student_id: user.student_id || '',
        role: user.role || 'viewer',
        password: '',
        phone_number: user.phone_number || '',
        course: user.course || '',
        profile_picture: user.profile_picture || ''
      })
      setImagePreview(user.profile_picture ? `http://localhost:8000${user.profile_picture}` : '')
    } else {
      setFormData({
        username: '',
        email: '',
        full_name: '',
        student_id: '',
        role: 'viewer',
        password: '',
        phone_number: '',
        course: '',
        profile_picture: ''
      })
      setImagePreview('')
    }
    setErrors({})
    setConfirmPassword('')
  }, [user, isOpen])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required'
    else if (formData.full_name.trim().length < 2) newErrors.full_name = 'Full name must be at least 2 characters'
    
    if (!formData.username.trim()) newErrors.username = 'Username is required'
    else if (formData.username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters'
    
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    
    if (!user) {
      if (!formData.password) newErrors.password = 'Password is required'
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
      
      if (!confirmPassword) newErrors.confirmPassword = 'Please confirm password'
      else if (formData.password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.role) newErrors.role = 'Role is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)

    setUploadingImage(true)
    try {
      let result
      if (user) {
        result = await profileService.uploadUserProfilePicture(user.id, file)
      } else {
        result = { profile_picture_url: previewUrl, file: file }
      }
      
      setFormData(prev => ({
        ...prev,
        profile_picture: user ? result.profile_picture_url : file
      }))
      toast.success('Profile picture uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Error uploading image')
      setImagePreview('')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setImagePreview('')
    setFormData(prev => ({
      ...prev,
      profile_picture: ''
    }))
    toast.info('Profile picture removed')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)

    try {
      const submitData = { ...formData }
      
      if (!submitData.password) {
        delete submitData.password
      }

      if (!user && submitData.profile_picture instanceof File) {
        const { profile_picture, ...userData } = submitData
        const newUser = await onSubmit(userData, null)
        
        if (newUser && profile_picture instanceof File) {
          await profileService.uploadUserProfilePicture(newUser.id, profile_picture)
        }
      } else {
        await onSubmit(submitData, user?.id)
      }
      
      handleClose()
      toast.success(`User ${user ? 'updated' : 'created'} successfully!`)
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(error.response?.data?.detail || `Failed to ${user ? 'update' : 'create'} user`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      student_id: '',
      role: 'viewer',
      password: '',
      phone_number: '',
      course: '',
      profile_picture: ''
    })
    setConfirmPassword('')
    setImagePreview('')
    setErrors({})
    onCancel()
  }

  if (!isOpen) return null

  const formFields = [
    { 
      label: 'Full Name *', icon: User, name: 'full_name', type: 'text', 
      placeholder: 'Enter full name', required: true 
    },
    { 
      label: 'Username *', icon: User, name: 'username', type: 'text',
      placeholder: 'Enter username', required: true 
    },
    { 
      label: 'Email *', icon: Mail, name: 'email', type: 'email',
      placeholder: 'Enter email address', required: true 
    },
    { 
      label: 'Student ID', icon: IdCard, name: 'student_id', type: 'text',
      placeholder: 'TUPT-XX-XXXX' 
    },
    { 
      label: 'Phone Number', icon: Phone, name: 'phone_number', type: 'tel',
      placeholder: 'Enter phone number' 
    },
    { 
      label: 'Course', icon: BookOpen, name: 'course', type: 'text',
      placeholder: 'e.g., BS Chemistry, BS Biology' 
    },
    { 
      label: 'Role *', icon: Shield, name: 'role', type: 'select',
      options: [
        { value: 'viewer', label: 'Viewer' },
        { value: 'admin', label: 'Admin' }
      ],
      required: true
    }
  ]

  return (
    <div className="ds-modal-overlay">
      <div className="ds-modal" style={{ maxWidth: '800px' }}>
        <div className="ds-modal-header">
          <div className="ds-modal-title">
            <User size={24} className="ds-modal-title-icon" />
            <h2>{user ? 'Edit User' : 'Add New User'}</h2>
          </div>
          <button onClick={handleClose} className="ds-modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="ds-modal-content">
          <form onSubmit={handleSubmit} className="ds-form">
            {/* Profile Picture Upload */}
            <ProfileImageUpload 
              imagePreview={imagePreview}
              uploadingImage={uploadingImage}
              onChange={handleImageUpload}
              onRemove={removeImage}
            />

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

            {/* Password Fields for New User */}
            {!user && (
              <div className="ds-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="ds-form-group">
                  <label className="ds-form-label">
                    <Key size={16} />
                    Password *
                  </label>
                  <div className="ds-input-wrapper">
                    <Key size={18} className="ds-input-icon" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`ds-input ${errors.password ? 'error' : ''}`}
                      required
                      minLength="6"
                      disabled={loading}
                      placeholder="Enter password"
                    />
                  </div>
                  {errors.password && <span className="ds-error-message">{errors.password}</span>}
                  <span className="ds-helper-text">Must be at least 6 characters long</span>
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-label">
                    <Key size={16} />
                    Confirm Password *
                  </label>
                  <div className="ds-input-wrapper">
                    <Key size={18} className="ds-input-icon" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }))
                      }}
                      className={`ds-input ${errors.confirmPassword ? 'error' : ''}`}
                      required
                      minLength="6"
                      disabled={loading}
                      placeholder="Confirm password"
                    />
                  </div>
                  {errors.confirmPassword && <span className="ds-error-message">{errors.confirmPassword}</span>}
                </div>
              </div>
            )}

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
                disabled={loading || uploadingImage}
                className="ds-btn ds-btn-primary"
              >
                {loading ? (
                  <div className="ds-loading-spinner">
                    <div className="ds-spinner"></div>
                    {user ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <>
                    <User size={18} />
                    {user ? 'Update User' : 'Create User'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <style jsx>{`
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
        ) : (
          <>
            <Icon size={18} className="ds-input-icon" />
            <input
              type={field.type}
              name={field.name}
              value={formData[field.name]}
              onChange={onChange}
              className={`ds-input ${hasError ? 'error' : ''}`}
              required={field.required}
              disabled={loading}
              placeholder={field.placeholder}
            />
          </>
        )}
      </div>
      {hasError && <span className="ds-error-message">{errors[field.name]}</span>}
    </div>
  )
}

// Sub-component for profile image upload
function ProfileImageUpload({ imagePreview, uploadingImage, onChange, onRemove }) {
  return (
    <div className="ds-form-group">
      <label className="ds-form-label">
        <Camera size={16} />
        Profile Picture
      </label>
      <div className="profile-image-upload-container">
        <div className="profile-image-preview">
          {imagePreview ? (
            <div className="profile-image-preview-container">
              <img src={imagePreview} alt="Profile preview" className="profile-preview-image" />
              <button 
                type="button" 
                onClick={onRemove}
                className="profile-image-remove-btn"
                disabled={uploadingImage}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div className="profile-image-upload-placeholder">
              <User size={32} />
              <span>No image selected</span>
            </div>
          )}
        </div>
        
        <div className="profile-image-upload-controls">
          <label htmlFor="profile-picture-upload" className="ds-btn ds-btn-secondary ds-btn-sm">
            <Camera size={16} />
            {imagePreview ? 'Change Photo' : 'Upload Photo'}
          </label>
          <input
            id="profile-picture-upload"
            type="file"
            accept="image/*"
            onChange={onChange}
            disabled={uploadingImage}
            className="profile-image-upload-input"
          />
          {uploadingImage && (
            <div className="uploading-text">
              <div className="ds-loading-spinner">
                <div className="ds-spinner"></div>
                Uploading...
              </div>
            </div>
          )}
          <div className="profile-image-upload-hint">
            Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-image-upload-container {
          display: flex;
          gap: var(--space-lg);
          align-items: flex-start;
        }

        .profile-image-preview {
          flex-shrink: 0;
        }

        .profile-image-preview-container {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid var(--border-color);
        }

        .profile-preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-image-remove-btn {
          position: absolute;
          top: var(--space-xs);
          right: var(--space-xs);
          width: 28px;
          height: 28px;
          background: var(--error-color);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .profile-image-remove-btn:hover:not(:disabled) {
          background: #dc2626;
          transform: scale(1.1);
        }

        .profile-image-upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          width: 120px;
          height: 120px;
          border: 2px dashed var(--border-color);
          border-radius: 50%;
          background: var(--tertiary-bg);
          color: var(--text-muted);
          text-align: center;
          padding: var(--space-md);
        }

        .profile-image-upload-placeholder span {
          font-size: 0.75rem;
        }

        .profile-image-upload-input {
          display: none;
        }

        .profile-image-upload-controls {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          flex: 1;
        }

        .uploading-text {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .profile-image-upload-hint {
          color: var(--text-muted);
          font-size: 0.75rem;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .profile-image-upload-container {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .profile-image-upload-controls {
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}

export default UserForm