<template>
  <div class="items-management">
    <div class="items-header">
      <h2>Gestión de Productos</h2>
      <button class="add-item-btn" @click="showNewItemModal = true">
        <i class="fas fa-plus"></i> Nuevo Producto
      </button>
    </div>
    
    <!-- Success message -->
    <div v-if="successMessage" class="alert alert-success">
      <i class="fas fa-check-circle"></i> {{ successMessage }}
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="alert alert-danger">
      <i class="fas fa-exclamation-circle"></i> 
      <div class="alert-content">
        <span>{{ error }}</span>
        <button @click="loadItems" class="retry-btn">
          <i class="fas fa-sync-alt"></i> Reintentar
        </button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="items-loading">
      <div class="spinner"></div>
      <p>Cargando productos...</p>
    </div>
    
    <!-- Empty state -->
    <div v-if="!isLoading && !error && items.length === 0" class="no-items">
      <div class="empty-state">
        <i class="fas fa-box-open empty-icon"></i>
        <p>No hay productos disponibles</p>
        <button @click="showNewItemModal = true" class="add-item-btn">
          <i class="fas fa-plus"></i> Agregar Producto
        </button>
      </div>
    </div>
    
    <!-- Items table -->
    <div v-if="!isLoading && !error && items.length > 0" class="items-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.category || '-' }}</td>
            <td>{{ formatPrice(item.price) }}</td>
            <td>{{ item.quantity || item.stock || 0 }}</td>
            <td class="actions-cell">
              <button @click="editItem(item)" class="action-btn edit-btn">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="confirmDelete(item)" class="action-btn delete-btn">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination controls -->
      <div class="pagination-controls">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 0 || isLoading"
          class="pagination-btn"
        >
          &laquo; Anterior
        </button>
        <span class="page-info">Página {{ currentPage + 1 }} de {{ totalPages }}</span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage >= totalPages - 1 || isLoading"
          class="pagination-btn"
        >
          Siguiente &raquo;
        </button>
      </div>
    </div>
    
    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="delete-modal-overlay" @click="showDeleteModal = false">
      <div class="delete-modal-content" @click.stop>
        <h3>Confirmar Eliminación</h3>
        <p>¿Está seguro que desea eliminar el producto <strong>{{ itemToDelete?.name }}</strong>?</p>
        <div class="delete-modal-actions">
          <button @click="showDeleteModal = false" class="cancel-btn">Cancelar</button>
          <button @click="deleteItem" class="delete-confirm-btn" :disabled="isDeleting">
            <i v-if="isDeleting" class="fas fa-spinner fa-spin"></i>
            Eliminar
          </button>
        </div>
      </div>
    </div>
    
    <!-- New/Edit Item Modal -->
    <NewItemModal 
      :is-open="showNewItemModal"
      :edit-item="itemToEdit"
      @close="closeItemModal"
      @item-created="handleItemCreated"
      @item-updated="handleItemUpdated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import NewItemModal from './NewItemModal.vue'
import ItemService from '../services/ItemService'
import { formatPrice } from '../utils/orderUtils'
import { eventBus } from '../utils/eventBus'

// Items state
const items = ref([])
const isLoading = ref(true)
const error = ref('')
const successMessage = ref('')
const currentPage = ref(0)
const pageSize = ref(10)
const totalPages = ref(1)
const totalItems = ref(0)

// Modal state
const showNewItemModal = ref(false)
const itemToEdit = ref(null)
const showDeleteModal = ref(false)
const itemToDelete = ref(null)
const isDeleting = ref(false)

// Load items from API
const loadItems = async () => {
  isLoading.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    const data = await ItemService.getAllItems(currentPage.value, pageSize.value)
    console.log('Items data:', data)
    
    if (data && data.content) {
      items.value = data.content
      totalPages.value = data.totalPages || 1
      totalItems.value = data.totalElements || data.content.length
    } else if (Array.isArray(data)) {
      items.value = data
      totalPages.value = Math.ceil(data.length / pageSize.value)
      totalItems.value = data.length
    } else {
      error.value = 'Formato de datos de productos inválido'
    }
  } catch (err) {
    console.error('Error loading items:', err)
    if (err.response && err.response.data && err.response.data.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'Error al cargar productos: ' + (err.message || 'Error desconocido')
    }
  } finally {
    isLoading.value = false
  }
}

