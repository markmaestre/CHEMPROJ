import React, { useState, useEffect } from 'react'
import { Plus, Download, Search, Filter, X } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { itemService, categoryService, borrowService } from '../services/api'
import ItemCard from '../components/ItemCard'
import ItemForm from '../components/ItemForm'
import BorrowLogForm from '../components/BorrowLogForm'
import '../styles/design-system.css'

function Items() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showItemForm, setShowItemForm] = useState(false)
  const [showBorrowForm, setShowBorrowForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadItems()
    loadCategories()
  }, [])

  useEffect(() => {
    // Reload items when filters change
    const timeoutId = setTimeout(() => {
      loadItems()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedCategory, selectedCondition, showLowStock])

  const loadItems = async () => {
    try {
      const params = {
        search: searchTerm || undefined,
        category_id: selectedCategory || undefined,
        condition: selectedCondition || undefined,
        low_stock: showLowStock || undefined
      }
      
      const data = await itemService.getItems(params)
      setItems(data)
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleCreateItem = async (formData) => {
    try {
      await itemService.createItem(formData)
      loadItems()
    } catch (error) {
      console.error('Error creating item:', error)
      throw error
    }
  }

  const handleUpdateItem = async (formData, itemId) => {
    try {
      await itemService.updateItem(itemId, formData)
      loadItems()
    } catch (error) {
      console.error('Error updating item:', error)
      throw error
    }
  }

const handleDeleteItem = async (item) => {
  if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
    try {
      await itemService.deleteItem(item.id)
      loadItems()
      toast.success('Item deleted successfully!') // Add toast here
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Error deleting item') // Add error toast
    }
  }
}

  const handleBorrowItem = async (borrowData) => {
    try {
      await borrowService.createBorrowLog(borrowData)
      loadItems()
    } catch (error) {
      console.error('Error creating borrow log:', error)
      throw error
    }
  }

  const handleEdit = (item) => {
    setSelectedItem(item)
    setShowItemForm(true)
  }

  const handleBorrow = (item) => {
    setSelectedItem(item)
    setShowBorrowForm(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedCondition('')
    setShowLowStock(false)
  }

  const exportItems = () => {
    const csvContent = [
      ['Name', 'Category', 'Quantity', 'Available', 'Unit', 'Location', 'Condition'],
      ...items.map(item => [
        item.name,
        item.category?.name,
        item.quantity,
        item.available_quantity,
        item.unit,
        item.storage_location,
        item.condition
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'chem-lab-items.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const hasActiveFilters = searchTerm || selectedCategory || selectedCondition || showLowStock

  return (
    <div className="ds-component">
      <div className="page-header">
        <div className="page-title">
          <h1>Inventory Items</h1>
          <p>Manage laboratory items and equipment</p>
        </div>
        <div className="page-actions">
          {user?.role === 'admin' && (
            <>
              <button 
                onClick={exportItems}
                className="ds-btn ds-btn-secondary"
              >
                <Download size={18} />
                Export CSV
              </button>
              <button 
                onClick={() => setShowItemForm(true)}
                className="ds-btn ds-btn-primary"
              >
                <Plus size={18} />
                Add Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* Simplified Search and Filters */}
      <div className="search-filters-container">
        <div className="search-section">
          <div className="ds-input-wrapper">
            <Search size={18} className="ds-input-icon" />
            <input
              type="text"
              placeholder="Search items by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ds-input"
            />
          </div>
          
          <button 
            className="ds-btn ds-btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>

          {hasActiveFilters && (
            <button 
              className="ds-btn ds-btn-ghost"
              onClick={clearFilters}
            >
              <X size={18} />
              Clear
            </button>
          )}
        </div>

        {/* Quick Filters - Always Visible */}
        <div className="quick-filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="ds-select quick-filter"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="ds-select quick-filter"
          >
            <option value="">All Conditions</option>
            <option value="good">Good Condition</option>
            <option value="for_disposal">For Disposal</option>
            <option value="expired">Expired</option>
          </select>

          <label className="checkbox-label quick-filter">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
            />
            Low Stock Only
          </label>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="active-filters">
            <span className="active-filters-label">Active filters:</span>
            {searchTerm && (
              <span className="active-filter-tag">
                Search: "{searchTerm}" <X size={12} onClick={() => setSearchTerm('')} />
              </span>
            )}
            {selectedCategory && (
              <span className="active-filter-tag">
                Category: {categories.find(c => c.id == selectedCategory)?.name} 
                <X size={12} onClick={() => setSelectedCategory('')} />
              </span>
            )}
            {selectedCondition && (
              <span className="active-filter-tag">
                Condition: {selectedCondition.replace('_', ' ')} 
                <X size={12} onClick={() => setSelectedCondition('')} />
              </span>
            )}
            {showLowStock && (
              <span className="active-filter-tag">
                Low Stock <X size={12} onClick={() => setShowLowStock(false)} />
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="ds-loading-spinner">
            <div className="ds-spinner"></div>
            Loading items...
          </div>
        </div>
      ) : (
        <div className="items-grid">
          {items.length > 0 ? (
            items.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDeleteItem}
                onBorrow={handleBorrow}
                userRole={user?.role}
              />
            ))
          ) : (
            <div className="empty-state">
              <h3>No items found</h3>
              <p>Try adjusting your search or filters</p>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="ds-btn ds-btn-primary"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Item Form Modal */}
      <ItemForm
        item={selectedItem}
        onSubmit={selectedItem ? handleUpdateItem : handleCreateItem}
        onCancel={() => {
          setShowItemForm(false)
          setSelectedItem(null)
        }}
        isOpen={showItemForm}
      />

      {/* Borrow Form Modal */}
      {user?.role === 'admin' && (
        <BorrowLogForm
          item={selectedItem}
          onSubmit={handleBorrowItem}
          onCancel={() => {
            setShowBorrowForm(false)
            setSelectedItem(null)
          }}
          isOpen={showBorrowForm}
          currentUser={user}
        />
      )}

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

        .search-filters-container {
          background: var(--secondary-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-2xl);
        }

        .search-section {
          display: flex;
          gap: var(--space-md);
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .search-section .ds-input-wrapper {
          flex: 1;
          max-width: 400px;
        }

        .quick-filters {
          display: flex;
          gap: var(--space-md);
          align-items: center;
          flex-wrap: wrap;
        }

        .quick-filter {
          min-width: 150px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
        }

        .checkbox-label input {
          margin: 0;
        }

        .active-filters {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex-wrap: wrap;
          margin-top: var(--space-lg);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--border-color);
        }

        .active-filters-label {
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .active-filter-tag {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          background: var(--tertiary-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--space-xs) var(--space-sm);
          font-size: 0.75rem;
          color: var(--text-primary);
        }

        .active-filter-tag svg {
          cursor: pointer;
          opacity: 0.7;
        }

        .active-filter-tag svg:hover {
          opacity: 1;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--space-xl);
        }

        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: var(--space-2xl);
          color: var(--text-secondary);
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: var(--space-2xl);
          color: var(--text-secondary);
        }

        .empty-state h3 {
          color: var(--text-primary);
          margin-bottom: var(--space-sm);
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

          .search-section {
            flex-direction: column;
            align-items: stretch;
          }

          .search-section .ds-input-wrapper {
            max-width: none;
          }

          .quick-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .quick-filter {
            min-width: auto;
          }

          .items-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Items