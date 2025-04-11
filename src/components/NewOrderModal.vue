<template>
  <div v-if="show" class="new-order-modal-wrapper" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center;">
    <div class="new-order-modal-content" style="width: 95vw !important; max-width: 90vw !important; height: 90vh !important; background-color: white; border-radius: 8px; padding: 15px; position: relative; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); border: 1px solid #e62222; display: flex; flex-direction: column; overflow: auto;">
      <span class="close" @click="closeModal">&times;</span>
      <h2>{{ translations.newOrder }} - {{ customer?.name }}</h2>
      
      <!-- Items loading state -->
      <div v-if="isLoadingItems" class="modal-loading">
        <div class="spinner"></div>
        <p>Cargando items disponibles...</p>
      </div>
      
      <!-- Items error state -->
      <div v-if="itemsError" class="modal-error">
        <p>{{ itemsError }}</p>
        <button @click="fetchItems" class="retry-btn">Reintentar</button>
      </div>
      
      <!-- Modal layout -->
      <div class="order-modal-layout" style="display: flex; width: 100%; gap: 20px; flex: 1; height: calc(90vh - 100px); overflow: hidden;">
        <!-- Left side: Available items list -->
        <div class="available-items-section" style="flex: 7; min-width: 0; height: 100%; overflow-y: auto; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
          <h3>Items Disponibles</h3>
          
          <!-- Display inventory alerts/warnings if any -->
          <div v-if="inventoryAlerts.length > 0" class="inventory-warnings">
            <div v-for="(alert, index) in inventoryAlerts" :key="index" 
                 class="inventory-alert" :class="{ 'critical': alert.type === 'critical', 'warning': alert.type === 'warning' }">
              <i class="fas" :class="alert.type === 'critical' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'"></i>
              {{ alert.message }}
            </div>
          </div>
          
          <div class="items-container">
            <ItemSelector 
              ref="itemSelectorRef"
              :items="availableItems"
              :is-loading="isLoadingItems"
              :error="itemsError"
              :current-page="currentPage"
              :total-pages="totalPages"
              @add-item="addToOrder"
              @change-page="changePage"
              @retry="fetchItems"
              @inventory-alert="handleInventoryAlert"
            />
          </div>
        </div>
        
        <!-- Right side: Current order using OrderSummary component -->
        <div class="current-order-section" style="flex: 3; min-width: 0; height: 100%; overflow-y: auto; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
          <OrderSummary 
            :items="currentOrder.items"
            :customer="customer"
            :trucks="availableTrucks"
            :is-loading-trucks="isLoadingTrucks"
            :trucks-error="trucksError"
            :is-submitting="isSubmittingOrder"
            :error="orderError"
            :success-message="orderSuccess"
            :inventory-alerts="inventoryAlerts"
            :inventory-projection-message="'La existencia en inventario se actualizará cuando el pedido sea marcado como entregado.'"
            @remove-item="removeFromOrder"
            @submit="submitOrder"
            @update-truck="updateTruck"
            @update-date="updateDate"
          />
        </div>
      </div>
    </div>
    
    <NewCustomerModal 
      :is-open="showNewCustomerModal"
      @close="showNewCustomerModal = false"
      @customer-created="handleCustomerCreated"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { eventBus } from '../utils/eventBus'
import ItemSelector from './ItemSelector.vue'
import OrderSummary from './OrderSummary.vue'
import OrderService from '../services/OrderService'
import TruckService from '../services/TruckService'
import { translations } from '../utils/translations'
import NewCustomerModal from './NewCustomerModal.vue'
import { useCustomerStore } from '../stores/customer'
import { useRouter } from 'vue-router'
import { createOrderObject, validateOrder } from '../utils/orderUtils'
import { calculateOrderTotal } from '../utils/orderUtils'
import { useI18n } from 'vue-i18n'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  customer: {
    type: Object,
    required: false,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'order-created', 'customer-selected'])

// Store
const customerStore = useCustomerStore()

// Customer search state
const searchPhone = ref('')
const selectedCustomer = ref(null)
const showNewCustomerModal = ref(false)

// Items state
const availableItems = ref([])
const isLoadingItems = ref(false)
const itemsError = ref('')
const currentPage = ref(0)
const pageSize = ref(10)
const totalPages = ref(1)
const totalItems = ref(0)

// Order state
const currentOrder = reactive({
  items: []
})
const selectedTruck = ref(null) // Will be set after fetching trucks
const availableTrucks = ref([])
const isLoadingTrucks = ref(false)
const trucksError = ref('')
const orderDate = ref(new Date().toISOString().split('T')[0])
const isSubmittingOrder = ref(false)
const orderError = ref('')
const orderSuccess = ref('')

