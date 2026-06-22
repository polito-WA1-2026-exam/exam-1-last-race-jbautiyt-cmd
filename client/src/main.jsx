// ─── React client entry point ─────────────────────────────────────────────────
// This file mounts the React application into the #root element of the HTML.

import { StrictMode } from 'react'       // strict mode: detects issues in development
import { createRoot } from 'react-dom/client' // API to mount React into the DOM
import './index.css'                     // global base styles
import App from './App.jsx'              // root component of the application

// createRoot creates the React "root" on the div with id="root" in index.html
// StrictMode makes effects run twice in development to detect errors
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
