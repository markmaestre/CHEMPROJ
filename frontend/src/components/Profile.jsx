import React, { useState, useEffect } from 'react'
import { Camera, Save, User, Mail, Phone, BookOpen, IdCard, Calendar, Shield } from 'lucide-react'
import { profileService } from '../services/api'
import { useAuth } from '../services/AuthContext'
import { useToast } from '../services/ToastContext'

function Profile() {
  const { user: currentUser, updateUser } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    course: '',
    profile_picture: ''
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await profileService.getMyProfile()
      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        phone_number: data.phone_number || '',
        course: data.course || '',
        profile_picture: data.profile_picture || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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

    setUploadingImage(true)
    try {
      const result = await profileService.uploadProfilePicture(file)
      setFormData(prev => ({
        ...prev,
        profile_picture: result.profile_picture_url
      }))
      toast.success('Profile picture updated successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Error uploading image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updatedProfile = await profileService.updateMyProfile(formData)
      setProfile(updatedProfile)
      setEditMode(false)
      
      updateUser(updatedProfile)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error.response?.data?.detail || 'Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name || '',
      phone_number: profile.phone_number || '',
      course: profile.course || '',
      profile_picture: profile.profile_picture || ''
    })
    setEditMode(false)
  }

  if (loading) {
    return (
      <div className="page text-white">
        <div className="page-header">
          <h1 className="text-white">My Profile</h1>
        </div>
        <div className="loading text-white d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-2">Loading profile...</span>
        </div>
      </div>
    )
  }

  const profileFields = [
    {
      label: 'Full Name',
      icon: User,
      name: 'full_name',
      type: 'text',
      required: true,
      value: profile.full_name
    },
    {
      label: 'Email',
      icon: Mail,
      name: 'email',
      type: 'email',
      readOnly: true,
      value: profile.email
    },
    {
      label: 'Phone Number',
      icon: Phone,
      name: 'phone_number',
      type: 'tel',
      value: profile.phone_number,
      placeholder: 'Enter your phone number'
    },
    {
      label: 'Course',
      icon: BookOpen,
      name: 'course',
      type: 'text',
      value: profile.course,
      placeholder: 'e.g., BS Chemistry, BS Biology'
    },
    {
      label: 'Student ID',
      icon: IdCard,
      name: 'student_id',
      type: 'text',
      readOnly: true,
      value: profile.student_id
    },
    {
      label: 'Role',
      icon: Shield,
      name: 'role',
      type: 'text',
      readOnly: true,
      value: profile.role
    },
    {
      label: 'Account Status',
      icon: Shield,
      name: 'status',
      type: 'status',
      readOnly: true,
      value: profile.is_active ? 'Active' : 'Inactive'
    },
    {
      label: 'Member Since',
      icon: Calendar,
      name: 'created_at',
      type: 'date',
      readOnly: true,
      value: profile.created_at
    }
  ]

  return (
    <div className="page text-white">
      {/* Page Header */}
      <div className="page-header mb-4">
        <div className="page-title">
          <h1 className="mb-2 text-white">My Profile</h1>
          <p className="text-light mb-0">Manage your personal information and account settings</p>
        </div>
        {!editMode && (
          <div className="page-actions">
            <button 
              onClick={() => setEditMode(true)}
              className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 text-white"
            >
              <Save size={18} />
              Edit Profile
            </button>
          </div>
        )}
      </div>

      <div className="row justify-content-center">
        <div className="col-xl-8 col-lg-10">
          <div className="card bg-dark border-secondary">
            <div className="card-body p-4">
              {/* Profile Header */}
              <div className="profile-header mb-4">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <div className="profile-avatar-wrapper position-relative">
                      <div className="profile-avatar">
                        {formData.profile_picture ? (
                          <img 
                            src={`http://localhost:8000${formData.profile_picture}`} 
                            alt="Profile" 
                            className="profile-image"
                          />
                        ) : (
                          <div className="profile-avatar-placeholder">
                            <User size={48} className="text-light" />
                          </div>
                        )}
                      </div>
                      
                      {editMode && (
                        <div className="profile-image-upload-overlay">
                          <label htmlFor="profile-picture-upload" className="profile-upload-btn">
                            <Camera size={20} />
                            {uploadingImage ? 'Uploading...' : 'Change'}
                          </label>
                          <input
                            id="profile-picture-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="d-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col">
                    <div className="profile-info">
                      <h2 className="text-white mb-1">{profile.full_name}</h2>
                      <p className="text-light mb-2">@{profile.username}</p>
                      <div className="d-flex gap-2 flex-wrap">
                        <span className={`badge ${profile.role === 'admin' ? 'bg-primary' : 'bg-info'}`}>
                          {profile.role}
                        </span>
                        <span className={`badge ${profile.is_active ? 'bg-success' : 'bg-danger'}`}>
                          {profile.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  {profileFields.map((field, index) => (
                    <div key={field.name} className="col-md-6">
                      <div className="profile-field-group">
                        <label className="profile-field-label d-flex align-items-center gap-2 mb-2">
                          <field.icon size={16} className="text-light" />
                          <span className="text-light">{field.label}</span>
                        </label>
                        
                        {editMode && !field.readOnly ? (
                          <div className="ds-input-wrapper">
                            <input
                              type={field.type}
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleInputChange}
                              className="ds-input"
                              required={field.required}
                              placeholder={field.placeholder}
                              disabled={field.readOnly}
                            />
                          </div>
                        ) : (
                          <div className="profile-field-value bg-tertiary p-3 rounded">
                            {field.type === 'status' ? (
                              <span className={`badge ${field.value === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                                {field.value}
                              </span>
                            ) : field.type === 'date' ? (
                              new Date(field.value).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            ) : (
                              field.value || <span className="text-muted">Not provided</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form Actions */}
                {editMode && (
                  <div className="profile-form-actions mt-4 pt-4 border-top border-secondary">
                    <div className="d-flex gap-3 justify-content-end">
                      <button 
                        type="button" 
                        onClick={handleCancel}
                        className="btn btn-outline-light d-flex align-items-center gap-2 px-4"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="btn btn-primary d-flex align-items-center gap-2 px-4"
                      >
                        {saving ? (
                          <div className="ds-loading-spinner">
                            <div className="ds-spinner"></div>
                            Saving...
                          </div>
                        ) : (
                          <>
                            <Save size={18} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-avatar-wrapper {
          position: relative;
        }

        .profile-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid var(--border-color);
          background: var(--tertiary-bg);
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--tertiary-bg);
          color: var(--text-muted);
        }

        .profile-image-upload-overlay {
          position: absolute;
          bottom: 0;
          right: 0;
          background: var(--accent-primary);
          border-radius: var(--radius-md);
          padding: 4px 8px;
        }

        .profile-upload-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
        }

        .profile-upload-btn:hover {
          color: white;
          text-decoration: none;
        }

        .profile-field-group {
          margin-bottom: var(--space-md);
        }

        .profile-field-value {
          background: var(--tertiary-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          min-height: 48px;
          display: flex;
          align-items: center;
          padding: 0 var(--space-md);
        }

        .bg-tertiary {
          background: var(--tertiary-bg) !important;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .profile-header .row {
            text-align: center;
          }
          
          .profile-avatar {
            width: 100px;
            height: 100px;
            margin: 0 auto var(--space-md);
          }
          
          .profile-info {
            text-align: center;
          }
          
          .profile-form-actions .d-flex {
            flex-direction: column;
            width: 100%;
          }
          
          .profile-form-actions .btn {
            width: 100%;
          }
        }

        @media (max-width: 576px) {
          .profile-avatar {
            width: 80px;
            height: 80px;
          }
          
          .row.g-4 {
            gap: var(--space-md) !important;
          }
          
          .col-md-6 {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default Profile