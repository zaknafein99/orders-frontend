import api from './api'

/**
 * Service for handling dashboard-related API calls and operations
 */
export default {
  /**
   * Get dashboard statistics
   * @returns {Promise} Promise with statistics data
   */
  getStatistics() {
    return api.get('/dashboard/statistics')
      .then(response => {
        return response.data
      })
      .catch(error => {
        console.error('Error fetching dashboard statistics:', error)
        throw error
      })
  },

  /**
   * Get daily sales data
   * @param {Date|string} date The date to get sales for
   * @returns {Promise} Promise with daily sales data
   */
  getDailySales(date) {
    // Handle both Date objects and string dates
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : (typeof date === 'string' ? date : new Date().toISOString().split('T')[0]);
    
    return api.get(`/dashboard/truck-sales/daily?date=${formattedDate}`)
      .then(response => {
        return response.data
      })
      .catch(error => {
        console.error('Error fetching daily sales:', error)
        throw error
      })
  },

  /**
   * Get weekly sales data
   * @param {Date|string} startDate The start date for weekly data
   * @returns {Promise} Promise with weekly sales data
   */
  getWeeklySales(startDate = new Date()) {
    // Handle both Date objects and string dates
    const formattedDate = startDate instanceof Date 
      ? startDate.toISOString().split('T')[0] 
      : (typeof startDate === 'string' ? startDate : new Date().toISOString().split('T')[0]);
    
    return api.get(`/dashboard/truck-sales/weekly?startDate=${formattedDate}`)
      .then(response => {
        return response.data
      })
      .catch(error => {
        console.error('Error fetching weekly sales:', error)
        throw error
      })
  },

  /**
   * Get monthly sales data
   * @param {Date|string} date The date for monthly data
   * @returns {Promise} Promise with monthly sales data
   */
  getMonthlySales(date = new Date()) {
    // Handle both Date objects and string dates
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : (typeof date === 'string' ? date : new Date().toISOString().split('T')[0]);
    
    return api.get(`/dashboard/truck-sales/monthly?date=${formattedDate}`)
      .then(response => {
        return response.data
      })
      .catch(error => {
        console.error('Error fetching monthly sales:', error)
        throw error
      })
  }
} 