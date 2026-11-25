import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return process.env.COMMIT_REF?.slice(0, 7) ?? 'dev'
  }
})()

export default defineConfig({
  define: { __BUILD__: JSON.stringify(commit) },
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
})
