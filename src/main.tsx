import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import App from './App.tsx'
import { theme } from './theme'

// Prevent mobile context menu globally
document.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

// Prevent mobile long press context menu
let touchTimeout: number | null = null
document.addEventListener('touchstart', (e) => {
  if (touchTimeout) {
    clearTimeout(touchTimeout)
  }
  touchTimeout = setTimeout(() => {
    // Cancel any potential context menu after 500ms
    e.preventDefault()
  }, 500)
}, { passive: false })

document.addEventListener('touchend', () => {
  if (touchTimeout) {
    clearTimeout(touchTimeout)
    touchTimeout = null
  }
})

document.addEventListener('touchcancel', () => {
  if (touchTimeout) {
    clearTimeout(touchTimeout)
    touchTimeout = null
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto" forceColorScheme={undefined}>
      <App />
    </MantineProvider>
  </StrictMode>,
)
