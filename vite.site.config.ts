import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** La page de démonstration (site/), servie par le Worker Cloudflare : `npm run site`, `npm run build-site`. */
export default defineConfig({
  root: resolve(import.meta.dirname, 'site'),
  base: './',
  plugins: [react()],
  build: {
    outDir: resolve(import.meta.dirname, 'site-dist'),
    emptyOutDir: true,
  },
})
