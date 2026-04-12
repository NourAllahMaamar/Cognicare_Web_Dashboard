import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { bootstrapMaterialIconFallback } from './utils/materialIconFallback'

void bootstrapMaterialIconFallback();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
)
