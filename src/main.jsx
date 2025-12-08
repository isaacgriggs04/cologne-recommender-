import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Verify root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

