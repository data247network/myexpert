import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { APIProvider } from '@vis.gl/react-google-maps'
import App from './App'
import './index.css'
import { initOneSignal } from '@/lib/notifications'

// Boot OneSignal (no-op when VITE_ONESIGNAL_APP_ID is not set)
initOneSignal()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min
      retry: 1,
    },
  },
})

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <APIProvider apiKey={MAPS_KEY}>
        <App />
      </APIProvider>
    </QueryClientProvider>
  </StrictMode>
)
