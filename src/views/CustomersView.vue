<template>
  <div class="customers">
    <div class="page-header">
      <h1>Gestión de Clientes</h1>
      <button @click="openNewCustomerModal" class="btn-primary">
        <i class="fas fa-user-plus"></i> Nuevo Cliente
      </button>
    </div>

    <div class="customers-content">
      <!-- Search and Filter Section -->
      <div class="search-section card">
        <div class="form-group">
          <label for="searchPhone">Buscar por Teléfono</label>
          <div class="input-with-icon">
            <i class="fas fa-phone"></i>
            <input
              id="searchPhone"
              v-model="searchPhone"
              type="text"
              placeholder="Ingrese número de teléfono"
              @input="handleSearch"
            />
          </div>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="table-container card">
        <!-- Page Size Selector -->
        <div class="table-controls">
          <div class="page-size-selector">
            <label for="pageSize">Mostrar:</label>
            <select 
              id="pageSize" 
              v-model="pageSize" 
              @change="handlePageSizeChange"
              class="form-select"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="100">100</option>
            </select>
            <span class="entries-text">registros</span>
          </div>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando clientes...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i> {{ error }}
        </div>

        <div v-else-if="customers.length === 0" class="empty-state">
          <i class="fas fa-users"></i>
          <p>No se encontraron clientes</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in customers" :key="customer.id">
              <td>{{ customer.name }}</td>
              <td>{{ customer.phoneNumber }}</td>
              <td>{{ customer.address }}</td>
              <td>
                <span class="badge" :class="customer.type === 'C' ? 'badge-customer' : 'badge-supplier'">
                  {{ customer.type === 'C' ? 'Cliente' : 'Proveedor' }}
                </span>
              </td>
              <td>
                <span class="badge" :class="customer.state === 'A' ? 'badge-active' : 'badge-inactive'">
                  {{ customer.state === 'A' ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="actions">
                <button @click="editCustomer(customer)" class="btn-icon" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(customer)" class="btn-icon" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            :disabled="currentPage === 0"
            @click="changePage(currentPage - 1)"
            class="btn-secondary"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">
            Página {{ currentPage + 1 }} de {{ totalPages }}
          </span>
          <button 
            :disabled="currentPage === totalPages - 1"
            @click="changePage(currentPage + 1)"
            class="btn-secondary"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- New/Edit Customer Modal -->
    <NewCustomerModal
      :is-open="showCustomerModal"
      :customer="selectedCustomer"
      :phone-number="searchPhone"
      @close="closeCustomerModal"
      @customer-created="handleCustomerCreated"
      @customer-updated="handleCustomerUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button class="close-btn" @click="closeDeleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>¿Está seguro que desea eliminar este cliente?</p>
          <p class="customer-name">{{ selectedCustomer?.name }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal">Cancelar</button>
          <button class="btn-danger" @click="deleteCustomer" :disabled="isDeleting">
            <i v-if="isDeleting" class="fas fa-spinner fa-spin"></i>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCustomerStore } from '@/stores/customer'
import NewCustomerModal from '@/components/NewCustomerModal.vue'
import { eventBus } from '@/utils/eventBus'

const customerStore = useCustomerStore()

// State
const customers = ref([])
const isLoading = ref(false)
const error = ref('')
const searchPhone = ref('')
const showCustomerModal = ref(false)
const showDeleteModal = ref(false)
const selectedCustomer = ref(null)
const isDeleting = ref(false)
const currentPage = ref(0)
const totalPages = ref(1)
const pageSize = ref(10)

// Methods
const loadCustomers = async () => {
  try {
    isLoading.value = true
    error.value = ''
    const response = await customerStore.fetchCustomers(currentPage.value, pageSize.value)
    customers.value = response.content
    totalPages.value = response.totalPages
  } catch (err) {
    console.error('Error loading customers:', err)
    error.value = 'Failed to load customers. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleSearch = async () => {
  if (searchPhone.value.length >= 3) {
    try {
      isLoading.value = true
      error.value = ''
      const customer = await customerStore.searchCustomer(searchPhone.value)
      if (customer) {
        customers.value = [customer]
        totalPages.value = 1
        currentPage.value = 0
      } else {
        customers.value = []
        totalPages.value = 0
      }
    } catch (err) {
      console.error('Error searching customer:', err)
      // Don't show error for 404 (no customer found)
      if (err.response?.status !== 404) {
        error.value = 'Failed to search customer. Please try again.'
      } else {
        customers.value = []
        totalPages.value = 0
      }
    } finally {
      isLoading.value = false
    }
  } else if (searchPhone.value.length === 0) {
    // Reset to normal pagination view when search is cleared
    currentPage.value = 0
    loadCustomers()
  }
}

const openNewCustomerModal = () => {
  selectedCustomer.value = null
  showCustomerModal.value = true
}

const editCustomer = (customer) => {
  selectedCustomer.value = customer
  showCustomerModal.value = true
}

const closeCustomerModal = () => {
  showCustomerModal.value = false
  selectedCustomer.value = null
}

const confirmDelete = (customer) => {
  selectedCustomer.value = customer
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedCustomer.value = null
}

const deleteCustomer = async () => {
  if (!selectedCustomer.value) return

  try {
    isDeleting.value = true
    await customerStore.deleteCustomer(selectedCustomer.value.id)
    await loadCustomers()
    closeDeleteModal()
    eventBus.emit('customer-deleted', selectedCustomer.value)
  } catch (err) {
    console.error('Error deleting customer:', err)
    error.value = 'Failed to delete customer. Please try again.'
  } finally {
    isDeleting.value = false
  }
}

const handleCustomerCreated = async (customer) => {
  await loadCustomers()
  closeCustomerModal()
  eventBus.emit('customer-created', customer)
}

const handleCustomerUpdated = async (customer) => {
  await loadCustomers()
  closeCustomerModal()
  eventBus.emit('customer-updated', customer)
}

const changePage = async (page) => {
  currentPage.value = page
  await loadCustomers()
}

const handlePageSizeChange = () => {
  currentPage.value = 0 // Reset to first page when changing page size
  loadCustomers()
}

// Lifecycle hooks
onMounted(() => {
  loadCustomers()
})
</script>

<style scoped>
.customers {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--dark-color);
}

/* New styles for the New Customer button */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: #e62222;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(230, 34, 34, 0.1);
}

.btn-primary:hover {
  background-color: #d41d1d;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(230, 34, 34, 0.2);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(230, 34, 34, 0.2);
}

.btn-primary i {
  font-size: 1rem;
}

.search-section {
  margin-bottom: 2rem;
}

.table-container {
  margin-top: 2rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: var(--dark-color);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: #f3f4f6;
  color: var(--primary-color);
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-customer {
  background-color: #e0f2fe;
  color: #0369a1;
}

.badge-supplier {
  background-color: #fef3c7;
  color: #92400e;
}

.badge-active {
  background-color: #dcfce7;
  color: #166534;
}

.badge-inactive {
  background-color: #fee2e2;
  color: #991b1b;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #f3f4f6;
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--dark-color);
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0;
  color: #4b5563;
}

.customer-name {
  font-weight: 600;
  color: var(--dark-color);
  margin-top: 0.5rem !important;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.btn-danger:disabled {
  background-color: #fca5a5;
  cursor: not-allowed;
}

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-size-selector label {
  color: #6b7280;
  font-size: 0.875rem;
}

.form-select {
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(230, 34, 34, 0.1);
}

.entries-text {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
