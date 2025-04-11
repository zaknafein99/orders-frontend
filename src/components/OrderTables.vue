<template>
  <div class="order-tables">
    <div class="tables-header">
      <h2><i class="fas fa-clipboard-list"></i> Panel de Pedidos</h2>
      <div class="header-actions">
        <span class="last-update">{{ lastUpdateText }}</span>
        <button @click="fetchOrders" class="refresh-btn">
          <i class="fas fa-sync-alt refresh-icon"></i> Actualizar
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p>Cargando pedidos...</p>
    </div>

    <div v-else>
      <div class="table-section">
        <h3 class="bg-primary-600"><i class="fas fa-clock text-secondary-500"></i> Pedidos Pendientes</h3>
        <div v-if="pendingOrders.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>{{ translations.noOrders }}</p>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th class="date-column">{{ translations.createdAt }}</th>
              <th>{{ translations.customer }}</th>
              <th>{{ translations.itemCount }}</th>
              <th>{{ translations.total }}</th>
              <th>{{ translations.truck }}</th>
              <th>{{ translations.actions }}</th>
            </tr>
          </thead>
          <TransitionGroup name="order-list" tag="tbody">
            <tr v-for="order in sortedPendingOrders" :key="order.id">
              <td class="date-cell">{{ formatDate(order.createdAt) }}</td>
              <td>
                <div class="customer-info">
                  <div class="customer-name">{{ order.customerName }}</div>
                  <div class="customer-phone">{{ order.customerPhone }}</div>
                </div>
              </td>
              <td>{{ order.items.length }}</td>
              <td>${{ order.total.toFixed(2) }}</td>
              <td>
                <div class="truck-selection-container">
                  <select 
                    v-model="orderTrucks[order.id]" 
                    class="truck-select"
                    @change="onTruckSelected(order.id, orderTrucks[order.id])"
                  >
                    <option value="">{{ translations.selectTruck }}</option>
                    <option v-for="truck in availableTrucks" :key="truck.id" :value="String(truck.id)">{{ truck.name }}</option>
                  </select>
                  <div v-if="truckUpdateLoading[order.id]" class="loading-indicator">{{ translations.updating }}...</div>
                  <div v-if="orderTrucks[order.id] && !truckUpdateLoading[order.id]" class="selected-truck-indicator">
                    {{ getSelectedTruckName(orderTrucks[order.id]) }}
                  </div>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    @click="markAsDelivered(order.id)" 
                    class="action-btn deliver-btn"
                    :disabled="!order.truck && !orderTrucks[order.id]"
                  >
                    <i class="fas fa-truck"></i> {{ translations.markDelivered }}
                  </button>
                  <button 
                    @click="showCancelConfirmation(order.id)" 
                    class="action-btn cancel-btn"
                  >
                    <i class="fas fa-times-circle"></i> {{ translations.cancelOrder || 'Cancelar' }}
                  </button>
                </div>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>

      <div class="table-section">
        <h3 class="bg-primary-600"><i class="fas fa-truck text-secondary-500"></i> Pedidos Entregados</h3>
        <div v-if="deliveredOrders.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>{{ translations.noOrders }}</p>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th class="date-column">{{ translations.createdAt }}</th>
              <th>{{ translations.customer }}</th>
              <th>{{ translations.itemCount }}</th>
              <th>{{ translations.total }}</th>
              <th>{{ translations.truck }}</th>
              <th class="date-column">{{ translations.deliveredAt }}</th>
            </tr>
          </thead>
          <TransitionGroup name="order-list" tag="tbody">
            <tr v-for="order in sortedDeliveredOrders" :key="order.id">
              <td class="date-cell">{{ formatDate(order.createdAt) }}</td>
              <td>
                <div class="customer-info">
                  <div class="customer-name">{{ order.customerName }}</div>
                  <div class="customer-phone">{{ order.customerPhone }}</div>
                </div>
              </td>
              <td>{{ order.items.length }}</td>
              <td>${{ order.total.toFixed(2) }}</td>
              <td>
                <div class="truck-selection-container">
                  <select 
                    v-model="orderTrucks[order.id]" 
                    class="truck-select"
                    @change="onTruckSelected(order.id, orderTrucks[order.id])"
                  >
                    <option value="">{{ translations.selectTruck }}</option>
                    <option v-for="truck in availableTrucks" :key="truck.id" :value="String(truck.id)">{{ truck.name }}</option>
                  </select>
                  <div v-if="truckUpdateLoading[order.id]" class="loading-indicator">{{ translations.updating }}...</div>
                  <div v-if="orderTrucks[order.id] && !truckUpdateLoading[order.id]" class="selected-truck-indicator">
                    {{ getSelectedTruckName(orderTrucks[order.id]) }}
                  </div>
                </div>
              </td>
              <td>{{ formatDate(order.deliveredAt) }}</td>
            </tr>
          </TransitionGroup>
        </table>
      </div>
    </div>
  </div>
  
  <!-- Confirmation Modal -->
  <div v-if="showConfirmation" class="modal-backdrop">
    <div class="confirmation-modal">
      <h3 class="confirmation-modal-title">
        <i class="fas fa-exclamation-triangle"></i> Cancelar Pedido
      </h3>
      <p class="confirmation-modal-message">
        ¿Está seguro que desea cancelar este pedido? Esta acción no se puede deshacer y el pedido será eliminado permanentemente.
      </p>
      <div class="confirmation-modal-actions">
        <button @click="hideConfirmation" class="cancel-action-btn">
          No, mantener pedido
        </button>
        <button @click="confirmCancelOrder" class="confirm-cancel-btn">
          Sí, cancelar pedido
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch, computed } from 'vue'
import { eventBus } from '../utils/eventBus'
import OrderService from '../services/OrderService'
import TruckService from '../services/TruckService'
import { translations } from '../utils/translations'
import { formatDate } from '../utils/formatters'

