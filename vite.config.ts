/// <reference types="vitest/config" />
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Le code : dist/index.js (ESM, React en dépendance pair). Les styles sont copiés tels quels dans
 * dist/styles (cf. scripts/copy-styles.mjs). Les apps importent l'un et l'autre :
 *   import { Button } from '@yoannyviquel/design-system'
 *   import '@yoannyviquel/design-system/styles.css'
 */
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
