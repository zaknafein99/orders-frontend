<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditing ? 'Editar Item' : 'Nuevo Item' }}</h2>
        <button class="close-btn" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-form">
        <div v-if="error" class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i> {{ error }}
        </div>

        <div class="form-group">
          <label for="name">Nombre</label>
          <input 
            type="text" 
            id="name" 
            v-model="form.name" 
            required
            placeholder="Nombre del producto"
          >
        </div>
        
        <div class="form-group">
          <label for="price">Precio</label>
          <input 
            type="number" 
            id="price" 
            v-model="form.price" 
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          >
        </div>
        
        <div class="form-group">
          <label for="category">Categoría</label>
          <input 
            type="text" 
            id="category" 
            v-model="form.category" 
            placeholder="Categoría del producto"
          >
        </div>
        
        <div class="form-group">
          <label for="description">Descripción</label>
          <textarea 
            id="description" 
            v-model="form.description" 
            placeholder="Descripción del producto"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="quantity">Cantidad</label>
          <input 
            type="number" 
            id="quantity" 
            v-model="form.quantity" 
            min="0"
            placeholder="Cantidad disponible"
          >
        </div>
        
        <div class="modal-footer">
          <button type="button" class="cancel-btn" @click="closeModal">
            Cancelar
          </button>
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            <i class="fas fa-spinner fa-spin" v-if="isSubmitting"></i>
            {{ isEditing ? 'Actualizar Item' : 'Crear Item' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ItemService from '../services/ItemService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  editItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'item-created', 'item-updated'])

const isSubmitting = ref(false)
const error = ref('')

const form = ref({
  name: '',
  price: 0,
  category: '',
  description: '',
  quantity: 0
})

const isEditing = computed(() => props.editItem !== null)

// Define resetForm before it's used in the watch function
const resetForm = () => {
  form.value = {
    name: '',
    price: 0,
    category: '',
    description: '',
    quantity: 0
  }
}

// Watch for editItem changes to populate the form
watch(() => props.editItem, (newItem) => {
  if (newItem) {
    form.value = { ...newItem }
  } else {
    resetForm()
  }
}, { immediate: true })

const closeModal = () => {
  emit('close')
  error.value = ''
  resetForm()
}

const validateForm = () => {
  if (!form.value.name || form.value.name.trim() === '') {
    error.value = 'El nombre del producto es obligatorio'
    return false
  }
  
  if (form.value.price <= 0) {
    error.value = 'El precio debe ser mayor que cero'
    return false
  }
  
  return true
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    error.value = ''
    
    if (!validateForm()) {
      isSubmitting.value = false
      return
    }
    
    let result;
    
    if (isEditing.value) {
      // Update existing item
      result = await ItemService.updateItem(props.editItem.id, form.value)
      console.log('Item updated:', result)
      emit('item-updated', result)
    } else {
      // Create new item
      result = await ItemService.createItem(form.value)
      console.log('Item created:', result)
      emit('item-created', result)
    }
    
    closeModal()
  } catch (err) {
    console.error('Error saving item:', err)
    
    // Try to extract error message from response if available
    if (err.response && err.response.data) {
      if (err.response.data.message) {
        error.value = err.response.data.message
      } else if (typeof err.response.data === 'string') {
        error.value = err.response.data
      }
    } else {
      error.value = isEditing.value 
        ? 'Error al actualizar el item. Por favor, intente nuevamente.'
        : 'Error al crear el item. Por favor, intente nuevamente.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style>
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
  max-height: 90vh;
  overflow-y: auto;
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

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: var(--primary-color);
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--dark-color);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(230, 34, 34, 0.1);
}

.alert {
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-danger {
  background-color: var(--error-bg);
  color: var(--error-text);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
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

.submit-btn {
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

.submit-btn:hover:not(:disabled) {
  background-color: #c81e1e;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style> 