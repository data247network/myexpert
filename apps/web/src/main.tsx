import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { APIProvider } from '@vis.gl/react-google-maps'
import App from './App'
import './index.css'

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
