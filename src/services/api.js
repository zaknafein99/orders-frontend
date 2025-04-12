import axios from 'axios'

// Create an Axios instance with custom config
const api = axios.create({
  baseURL: 'http://localhost:8080',
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

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response || error)
    return Promise.reject(error)
  }
)

export default api