// Item quantities for UI
const itemQuantities = reactive({})

// Inventory alerts state
const inventoryAlerts = ref([])

// Computed properties
const todayFormatted = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Methods
const resetModal = () => {
  currentOrder.items = []
  Object.keys(itemQuantities).forEach(key => {
    itemQuantities[key] = 0
  })
  inventoryAlerts.value = []
  orderError.value = ''
  orderSuccess.value = ''
  currentPage.value = 0
  selectedTruck.value = null
  orderDate.value = new Date().toISOString().split('T')[0]
  // Notify ItemSelector to reset its state
  if (itemSelectorRef.value) {
    itemSelectorRef.value.resetItemSelections()
  }
}

const closeModal = () => {
  resetModal()
  emit('close')
}

const fetchTrucks = async () => {
  console.log('Fetching trucks...')
  isLoadingTrucks.value = true
  trucksError.value = ''
  
  try {
    const trucks = await TruckService.getAllTrucks()
    console.log('Trucks fetched:', trucks)
    
    if (Array.isArray(trucks)) {
      availableTrucks.value = trucks
      
      // Set default selected truck if available
      if (trucks.length > 0) {
        selectedTruck.value = trucks[0]
        console.log('Default truck selected:', selectedTruck.value)
      } else {
        trucksError.value = 'No hay camiones disponibles'
        console.warn('No trucks available')
      }
    } else {
      trucksError.value = 'Formato de datos de camiones inválido'
      console.error('Invalid truck data format:', trucks)
    }
  } catch (error) {
    console.error('Error fetching trucks:', error)
    trucksError.value = `Error al cargar camiones: ${error.message || 'Error desconocido'}`
  } finally {
    isLoadingTrucks.value = false
  }
}

const fetchItems = async () => {
  console.log('Fetching items...')
  isLoadingItems.value = true
  itemsError.value = ''
  
  try {
    const data = await OrderService.getItems(currentPage.value, pageSize.value)
    console.log('Items response:', data)
    
    if (data && data.content) {
      availableItems.value = data.content
      totalPages.value = data.totalPages || 1
      totalItems.value = data.totalElements || data.content.length
      console.log(`Loaded ${availableItems.value.length} items, total pages: ${totalPages.value}`)
    } else if (Array.isArray(data)) {
      availableItems.value = data
      totalPages.value = Math.ceil(data.length / pageSize.value)
      totalItems.value = data.length
      console.log(`Loaded ${availableItems.value.length} items from array`)
    } else {
      itemsError.value = 'Formato de datos de items inválido'
      console.error('Invalid item data format:', data)
    }
    
    // Initialize quantities for new items
    availableItems.value.forEach(item => {
      // Initialize quantityToAdd property
      if (item.quantityToAdd === undefined) {
        item.quantityToAdd = 1
      }
      
      // Also initialize in the itemQuantities object for backward compatibility
      if (itemQuantities[item.id] === undefined) {
        itemQuantities[item.id] = 0
      }
    })
  } catch (error) {
    console.error('Error fetching items:', error)
    itemsError.value = error.message || 'Error al cargar items'
  } finally {
    isLoadingItems.value = false
  }
}

const changePage = (newPage) => {
  if (newPage >= 0 && newPage < totalPages.value) {
    currentPage.value = newPage
    fetchItems()
  }
}

const addToOrder = (item) => {
  // Check if item already exists in order
  const existingItemIndex = currentOrder.items.findIndex(i => i.id === item.id)
  
  // Find the original item from available items to check quantity
  const originalItem = availableItems.value.find(i => i.id === item.id)
  const currentInventory = originalItem ? originalItem.quantity || 0 : 0
  
  // Calculate requested quantity
  let requestedQuantity = item.quantity
  if (existingItemIndex >= 0) {
    requestedQuantity += currentOrder.items[existingItemIndex].quantity
  }
  
  // Check if we're exceeding available inventory
  if (requestedQuantity > currentInventory) {
    // Show warning but proceed with adding to order
    const warningMessage = {
      id: item.id,
      name: item.name,
      available: currentInventory,
      requested: requestedQuantity,
      message: `Advertencia: Solicitando ${requestedQuantity} unidades de "${item.name}" pero solo hay ${currentInventory} disponibles.`
    }
    
    // Check if we already have an alert for this item
    const existingAlertIndex = inventoryAlerts.value.findIndex(alert => alert.id === item.id)
    if (existingAlertIndex >= 0) {
      // Update existing alert
      inventoryAlerts.value[existingAlertIndex] = warningMessage
    } else {
      // Add new alert
      inventoryAlerts.value.push(warningMessage)
    }
    
    console.warn(`Inventory warning: Requesting ${requestedQuantity} units of "${item.name}" but only ${currentInventory} available.`)
  } else {
    // Remove any existing alerts for this item
    inventoryAlerts.value = inventoryAlerts.value.filter(alert => alert.id !== item.id)
  }
  
  // Add to order regardless of inventory level
  if (existingItemIndex >= 0) {
    // Update existing item
    currentOrder.items[existingItemIndex].quantity += item.quantity
  } else {
    // Add new item
    currentOrder.items.push(item)
  }
  
  // Update the UI to reflect the inventory change
  if (originalItem) {
    // Update the displayed inventory (but don't actually commit this change to backend yet)
    originalItem.inventoryAfterOrder = Math.max(0, currentInventory - requestedQuantity)
  }
}

