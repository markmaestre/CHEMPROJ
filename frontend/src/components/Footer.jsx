import React from 'react'
import { FlaskConical } from 'lucide-react'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-brand">
            <FlaskConical size={24} />
            <span className="brand-name">Chemistry Lab Inventory</span>
          </div>
          <p className="footer-description">
            TUPT Laboratory Management System for efficient inventory tracking and equipment management.
          </p>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-section-title">Contact Info</h4>
          <div className="contact-info">
            <div className="contact-item">
              <span>📍 TUPT Taguig Campus</span>
            </div>
            <div className="contact-item">
              <span>📞 (02) 123-4567-89</span>
            </div>
            <div className="contact-item">
              <span>✉️ avery.macasa@tupt.edu.ph</span>
            </div>
          </div>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-section-title">Quick Links</h4>
          <div className="quick-links">
            <a href="/dashboard" className="footer-link">Dashboard</a>
            <a href="/items" className="footer-link">Inventory</a>
            <a href="/borrowed" className="footer-link">Borrowed Items</a>
            <a href="/reports" className="footer-link">Reports</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-info">
          <span>© 2025 TUPT Laboratory Management. All rights reserved.</span>
          <div className="footer-meta">
            <span className="footer-version">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer