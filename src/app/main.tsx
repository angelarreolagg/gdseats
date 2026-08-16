import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/globals.css'
// Above `App`, and imported for its side effect: the singleton initialises at
// module scope, so anything below this line can call `t()` on first render.
import '@/shared/i18n'
import { App } from './App'
import { AppProviders } from './providers/AppProviders'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
