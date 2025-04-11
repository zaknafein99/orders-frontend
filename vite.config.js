import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'vue-i18n']
  },
  build: {
    target: 'esnext',
    sourcemap: true
  },
  server: {
    host: '0.0.0.0',
    hmr: {
      host: 'localhost',
      protocol: 'ws'
    },
    watch: {
      usePolling: true
    },
    proxy: {
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying auth request:', {
              method: req.method,
              url: req.url,
              headers: req.headers
            })
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received auth response:', {
              status: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers
            })
          })
          proxy.on('error', (err, req, res) => {
            console.error('Auth proxy error:', err)
          })
        }
      },
      '/customer': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying customer request:', {
              method: req.method,
              url: req.url,
              headers: req.headers
            })
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received customer response:', {
              status: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers
            })
          })
          proxy.on('error', (err, req, res) => {
            console.error('Customer proxy error:', err)
          })
        }
      },
      '/orders': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying orders request:', {
              method: req.method,
              url: req.url,
              headers: req.headers
            })
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received orders response:', {
              status: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers
            })
          })
          proxy.on('error', (err, req, res) => {
            console.error('Orders proxy error:', err)
          })
        }
      },
      '/truck': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying truck request:', {
              method: req.method,
              url: req.url,
              headers: req.headers
            })
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received truck response:', {
              status: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers
            })
          })
          proxy.on('error', (err, req, res) => {
            console.error('Truck proxy error:', err)
          })
        }
      },
      '/item': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying item request:', {
              method: req.method,
              url: req.url,
              headers: req.headers
            })
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received item response:', {
              status: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers
            })
          })
          proxy.on('error', (err, req, res) => {
            console.error('Item proxy error:', err)
          })
        }
      },
      '/dashboard': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying dashboard request:', {
              method: req.method,
              url: req.url,
              headers: req.headers
            })
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received dashboard response:', {
              status: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers
            })
          })
          proxy.on('error', (err, req, res) => {
            console.error('Dashboard proxy error:', err)
          })
        }
      }
    }
  }
})
