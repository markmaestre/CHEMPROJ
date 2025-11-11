import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Grid,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Pagination,
  Alert
} from '@mui/material'
import { categoryService } from '../services/api'
import CategoryForm from '../components/CategoryForm'
import { useToast } from '../services/ToastContext'

function Categories() {
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryService.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (formData) => {
    try {
      await categoryService.createCategory(formData)
      loadCategories()
      toast.success('Category created successfully!')
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  const handleUpdateCategory = async (formData, categoryId) => {
    try {
      await categoryService.updateCategory(categoryId, formData)
      loadCategories()
      toast.success('Category updated successfully!')
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  const handleDeleteCategory = async (category) => {
    if (category.items_count > 0) {
      toast.error('Cannot delete category with existing items. Please reassign or delete the items first.')
      return
    }

    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await categoryService.deleteCategory(category.id)
        loadCategories()
        toast.success('Category deleted successfully!')
      } catch (error) {
        console.error('Error deleting category:', error)
        toast.error('Error deleting category')
      }
    }
  }

  const handleEdit = (category) => {
    setSelectedCategory(category)
    setShowForm(true)
  }

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => 
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Paginate categories
  const paginatedCategories = filteredCategories.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const handlePageChange = (event, value) => {
    setPage(value)
  }

  const getItemsCountColor = (count) => {
    if (count === 0) return 'default'
    if (count <= 5) return 'warning'
    return 'success'
  }

  return (
    <div className="page text-white">
      {/* Page Header */}
      <div className="page-header mb-4">
        <div className="page-title">
          <h1 className="mb-2 text-white">Categories</h1>
          <p className="text-light mb-0">Manage item categories and classifications</p>
        </div>
        <div className="page-actions">
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 text-white"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="card bg-dark border-secondary">
        {/* Search Section */}
        <div className="card-header px-4 py-3 bg-dark border-secondary">
          <div className="search-box">
            <TextField
              placeholder="Search categories..."
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
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused fieldset': {
                    border: '2px solid var(--accent-primary)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#ffffff',
                  padding: '12px 14px',
                  '&::placeholder': {
                    color: 'var(--text-muted)',
                    opacity: 1,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="text-center py-5 text-white">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-light mt-2 mb-0">Loading categories...</p>
          </div>
        ) : (
          <>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {paginatedCategories.length > 0 ? (
                  paginatedCategories.map(category => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
                      <Card 
                        sx={{
                          backgroundColor: 'var(--secondary-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-lg)',
                          height: '100%',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: 'var(--accent-primary)',
                            transform: 'translateY(-2px)',
                            boxShadow: 'var(--shadow-lg)'
                          },
                          position: 'relative'
                        }}
                      >
                        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          {/* Category Header */}
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <div className="category-icon-wrapper">
                                <Package size={20} color="var(--accent-primary)" />
                              </div>
                              <Chip
                                label={`${category.items_count} items`}
                                color={getItemsCountColor(category.items_count)}
                                size="small"
                                sx={{
                                  color: 'white !important',
                                  fontWeight: '600',
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Category Content */}
                          <Box sx={{ flex: 1, mb: 3 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                color: '#ffffff',
                                fontWeight: '600',
                                fontSize: '1rem',
                                mb: 1,
                                lineHeight: 1.3
                              }}
                            >
                              {category.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'var(--text-muted)',
                                fontSize: '0.875rem',
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {category.description || 'No description provided'}
                            </Typography>
                          </Box>

                          {/* Category Actions */}
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                            <button 
                              onClick={() => handleEdit(category)}
                              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1 px-3 text-white"
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(category)}
                              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 px-3 text-white"
                              disabled={category.items_count > 0}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </Box>

                          {/* Delete Restriction Warning - Only show on hover for categories with items */}
                          {category.items_count > 0 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.3s ease',
                                '&:hover': {
                                  opacity: 1
                                },
                                pointerEvents: 'none'
                              }}
                            >
                              <Box sx={{ textAlign: 'center', p: 2 }}>
                                <Trash2 size={24} color="var(--warning-color)" />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: 'var(--warning-color)',
                                    fontWeight: '600',
                                    mt: 1
                                  }}
                                >
                                  Contains {category.items_count} items
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'var(--text-muted)',
                                    display: 'block',
                                    mt: 0.5
                                  }}
                                >
                                  Reassign or delete items first
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Package size={64} className="text-light mb-3" />
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                        {searchTerm ? 'No categories found' : 'No categories available'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                        {searchTerm 
                          ? 'Try adjusting your search terms' 
                          : 'Get started by creating your first category'
                        }
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Pagination */}
            {filteredCategories.length > 0 && (
              <div className="card-footer px-4 py-3 border-top border-secondary d-flex justify-content-center bg-dark">
                <Pagination
                  count={Math.ceil(filteredCategories.length / itemsPerPage)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#ffffff',
                      backgroundColor: 'var(--tertiary-bg)',
                      border: '1px solid var(--border-color)',
                      '&:hover': {
                        backgroundColor: 'var(--border-color)',
                        color: '#ffffff'
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'var(--accent-primary)',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: 'var(--accent-hover)',
                          color: '#ffffff'
                        },
                      },
                    },
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <CategoryForm
        category={selectedCategory}
        onSubmit={selectedCategory ? handleUpdateCategory : handleCreateCategory}
        onCancel={() => {
          setShowForm(false)
          setSelectedCategory(null)
        }}
        isOpen={showForm}
      />
    </div>
  )
}

export default Categories