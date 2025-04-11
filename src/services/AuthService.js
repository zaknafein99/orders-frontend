import api from './api'
import { eventBus } from '../utils/eventBus'

export default {
  /**
   * Login with email and password
   * @param {String} email User email
   * @param {String} password User password
   * @returns {Promise} Promise with login result
   */
  login(email, password) {
    console.log('Attempting login with email:', email)
    return api.post('/auth', { email, password })
      .then(response => {
        console.log('Login response:', response)
        const { accessToken, refreshToken } = response.data
        
        console.log('Full response data:', response.data)
        
        if (!accessToken) {
          console.error('No access token found in response!')
          console.error('Response data:', response.data)
          throw new Error('No access token found in response')
        }
        
        console.log(`Received token: ${accessToken.substring(0, 15)}...`)
        
        // Store tokens in localStorage
        localStorage.setItem('token', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        
        // Store credentials for future refresh if needed
        localStorage.setItem('userEmail', email)
        localStorage.setItem('userPassword', password)
        
        console.log('Tokens and credentials stored in localStorage')
        
        // Set the token in axios default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        console.log('Token set in axios default headers')
        
        // Emit login success event
        eventBus.emit('login-success')
        console.log('Login success event emitted')
        
        return accessToken
      })
      .catch(error => {
        console.error('Login error:', error)
        if (error.response) {
          console.error('Error response data:', error.response.data)
          console.error('Error response status:', error.response.status)
        }
        throw error
      })
  },

  /**
   * Logout the current user
   */
  logout() {
    // Remove token and credentials from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userPassword')
    
    // Clear authorization header
    delete api.defaults.headers.common['Authorization']
    
    // Emit logout event
    eventBus.emit('logout')
  },

  /**
   * Check if user is authenticated
   * @returns {Boolean} True if authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  /**
   * Get the current authentication token
   * @returns {String|null} The token or null if not authenticated
   */
  getToken() {
    const token = localStorage.getItem('token')
    if (token) {
      console.log(`Retrieved token from storage: ${token.substring(0, 15)}...`)
    }
    return token
  },

  /**
   * Initialize authentication state
   * Checks if there's a token in localStorage and emits the appropriate event
   */
  initAuth() {
    const token = this.getToken()
    if (token) {
      console.log('Found existing token, emitting login-success event')
      
      // Set the token in axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Verify token validity by making a test request
      this.verifyToken(token)
        .then(isValid => {
          if (isValid) {
            eventBus.emit('login-success', token)
          } else {
            console.log('Token is invalid, removing')
            this.logout()
          }
        })
        .catch(() => {
          console.log('Token verification failed, removing')
          this.logout()
        })
      
      return true
    }
    return false
  },
  
  /**
   * Verify if the token is still valid
   * @param {String} token The token to verify
   * @returns {Promise<boolean>} Promise that resolves to true if token is valid
   */
  verifyToken(token) {
    // Make a simple request to check if the token is still valid
    return api.get('/customer/list?size=1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(() => true)
    .catch(error => {
      console.error('Token verification failed:', error.response ? error.response.status : error)
      return false
    })
  },
  
  /**
   * Refresh the authentication token
   * @returns {Promise<string|null>} Promise that resolves to the new token or null if refresh failed
   */
  refreshToken() {
    console.log('Attempting to refresh token')
    
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (refreshToken) {
      console.log('Found refresh token, attempting to refresh access token')
      
      return api.post('/auth/refresh', { token: refreshToken })
        .then(response => {
          console.log('Token refresh response:', response)
          
          // Check if the response contains the new token
          if (response.data && response.data.token) {
            const newToken = response.data.token
            
            // Update the stored token
            localStorage.setItem('token', newToken)
            
            // Update the authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
            
            console.log('Access token refreshed successfully')
            return newToken
          } else {
            console.error('No token in refresh response')
            return null
          }
        })
        .catch(error => {
          console.error('Failed to refresh token with refresh token:', error)
          
          // Fall back to credentials-based refresh if available
          return this.refreshWithCredentials()
        })
    } else {
      console.log('No refresh token found, trying credentials refresh')
      return this.refreshWithCredentials()
    }
  },
  
  /**
   * Fall back to credentials-based refresh if refresh token fails
   * @returns {Promise<string|null>} Promise that resolves to the new token or null if refresh failed
   */
  refreshWithCredentials() {
    const userEmail = localStorage.getItem('userEmail')
    const userPassword = localStorage.getItem('userPassword')
    
    if (userEmail && userPassword) {
      console.log(`Found stored credentials for ${userEmail}, attempting to re-login`)
      
      // Re-authenticate with stored credentials
      return this.login(userEmail, userPassword)
        .then(newToken => {
          console.log('Token refreshed successfully through re-login')
          return newToken
        })
        .catch(error => {
          console.error('Failed to refresh token through re-login:', error)
          return null
        })
    } else {
      console.error('No stored credentials found, cannot refresh token')
      return Promise.resolve(null)
    }
  }
}
