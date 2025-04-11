/**
 * Utility functions for order management
 */

/**
 * Calculate the total price of an order
 * @param {Array} items - Array of order items
 * @returns {Number} - Total price
 */
export const calculateOrderTotal = (items) => {
  if (!items || !items.length) return 0
  
  return items.reduce((total, item) => {
    return total + (Number(item.price) * item.quantity)
  }, 0)
}

/**
 * Format a price as currency
 * @param {Number} price - Price to format
 * @param {String} currencySymbol - Currency symbol to use
 * @returns {String} - Formatted price
 */
export const formatPrice = (price, currencySymbol = '$') => {
  return `${currencySymbol}${Number(price).toFixed(2)}`
}

/**
 * Group order items by category
 * @param {Array} items - Array of order items
 * @returns {Object} - Object with categories as keys and arrays of items as values
 */
export const groupItemsByCategory = (items) => {
  if (!items || !items.length) return {}
  
  return items.reduce((groups, item) => {
    const category = item.category || 'Uncategorized'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {})
}

/**
 * Sort items by price (ascending or descending)
 * @param {Array} items - Array of items to sort
 * @param {Boolean} ascending - Sort direction
 * @returns {Array} - Sorted array of items
 */
export const sortItemsByPrice = (items, ascending = true) => {
  if (!items || !items.length) return []
  
  return [...items].sort((a, b) => {
    const priceA = Number(a.price)
    const priceB = Number(b.price)
    return ascending ? priceA - priceB : priceB - priceA
  })
}

/**
 * Filter items by name or description
 * @param {Array} items - Array of items to filter
 * @param {String} searchTerm - Term to search for
 * @returns {Array} - Filtered array of items
 */
export const filterItemsByText = (items, searchTerm) => {
  if (!items || !items.length) return []
  if (!searchTerm) return items
  
  const term = searchTerm.toLowerCase()
  return items.filter(item => {
    return (
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term))
    )
  })
}

/**
 * Create a new order object
 * @param {Object} customer - Customer object
 * @param {Array} items - Array of order items
 * @param {Object} truck - Truck object
 * @param {String} date - Order date
 * @returns {Object} - New order object formatted for the API
 */
export const createOrderObject = (customer, items, truck, date) => {
  // Calculate the total price
  const totalPrice = calculateOrderTotal(items)
  
  // Format the order data to exactly match the backend API expectations
  // Based on the curl example
  return {
    id: null,
    customer: {
      id: customer.id,
      name: customer.name,
      address: customer.address || '',
      phoneNumber: customer.phoneNumber || '',
      type: customer.type || 'E',
      state: customer.state || 'A'
    },
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: Number(item.price),
      quantity: item.quantity,
      category: item.category || 'Uncategorized'
    })),
    truck: truck ? {
      id: truck.id,
      name: truck.name
    } : null,
    date: date,
    totalPrice: calculateOrderTotal(items),
    status: "PENDING"
  }
}

/**
 * Validate an order object
 * @param {Object} order - Order object to validate
 * @returns {Object} - Object with isValid and errors properties
 */
export const validateOrder = (order) => {
  const errors = []
  
  // Validate customer
  if (!order.customer || !order.customer.id) {
    errors.push('Customer is required')
  }
  
  // Validate items
  if (!order.items || order.items.length === 0) {
    errors.push('Order must have at least one item')
  } else {
    // Check that each item has the required fields
    order.items.forEach((item, index) => {
      if (!item.id) {
        errors.push(`Item ${index + 1} is missing an ID`)
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1} must have a valid quantity`)
      }
    })
  }
  
  // Validate truck
  if (!order.truck || !order.truck.id) {
    errors.push('Truck is required')
  }
  
  // Validate date
  if (!order.date) {
    errors.push('Order date is required')
  }
  
  // Log validation results
  if (errors.length > 0) {
    console.error('Order validation errors:', errors)
    console.log('Invalid order data:', JSON.stringify(order, null, 2))
  } else {
    console.log('Order validation passed')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