// Change page
const changePage = (newPage) => {
  if (newPage >= 0 && newPage < totalPages.value) {
    currentPage.value = newPage
    loadItems()
  }
}

// Edit item
const editItem = (item) => {
  const editableItem = { ...item }
  
  // Make sure we're using quantity in the form
  if (editableItem.quantity === undefined && editableItem.stock !== undefined) {
    editableItem.quantity = editableItem.stock
    delete editableItem.stock
  }
  
  itemToEdit.value = editableItem
  showNewItemModal.value = true
}

// Close item modal
const closeItemModal = () => {
  showNewItemModal.value = false
  itemToEdit.value = null
}

// Handle item created
const handleItemCreated = (item) => {
  console.log('Item created:', item)
  successMessage.value = `Producto "${item.name}" creado exitosamente`
  // Clear success message after 3 seconds
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
  loadItems() // Reload items
}

// Handle item updated
const handleItemUpdated = (item) => {
  console.log('Item updated:', item)
  successMessage.value = `Producto "${item.name}" actualizado exitosamente`
  // Clear success message after 3 seconds
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
  loadItems() // Reload items
}

// Confirm delete
const confirmDelete = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

// Delete item
const deleteItem = async () => {
  if (!itemToDelete.value) return
  
  isDeleting.value = true
  
  try {
    await ItemService.deleteItem(itemToDelete.value.id)
    // Show success message
    successMessage.value = `Producto "${itemToDelete.value.name}" eliminado exitosamente`
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    // Remove from local list to avoid reload
    items.value = items.value.filter(i => i.id !== itemToDelete.value.id)
    showDeleteModal.value = false
    itemToDelete.value = null
  } catch (err) {
    console.error('Error deleting item:', err)
    error.value = 'Error al eliminar producto: ' + (err.message || 'Error desconocido')
  } finally {
    isDeleting.value = false
  }
}

// Load items on component mount and set up event listeners
onMounted(() => {
  console.log('ItemsManagement component mounted')
  loadItems()
  
  // Listen for refresh-items events to update item data
  eventBus.on('refresh-items', handleRefreshItems)
})

// Clean up event listeners when component is unmounted
onBeforeUnmount(() => {
  console.log('ItemsManagement component will unmount, removing event listeners')
  eventBus.off('refresh-items', handleRefreshItems)
})

// Handle refresh-items event
const handleRefreshItems = () => {
  console.log('Received refresh-items event in ItemsManagement, updating item data')
  loadItems()
}
</script>

<style>
.items-management {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.items-header h2 {
  margin: 0;
  color: var(--dark-color);
  font-size: 1.5rem;
}

.add-item-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.add-item-btn:hover {
  background-color: #c81e1e;
  transform: translateY(-1px);
}

.items-loading,
.items-error,
.no-items {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: var(--box-shadow);
  min-height: 300px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.retry-btn {
  background-color: transparent;
  color: var(--error-text);
  border: 1px solid var(--error-text);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
}

.retry-btn:hover {
  background-color: var(--error-text);
  color: white;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.items-table {
  background-color: white;
  border-radius: 8px;
  box-shadow: var(--box-shadow);
  overflow: hidden;
}

.items-table table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.items-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: var(--dark-color);
}

.items-table tr:last-child td {
  border-bottom: none;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  color: #3b82f6;
}

.edit-btn:hover {
  background-color: #dbeafe;
}

.delete-btn {
  color: var(--primary-color);
}

.delete-btn:hover {
  background-color: #fee2e2;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: white;
  color: var(--dark-color);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--gray-color);
}

.delete-modal-overlay {
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

.delete-modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.delete-modal-content h3 {
  margin-top: 0;
  color: var(--dark-color);
}

.delete-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: white;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.delete-confirm-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.delete-confirm-btn:hover:not(:disabled) {
  background-color: #c81e1e;
}

.delete-confirm-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.alert {
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-success {
  background-color: var(--success-bg);
  color: var(--success-text);
  border-left: 4px solid var(--success-text);
}

.alert-danger {
  background-color: var(--error-bg);
  color: var(--error-text);
  border-left: 4px solid var(--error-text);
}

.alert-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 