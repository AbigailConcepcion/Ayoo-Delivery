/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_APP_ENV: 'development' | 'production' | 'staging'
  readonly VITE_GOOGLE_AI_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
