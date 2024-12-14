import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import { BrowserRouter } from "react-router"

createRoot(document.getElementById('root')!).render(
  // StrictMode causes render twice in development mode,
  // It is the desired behaviour which would not happen
  // in Prod.
  // https://legacy.reactjs.org/docs/strict-mode.html
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