// Track truck assignments for orders that don't have one yet
const orderTrucks = reactive({})

// Track loading state for truck updates
const truckUpdateLoading = reactive({})

// Available trucks for selection
const availableTrucks = ref([])
const trucksLoading = ref(false)
const trucksError = ref('')

const pendingOrders = ref([])
const deliveredOrders = ref([])
const isLoading = ref(false)
const lastUpdateTime = ref(new Date())
const pollingInterval = ref(null)

// Modify the polling configuration and add a lastOrderId ref
const POLLING_INTERVAL = 3000 // Reduce to 3 seconds for more responsive updates
const MAX_POLLING_TIME = 5 * 60 * 1000 // 5 minutes
const lastOrderId = ref(null)

// Confirmation modal state
const showConfirmation = ref(false)
const orderToCancel = ref(null)
const isCanceling = ref(false)

// Add new refs for tracking changes
const previousPendingIds = ref(new Set())
const previousDeliveredIds = ref(new Set())

// Add computed properties for sorted orders
const sortedPendingOrders = computed(() => {
  return [...pendingOrders.value].sort((a, b) => b.createdAt - a.createdAt)
})

const sortedDeliveredOrders = computed(() => {
  return [...deliveredOrders.value].sort((a, b) => b.createdAt - a.createdAt)
})

const fetchTrucks = async () => {
  trucksLoading.value = true
  trucksError.value = ''
  try {
    console.log('Fetching trucks...')
    const response = await TruckService.getAllTrucks()
    console.log('Trucks response:', response)
    
    // Ensure we have an array of trucks
    if (Array.isArray(response)) {
      availableTrucks.value = response
    } else if (response && response.content && Array.isArray(response.content)) {
      availableTrucks.value = response.content
    } else {
      console.error('Unexpected trucks response format:', response)
      availableTrucks.value = []
    }
    
    console.log('Trucks fetched successfully:', availableTrucks.value)
  } catch (error) {
    console.error('Error fetching trucks:', error)
    trucksError.value = 'Failed to load trucks'
    availableTrucks.value = [] // Ensure it's an array even on error
  } finally {
    trucksLoading.value = false
  }
}

const checkToken = () => {
  const token = localStorage.getItem('token')
  console.log('Current token in localStorage:', token ? `${token.substring(0, 15)}...` : 'No token')
  return token
}

