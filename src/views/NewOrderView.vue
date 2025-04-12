<template>
  <div class="new-order">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">{{ $t('newOrder') }}</h1>
      <button class="btn btn-outline" @click="$router.push('/orders')">
        <i class="fas fa-arrow-left mr-2"></i>
        {{ $t('backToOrders') }}
      </button>
    </div>
    
    <div class="card">
      <div class="new-order-content">
        <form @submit.prevent="submitOrder" class="order-form">
          <!-- Customer Selection -->
          <div class="form-section">
            <h3 class="section-title">{{ $t('customer') }}</h3>
            <div class="form-group">
              <label for="customer">{{ $t('selectCustomer') }}:</label>
              <select 
                id="customer" 
                v-model="selectedCustomerId" 
                class="form-input"
                required
                :disabled="loading"
              >
                <option value="">{{ $t('selectCustomer') }}</option>
                <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                  {{ customer.name }}
                </option>
              </select>
            </div>
          </div>
          
          <!-- Items Selection -->
          <div class="form-section">
            <h3 class="section-title">{{ $t('items') }}</h3>
            <div v-if="loadingItems" class="text-center py-4">
              <i class="fas fa-spinner fa-spin"></i>
              <p>{{ $t('loadingItems') }}</p>
            </div>
            <div v-else>
              <div class="items-grid">
                <div v-for="item in availableItems" :key="item.id" class="item-card">
                  <div class="item-details">
                    <h4>{{ item.name }}</h4>
                    <p class="item-price">${{ formatCurrency(item.price) }}</p>
                  </div>
                  <div class="item-actions">
                    <button 
                      type="button" 
                      class="btn-icon btn-small" 
                      :disabled="getItemQuantity(item.id) === 0 || loading"
                      @click="decrementItem(item)"
                    >
                      <i class="fas fa-minus"></i>
                    </button>
                    <span class="item-quantity">{{ getItemQuantity(item.id) }}</span>
                    <button 
                      type="button" 
                      class="btn-icon btn-small" 
                      :disabled="loading"
                      @click="incrementItem(item)"
                    >
                      <i class="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <div v-if="selectedItems.length === 0" class="empty-items-message">
                <p>{{ $t('noItemsSelected') }}</p>
              </div>
              
              <div v-else class="selected-items">
                <h4>{{ $t('selectedItems') }}</h4>
                <ul class="selected-items-list">
                  <li v-for="item in selectedItems" :key="item.id" class="selected-item">
                    <span>{{ item.name }}</span>
                    <span>{{ item.quantity }} x ${{ formatCurrency(item.price) }}</span>
                    <span>${{ formatCurrency(item.quantity * item.price) }}</span>
                  </li>
                </ul>
                <div class="order-total">
                  <span>{{ $t('total') }}:</span>
                  <span>${{ formatCurrency(calculateTotal()) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Submit Button -->
          <div class="form-actions">
            <button 
              type="button" 
              class="btn btn-outline" 
              @click="resetForm"
              :disabled="loading"
            >
              {{ $t('reset') }}
            </button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="!isFormValid || loading"
            >
              <i class="fas fa-check mr-2"></i>
              {{ loading ? $t('creating') : $t('createOrder') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import OrderService from '../services/OrderService';
import CustomerService from '../services/CustomerService';
import { calculateOrderTotal } from '../utils/orderUtils';
import { eventBus } from '../utils/eventBus';

const router = useRouter();
const customers = ref([]);
const availableItems = ref([]);
const selectedCustomerId = ref('');
const orderItems = ref({});
const loading = ref(false);
const loadingItems = ref(false);

const fetchCustomers = async () => {
  try {
    const response = await CustomerService.getAllCustomers();
    customers.value = response;
  } catch (error) {
    console.error('Failed to fetch customers:', error);
  }
};

const fetchItems = async () => {
  loadingItems.value = true;
  try {
    const response = await OrderService.getItems(0, 50, true);
    availableItems.value = response.content || [];
  } catch (error) {
    console.error('Failed to fetch items:', error);
  } finally {
    loadingItems.value = false;
  }
};

const getItemQuantity = (itemId) => {
  return orderItems.value[itemId] || 0;
};

const incrementItem = (item) => {
  if (!orderItems.value[item.id]) {
    orderItems.value[item.id] = 0;
  }
  orderItems.value[item.id]++;
};

const decrementItem = (item) => {
  if (orderItems.value[item.id] > 0) {
    orderItems.value[item.id]--;
  }
};

const selectedItems = computed(() => {
  return availableItems.value
    .filter(item => getItemQuantity(item.id) > 0)
    .map(item => ({
      ...item,
      quantity: getItemQuantity(item.id)
    }));
});

const isFormValid = computed(() => {
  return selectedCustomerId.value && selectedItems.value.length > 0;
});

const calculateTotal = () => {
  return calculateOrderTotal(selectedItems.value);
};

const formatCurrency = (value) => {
  return value.toFixed(2);
};

const resetForm = () => {
  selectedCustomerId.value = '';
  orderItems.value = {};
};

const submitOrder = async () => {
  if (!isFormValid.value) return;
  
  loading.value = true;
  
  try {
    // Find the selected customer
    const customer = customers.value.find(c => c.id === parseInt(selectedCustomerId.value));
    
    if (!customer) {
      console.error('Customer not found');
      return;
    }
    
    // Create order data object
    const orderData = {
      customer: customer,
      items: selectedItems.value,
      truck: null // No truck assigned initially
    };
    
    // Submit order using OrderService
    const createdOrder = await OrderService.createOrder(orderData);
    console.log('Order created:', createdOrder);
    
    // Emit event for other components
    eventBus.emit('order-submitted', createdOrder);
    
    // Show success message and navigate back
    alert('Order created successfully');
    router.push('/orders');
  } catch (error) {
    console.error('Failed to create order:', error);
    alert('Failed to create order: ' + (error.message || 'Unknown error'));
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCustomers();
  fetchItems();
});
</script>

<style scoped>
.new-order {
  @apply w-full;
}

.order-form {
  @apply w-full divide-y divide-slate-200;
}

.form-section {
  @apply py-6;
}

.section-title {
  @apply text-lg font-medium mb-4;
}

.form-group {
  @apply mb-4;
}

.form-input {
  @apply w-full px-3 py-2 border border-slate-300 rounded mt-1;
}

.items-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4;
}

.item-card {
  @apply border p-3 rounded flex justify-between items-center;
}

.item-details {
  @apply flex-grow;
}

.item-price {
  @apply text-slate-600 mt-1;
}

.item-actions {
  @apply flex items-center space-x-2;
}

.item-quantity {
  @apply w-8 text-center;
}

.btn-icon {
  @apply p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600;
}

.btn-small {
  @apply p-1 text-xs;
}

.selected-items {
  @apply mt-8 p-4 border rounded;
}

.selected-items-list {
  @apply divide-y;
}

.selected-item {
  @apply py-2 flex justify-between;
}

.order-total {
  @apply mt-4 pt-4 border-t flex justify-between font-bold;
}

.form-actions {
  @apply mt-8 flex justify-end space-x-4;
}

.empty-items-message {
  @apply text-center p-4 text-slate-500;
}
</style>
