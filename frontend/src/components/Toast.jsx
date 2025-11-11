import React, { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useToast } from '../services/ToastContext'
import '../styles/design-system.css'

function Toast() {
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration !== 0) {
        const timer = setTimeout(() => {
          removeToast(toast.id)
        }, toast.duration)
        
        return () => clearTimeout(timer)
      }
    })
  }, [toasts, removeToast])

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />
      case 'error': return <AlertCircle size={20} />
      case 'warning': return <AlertTriangle size={20} />
      default: return <Info size={20} />
    }
  }

  const getToastClass = (type) => {
    switch (type) {
      case 'success': return 'toast-success'
      case 'error': return 'toast-error'
      case 'warning': return 'toast-warning'
      default: return 'toast-info'
    }
  }

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${getToastClass(toast.type)}`}
        >
          <div className="toast-icon">
            {getToastIcon(toast.type)}
          </div>
          <div className="toast-content">
            <p className="toast-message">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="toast-close-btn"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      
      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          animation: slideIn 0.3s ease;
          border: 1px solid;
          max-width: 400px;
        }

        .toast-success {
          background: var(--secondary-bg);
          border-color: var(--success-color);
          color: var(--success-color);
        }

        .toast-error {
          background: var(--secondary-bg);
          border-color: var(--error-color);
          color: var(--error-color);
        }

        .toast-warning {
          background: var(--secondary-bg);
          border-color: var(--warning-color);
          color: var(--warning-color);
        }

        .toast-info {
          background: var(--secondary-bg);
          border-color: var(--accent-secondary);
          color: var(--accent-secondary);
        }

        .toast-icon {
          flex-shrink: 0;
        }

        .toast-content {
          flex: 1;
        }

        .toast-message {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.4;
        }

        .toast-close-btn {
          background: none;
          border: none;
          color: currentColor;
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-sm);
          opacity: 0.7;
          transition: opacity var(--transition-fast);
        }

        .toast-close-btn:hover {
          opacity: 1;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .toast-container {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
          }

          .toast {
            max-width: none;
          }
        }
      `}</style>
    </div>
  )
}

export default Toast