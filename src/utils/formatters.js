/**
 * Utility functions for formatting various data types
 */

/**
 * Format a price as currency
 * @param {Number} price - Price to format
 * @param {String} locale - Locale to use for formatting (default: 'en-US')
 * @param {String} currency - Currency code (default: 'USD')
 * @returns {String} - Formatted price
 */
export const formatCurrency = (price, locale = 'en-US', currency = 'USD') => {
  if (price == null || isNaN(price)) return '-';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(Number(price));
};

/**
 * Format a date to a readable string
 * @param {String|Date} date - Date to format
 * @param {String} locale - Locale to use for formatting (default: 'en-US')
 * @param {Object} options - Options for Intl.DateTimeFormat
 * @returns {String} - Formatted date
 */
export const formatDate = (date, locale = 'en-US', options = {}) => {
  if (!date) return '-';
  
  // Default options
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Format a simple date as YYYY-MM-DD
 * @param {Date|String} date - Date to format
 * @returns {String} - Formatted date (YYYY-MM-DD)
 */
export const formatSimpleDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting simple date:', error);
    return String(date);
  }
};

/**
 * Format a number with commas as thousands separators
 * @param {Number} number - Number to format
 * @param {Number} decimals - Number of decimal places (default: 0)
 * @returns {String} - Formatted number
 */
export const formatNumber = (number, decimals = 0) => {
  if (number == null || isNaN(number)) return '-';
  
  return Number(number).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}; 