const updateOrdersSmooth = (newPendingData, newDeliveredData) => {
  // Convert current orders to maps for easy lookup
  const currentPendingMap = new Map(pendingOrders.value.map(order => [order.id, order]))
  const currentDeliveredMap = new Map(deliveredOrders.value.map(order => [order.id, order]))
  
  // Create sets of current IDs
  const currentPendingIds = new Set(currentPendingMap.keys())
  const currentDeliveredIds = new Set(currentDeliveredMap.keys())
  
  // Process pending orders
  if (newPendingData && Array.isArray(newPendingData)) {
    const newPendingOrders = newPendingData.map(order => ({
      id: order.id,
      customerName: order.customer.name,
      customerPhone: order.customer.phoneNumber,
      createdAt: new Date(order.date),
      items: [...order.items],
      total: order.totalPrice,
      truck: order.truck ? {
        id: order.truck.id,
        name: order.truck.name
      } : null
    }))
    
    // Update only changed or new orders
    newPendingOrders.forEach(newOrder => {
      const existingOrder = currentPendingMap.get(newOrder.id)
      if (!existingOrder || JSON.stringify(existingOrder) !== JSON.stringify(newOrder)) {
        const index = pendingOrders.value.findIndex(o => o.id === newOrder.id)
        if (index !== -1) {
          // Update existing order
          pendingOrders.value[index] = newOrder
        } else {
          // Add new order
          pendingOrders.value.push(newOrder)
        }
      }
    })
    
    // Remove orders that no longer exist
    const newPendingIds = new Set(newPendingOrders.map(o => o.id))
    pendingOrders.value = pendingOrders.value.filter(order => newPendingIds.has(order.id))
  }
  
  // Process delivered orders
  if (newDeliveredData && Array.isArray(newDeliveredData)) {
    const newDeliveredOrders = newDeliveredData.map(order => ({
      id: order.id,
      customerName: order.customer.name,
      customerPhone: order.customer.phoneNumber,
      createdAt: new Date(order.date),
      items: [...order.items],
      deliveredAt: new Date(order.date),
      total: order.totalPrice,
      truck: order.truck ? {
        id: order.truck.id,
        name: order.truck.name
      } : null
    }))
    
    // Update only changed or new orders
    newDeliveredOrders.forEach(newOrder => {
      const existingOrder = currentDeliveredMap.get(newOrder.id)
      if (!existingOrder || JSON.stringify(existingOrder) !== JSON.stringify(newOrder)) {
        const index = deliveredOrders.value.findIndex(o => o.id === newOrder.id)
        if (index !== -1) {
          // Update existing order
          deliveredOrders.value[index] = newOrder
        } else {
          // Add new order
          deliveredOrders.value.push(newOrder)
        }
      }
    })
    
    // Remove orders that no longer exist
    const newDeliveredIds = new Set(newDeliveredOrders.map(o => o.id))
    deliveredOrders.value = deliveredOrders.value.filter(order => newDeliveredIds.has(order.id))
  }
  
  // Update truck assignments
  const allOrders = [...pendingOrders.value, ...deliveredOrders.value]
  allOrders.forEach(order => {
    if (order.truck) {
      orderTrucks[order.id] = String(order.truck.id)
    } else {
      orderTrucks[order.id] = ''
    }
  })
}

const fetchOrders = async () => {
  if (isLoading.value) return // Prevent concurrent fetches
  
  // Check if we have a token
  const token = checkToken()
  if (!token) {
    console.error('No token found in localStorage, cannot fetch orders')
    return
  }

  try {
    // Fetch trucks first if not already loaded
    if (availableTrucks.value.length === 0) {
      await fetchTrucks()
    }
    
    // Force refresh when polling
    const force = OrderService.isPolling
    
    // Fetch both types of orders concurrently
    const [pendingData, deliveredData] = await Promise.all([
      OrderService.getPendingOrders(force),
      OrderService.getDeliveredOrders(force)
    ])
    
    // Use the smooth update function
    updateOrdersSmooth(pendingData, deliveredData)
    
    lastUpdateTime.value = new Date()
  } catch (error) {
    console.error('Error fetching orders:', error)
  }
}