const removeFromOrder = (index) => {
  const removedItem = currentOrder.items[index]
  
  // Remove the item from the order
  currentOrder.items.splice(index, 1)
  
  // Find the original item in the available items list
  const originalItem = availableItems.value.find(i => i.id === removedItem.id)
  
  if (originalItem) {
    // Update the inventory projection
    if (originalItem.inventoryAfterOrder !== undefined) {
      originalItem.inventoryAfterOrder = Math.min(
        originalItem.quantity,
        (originalItem.inventoryAfterOrder || 0) + removedItem.quantity
      )
      
      // If inventory is now sufficient, remove any alert
      if (originalItem.inventoryAfterOrder >= originalItem.quantity) {
        inventoryAlerts.value = inventoryAlerts.value.filter(alert => alert.id !== removedItem.id)
      } else {
        // Otherwise, update the alert if it exists
        const alertIndex = inventoryAlerts.value.findIndex(alert => alert.id === removedItem.id)
        if (alertIndex >= 0) {
          // Calculate new requested quantity after removal
          const remainingQuantity = currentOrder.items
            .filter(item => item.id === removedItem.id)
            .reduce((sum, item) => sum + item.quantity, 0)
          
          if (remainingQuantity > 0) {
            // Update the alert with new quantities
            inventoryAlerts.value[alertIndex] = {
              ...inventoryAlerts.value[alertIndex],
              requested: remainingQuantity,
              message: `Advertencia: Solicitando ${remainingQuantity} unidades de "${removedItem.name}" pero solo hay ${originalItem.quantity} disponibles.`
            }
          } else {
            // No more of this item in the order, remove the alert
            inventoryAlerts.value.splice(alertIndex, 1)
          }
        }
      }
    }
  }
}

// Additional methods for OrderSummary component
const updateTruck = (truck) => {
  selectedTruck.value = truck
}

const updateDate = (date) => {
  orderDate.value = date
}

const submitOrder = async () => {
  if (!props.customer) {
    console.error('No customer selected for order')
    return
  }

  if (!selectedTruck.value) {
    console.error('No truck selected for order')
    return
  }

  if (currentOrder.items.length === 0) {
    console.error('No items in order')
    return
  }

  try {
    isSubmittingOrder.value = true
    orderError.value = ''
    orderSuccess.value = ''

    // Log inventory warnings if any
    if (inventoryAlerts.value.length > 0) {
      console.warn('Order contains items with insufficient inventory:', inventoryAlerts.value)
    }

    console.log('Creating order with data:', {
      customer: props.customer,
      items: currentOrder.items,
      truck: selectedTruck.value,
      date: orderDate.value
    })

    const orderData = createOrderObject(
      props.customer,
      currentOrder.items,
      selectedTruck.value,
      orderDate.value
    )

    console.log('Order data created:', orderData)

    // Validate order before submitting
    const validation = validateOrder(orderData)
    if (!validation.isValid) {
      console.error('Order validation failed:', validation.errors)
      orderError.value = validation.errors.join(', ')
      return
    }

    const response = await OrderService.createOrder(orderData)
    console.log('Order created successfully:', response)

    // Set success message with inventory update note
    const hadInventoryWarnings = inventoryAlerts.value.length > 0
    orderSuccess.value = hadInventoryWarnings
      ? 'Orden creada exitosamente. El inventario ha sido actualizado, incluyendo items con existencias insuficientes.'
      : 'Orden creada exitosamente. El inventario ha sido actualizado.'
    
    // Reset inventory alerts
    inventoryAlerts.value = []
    
    setTimeout(() => {
      emit('order-created', response)
      closeModal()
    }, 2000) // Show success message for 2 seconds before closing
  } catch (error) {
    console.error('Error creating order:', error)
    orderError.value = error.response?.data?.message || 'Error al crear la orden'
  } finally {
    isSubmittingOrder.value = false
  }
}

