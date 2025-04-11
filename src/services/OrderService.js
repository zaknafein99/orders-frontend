import { eventBus } from '../utils/eventBus'
import AuthService from './AuthService'
import { calculateOrderTotal } from '../utils/orderUtils'
import api from './api'

/**
 * Service for handling order-related API calls and operations
 */
export default {
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
    
    const token = localStorage.getItem('token')
    console.log('Using token for orders request:', token ? `${token.substring(0, 15)}...` : 'No token')
    
    // Log the exact request we're making to compare with the curl command
    console.log('Making request to: /orders/pending with Authorization: Bearer ' + (token ? token.substring(0, 15) + '...' : 'No token'))
    
    return api.get('/orders/pending', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Add cache busting parameter when forcing refresh
      params: force ? { _t: new Date().getTime() } : {}
    })
    .then(response => {
      console.log('Orders API response status:', response.status)
      console.log('Orders response data type:', typeof response.data)
      console.log('Orders response full data:', JSON.stringify(response.data, null, 2))
      
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
      if (error.response) {
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
        console.error('Error response headers:', error.response.headers)
      } else if (error.request) {
        console.error('No response received:', error.request)
      } else {
        console.error('Error message:', error.message)
      }
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
    
    const token = localStorage.getItem('token')
    console.log('Using token for delivered orders request:', token ? `${token.substring(0, 15)}...` : 'No token')
    
    // Use a query parameter to specifically request delivered orders
    return api.get('/orders/delivered', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Add cache busting parameter when forcing refresh
      params: force ? { _t: new Date().getTime() } : {}
    })
    .then(response => {
      console.log('Delivered orders API response status:', response.status)
      console.log('Delivered orders response data type:', typeof response.data)
      console.log('Delivered orders response full data:', JSON.stringify(response.data, null, 2))
      
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
      if (error.response) {
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
        console.error('Error response headers:', error.response.headers)
      } else if (error.request) {
        console.error('No response received for delivered orders:', error.request)
      } else {
        console.error('Error message for delivered orders:', error.message)
      }
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
    
    const token = localStorage.getItem('token')
    if (!token) {
      eventBus.emit('auth-error')
      return Promise.reject(new Error('Authentication required'))
    }

    // Sort by name rather than id to maintain consistent sorting
    return api.get(`/item?page=${page}&size=${size}&sort=name,asc${forceRefresh ? '&_t=' + new Date().getTime() : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`
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
    // Refresh the token to ensure it's valid
    const token = AuthService.getToken()
    if (!token) {
      console.error('No authentication token found')
      eventBus.emit('auth-error')
      return Promise.reject(new Error('Authentication required'))
    }

    // Log the order data being sent to the API
    console.log('Sending order data to API:', JSON.stringify(orderData, null, 2))
    console.log('Using token:', token.substring(0, 15) + '...')
    
    // Use the exact token without any modifications
    const authHeader = `Bearer ${token}`
    console.log(`Authorization header set: ${authHeader.substring(0, 20)}...`)

    // Create a complete version of the order data that matches exactly what the backend expects
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
      items: orderData.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: Number(item.price),
        quantity: item.quantity,
        category: item.category || 'Uncategorized'
      })),
      truck: orderData.truck ? {
        id: orderData.truck.id,
        name: orderData.truck.name
      } : null,
      
      // Ensure truck is properly set
      truckId: orderData.truck?.id,
      date: orderData.date,
      totalPrice: typeof orderData.totalPrice === 'number' ? orderData.totalPrice : calculateOrderTotal(orderData.items),
      status: "PENDING"
    }

    console.log('Simplified order data for API:', JSON.stringify(apiOrderData, null, 2))

    // Make sure the data is properly formatted as a JSON string
    console.log('=== ORDER CREATION REQUEST ===');
    console.log('URL: /orders');
    console.log('Method: POST');
    console.log('Headers:', {
      'Authorization': authHeader.substring(0, 20) + '...',
      'Content-Type': 'application/json'
    });
    console.log('Request Body:', JSON.stringify(apiOrderData, null, 2));
    
    return api.post('/orders', apiOrderData, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      // Add timeout and additional debugging
      timeout: 10000,
      validateStatus: (status) => {
        console.log(`Response status: ${status}`)
        return status >= 200 && status < 300
      }
    })
    .then(response => {
      console.log('=== ORDER CREATION RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      
      const createdOrder = response.data
      console.log('Order created successfully with ID:', createdOrder.id);
      
      // We no longer update inventory at order creation time
      // Inventory will only be updated when the order is marked as delivered
      
      // Refresh order tables
      this.refreshOrders(createdOrder)
      return createdOrder
    })
    .catch(error => {
      console.error('Order creation error details:', error.response ? error.response.data : error)
      console.error('Full error object:', error)
      if (error.request) {
        console.error('Request data sent:', error.config.data)
      }
      
      // Special handling for order creation errors
      if (error.response && error.response.status === 403) {
        console.error('Authorization error during order creation. Will attempt to refresh token.')
        
        // Try to refresh the token instead of logging out immediately
        return AuthService.refreshToken()
          .then(newToken => {
            if (newToken) {
              console.log('Token refreshed successfully, retrying order creation')
              return this.createOrder(orderData)
            } else {
              console.error('Token refresh failed, emitting auth-error')
              eventBus.emit('auth-error')
              throw error
            }
          })
          .catch(() => {
            console.error('Token refresh failed with error, emitting auth-error')
            eventBus.emit('auth-error')
            throw error
          })
      } else {
        this.handleAuthError(error)
        throw error
      }
    })
  },

  /**
   * Update an order's status
   * @param {Number} orderId Order ID
   * @param {String} status New status
   * @returns {Promise} Promise with updated order data
   */
  updateOrderStatus(orderId, status) {
    const token = AuthService.getToken()
    if (!token) {
      eventBus.emit('auth-error')
      return Promise.reject(new Error('Authentication required'))
    }

    return axios.put(`/orders/${orderId}/status`, { status }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      const updatedOrder = response.data
      // Refresh order tables
      this.refreshOrders(updatedOrder)
      return updatedOrder
    })
    .catch(error => {
      this.handleAuthError(error)
      throw error
    })
  },

  /**
   * Mark an order as delivered
   * @param {Number} orderId Order ID
   * @param {Number} truckId Optional truck ID if not already assigned
   * @returns {Promise} Promise with updated order data
   */
  markOrderAsDelivered(orderId, truckId = null) {
    console.log(`Marking order ${orderId} as delivered${truckId ? ` with truck ${truckId}` : ''}`)
    
    // Get the token for authorization
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No authentication token found')
      eventBus.emit('auth-error')
      return Promise.reject(new Error('Authentication required'))
    }
    
    console.log('Using token for deliver request:', token ? `${token.substring(0, 15)}...` : 'No token')
    
    // First try the main delivery endpoint
    console.log('Attempting to mark order as delivered using dedicated endpoint...')
    
    return api.post(`/orders/${orderId}/deliver`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('Order marked as delivered successfully:', response.data)
      const updatedOrder = response.data
      
      // The backend should have updated the inventory automatically
      console.log('Backend should have updated inventory. Order was marked as delivered successfully.')
      
      // Refresh order tables
      this.refreshOrders(updatedOrder)
      
      // Also refresh items to update their quantities in the UI
      this.refreshItems()
        .catch(error => console.error('Failed to refresh items after delivery:', error));
      
      return updatedOrder
    })
    .catch(firstError => {
      console.warn('Direct deliver endpoint failed:', firstError.message)
      console.warn('Trying status update endpoint...')
      
      // Try the status update endpoint as fallback
      return api.put(`/orders/${orderId}/status`, {
        status: 'DELIVERED'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        console.log('Order marked as delivered successfully using status endpoint:', response.data)
        const updatedOrder = response.data
        
        // The backend should have updated the inventory automatically
        console.log('Backend should have updated inventory. Order status was changed to DELIVERED successfully.')
        
        // Refresh order tables
        this.refreshOrders(updatedOrder)
        
        // Also refresh items to update their quantities in the UI
        this.refreshItems()
          .catch(error => console.error('Failed to refresh items after delivery:', error));
        
        return updatedOrder
      })
      .catch(secondError => {
        console.error('All approaches to mark order as delivered failed')
        console.error('First error:', firstError)
        console.error('Second error:', secondError)
        throw secondError
      })
    })
  },

  /**
   * Assign a truck to an order
   * @param {Number} orderId Order ID
   * @param {Number} truckId Truck ID
   * @returns {Promise} Promise with updated order data
   */
  assignTruckToOrder(orderId, truckId) {
    console.log(`Assigning truck ${truckId} to order ${orderId}`)
    
    // Create a payload with the truck ID
    const payload = { 
      truckId: parseInt(truckId)
    }
    
    console.log('Updating truck with payload:', payload)
    
    // Use a POST request to update the order with the new truck
    return api.post(`/orders/${orderId}/truck`, payload)
      .then(response => {
        console.log('Truck updated successfully:', response.data)
        const updatedOrder = response.data
        // Refresh order tables
        this.refreshOrders(updatedOrder)
        return updatedOrder
      })
      .catch(error => {
        console.error('Error updating truck:', error.response ? error.response.data : error.message)
        this.handleAuthError(error)
        throw error
      })
  },

  /**
   * Handle API errors including authentication errors
   * @param {Error} error Error object
   */
  handleAuthError(error) {
    if (error.response) {
      const status = error.response.status
      console.error(`API Error: ${status} - ${error.response.statusText}`)
      
      // Log detailed error information if available
      if (error.response.data) {
        console.error('Error details:', error.response.data)
        
        // Log specific error message if available
        if (error.response.data.message) {
          console.error('Error message:', error.response.data.message)
        }
      }
      
      if (status === 401 || status === 403) {
        console.error('Authentication error detected')
        
        // Try to refresh the token first instead of immediately logging out
        AuthService.refreshToken()
          .then(newToken => {
            if (newToken) {
              console.log('Token refreshed successfully')
              // No need to emit auth-error, we've recovered
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
        // Bad request - log more details
        console.error('Bad request error. Request data:', error.config ? error.config.data : 'No data available')
        
        // Parse the request data to see what might be missing
        try {
          const requestData = JSON.parse(error.config.data)
          console.error('Parsed request data:', requestData)
          
          // Check for missing required fields
          const requiredFields = ['customer', 'items', 'date', 'status']
          const missingFields = requiredFields.filter(field => !requestData[field])
          
          if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields.join(', '))
          }
        } catch (e) {
          console.error('Error parsing request data:', e)
        }
        
        eventBus.emit('api-error', { message: 'Invalid order data format', details: error.response.data })
      } else if (status === 404) {
        // Not found - log details about the request
        console.error('Resource not found error. URL:', error.config ? error.config.url : 'No URL available')
        console.error('Request method:', error.config ? error.config.method : 'No method available')
        
        // Check if this is a missing item by examining the URL
        const url = error.config ? error.config.url : '';
        if (url && url.includes('/item/')) {
          // Extract the item ID from the URL
          const matches = url.match(/\/item\/(\d+)/);
          const itemId = matches ? matches[1] : 'unknown';
          console.error(`Item with ID ${itemId} not found`);
          
          // Use a more specific message for missing items
          eventBus.emit('api-error', { 
            message: `Item #${itemId} does not exist or has been deleted`, 
            details: error.response.data,
            recoverable: true
          });
        } else {
          // Generic 404 error
          eventBus.emit('api-error', { message: 'Resource not found', details: error.response.data });
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server', error.request)
      eventBus.emit('api-error', { message: 'No response from server' })
    } else {
      // Something happened in setting up the request that triggered an Error
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
   * Refresh item data from the server
   * This should be called whenever item quantities might have changed (e.g., after an order is delivered)
   */
  refreshItems() {
    console.log('Refreshing items data to update quantities...');
    
    // Emit an event to trigger a refresh in UI components
    eventBus.emit('refresh-items');
    
    // Get fresh items data from server with force refresh flag to avoid cache
    return this.getItems(0, 100, true)
      .then(items => {
        console.log(`Successfully refreshed ${items.content?.length || 0} items`);
        return items;
      })
      .catch(error => {
        console.error('Error refreshing items:', error);
        // Don't rethrow the error, instead return an empty result
        // This allows the app to continue even if an item is missing
        console.log('Continuing despite item refresh error');
        eventBus.emit('api-error', { 
          message: 'Unable to refresh some items', 
          details: error.message || 'Unknown error',
          recoverable: true
        });
        return { content: [] };
      });
  },
  
  /**
   * Update inventory quantities after an order is marked as delivered
   * This method should ONLY be called when an order is delivered, not when it's created.
   * It decreases the inventory quantities based on the items in the delivered order.
   * 
   * @param {Array} items Order items with quantities
   * @returns {Promise} Promise with results of all inventory updates
   */
  updateInventoryQuantities(items) {
    if (!items || !items.length) {
      console.log('No items to update inventory for')
      return Promise.resolve([])
    }
    
    const token = AuthService.getToken()
    if (!token) {
      console.error('No authentication token found')
      eventBus.emit('auth-error')
      return Promise.reject(new Error('Authentication required'))
    }
    
    console.log('Updating inventory quantities for items:', JSON.stringify(items))
    
    // Create an array of promises for each item update
    const updatePromises = items.map(item => {
      try {
        // Extract the item ID and quantity based on the data structure
        // Log the full item object for debugging
        console.log('Processing item:', JSON.stringify(item))
        
        // Handle different possible formats:
        // 1. Direct format: { id: 123, name: 'Item', quantity: 5 }
        // 2. Nested item format: { item: { id: 123, name: 'Item' }, quantity: 5 }
        // 3. Nested id format: { itemId: 123, quantity: 5 }
        let itemId = null;
        if (item.id) {
          itemId = parseInt(item.id);
          console.log(`Found direct item ID: ${item.id} (parsed as ${itemId})`);
        } else if (item.item && item.item.id) {
          itemId = parseInt(item.item.id);
          console.log(`Found nested item ID: ${item.item.id} (parsed as ${itemId})`);
        } else if (item.itemId) {
          itemId = parseInt(item.itemId);
          console.log(`Found itemId property: ${item.itemId} (parsed as ${itemId})`);
        }
        
        let itemName = item.name || (item.item && item.item.name) || 'Unknown Item';
        let itemQuantity = 0;
        
        if (typeof item.quantity !== 'undefined') {
          itemQuantity = parseInt(item.quantity);
          console.log(`Found direct quantity: ${item.quantity} (parsed as ${itemQuantity})`);
        } else if (item.item && typeof item.item.quantity !== 'undefined') {
          itemQuantity = parseInt(item.item.quantity);
          console.log(`Found nested quantity: ${item.item.quantity} (parsed as ${itemQuantity})`);
        }
        
        console.log(`Processing item for inventory update: ID=${itemId}, Name=${itemName}, Quantity=${itemQuantity}`)
        
        if (!itemId) {
          console.error('Cannot update inventory for item without ID:', item)
          return Promise.resolve({
            error: 'Invalid item format - missing ID',
            item
          })
        }
        
        if (isNaN(itemQuantity) || itemQuantity <= 0) {
          console.warn(`Item ${itemId} has invalid quantity (${itemQuantity}), skipping inventory update`);
          return Promise.resolve({
            itemId,
            name: itemName,
            skipped: true,
            reason: `Invalid quantity: ${itemQuantity}`
          });
        }
        
        // First, get the current item to retrieve its properties and current quantity
        // Use sort=name,asc for consistent sorting with other item requests
        return api.get(`/item/${itemId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          const itemData = response.data;
          console.log(`Found item ${itemId} directly:`, itemData);
          
          if (!itemData) {
            console.error(`Item with ID ${itemId} not found directly`);
            // Fall back to list endpoint
            return api.get(`/item/list?page=0&size=100&sort=name,asc`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            .then(listResponse => {
              let foundItem = null;
              
              if (listResponse.data && listResponse.data.content) {
                // Find the item in the paginated response
                foundItem = listResponse.data.content.find(i => parseInt(i.id) === itemId);
                console.log(`Searching for item with ID ${itemId} in ${listResponse.data.content.length} items. Found:`, foundItem);
              } else if (Array.isArray(listResponse.data)) {
                // Find the item in the array response
                foundItem = listResponse.data.find(i => parseInt(i.id) === itemId);
                console.log(`Searching for item with ID ${itemId} in ${listResponse.data.length} items. Found:`, foundItem);
              }
              
              if (!foundItem) {
                throw new Error(`Item with ID ${itemId} not found in inventory list`);
              }
              
              return foundItem;
            });
          }
          
          return itemData;
        })
        .then(itemData => {
          // Calculate the new quantity by subtracting the order quantity
          const currentQuantity = parseInt(itemData.quantity) || 0;
          const newQuantity = Math.max(0, currentQuantity - itemQuantity);
          
          console.log(`Updating inventory for item ${itemId} (${itemName}): ${currentQuantity} - ${itemQuantity} = ${newQuantity}`);
          
          // Prepare the updated item with all required fields
          const updatedItem = {
            id: itemId,
            name: itemData.name,
            description: itemData.description || "",
            price: Number(itemData.price),
            quantity: newQuantity,
            category: itemData.category || "Uncategorized"
          };
          
          console.log('Sending PUT request with updated item:', updatedItem);
          
          // Update the item with the PUT endpoint
          return api.put(`/item/${itemId}`, updatedItem, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          .then(updateResponse => {
            console.log(`Inventory updated for item ${itemId} using PUT:`, updateResponse.data);
            return {
              success: true,
              itemId,
              name: itemData.name,
              previousQuantity: currentQuantity,
              newQuantity,
              data: updateResponse.data
            };
          })
          .catch(error => {
            console.error(`Error updating inventory for item ${itemId}:`, error);
            console.error('Request details:', {
              url: `/item/${itemId}`,
              method: 'PUT',
              error: error.message
            });
            
            // Check if it's a 404 Not Found error
            if (error.response && error.response.status === 404) {
              // Provide more specific information about the missing item
              console.warn(`Item #${itemId} (${itemName}) was not found in the inventory. It may have been deleted.`);
              
              // Show a notification to the user about the missing item
              eventBus.emit('api-error', { 
                message: `Item #${itemId} (${itemName}) does not exist or has been deleted.`, 
                details: 'This item was referenced in an order but could not be found in the inventory.',
                recoverable: true 
              });
              
              // Return a structured error object for better tracking
              return {
                success: false,
                itemId,
                name: itemName,
                error: 'Item not found in inventory',
                code: 'ITEM_NOT_FOUND',
                status: 404
              };
            }
            
            // Handle other types of errors
            return {
              success: false,
              itemId,
              name: itemName,
              error: error.message
            };
          });
        })
        .catch(error => {
          console.error(`Error processing item ${itemId} for inventory update:`, error);
          
          // Check if it's a 404 Not Found error
          if (error.response && error.response.status === 404) {
            // Provide more specific information about the missing item
            console.warn(`Item #${itemId} (${itemName}) was not found in the inventory. It may have been deleted.`);
            
            // Show a notification to the user about the missing item
            eventBus.emit('api-error', { 
              message: `Item #${itemId} (${itemName}) does not exist or has been deleted.`, 
              details: 'This item was referenced in an order but could not be found in the inventory.',
              recoverable: true 
            });
            
            // Return a structured error object for better tracking
            return {
              success: false,
              itemId,
              name: itemName,
              error: 'Item not found in inventory',
              code: 'ITEM_NOT_FOUND',
              status: 404
            };
          }
          
          // Handle other types of errors
          return {
            success: false,
            itemId,
            name: itemName,
            error: error.message
          };
        });
      } catch (e) {
        console.error('Unexpected error processing item:', e);
        return Promise.resolve({
          success: false,
          error: e.message,
          item
        });
      }
    });
    
    return Promise.all(updatePromises);
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
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No authentication token found');
      eventBus.emit('auth-error');
      return Promise.reject(new Error('Authentication required'));
    }

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
        return api.delete(`/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
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
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No authentication token found');
      eventBus.emit('auth-error');
      return Promise.reject(new Error('Authentication required'));
    }
    
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
  },

  // Add a new property to track polling state
  isPolling: false
}