/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_ONESIGNAL_APP_ID?: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_ENV: string
  readonly VITE_PAYSTACK_PUBLIC_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
