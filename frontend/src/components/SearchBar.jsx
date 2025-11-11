import React from 'react'
import { Search } from 'lucide-react'
import '../styles/design-system.css'

function SearchBar({ 
  searchTerm, 
  onSearchChange,
  filters,
  onFilterChange,
  availableFilters = {}
}) {
  return (
    <div className="ds-search-container">
      <div className="ds-search-box">
        <Search className="ds-search-icon" size={20} />
        <input
          type="text"
          placeholder="Search items by name, description, or location..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ds-search-input"
        />
      </div>
      
      <div className="ds-filter-row">
        {availableFilters.category && (
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="ds-filter-select"
          >
            <option value="">All Categories</option>
            {availableFilters.category.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={filters.condition || ''}
          onChange={(e) => onFilterChange('condition', e.target.value)}
          className="ds-filter-select"
        >
          <option value="">All Conditions</option>
          <option value="good">Good Condition</option>
          <option value="for_disposal">For Disposal</option>
          <option value="expired">Expired</option>
        </select>

        {availableFilters.lowStock !== undefined && (
          <select
            value={filters.lowStock || ''}
            onChange={(e) => onFilterChange('lowStock', e.target.value === 'true')}
            className="ds-filter-select"
          >
            <option value="">All Stock Levels</option>
            <option value="true">Low Stock Only</option>
          </select>
        )}
      </div>
    </div>
  )
}

export default SearchBar