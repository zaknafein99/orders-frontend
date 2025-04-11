import api from './api'

export default {
  /**
   * Get all trucks from the API
   * @returns {Promise<Array>} Promise that resolves to an array of trucks
   */
  getAllTrucks() {
    console.log('Fetching all trucks')
    
    return api.get('/truck')
      .then(response => {
        console.log('Trucks fetched successfully:', response.data)
        return response.data
      })
      .catch(error => {
        console.error('Error fetching trucks:', error.response ? error.response.data : error.message)
        throw error
      })
  },
  
  /**
   * Update the truck of an order
   * @param {Number} orderId - The ID of the order to update
   * @param {Number} truckId - The ID of the truck to assign
   * @returns {Promise} Promise that resolves when the truck is updated
   */
  updateOrderTruck(orderId, truckId) {
    console.log(`Updating truck for order ${orderId} to truck ${truckId}`)
    
    // Import OrderService dynamically to avoid circular dependency
    const OrderService = require('./OrderService').default
    
    // Use OrderService to update the truck
    return OrderService.assignTruckToOrder(orderId, truckId)
      .then(response => {
        console.log('Truck updated successfully:', response)
        return response
      })
      .catch(error => {
        console.error('Error updating truck:', error.response ? error.response.data : error.message)
        throw error
      })
  }
}
