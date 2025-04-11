<template>
  <div class="order-summary-component">
    <h3>{{ translations.currentOrder }}</h3>
    
    <!-- Empty order state -->
    <div v-if="items.length === 0" class="empty-order">
      <p>{{ translations.emptyOrder }}</p>
      <p class="instruction">{{ translations.addItemsInstruction }}</p>
    </div>
    
    <!-- Order items -->
    <div v-else class="order-content">
      <!-- Truck selection -->
      <div class="truck-selection">
        <label for="truck-select">{{ translations.selectTruck }}:</label>
        <div v-if="isLoadingTrucks" class="loading-indicator">
          <div class="spinner-sm"></div>
          <span>Loading trucks...</span>
        </div>
        <div v-else-if="trucksError" class="error-message">
          {{ trucksError }}
        </div>
        <select v-else id="truck-select" v-model="selectedTruck" @change="updateTruck">
          <option v-if="trucks.length === 0" disabled>No trucks available</option>
          <option v-for="truck in trucks" :key="truck.id" :value="truck">
            {{ truck.name }}
          </option>
        </select>
      </div>
      
      <!-- Order date -->
      <div class="order-date">
        <label for="order-date">{{ translations.orderDate }}:</label>
        <input 
          type="date" 
          id="order-date" 
          v-model="orderDate" 
          :min="todayFormatted" 
          @change="updateDate"
        />
      </div>
      
      <!-- Order items -->
      <div class="order-items">
        <div v-for="(item, index) in items" :key="index" class="order-item">
          <div class="order-item-details">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-quantity">x{{ item.quantity }}</span>
            <span class="item-price">{{ formatPrice(Number(item.price) * item.quantity) }}</span>
          </div>
          <button @click="removeItem(index)" class="remove-btn">{{ translations.remove }}</button>
        </div>
      </div>
      
      <!-- Inventory alerts -->
      <div v-if="inventoryAlerts.length > 0" class="inventory-alerts">
        <div class="inventory-alert-title">
          <i class="fas fa-exclamation-triangle"></i>
          Advertencias de inventario
        </div>
        <div v-for="alert in inventoryAlerts" :key="alert.id" class="inventory-alert">
          <p>
            <strong>{{ alert.name }}:</strong> 
            Solicitando <span class="alert-requested">{{ alert.requested }}</span> unidades, 
            pero solo hay <span class="alert-available">{{ alert.available }}</span> disponibles.
          </p>
        </div>
        <p class="inventory-note">{{ inventoryProjectionMessage || 'La orden podrá procesarse de todas formas.' }}</p>
      </div>
      
      <!-- Order summary -->
      <div class="order-total-section">
        <div class="order-total">
          <strong>{{ translations.total }}:</strong> {{ formatPrice(calculateOrderTotal(items)) }}
        </div>
        <button 
          @click="submitOrder" 
          :disabled="isSubmitting || items.length === 0 || !selectedTruck" 
          class="submit-btn"
        >
          <i class="fas fa-check-circle"></i>
          {{ isSubmitting ? translations.submitting : 'Crear Pedido' }}
        </button>
        <div v-if="error" class="order-error">
          {{ error }}
        </div>
        <div v-if="successMessage" class="order-success">
          {{ successMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue'
import { calculateOrderTotal, formatPrice, createOrderObject, validateOrder } from '../utils/orderUtils'
import { translations } from '../utils/translations'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  customer: {
    type: Object,
    required: true
  },
  trucks: {
    type: Array,
    default: () => []
  },
  isLoadingTrucks: {
    type: Boolean,
    default: false
  },
  trucksError: {
    type: String,
    default: ''
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  successMessage: {
    type: String,
    default: ''
  },
  inventoryAlerts: {
    type: Array,
    default: () => []
  },
  inventoryProjectionMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['remove-item', 'submit', 'update-truck', 'update-date'])

// State
const selectedTruck = ref(props.trucks.length > 0 ? props.trucks[0] : null)
const orderDate = ref(new Date().toISOString().split('T')[0])

// Watch for trucks changes to set default selected truck
watch(() => props.trucks, (newTrucks) => {
  if (newTrucks.length > 0 && !selectedTruck.value) {
    selectedTruck.value = newTrucks[0]
    emit('update-truck', newTrucks[0])
  }
}, { immediate: true })

// Computed properties
const todayFormatted = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Methods

const removeItem = (index) => {
  emit('remove-item', index)
}

const submitOrder = () => {
  if (props.items.length === 0) return
  
  const orderData = createOrderObject(
    props.customer,
    props.items,
    selectedTruck.value,
    orderDate.value
  )
  
  // Validate order before submitting
  const validation = validateOrder(orderData)
  if (!validation.isValid) {
    console.error('Order validation failed:', validation.errors)
    return
  }
  
  emit('submit', orderData)
}

const updateTruck = () => {
  emit('update-truck', selectedTruck.value)
}

const updateDate = () => {
  emit('update-date', orderDate.value)
}
</script>

<style scoped>
/* Truck loading styles */
.loading-indicator {
  display: flex;
  align-items: center;
  margin-top: 5px;
  font-size: 0.9em;
  color: #666;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9em;
  margin-top: 5px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Component styles */
.order-summary-component {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.order-summary-component h3 {
  margin-top: 0;
  color: var(--primary-color, #1d4ed8);
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.empty-order {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  color: #6b7280;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
  flex-grow: 1;
  margin: 1rem 0;
}

.instruction {
  font-size: 14px;
  margin-top: 10px;
  color: #9ca3af;
}

.order-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.truck-selection, .order-date {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.truck-selection label, .order-date label {
  font-weight: 500;
  color: #4b5563;
  font-size: 0.9rem;
}

.truck-selection select, .order-date input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #f9fafb;
  font-size: 1rem;
  width: 100%;
}

.truck-selection select:focus, .order-date input:focus {
  outline: none;
  border-color: var(--primary-color, #1d4ed8);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.order-items {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.order-item:last-child {
  border-bottom: none;
}

.order-item-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.item-name {
  flex: 1;
  font-weight: 500;
}

.item-quantity {
  padding: 0.25rem 0.5rem;
  background-color: #f3f4f6;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.item-price {
  font-weight: 600;
  color: var(--primary-color, #1d4ed8);
}

.remove-btn {
  background-color: transparent;
  color: #ef4444;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background-color: #fee2e2;
}

.inventory-alerts {
  background-color: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 0.5rem;
  padding: 1rem;
}

.inventory-alert-title {
  color: #d97706;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.inventory-alert {
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed #fcd34d;
}

.inventory-alert:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.inventory-alert p {
  margin: 0;
  font-size: 0.9rem;
}

.alert-requested {
  color: #ef4444;
  font-weight: 600;
}

.alert-available {
  color: #10b981;
  font-weight: 600;
}

.inventory-note {
  font-size: 0.875rem;
  font-style: italic;
  color: #9ca3af;
  margin-top: 0.75rem;
  margin-bottom: 0;
}

.order-total-section {
  margin-top: auto;
  padding-top: 1.25rem;
  border-top: 2px solid #f3f4f6;
}

.order-total {
  display: flex;
  justify-content: space-between;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.submit-btn {
  width: 100%;
  background-color: var(--primary-color, #1d4ed8);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #1e40af;
}

.submit-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.order-error {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #fee2e2;
  border-radius: 0.375rem;
  color: #ef4444;
  font-size: 0.875rem;
}

.order-success {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #d1fae5;
  border-radius: 0.375rem;
  color: #10b981;
  font-size: 0.875rem;
}
</style>