const getSelectedTruckName = (truckId) => {
  if (!availableTrucks.value || !Array.isArray(availableTrucks.value)) {
    console.warn('availableTrucks is not properly initialized:', availableTrucks.value)
    return ''
  }
  const truck = availableTrucks.value.find(t => String(t.id) === String(truckId))
  return truck ? truck.name : ''
}

const onTruckSelected = async (orderId, truckId) => {
  if (!truckId) return
  
  try {
    console.log('Truck selected for order:', orderId, 'truck:', truckId)
    // Store the previous truck ID in case we need to revert
    const previousTruckId = orderTrucks[orderId]
    
    // Set loading state
    truckUpdateLoading[orderId] = true
    
    // Call the API to update the truck
    await OrderService.assignTruckToOrder(orderId, truckId)
    
    // Update the UI to show the selected truck
    console.log('Truck updated successfully in UI')
    
    // Refresh orders to ensure UI is up to date
    await fetchOrders()
  } catch (error) {
    console.error('Error handling truck selection:', error)
    // Reset to previous value on error
    const order = [...pendingOrders.value, ...deliveredOrders.value].find(o => o.id === orderId)
    if (order && order.truck) {
      orderTrucks[orderId] = String(order.truck.id)
    } else {
      orderTrucks[orderId] = ''
    }
    alert(translations.errorUpdatingTruck)
  } finally {
    truckUpdateLoading[orderId] = false
  }
}

const assignTruckToOrder = async (orderId, truckId) => {
  try {
    console.log('Assigning truck to order:', orderId, 'truck:', truckId)
    
    // Call the API to assign the truck
    const response = await TruckService.updateOrderTruck(orderId, truckId)
    console.log('API response:', response)
    
    // Update the local state in both pending and delivered orders
    const selectedTruck = availableTrucks.value.find(truck => truck.id === parseInt(truckId))
    if (!selectedTruck) {
      console.error('Selected truck not found in available trucks')
      return
    }
    
    // Ensure orderTrucks is updated with the new value
    orderTrucks[orderId] = String(truckId)
    
    // Check if the order is in pending orders
    const pendingIndex = pendingOrders.value.findIndex(order => order.id === orderId)
    if (pendingIndex !== -1) {
      pendingOrders.value[pendingIndex].truck = {
        id: selectedTruck.id,
        name: selectedTruck.name
      }
    }
    
    // Check if the order is in delivered orders
    const deliveredIndex = deliveredOrders.value.findIndex(order => order.id === orderId)
    if (deliveredIndex !== -1) {
      deliveredOrders.value[deliveredIndex].truck = {
        id: selectedTruck.id,
        name: selectedTruck.name
      }
    }
    
    console.log('Truck assigned successfully')
  } catch (error) {
    console.error('Error assigning truck to order:', error)
    if (error.response) {
      console.error('Error response data:', error.response.data)
      console.error('Error response status:', error.response.status)
      console.error('Error response headers:', error.response.headers)
    } else if (error.request) {
      console.error('Error request:', error.request)
    } else {
      console.error('Error message:', error.message)
    }
    console.error('Error config:', error.config)
    throw error // Rethrow to handle in the calling function
  }
}

