import api from './api'
import AuthService from './AuthService'
import { eventBus } from '../utils/eventBus'

/**
 * Service for handling item-related API calls and operations
 */
export default {
  /**
   * Get all items with optional pagination
   * @param {Number} page Page number (0-based)
   * @param {Number} size Items per page
   * @returns {Promise} Promise with items data
   */
  getAllItems(page = 0, size = 10) {
    const token = localStorage.getItem('token')
    if (!token) {
      eventBus.emit('auth-error')
      return Promise.reject(new Error('Authentication required'))
    }

    return api.get(`/item?page=${page}&size=${size}&sort=name,asc`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.data)
    .catch(error => {
      this.handleAuthError(error)
      throw error
    })
  },

  /**
   * Get a single item by ID
   * @param {Number} id Item ID
   * @returns {Promise} Promise with item data
   */
  getItem(id) {
    const token = localStorage.getItem('token')
    if (!token) {
      eventBus.emit('auth-error')
      return Promise.reject(new Error('Authentication required'))
    }

    return api.get(`/item/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.data)
    .catch(error => {
      this.handleAuthError(error)
      throw error
    })
  },

  /**
   * Create a new item
   * @param {Object} itemData Item data object
   * @returns {Promise} Promise with created item data
   */
  createItem(itemData) {
    const token = AuthService.getToken()
    if (!token) {
      console.error('No authentication token found')
      eventBus.emit('auth-error')
      return Promise.reject(new Error('Authentication required'))
    }

    // Format the payload to match API expectations
    const apiPayload = {
      name: itemData.name,
      description: itemData.description || '',
      price: Number(itemData.price),
      quantity: Number(itemData.quantity) || 1,
      category: itemData.category || ''
    }

    console.log('Creating new item:', JSON.stringify(apiPayload, null, 2))

    return api.post('/item', apiPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('Item created successfully:', response.data)
      return response.data
    })
    .catch(error => {
      console.error('Error creating item:', error)
      this.handleAuthError(error)
      throw error
    })
  },

  /**
   * Update an existing item
   * @param {Number} id Item ID
   * @param {Object} itemData Updated item data
   * @returns {Promise} Promise with updated item data
   */
  updateItem(id, itemData) {
    const token = AuthService.getToken()
    if (!token) {
      console.error('No authentication token found')
      eventBus.emit('auth-error')
      return Promise.reject(new Error('Authentication required'))
    }

    // Format the payload to match API expectations
    const apiPayload = {
      name: itemData.name,
      description: itemData.description || '',
      price: Number(itemData.price),
      quantity: Number(itemData.quantity) || 1,
      category: itemData.category || ''
    }

    console.log(`Updating item ${id}:`, JSON.stringify(apiPayload, null, 2))

    return api.put(`/item/${id}`, apiPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('Item updated successfully:', response.data)
      return response.data
    })
    .catch(error => {
      console.error(`Error updating item ${id}:`, error)
      this.handleAuthError(error)
      throw error
    })
  },

  /**
   * Delete an item
   * @param {Number} id Item ID
   * @returns {Promise} Promise with deletion status
   */
  deleteItem(id) {
    const token = AuthService.getToken()
    if (!token) {
      console.error('No authentication token found')
      eventBus.emit('auth-error')
      return Promise.reject(new Error('Authentication required'))
    }

    return api.delete(`/item/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log(`Item ${id} deleted successfully`)
      return response.data
    })
    .catch(error => {
      console.error(`Error deleting item ${id}:`, error)
      this.handleAuthError(error)
      throw error
    })
  },

  /**
   * Handle authentication errors
   * @param {Error} error Error object
   */
  handleAuthError(error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Authentication error:', error)
      eventBus.emit('auth-error')
    }
  }
} 