const handleCustomerCreated = (customer) => {
  selectedCustomer.value = customer
  emit('customer-selected', customer)
}

const clearCustomer = () => {
  selectedCustomer.value = null
}

const router = useRouter()

const searchCustomer = async () => {
  if (!searchPhone.value) {
    selectedCustomer.value = null
    return
  }

  try {
    const customer = await customerStore.searchCustomer(searchPhone.value)
    if (customer) {
      selectedCustomer.value = customer
      emit('customer-selected', customer)
    } else {
      selectedCustomer.value = null
      // Don't emit customer-selected event when no customer is found
      // This will show the "Nuevo Cliente" button
    }
  } catch (error) {
    // Handle authentication errors
    if (error.response?.status === 403 || error.response?.status === 401) {
      // Clear any existing token
      localStorage.removeItem('token')
      // Redirect to login
      router.push('/login')
      return
    }
    
    // Only log other errors
    if (error.response?.status !== 404) {
      console.error('Error searching customer:', error)
    }
    selectedCustomer.value = null
    // Don't emit customer-selected event on error
  }
}

// Additional methods
const handleInventoryAlert = (alert) => {
  // Check if we already have an alert for this item
  const existingAlertIndex = inventoryAlerts.value.findIndex(a => a.id === alert.id)
  if (existingAlertIndex >= 0) {
    // Update existing alert
    inventoryAlerts.value[existingAlertIndex] = alert
  } else {
    // Add new alert
    inventoryAlerts.value.push(alert)
  }
}

// Handle refresh-items event to update inventory quantities after delivery
const handleItemsRefresh = () => {
  console.log('Received refresh-items event, updating item data')
  fetchItems()
}

// Initialize when component is mounted
onMounted(() => {
  console.log('NewOrderModal component mounted')
  fetchItems()
  fetchTrucks()
  
  // Listen for refresh-items events to update item quantities
  eventBus.on('refresh-items', handleItemsRefresh)
})

// Clean up event listeners when component is unmounted
onBeforeUnmount(() => {
  console.log('NewOrderModal component will unmount, removing event listeners')
  eventBus.off('refresh-items', handleItemsRefresh)
})

// Watch for modal visibility changes
watch(() => props.show, (newVal) => {
  if (newVal) {
    console.log('Modal opened, loading data...')
    // Reset state
    resetModal()
    
    // Reset inventory alerts
    inventoryAlerts.value = []
    
    // Fetch items and trucks
    Promise.all([
      fetchItems(),
      fetchTrucks()
    ]).catch(error => {
      console.error('Error loading modal data:', error)
    })
  }
})

// Add immediate option to watch to ensure it runs on component mount if modal is already open
watch(() => props.show, (newVal) => {
  if (newVal) {
    console.log('Modal is open, loading data...')
    Promise.all([
      fetchItems(),
      fetchTrucks()
    ]).catch(error => {
      console.error('Error loading modal data:', error)
    })
  }
}, { immediate: true })

// Ref for ItemSelector component
const itemSelectorRef = ref(null)
</script>

<style>
/* Styles moved to /src/assets/styles/components/NewOrderModal.css */

.customer-search {
  position: relative;
}

.customer-actions {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
}

.new-customer-btn {
  background-color: var(--secondary-color);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.new-customer-btn:hover {
  background-color: var(--primary-color);
  color: var(--secondary-color);
  transform: translateY(-1px);
}

.selected-customer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f3f4f6;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.selected-customer span {
  font-weight: 500;
  color: var(--dark-color);
}

.clear-customer-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-customer-btn:hover {
  background-color: #e5e7eb;
  color: var(--primary-color);
}

.inventory-warnings {
  margin-bottom: 1rem;
  border-radius: 4px;
  overflow: hidden;
}

.inventory-alert {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 4px;
}

.inventory-alert.critical {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-left: 4px solid #ef4444;
}

.inventory-alert.warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-left: 4px solid #f59e0b;
}

.ordered-items {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.5rem;
}

.ordered-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.ordered-item:last-child {
  border-bottom: none;
}

.ordered-item-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.empty-cart {
  text-align: center;
  padding: 1rem;
  color: #6b7280;
  font-style: italic;
}

.order-total {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-top: 2px solid #e5e7eb;
}

.remove-item-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 1rem;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  gap: 0.5rem;
}

.page-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  margin: 0 0.5rem;
}
</style>