const markAsDelivered = async (orderId) => {
  try {
    console.log('Marking order as delivered:', orderId)
    
    // If the order doesn't have a truck assigned yet, assign it first
    const orderIndex = pendingOrders.value.findIndex(order => order.id === orderId)
    if (orderIndex !== -1) {
      const order = pendingOrders.value[orderIndex]
      
      // Check if we need to assign a truck first
      if (orderTrucks[orderId] && (!order.truck || order.truck.id !== parseInt(orderTrucks[orderId]))) {
        console.log('Assigning truck before marking as delivered')
        try {
          await assignTruckToOrder(orderId, orderTrucks[orderId])
        } catch (error) {
          console.error('Failed to assign truck before delivery:', error)
          return // Don't proceed with delivery if truck assignment fails
        }
      }
    }
    
    // Use OrderService to mark order as delivered
    await OrderService.markOrderAsDelivered(orderId)
    
    // After successful API call, update the local state
    if (orderIndex !== -1) {
      const order = {...pendingOrders.value[orderIndex]}
      order.deliveredAt = new Date()
      
      // Check if this order already exists in the delivered orders list
      const existingDeliveredIndex = deliveredOrders.value.findIndex(o => o.id === order.id)
      if (existingDeliveredIndex !== -1) {
        console.log(`Order ID ${order.id} already exists in delivered orders, updating instead of adding`)
        deliveredOrders.value[existingDeliveredIndex] = order
      } else {
        deliveredOrders.value.unshift(order)
      }
      
      // Remove from pending orders
      pendingOrders.value.splice(orderIndex, 1)
      
      // Make sure the truck selection is preserved in the delivered order
      if (orderTrucks[orderId]) {
        const truckId = parseInt(orderTrucks[orderId])
        const selectedTruck = availableTrucks.value.find(truck => truck.id === truckId)
        if (selectedTruck) {
          // Find the order in the delivered list (it might be at index 0 or at existingDeliveredIndex)
          const deliveredOrderIndex = existingDeliveredIndex !== -1 ? existingDeliveredIndex : 0
          deliveredOrders.value[deliveredOrderIndex].truck = {
            id: selectedTruck.id,
            name: selectedTruck.name
          }
        }
      }
    }
  } catch (error) {
    console.error('Error marking order as delivered:', error)
    if (error.response) {
      console.error('Error response data:', error.response.data)
      console.error('Error response status:', error.response.status)
      console.error('Error response headers:', error.response.headers)
    } else if (error.request) {
      console.error('Error request:', error.request)
    } else {
      console.error('Error message:', error.message)
    }
    console.error('Error config:', error.config)
  }
}

const showCancelConfirmation = (orderId) => {
  orderToCancel.value = orderId
  showConfirmation.value = true
}

const hideConfirmation = () => {
  showConfirmation.value = false
  orderToCancel.value = null
}

const confirmCancelOrder = async () => {
  if (!orderToCancel.value) return
  
  try {
    isCanceling.value = true
    console.log('Canceling order:', orderToCancel.value)
    
    // Add a loading indicator to the button
    const btnElement = document.querySelector('.confirm-cancel-btn')
    if (btnElement) {
      btnElement.textContent = 'Cancelando...'
      btnElement.disabled = true
    }
    
    // Call the API to cancel the order
    const response = await OrderService.cancelOrder(orderToCancel.value)
    console.log('Cancel order response:', response)
    
    // Hide the confirmation modal
    hideConfirmation()
    
    // Show success message
    alert(translations.orderCanceled || 'Pedido cancelado exitosamente')
    
  } catch (error) {
    console.error('Error canceling order:', error)
    
    // Create a more user-friendly error message
    let errorMessage = translations.orderCancelError || 'Error al cancelar el pedido'
    
    if (error.message && error.message.includes('delivered')) {
      errorMessage = 'No se puede cancelar un pedido que ya ha sido entregado'
    } else if (error.message && error.message.includes('not found')) {
      errorMessage = `${translations.orderNotFound || 'Pedido no encontrado'}: ${orderToCancel.value}`
    } else if (error.response) {
      if (error.response.status === 404) {
        errorMessage += ': ' + (translations.orderNotFound || 'No se encontró el pedido')
      } else if (error.response.status === 403) {
        errorMessage += ': ' + (translations.permissionDenied || 'No tiene permisos para cancelar este pedido')
      } else if (error.response.data && error.response.data.message) {
        errorMessage += ': ' + error.response.data.message
      } else if (error.response.data && error.response.data.detail) {
        errorMessage += ': ' + error.response.data.detail
      }
    } else if (error.message) {
      errorMessage += ': ' + error.message
    }
    
    // Show error message
    alert(errorMessage)
    
    // Don't close the modal on error if the order still exists
    const orderStillExists = pendingOrders.value.some(order => order.id === orderToCancel.value)
    if (!orderStillExists) {
      hideConfirmation()
    }
  } finally {
    isCanceling.value = false
    
    // Reset the button state
    const btnElement = document.querySelector('.confirm-cancel-btn')
    if (btnElement) {
      btnElement.textContent = 'Sí, cancelar pedido'
      btnElement.disabled = false
    }
  }
}

