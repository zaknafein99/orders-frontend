import { eventBus } from '../utils/eventBus'
import AuthService from './AuthService'
import { calculateOrderTotal } from '../utils/orderUtils'
import api from './api'

/**
 * Service for handling order-related API calls and operations
 */
export default {
  // Cache for orders
  cachedPendingOrders: null,
  cachedDeliveredOrders: null,
  isPolling: false,

  /**
   * Fetch all pending orders
   * @param {Boolean} force Force a fresh fetch from the server (ignore cache)
   * @returns {Promise} Promise with pending orders data
   */
  getPendingOrders(force = false) {
    console.log('Fetching pending orders from API', force ? '(forced refresh)' : '')
    
    // Always force refresh when polling
    if (this.isPolling) {
      force = true;
    }
    
    // Use cached orders if available and not forcing refresh
    if (this.cachedPendingOrders && !force) {
      console.log('Using cached pending orders:', this.cachedPendingOrders.length)
      return Promise.resolve(this.cachedPendingOrders)
    }
    
    // Log the exact request we're making
    console.log('Making request to: /orders/pending')
    
    return api.get('/orders/pending', {
      // Add cache busting parameter when forcing refresh
      params: force ? { _t: new Date().getTime() } : {}
    })
    .then(response => {
      console.log('Orders API response status:', response.status)
      console.log('Orders response data type:', typeof response.data)
      
      let ordersData = [];
      
      if (response.data && response.data.content) {
        console.log('Orders content found, returning content array with length:', response.data.content.length)
        ordersData = response.data.content;
      } else if (Array.isArray(response.data)) {
        console.log('Response data is an array, returning directly with length:', response.data.length)
        ordersData = response.data;
      } else {
        console.log('Response data is not in expected format, attempting to parse')
        // Try to handle different response formats
        if (response.data && typeof response.data === 'object') {
          // If it's an object but not with a content property, it might be a single order or have a different structure
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val))
          if (possibleArrays.length > 0) {
            console.log('Found array in response object, using first array with length:', possibleArrays[0].length)
            ordersData = possibleArrays[0];
          }
          
          // If it looks like a single order, wrap it in an array
          else if (response.data.id && response.data.customer) {
            console.log('Response appears to be a single order, wrapping in array')
            ordersData = [response.data];
          }
        }
      }
      
      // Filter out any orders that have status 'DELIVERED'
      const pendingOrders = ordersData.filter(order => {
        const isDelivered = order.status === 'DELIVERED';
        if (isDelivered) {
          console.log(`Order ID ${order.id} has status DELIVERED, filtering out from pending orders`);
        }
        return !isDelivered;
      });
      
      console.log(`Filtered out ${ordersData.length - pendingOrders.length} delivered orders from pending list`);
      
      // Cache the orders
      this.cachedPendingOrders = pendingOrders;
      return pendingOrders;
    })
    .catch(error => {
      console.error('Error fetching orders:', error)
      this.handleAuthError(error)
      throw error
    })
  },

  /**
   * Fetch all delivered orders
   * @param {Boolean} force Force a fresh fetch from the server (ignore cache)
   * @returns {Promise} Promise with delivered orders data
   */
  getDeliveredOrders(force = false) {
    console.log('Fetching delivered orders from API', force ? '(forced refresh)' : '')
    
    // Always force refresh when polling
    if (this.isPolling) {
      force = true;
    }
    
    // Use cached orders if available and not forcing refresh
    if (this.cachedDeliveredOrders && !force) {
      console.log('Using cached delivered orders:', this.cachedDeliveredOrders.length)
      return Promise.resolve(this.cachedDeliveredOrders)
    }
    
    console.log('Making request to: /orders/delivered')
    
    // Use the API instance with automatic token handling
    return api.get('/orders/delivered', {
      // Add cache busting parameter when forcing refresh
      params: force ? { _t: new Date().getTime() } : {}
    })
    .then(response => {
      console.log('Delivered orders API response status:', response.status)
      
      let deliveredOrders = [];
      
      if (response.data && response.data.content) {
        console.log('Delivered orders content found, returning content array with length:', response.data.content.length)
        deliveredOrders = response.data.content;
      } else if (Array.isArray(response.data)) {
        console.log('Delivered orders response data is an array, returning directly with length:', response.data.length)
        deliveredOrders = response.data;
      } else {
        console.log('Delivered orders response data is not in expected format, attempting to parse')
        // Try to handle different response formats
        if (response.data && typeof response.data === 'object') {
          // If it's an object but not with a content property, it might be a single order or have a different structure
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val))
          if (possibleArrays.length > 0) {
            console.log('Found array in delivered orders response object, using first array with length:', possibleArrays[0].length)
            deliveredOrders = possibleArrays[0];
          }
          
          // If it looks like a single order, wrap it in an array
          if (response.data.id && response.data.customer) {
            console.log('Delivered orders response appears to be a single order, wrapping in array')
            deliveredOrders = [response.data];
          }
        }
      }
      
      // Cache the orders
      this.cachedDeliveredOrders = deliveredOrders;
      return deliveredOrders;
    })
    .catch(error => {
      console.error('Error fetching delivered orders:', error)
      this.handleAuthError(error)
      throw error
    })
  },

  /**
   * Fetch available items for ordering
   * @param {Number} page Page number (0-based)
   * @param {Number} size Items per page
   * @param {Boolean} forceRefresh Force a fresh fetch from server (ignore cache)
   * @returns {Promise} Promise with items data
   */
  getItems(page = 0, size = 10, forceRefresh = false) {
    console.log(`Fetching items, page: ${page}, size: ${size}, forceRefresh: ${forceRefresh}`)
    
    // Sort by name rather than id to maintain consistent sorting
    return api.get(`/item`, {
      params: {
        page,
        size,
        sort: 'name,asc',
        ...(forceRefresh ? { _t: new Date().getTime() } : {})
      }
    })
    .then(response => {
      console.log(`Items fetched successfully. Content array length: ${response.data?.content?.length || 0}`)
      return response.data
    })
    .catch(error => {
      // Check if it's a 404 error for a specific item
      if (error.response && error.response.status === 404) {
        console.error('Item not found error:', error.response.data)
        // Return empty data structure that matches expected format
        return { content: [], totalPages: 0, totalElements: 0, size: size, number: page }
      }
      
      this.handleAuthError(error)
      throw error
    })
  },

  /**
   * Create a new order
   * @param {Object} orderData Order data object
   * @returns {Promise} Promise with created order data
   */
  createOrder(orderData) {
    // Log the order data being sent to the API
    console.log('Sending order data to API:', JSON.stringify(orderData, null, 2))

    // Create a complete version of the order data
    const apiOrderData = {
      id: null,
      customer: {
        id: orderData.customer.id,
        name: orderData.customer.name,
        address: orderData.customer.address || '',
        phoneNumber: orderData.customer.phoneNumber || '',
        type: orderData.customer.type || 'E',
        state: orderData.customer.state || 'A'
      },
      truck: {
        id: orderData.truck ? orderData.truck.id : null
      },
      items: orderData.items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name
      })),
      totalPrice: calculateOrderTotal(orderData.items),
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0]
    }
    
    console.log('Transformed order data for API:', JSON.stringify(apiOrderData, null, 2))
    
    return api.post('/orders', apiOrderData)
      .then(response => {
        console.log('Order created successfully:', response.data)
        // Clear the cache to force fresh data on next fetch
        this.cachedPendingOrders = null
        return response.data
      })
      .catch(error => {
        console.error('Error creating order:', error)
        this.handleAuthError(error)
        throw error
      })
  },

  /**
   * Update order status
   * @param {Number} orderId The ID of the order
   * @param {String} status The new status
   * @returns {Promise} Promise with the updated order
   */
  updateOrderStatus(orderId, status) {
    console.log(`Updating order ${orderId} status to ${status}`)
    
    return api.put(`/orders/${orderId}/status`, { status })
      .then(response => {
        console.log(`Order ${orderId} status updated successfully to ${status}`)
        this.refreshOrders()
        return response.data
      })
      .catch(error => {
        console.error(`Error updating order ${orderId} status:`, error)
        this.handleAuthError(error)
        throw error
      })
  },

  /**
   * Mark order as delivered
   * @param {Number} orderId The ID of the order
   * @param {Number} truckId Optional truck ID
   * @returns {Promise} Promise with the updated order
   */
  markOrderAsDelivered(orderId, truckId = null) {
    console.log(`Marking order ${orderId} as delivered`)
    
    // If no truck is selected, try to get it from the current truck assignment
    if (!truckId) {
      console.log('No truck ID provided, attempting to get current truck assignment')
      return this.getOrderDetails(orderId)
        .then(order => {
          if (order && order.truck && order.truck.id) {
            console.log(`Found existing truck assignment: ${order.truck.id}`)
            return api.post(`/orders/${orderId}/deliver`)
          } else {
            console.log('No existing truck assignment found, order cannot be delivered without a truck')
            return Promise.reject(new Error('Cannot mark an order as delivered without assigning a truck'))
          }
        })
        .then(response => {
          console.log(`Order ${orderId} marked as delivered successfully:`, response.data)
          this.refreshOrders()
          return response.data
        })
        .catch(error => {
          console.error(`Error marking order ${orderId} as delivered:`, error)
          this.handleAuthError(error)
          throw error
        })
    }
    
    // If truck is provided, use it
    console.log(`Using provided truck ID: ${truckId}`)
    return this.assignTruckToOrder(orderId, truckId)
      .then(() => {
        return api.post(`/orders/${orderId}/deliver`)
      })
      .then(response => {
        console.log(`Order ${orderId} marked as delivered successfully:`, response.data)
        this.refreshOrders()
        return response.data
      })
      .catch(error => {
        console.error(`Error marking order ${orderId} as delivered:`, error)
        this.handleAuthError(error)
        throw error
      })
  },

  /**
   * Assign truck to order
   * @param {Number} orderId The ID of the order
   * @param {Number} truckId The ID of the truck
   * @returns {Promise} Promise with the updated order
   */
  assignTruckToOrder(orderId, truckId) {
    console.log(`Assigning truck ${truckId} to order ${orderId}`)
    
    return api.put(`/orders/${orderId}/truck/${truckId}`)
      .then(response => {
        console.log(`Truck ${truckId} assigned to order ${orderId} successfully:`, response.data)
        return response.data
      })
      .catch(error => {
        console.error(`Error assigning truck ${truckId} to order ${orderId}:`, error)
        this.handleAuthError(error)
        throw error
      })
  },

  /**
   * Handle API errors, particularly auth errors
   * @param {Error} error The error object
   */
  handleAuthError(error) {
    if (error.response) {
      const status = error.response.status
      console.error(`API Error: ${status} - ${error.response.statusText}`)
      
      if (status === 401 || status === 403) {
        console.error('Authentication error detected')
        
        // Try to refresh the token first
        AuthService.refreshToken()
          .then(newToken => {
            if (newToken) {
              console.log('Token refreshed successfully')
            } else {
              console.error('Token refresh failed, logging out')
              AuthService.logout()
              eventBus.emit('auth-error')
            }
          })
          .catch(() => {
            console.error('Token refresh failed with error, logging out')
            AuthService.logout()
            eventBus.emit('auth-error')
          })
      } else if (status === 400) {
        eventBus.emit('api-error', { message: 'Invalid order data format', details: error.response.data })
      } else if (status === 404) {
        eventBus.emit('api-error', { message: 'Resource not found', details: error.response.data });
      }
    } else if (error.request) {
      console.error('No response received from server', error.request)
      eventBus.emit('api-error', { message: 'No response from server' })
    } else {
      console.error('Error setting up request:', error.message)
      eventBus.emit('api-error', { message: 'Error setting up request' })
    }
  },
  
  /**
   * Refresh both pending and delivered orders
   * Helper method to refresh the UI after changes
   */
  refreshOrders() {
    console.log('Refreshing orders...');
    // Explicitly clear the cached orders to force a fresh fetch
    console.log('Clearing cached pending and delivered orders');
    this.cachedPendingOrders = null;
    this.cachedDeliveredOrders = null;
    
    // Emit an event to trigger a refresh in UI components
    eventBus.emit('refresh-orders');
    
    // Force a refresh of the cached orders
    this.getPendingOrders(true)
      .catch(error => console.error('Error refreshing pending orders:', error));
    
    this.getDeliveredOrders(true)
      .catch(error => console.error('Error refreshing delivered orders:', error));
  },
  
  /**
   * Cancel an order by deleting it from the database
   * @param {Number} orderId The ID of the order to cancel
   * @returns {Promise} Promise with the result of the cancellation
   */
  cancelOrder(orderId) {
    if (!orderId) {
      return Promise.reject(new Error('Order ID is required'));
    }

    console.log(`Canceling order with ID: ${orderId}`);
    
    // First, get the order to make sure it exists
    return this.getOrderDetails(orderId)
      .then(order => {
        if (!order) {
          throw new Error(`Order with ID ${orderId} not found`);
        }
        
        console.log(`Found order ${orderId}, status: ${order.status}`);
        
        // If order is already delivered, don't allow cancellation
        if (order.status === 'DELIVERED') {
          throw new Error('Cannot cancel an order that has already been delivered');
        }
        
        // Make an actual DELETE call to the API to cancel the order
        return api.delete(`/orders/${orderId}`)
        .then(() => {
          console.log(`Order ${orderId} canceled successfully on the backend`);
          // After successful backend deletion, update the UI
          return this.removeOrderLocally(orderId);
        })
        .catch(error => {
          console.error(`Error deleting order ${orderId} on the backend:`, error);
          throw error;
        });
      })
      .catch(error => {
        console.error(`Error in cancelOrder for order ${orderId}:`, error);
        // If we can't get the order, assume it doesn't exist
        if (error.response && error.response.status === 404) {
          // The order doesn't exist in the backend, so we can just remove it locally
          this.removeOrderLocally(orderId);
          return { success: true, message: `Order ${orderId} removed from UI` };
        }
        throw error;
      });
  },
  
  /**
   * Get details of a specific order
   * @param {Number} orderId The order ID
   * @returns {Promise<Object>} Promise with the order details
   */
  getOrderDetails(orderId) {
    console.log(`Getting details for order ${orderId}`);
    
    // Try to find the order in the pending orders
    return this.getPendingOrders()
      .then(pendingOrders => {
        console.log(`Checking ${pendingOrders.length} pending orders for ID ${orderId}`);
        const order = pendingOrders.find(o => o.id === parseInt(orderId));
        if (order) {
          return order;
        }
        
        // If not found in pending, check delivered orders
        return this.getDeliveredOrders()
          .then(deliveredOrders => {
            console.log(`Checking ${deliveredOrders.length} delivered orders for ID ${orderId}`);
            const order = deliveredOrders.find(o => o.id === parseInt(orderId));
            if (order) {
              return order;
            }
            
            throw { response: { status: 404 } };
          });
      });
  },
  
  /**
   * Remove an order from local state and refresh the UI
   * @param {Number} orderId The order ID to remove
   * @returns {Promise<Object>} Promise that resolves when the UI is updated
   */
  removeOrderLocally(orderId) {
    console.log(`Removing order ${orderId} from local state`);
    // Emit an event to notify components that an order has been canceled
    eventBus.emit('order-canceled', orderId);
    // Refresh orders to ensure UI is in sync
    this.refreshOrders();
    return Promise.resolve({ success: true, message: `Order ${orderId} canceled` });
  }
}