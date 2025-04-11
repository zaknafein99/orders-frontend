import { reactive } from 'vue'

// Simple event bus for communication between components
export const eventBus = reactive({
  events: {},
  
  // Register an event listener
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  },
  
  // Remove an event listener
  off(event, callback) {
    if (!this.events[event]) return
    if (!callback) {
      delete this.events[event]
      return
    }
    this.events[event] = this.events[event].filter(cb => cb !== callback)
  },
  
  // Emit an event
  emit(event, ...args) {
    if (!this.events[event]) return
    this.events[event].forEach(callback => callback(...args))
  }
})
