import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import './style.css'
import './assets/styles/main.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import { messages } from './utils/translations'

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'en',
  messages
})

// Create Pinia store
const pinia = createPinia()

// Create app
const app = createApp(App)

// Add request interceptor for debugging and authentication
axios.interceptors.request.use(config => {
  console.log(`Making request: ${config.method?.toUpperCase()} ${config.url}`)
  
  // Add token to request if it exists and isn't already set
  const token = localStorage.getItem('token')
  if (token && !config.headers['Authorization']) {
    // Make sure to use the exact token without any modifications
    const authHeader = `Bearer ${token}`
    config.headers['Authorization'] = authHeader
    console.log(`Added token to request: ${config.url}`)
    console.log(`Authorization header: ${authHeader.substring(0, 20)}...`)
  }
  
  // Log the full request for debugging
  if (config.url.includes('/orders') && config.method === 'post') {
    console.log('Full request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    })
  }
  
  return config
}, error => {
  console.error('Request error:', error)
  return Promise.reject(error)
})

// Add response interceptor for debugging and authentication errors
axios.interceptors.response.use(response => {
  console.log(`Response received: ${response.status} ${response.config.url}`)
  return response
}, async error => {
  // Handle specific error codes for authentication
  if (error.response) {
    console.error(`Request failed with status: ${error.response.status}`, error.config?.url)
    
    // Handle authentication errors (401 Unauthorized or 403 Forbidden)
    if (error.response.status === 401 || error.response.status === 403) {
      console.error('Authentication error:', error.response.status, error.config?.url)
      console.error('Error details:', error.response.data)
      
      // Log the request that failed for debugging
      console.error('Failed request details:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      })
      
      // Import AuthService dynamically to avoid circular dependency
      const AuthService = (await import('./services/AuthService')).default
      
      // Only try to refresh if not already at login page and not already trying to refresh
      if (router.currentRoute.value.name !== 'login' && !error.config?.url.includes('/auth')) {
        console.log('Attempting to refresh token before redirect')
        
        try {
          const newToken = await AuthService.refreshToken()
          if (newToken) {
            console.log('Token refreshed successfully, retrying original request')
            
            // If we got a new token, retry the original request
            const originalRequest = error.config
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`
            return axios(originalRequest)
          } else {
            console.error('Token refresh failed, redirecting to login')
          }
        } catch (refreshError) {
          console.error('Error during token refresh:', refreshError)
        }
      }
      
      // If refresh failed or not applicable, clear token and redirect
      localStorage.removeItem('token')
      
      // Redirect to login page if needed
      if (router.currentRoute.value.name !== 'login') {
        router.push('/login')
      }
    }
  } else {
    console.error(`Request failed: ${error.message}`, error.config?.url)
  }
  return Promise.reject(error)
})

// Add global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Error Info:', info)
  console.error('Component:', instance)
}

// Initialize app with plugins
app.use(pinia)
app.use(router)
app.use(i18n)

// Mount the app
app.mount('#app')

// Log successful mounting
console.log('Vue app mounted successfully')
