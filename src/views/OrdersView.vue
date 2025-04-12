<template>
  <div class="orders">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">{{ $t('orders') }}</h1>
      <button class="btn btn-primary" @click="navigateToNewOrder">
        <i class="fas fa-plus mr-2"></i>
        {{ $t('createOrder') }}
      </button>
    </div>

    <div class="card">
      <div class="orders-content">
        <div v-if="loading" class="text-center py-8">
          <i class="fas fa-spinner fa-spin fa-2x text-primary-500"></i>
          <p class="mt-2 text-slate-500">{{ $t('loading') }}</p>
        </div>
        <div v-else class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>{{ $t('orderNumber') }}</th>
                <th>{{ $t('customer') }}</th>
                <th>{{ $t('status') }}</th>
                <th>{{ $t('total') }}</th>
                <th>{{ $t('createdAt') }}</th>
                <th>{{ $t('actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="orders.length === 0" class="text-center">
                <td colspan="6" class="py-8">
                  <i class="fas fa-box-open text-4xl text-slate-400 mb-2"></i>
                  <p class="text-slate-500">{{ $t('noOrders') }}</p>
                </td>
              </tr>
              <tr v-for="order in orders" :key="order.id">
                <td>#{{ order.id }}</td>
                <td>{{ order.customer.name }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(order.status)">
                    {{ order.status }}
                  </span>
                </td>
                <td>${{ formatCurrency(order.totalPrice) }}</td>
                <td>{{ formatDate(order.date) }}</td>
                <td>
                  <div class="flex space-x-2 justify-end">
                    <button class="btn-icon btn-primary" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-secondary" title="Edit Order">
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import OrderService from '../services/OrderService';

const router = useRouter();
const orders = ref([]);
const loading = ref(true);

const fetchOrders = async () => {
  loading.value = true;
  try {
    // Get both pending and delivered orders
    const [pendingOrders, deliveredOrders] = await Promise.all([
      OrderService.getPendingOrders(true),
      OrderService.getDeliveredOrders(true)
    ]);
    
    // Combine and sort by creation date, newest first
    orders.value = [...pendingOrders, ...deliveredOrders]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
      
    console.log('Orders loaded:', orders.value.length);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
  } finally {
    loading.value = false;
  }
};

const navigateToNewOrder = () => {
  router.push('/new-order');
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatCurrency = (value) => {
  return value?.toFixed(2) || '0.00';
};

const getStatusClass = (status) => {
  switch (status) {
    case 'PENDING': return 'status-pending';
    case 'DELIVERED': return 'status-delivered';
    case 'CANCELED': return 'status-canceled';
    default: return '';
  }
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.orders {
  @apply w-full;
}

.table {
  @apply w-full border-collapse;
}

.table th {
  @apply text-left py-3 px-4 bg-slate-100 font-medium text-slate-600;
}

.table td {
  @apply py-3 px-4 border-b border-slate-200;
}

.status-badge {
  @apply px-2 py-1 rounded-full text-xs font-semibold;
}

.status-pending {
  @apply bg-yellow-100 text-yellow-800;
}

.status-delivered {
  @apply bg-green-100 text-green-800;
}

.status-canceled {
  @apply bg-red-100 text-red-800;
}

.btn-icon {
  @apply p-2 rounded-full;
}

.btn-primary {
  @apply bg-primary-500 text-white hover:bg-primary-600;
}

.btn-secondary {
  @apply bg-slate-200 text-slate-700 hover:bg-slate-300;
}
</style>
