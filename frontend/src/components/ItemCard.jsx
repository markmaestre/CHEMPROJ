import React from 'react'
import { Edit, Trash2, AlertTriangle, Clock, CheckCircle, FlaskConical, Ban } from 'lucide-react'

function ItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  onBorrow,
  showActions = true,
  userRole = 'viewer'
}) {
  const isLowStock = item.available_quantity <= item.min_stock_level
  const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date()
  const canBorrow = item.is_borrowable && item.available_quantity > 0 && !isExpired
  
  const getConditionColor = (condition) => {
    switch (condition) {
      case 'good': return 'var(--success-color)'
      case 'for_disposal': return 'var(--warning-color)'
      case 'expired': return 'var(--error-color)'
      default: return 'var(--text-muted)'
    }
  }

  const getStatusIcon = () => {
    if (isExpired) return <AlertTriangle size={16} color="var(--warning-color)" />
    if (isLowStock) return <Clock size={16} color="var(--warning-color)" />
    return <CheckCircle size={16} color="var(--success-color)" />
  }

  const getStatusText = () => {
    if (isExpired) return 'Expired'
    if (isLowStock) return 'Low Stock'
    return 'Available'
  }

  return (
    <div className="card bg-dark border-secondary h-100">
      <div className="card-body d-flex flex-column">
        {/* Item Image - Larger Size */}
        <div className="item-image-section mb-3">
          <div className="item-image-wrapper">
            {item.image_url ? (
              <img 
                src={`http://localhost:8000/uploads/${item.image_url}`} 
                alt={item.name}
                className="item-image"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div className="item-image-placeholder">
              <FlaskConical size={48} className="text-light" />
            </div>
            
            {/* Status Badge */}
            <div className={`status-badge ${isExpired ? 'bg-danger' : isLowStock ? 'bg-warning' : 'bg-success'}`}>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
          </div>
        </div>

        {/* Item Content */}
        <div className="item-content flex-grow-1">
          {/* Item Header */}
          <div className="item-header mb-2">
            <h5 className="item-name text-white mb-1">{item.name}</h5>
            <p className="item-category text-light small mb-2">
              {item.category?.name}
            </p>
          </div>

          {/* Item Description */}
          {item.description && (
            <p className="item-description text-light small mb-3">
              {item.description}
            </p>
          )}

          {/* Item Details */}
          <div className="item-details">
            <div className="detail-item mb-2">
              <div className="d-flex justify-content-between">
                <span className="text-light small">Available:</span>
                <span className={`small ${isLowStock ? 'text-warning fw-bold' : 'text-light'}`}>
                  {item.available_quantity} / {item.quantity} {item.unit}
                </span>
              </div>
            </div>

            <div className="detail-item mb-2">
              <div className="d-flex justify-content-between">
                <span className="text-light small">Location:</span>
                <span className="text-light small">
                  {item.storage_location || 'Not specified'}
                </span>
              </div>
            </div>

            <div className="detail-item mb-2">
              <div className="d-flex justify-content-between">
                <span className="text-light small">Condition:</span>
                <span 
                  className="small fw-bold condition-badge"
                  style={{ color: getConditionColor(item.condition) }}
                >
                  {item.condition?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            </div>

            {item.expiry_date && (
              <div className="detail-item mb-2">
                <div className="d-flex justify-content-between">
                  <span className="text-light small">Expires:</span>
                  <span className={`small ${isExpired ? 'text-danger fw-bold' : 'text-light'}`}>
                    {new Date(item.expiry_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {item.min_stock_level > 0 && (
              <div className="detail-item">
                <div className="d-flex justify-content-between">
                  <span className="text-light small">Min Stock:</span>
                  <span className="text-light small">
                    {item.min_stock_level} {item.unit}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Item Actions */}
        {showActions && (
          <div className="item-actions mt-3 pt-3 border-top border-secondary">
            <div className="d-flex gap-2 flex-wrap">
              {/* Borrow Button - Only show if item can be borrowed */}
              {userRole !== 'viewer' && item.is_borrowable && (
                <button 
                  onClick={() => onBorrow(item)}
                  disabled={!canBorrow}
                  className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-1 ${
                    canBorrow ? 'btn-primary' : 'btn-secondary'
                  }`}
                  title={!canBorrow ? 
                    (isExpired ? 'Cannot borrow expired items' : 
                     item.available_quantity === 0 ? 'Item out of stock' : 
                     'Cannot borrow this item') : 
                    'Borrow item'
                  }
                >
                  {canBorrow ? (
                    <>
                      <CheckCircle size={14} />
                      Borrow
                    </>
                  ) : (
                    <>
                      <Ban size={14} />
                      Unavailable
                    </>
                  )}
                </button>
              )}

              {/* Admin Actions */}
              {userRole === 'admin' && (
                <>
                  <button 
                    onClick={() => onEdit(item)}
                    className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button 
                    onClick={() => onDelete(item)}
                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              )}
            </div>

            {/* Borrowing Restrictions Info */}
            {!canBorrow && item.is_borrowable && (
              <div className="mt-2">
                {isExpired && (
                  <small className="text-danger d-block">
                    <AlertTriangle size={12} className="me-1" />
                    This item has expired and cannot be borrowed
                  </small>
                )}
                {item.available_quantity === 0 && (
                  <small className="text-warning d-block">
                    <Clock size={12} className="me-1" />
                    This item is currently out of stock
                  </small>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .item-image-section {
          position: relative;
        }

        .item-image-wrapper {
          position: relative;
          width: 100%;
          height: 200px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--tertiary-bg);
          border: 2px solid var(--border-color);
        }

        .item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .item-image-wrapper:hover .item-image {
          transform: scale(1.05);
        }

        .item-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--tertiary-bg);
          color: var(--text-muted);
        }

        .status-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .condition-badge {
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.1);
        }

        .item-name {
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.3;
        }

        .item-description {
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .item-details {
          background: var(--tertiary-bg);
          padding: var(--space-md);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .detail-item:last-child {
          margin-bottom: 0 !important;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .item-image-wrapper {
            height: 160px;
          }
          
          .item-actions .d-flex {
            flex-direction: column;
          }
          
          .item-actions .btn {
            min-width: auto;
          }
        }

        @media (max-width: 576px) {
          .item-image-wrapper {
            height: 140px;
          }
          
          .status-badge {
            font-size: 0.7rem;
            padding: 3px 6px;
          }
        }
      `}</style>
    </div>
  )
}

export default ItemCard