const startPolling = () => {
  // Clear any existing interval
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
  
  // Set up new polling interval
  pollingInterval.value = setInterval(async () => {
    try {
      // Only fetch if we're not already loading
      if (!isLoading.value) {
        console.log('Polling for new orders...')
        // Set polling flag in OrderService
        OrderService.isPolling = true
        await fetchOrders()
        lastUpdateTime.value = new Date()
        // Reset polling flag
        OrderService.isPolling = false
      }
    } catch (error) {
      console.error('Error during polling:', error)
      // Make sure to reset polling flag even on error
      OrderService.isPolling = false
    }
  }, POLLING_INTERVAL)
}

const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

onMounted(() => {
  // Initial fetch
  fetchOrders()
  
  // Start polling immediately
  startPolling()
  
  // Set up event listeners
  eventBus.on('login-success', (token) => {
    console.log('Login success event received in OrderTables')
    fetchOrders()
    startPolling()
  })
  
  eventBus.on('order-submitted', () => {
    console.log('Order submitted event received in OrderTables')
    fetchOrders()
  })
  
  eventBus.on('refresh-orders', () => {
    console.log('Refresh orders event received in OrderTables')
    fetchOrders()
  })
  
  eventBus.on('order-canceled', (orderId) => {
    console.log('Order canceled event received in OrderTables for order:', orderId)
    // Remove the order from the pending orders list if it exists
    const orderIndex = pendingOrders.value.findIndex(order => order.id === parseInt(orderId))
    if (orderIndex !== -1) {
      pendingOrders.value.splice(orderIndex, 1)
      console.log(`Removed order ${orderId} from pending orders list`)
    }
  })
})

onUnmounted(() => {
  stopPolling()
  eventBus.off('login-success')
  eventBus.off('order-submitted')
  eventBus.off('refresh-orders')
  eventBus.off('order-canceled')
})

// Add a computed property for the last update time
const lastUpdateText = computed(() => {
  if (!lastUpdateTime.value) return ''
  const now = new Date()
  const diff = now - lastUpdateTime.value
  const seconds = Math.floor(diff / 1000)
  return `Última actualización: ${seconds} segundos`
})

// Add a watch effect to monitor changes in the orders
watch([pendingOrders, deliveredOrders], () => {
  console.log('Orders changed, updating lastOrderId')
  const allOrders = [...pendingOrders.value, ...deliveredOrders.value]
  const allOrderIds = allOrders.map(order => order.id)
  if (allOrderIds.length > 0) {
    lastOrderId.value = Math.max(...allOrderIds)
  }
}, { deep: true })
</script>

<style>
/* Styles moved to /src/assets/styles/components/OrderTables.css */
.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;
}

.deliver-btn {
  background-color: #10b981;
  color: white;
}

.deliver-btn:hover {
  background-color: #059669;
}

.deliver-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #f87171;
  color: white;
}

.cancel-btn:hover {
  background-color: #ef4444;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirmation-modal {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 1001;
}

.confirmation-modal-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #ef4444;
}

.confirmation-modal-message {
  margin-bottom: 1.5rem;
  color: #4b5563;
}

.confirmation-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.confirm-cancel-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
}

.confirm-cancel-btn:hover {
  background-color: #dc2626;
}

.cancel-action-btn {
  background-color: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
}

.cancel-action-btn:hover {
  background-color: #d1d5db;
}

.tables-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.last-update {
  color: #6b7280;
  font-size: 0.875rem;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border: none;
  border-radius: 0.375rem;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background-color: #e5e7eb;
}

.refresh-icon {
  font-size: 0.875rem;
}

/* Add transition styles */
.order-list-move,
.order-list-enter-active,
.order-list-leave-active {
  transition: all 0.5s ease;
}

.order-list-enter-from,
.order-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.order-list-leave-active {
  position: absolute;
}
</style>
