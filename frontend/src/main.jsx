import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('React app is starting...') // Debug log

try {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('App rendered successfully') // Debug log
} catch (error) {
  console.error('Error rendering app:', error) // Debug log
}