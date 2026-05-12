import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { visualizer } from 'rollup-plugin-visualizer'

const plugins = [inspectAttr(), react()]

// Only enable visualizer when running build:analyze
if (process.env.ANALYZE === 'true') {
  plugins.push(visualizer({
    open: true,
    gzipSize: true,
    filename: 'dist/stats.html',
  }))
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins,
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-recharts'
            if (id.includes('@radix-ui')) return 'vendor-radix'
            if (id.includes('framer-motion')) return 'vendor-framer'
            if (id.includes('react-router')) return 'vendor-router'
            return 'vendor-misc'
          }
        },
      },
    },
    // Size budgets (warnings at 80% of limits)
    chunkSizeWarningLimit: 650, // KB (warn if >520KB)
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    exclude: ['node_modules', 'e2e'],
  },
})
