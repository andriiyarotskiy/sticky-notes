import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@common': fileURLToPath(
        new URL('./src/components/common', import.meta.url),
      ),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
    },
  },
})
