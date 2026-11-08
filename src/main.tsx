import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.tsx'
import { applyBrandTheme } from './config/brandTheme'

applyBrandTheme(import.meta.env.VITE_BRAND_COLOR)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
