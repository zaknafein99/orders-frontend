import { defineStore } from 'pinia'
import CustomerService from '../services/CustomerService'

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [],
    isLoading: false,
    error: null
  }),

  getters: {
    getCustomerById: (state) => (id) => {
      return state.customers.find(customer => customer.id === id)
    },
    
    getCustomerByPhone: (state) => (phone) => {
      return state.customers.find(customer => customer.phone === phone)
    }
  },

  actions: {
    async fetchCustomers(page = 0, size = 10) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await CustomerService.getAllCustomers(page, size)
        this.customers = response.content || []
        return {
          content: this.customers,
          totalPages: response.totalPages || 1,
          totalElements: response.totalElements || this.customers.length
        }
      } catch (error) {
        this.error = error.message || 'Failed to fetch customers'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createCustomer(customerData) {
      this.isLoading = true
      this.error = null
      
      try {
        const newCustomer = await CustomerService.createCustomer(customerData)
        this.customers.push(newCustomer)
        return newCustomer
      } catch (error) {
        this.error = error.message || 'Failed to create customer'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateCustomer(id, customerData) {
      this.isLoading = true
      this.error = null
      
      try {
        const updatedCustomer = await CustomerService.updateCustomer(id, customerData)
        const index = this.customers.findIndex(c => c.id === id)
        if (index !== -1) {
          this.customers[index] = updatedCustomer
        }
        return updatedCustomer
      } catch (error) {
        this.error = error.message || 'Failed to update customer'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteCustomer(id) {
      this.isLoading = true
      this.error = null
      
      try {
        await CustomerService.deleteCustomer(id)
        this.customers = this.customers.filter(c => c.id !== id)
      } catch (error) {
        this.error = error.message || 'Failed to delete customer'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async searchCustomer(phone) {
      this.isLoading = true
      this.error = null
      
      try {
        const customer = await CustomerService.searchCustomer(phone)
        return customer
      } catch (error) {
        if (error.response?.status === 404) {
          return null
        }
        this.error = error.message || 'Failed to search customer'
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
}) 