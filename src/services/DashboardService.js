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
  },

  /**
   * Download daily sales PDF report
   * @param {Date|string} date The date for the report
   * @returns {Promise} Promise that resolves when download is complete
   */
  downloadDailySalesPDF(date = new Date()) {
    // Handle both Date objects and string dates
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : (typeof date === 'string' ? date : new Date().toISOString().split('T')[0]);
    
    return api.get(`/dashboard/truck-sales/daily/pdf?date=${formattedDate}`, {
      responseType: 'blob'
    })
      .then(response => {
        // Create a blob from the PDF data
        const blob = new Blob([response.data], { type: 'application/pdf' });
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        // Set the filename
        link.setAttribute('download', `daily-sales-${formattedDate}.pdf`);
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Clean up the URL
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading daily sales PDF:', error);
        throw error;
      });
  },

  /**
   * Download truck delivery report PDF
   * @param {Number} truckId The truck ID
   * @param {Date|string} startDate The start date for the report
   * @param {Date|string} endDate The end date for the report
   * @returns {Promise} Promise that resolves when download is complete
   */
  downloadTruckDeliveryReport(truckId, startDate, endDate) {
    // Handle both Date objects and string dates
    const formatDate = (date) => {
      return date instanceof Date 
        ? date.toISOString().split('T')[0] 
        : (typeof date === 'string' ? date : new Date().toISOString().split('T')[0]);
    };
    
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    return api.get(`/reports/truck-delivery?truckId=${truckId}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`, {
      responseType: 'blob'
    })
      .then(response => {
        // Create a blob from the PDF data
        const blob = new Blob([response.data], { type: 'application/pdf' });
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        // Set the filename
        link.setAttribute('download', `truck-${truckId}-delivery-report-${formattedStartDate}-to-${formattedEndDate}.pdf`);
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Clean up the URL
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading truck delivery report PDF:', error);
        throw error;
      });
  }
} 