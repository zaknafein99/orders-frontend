<template>
  <div class="item-selector">
    <!-- Pagination controls -->
    <div class="pagination-controls">
      <button 
        @click="$emit('change-page', currentPage - 1)" 
        :disabled="currentPage === 0 || isLoading"
        class="pagination-btn"
      >
        &laquo; Anterior
      </button>
      <span class="page-info">Página {{ currentPage + 1 }} de {{ totalPages }}</span>
      <button 
        @click="$emit('change-page', currentPage + 1)" 
        :disabled="currentPage >= totalPages - 1 || isLoading"
        class="pagination-btn"
      >
        Siguiente &raquo;
      </button>
    </div>
    
    <!-- Items loading state -->
    <div v-if="isLoading" class="items-loading">
      <div class="spinner"></div>
      <p>Cargando items...</p>
    </div>
    
    <!-- Items error state -->
    <div v-if="error" class="items-error">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="retry-btn">Reintentar</button>
    </div>
    
    <!-- Items list -->
    <div v-if="!isLoading && !error && items.length > 0" class="items-list">
      <div v-for="item in items" :key="item.id" class="item-card">
        <div class="item-header">
          <h4>{{ item.name }}</h4>
          <span class="item-price">${{ item.price.toFixed(2) }}</span>
        </div>
        <p class="item-description">{{ item.description }}</p>
        <div class="item-metadata">
          <span class="item-category">Categoría: {{ item.category }}</span>
          
          <!-- Display inventory status with different styling based on quantity -->
          <span :class="['inventory-status', item.quantity <= 0 ? 'out-of-stock' : 'in-stock']">
            <i class="fas fa-boxes"></i> Disponible: {{ item.quantity }}
          </span>
        </div>
        
        <!-- Show projected inventory if set -->
        <div v-if="item.inventoryAfterOrder !== undefined" class="inventory-projection">
          <span>Después del pedido: {{ item.inventoryAfterOrder }}</span>
        </div>
        
        <!-- Item quantity selector -->
        <div class="item-quantity-controls">
          <button 
            class="quantity-btn" 
            @click="decrementQuantity(item)"
            :disabled="item.quantityToAdd <= 1">-</button>
          <input 
            type="number" 
            v-model="item.quantityToAdd" 
            min="1"
            class="quantity-input">
          <button 
            class="quantity-btn" 
            @click="incrementQuantity(item)">+</button>
          
          <!-- Disable the add button when the item is out of stock -->
          <button 
            class="add-btn"
            :class="{'disabled': item.quantity <= 0}" 
            :disabled="item.quantity <= 0"
            @click="addItem(item)">
            <span v-if="item.quantity > 0">Agregar al Pedido</span>
            <span v-else>Sin Stock</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- No items state -->
    <div v-if="!isLoading && !error && items.length === 0" class="no-items">
      <p>No hay items disponibles</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, reactive, defineExpose } from 'vue'
import { formatPrice } from '../utils/orderUtils'
import { translations } from '../utils/translations'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  currentPage: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['add-item', 'change-page', 'retry', 'inventory-alert'])

// Item quantities for UI
const itemQuantities = reactive({})

// Methods
const getItemQuantity = (itemId) => {
  return itemQuantities[itemId] || 0
}

const incrementQuantity = (item) => {
  if (!item.quantityToAdd) {
    item.quantityToAdd = 1
  } else {
    item.quantityToAdd++
  }
}

const decrementQuantity = (item) => {
  if (item.quantityToAdd > 1) {
    item.quantityToAdd--
  }
}

const addItem = (item) => {
  if (item.quantity <= 0) {
    // Item is out of stock, don't allow adding
    emit('inventory-alert', {
      type: 'critical',
      message: `No hay stock disponible para: ${item.name}`
    })
    return
  }
  
  const quantity = item.quantityToAdd || 1
  
  // Check if adding this item would exceed available inventory
  if (quantity > item.quantity) {
    // Emit inventory alert but still allow adding
    emit('inventory-alert', {
      type: 'warning',
      message: `Advertencia: Solicitando ${quantity} unidades de "${item.name}" pero solo hay ${item.quantity} disponibles.`
    })
  }
  
  // Emit event to parent component
  emit('add-item', {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    quantity: quantity,
    category: item.category
  })
  
  // Reset quantity to 1 after adding
  item.quantityToAdd = 1
}

const resetItemSelections = () => {
  // Reset all item quantities
  if (props.items && props.items.length > 0) {
    props.items.forEach(item => {
      item.quantityToAdd = 1
      // Reset any inventory projections
      if (item.inventoryAfterOrder !== undefined) {
        delete item.inventoryAfterOrder
      }
    })
  }
}

// Expose methods to the parent component
defineExpose({
  resetItemSelections
})

const getInventoryStatusClass = (item) => {
  if (item.quantity <= 0) {
    return 'out-of-stock'
  } else if (item.quantity <= 5) {
    return 'low-stock'
  } else {
    return 'in-stock'
  }
}

const getInventoryIcon = (item) => {
  if (item.quantity <= 0) {
    return 'fa-times-circle'
  } else if (item.quantity <= 5) {
    return 'fa-exclamation-circle'
  } else {
    return 'fa-check-circle'
  }
}
</script>

<style>
/* Inventory status styles */
.item-inventory {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  gap: 0.25rem;
}

/* Improve item card layout */
.items-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
  width: 100%;
}

.item-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.item-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.item-price {
  font-weight: 600;
  color: var(--primary-color, #1d4ed8);
}

.item-description {
  flex-grow: 1;
  margin-bottom: 0.75rem;
  color: #4b5563;
  font-size: 0.875rem;
}

.item-metadata {
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.item-category {
  color: #6b7280;
}

.item-quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
  flex-wrap: wrap;
}

.quantity-btn {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
}

.quantity-btn:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.quantity-input {
  width: 3rem;
  height: 2rem;
  text-align: center;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.add-btn {
  background-color: #e62222;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  white-space: nowrap;
}

.add-btn:hover {
  background-color: #d41d1d;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-btn.disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  color: #666666;
}

.in-stock {
  color: #16a34a; /* Green */
}

.low-stock {
  color: #ca8a04; /* Amber/Orange */
}

.out-of-stock {
  color: #dc2626; /* Red */
}

.inventory-projection {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.25rem;
  font-style: italic;
}

.inventory-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.in-stock {
  color: var(--success-color, #10b981);
}

.out-of-stock {
  color: var(--danger-color, #ef4444);
  font-weight: bold;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #4b5563;
}

.items-loading, .items-error, .no-items {
  text-align: center;
  padding: 2rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color, #1d4ed8);
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  background-color: var(--primary-color, #1d4ed8);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  margin-top: 1rem;
  cursor: pointer;
}
</style>
