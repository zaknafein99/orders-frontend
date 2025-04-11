import axios from 'axios'

// Create an Axios instance with custom config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', // Use environment variable or fallback
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url)
    // Don't add token for auth endpoints
    if (!config.url.startsWith('/auth')) {
      const token = localStorage.getItem('token')
      if (token) {
        console.log('Adding Authorization header with token')
        config.headers.Authorization = `Bearer ${token}`
      } else {
        console.warn('No token found in localStorage')
      }
    } else {
      console.log('Auth endpoint, not adding token')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log('401 Unauthorized error - clearing token and redirecting to login')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    // For all other errors, just reject the promise
    return Promise.reject(error)
  }
)

export default api
