import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode: .env.local (default dev), .env.qa, .env.production
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      // Make VITE_ENV available globally as a string constant
      __APP_ENV__: JSON.stringify(env.VITE_ENV || mode),
    },
  }
})

