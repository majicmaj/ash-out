import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { StructurerProvider } from './features/structure/StructurerProvider'
import './index.css'

// Auto-update the service worker so users always get the latest shell offline.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StructurerProvider>
      <App />
    </StructurerProvider>
  </StrictMode>,
)
