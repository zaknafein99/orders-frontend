<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Nuevo Cliente</h2>
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
            placeholder="Nombre completo"
          >
        </div>
        
        <div class="form-group">
          <label for="phone">Teléfono</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="form.phone" 
            required
            placeholder="Número de teléfono"
          >
        </div>
        
        <div class="form-group">
          <label for="address">Dirección</label>
          <textarea 
            id="address" 
            v-model="form.address" 
            required
            placeholder="Dirección completa"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="notes">Notas</label>
          <textarea 
            id="notes" 
            v-model="form.notes" 
            placeholder="Notas adicionales"
            rows="2"
          ></textarea>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="cancel-btn" @click="closeModal">
            Cancelar
          </button>
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            <i class="fas fa-spinner fa-spin" v-if="isSubmitting"></i>
            Crear Cliente
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useCustomerStore } from '@/stores/customer'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  phoneNumber: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'customer-created'])

const customerStore = useCustomerStore()
const isSubmitting = ref(false)
const error = ref('')

const form = ref({
  name: '',
  phone: '',
  address: '',
  notes: '',
  type: 'C', // Default to Customer type
  state: 'A' // Default to Active state
})

// Watch for changes to the phoneNumber prop and update the form
watch(() => props.phoneNumber, (newPhoneNumber) => {
  if (newPhoneNumber) {
    form.value.phone = newPhoneNumber
  }
}, { immediate: true })

// Watch for modal open/close to reset form when opening
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.phoneNumber) {
    form.value.phone = props.phoneNumber
  }
})

const closeModal = () => {
  emit('close')
  form.value = {
    name: '',
    phone: '',
    address: '',
    notes: '',
    type: 'C',
    state: 'A'
  }
  error.value = ''
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    error.value = ''
    
    // Validate phone number
    if (!form.value.phone || form.value.phone.length < 3) {
      error.value = 'El número de teléfono debe tener al menos 3 dígitos'
      return
    }
    
    const newCustomer = await customerStore.createCustomer(form.value)
    emit('customer-created', newCustomer)
    closeModal()
  } catch (error) {
    console.error('Error creating customer:', error)
    if (error.response?.status === 409) {
      error.value = 'Ya existe un cliente con ese número de teléfono'
    } else {
      error.value = 'Error al crear el cliente. Por favor, intente nuevamente.'
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
  background-color: #d41d1d;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background-color: #fca5a5;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .cancel-btn,
  .submit-btn {
    width: 100%;
  }
}

.alert {
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.alert-danger {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert i {
  font-size: 1rem;
}
</style> 