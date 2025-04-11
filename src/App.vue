<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthService from './services/AuthService'

// Log that App.vue is being rendered
console.log('App.vue is being rendered')

onMounted(() => {
  // Initialize authentication state when the app starts
  console.log('App.vue onMounted hook triggered')
  try {
    AuthService.initAuth()
    console.log('AuthService.initAuth() completed successfully')
  } catch (error) {
    console.error('Error in AuthService.initAuth():', error)
  }
})

const route = useRoute()

// Determine if we should show the layout (header/footer) based on the route
const showLayout = computed(() => {
  return route.name !== 'login'
})
</script>

<template>
  <!-- Login page doesn't use the layout -->
  <router-view v-if="!showLayout" />
  
  <!-- Main layout for authenticated pages -->
  <div v-else class="app-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <router-link to="/" class="logo-container">
          <img src="@/assets/images/acodike-logo.svg" alt="Acodike Supergas" class="logo" />
        </router-link>
        
        <nav class="nav-links">
          <router-link to="/dashboard" class="nav-link">
            <i class="fas fa-chart-line"></i>
            Panel de Control
          </router-link>
          <router-link to="/customers" class="nav-link">
            <i class="fas fa-users"></i>
            Clientes
          </router-link>
          <router-link to="/orders" class="nav-link">
            <i class="fas fa-shopping-cart"></i>
            Pedidos
          </router-link>
          <router-link to="/items" class="nav-link">
            <i class="fas fa-box"></i>
            Inventario
          </router-link>
        </nav>

        <div class="header-actions">
          <button class="create-order-btn" @click="$router.push('/orders/new')">
            <i class="fas fa-plus"></i>
            Crear Pedido
          </button>
          <button class="user-btn">
            <i class="fas fa-user"></i>
          </button>
        </div>
      </div>
    </header>

    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <!-- Removed CustomerSearch component -->
      </aside>

      <!-- Main content -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style>
/* All styles are now managed through Tailwind CSS */
.router-link-active {
  border-color: #e62222;
  color: #e62222;
}

.router-link-exact-active {
  border-color: #e62222;
  color: #e62222;
  font-weight: 500;
}

.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.25rem;
}

.form-input {
  margin-top: 0.25rem;
  display: block;
  width: 100%;
  border-radius: 0.375rem;
  border-color: #cbd5e1;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.form-input:focus {
  border-color: #e62222;
  box-shadow: 0 0 0 2px rgba(230, 34, 34, 0.2);
}

.form-error {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #dc2626;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  font-size: 0.875rem;
  font-weight: 500;
}

.btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5), 0 0 0 4px rgba(230, 34, 34, 0.5);
}

.btn-primary {
  color: white;
  background-color: #e62222;
}

.btn-primary:hover {
  background-color: #c91c1c;
}

.btn-primary:focus {
  box-shadow: 0 0 0 2px rgba(230, 34, 34, 0.5);
}

.btn-secondary {
  color: white;
  background-color: #475569;
}

.btn-secondary:hover {
  background-color: #334155;
}

.btn-secondary:focus {
  box-shadow: 0 0 0 2px rgba(71, 85, 105, 0.5);
}

.btn-danger {
  color: white;
  background-color: #dc2626;
}

.btn-danger:hover {
  background-color: #b91c1c;
}

.btn-danger:focus {
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.5);
}

.btn-success {
  color: white;
  background-color: #16a34a;
}

.btn-success:hover {
  background-color: #15803d;
}

.btn-success:focus {
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.5);
}

.btn-outline {
  color: #e62222;
  background-color: white;
  border-color: #f87171;
}

.btn-outline:hover {
  background-color: #fee2e2;
}

.btn-outline:focus {
  box-shadow: 0 0 0 2px rgba(230, 34, 34, 0.5);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.alert {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.375rem;
  border-left-width: 4px;
}

.alert-success {
  background-color: #dcfce7;
  border-color: #16a34a;
  color: #166534;
}

.alert-danger {
  background-color: #fee2e2;
  border-color: #dc2626;
  color: #991b1b;
}

.alert-info {
  background-color: #fee2e2;
  border-color: #e62222;
  color: #b91c1c;
}

.alert-warning {
  background-color: #fef9c3;
  border-color: #ca8a04;
  color: #854d0e;
}

.header {
  background-color: var(--primary-color);
  padding: 0.5rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
}

.logo-container {
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 0.25rem 0;
}

.logo {
  height: 44px;
  width: auto;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.15);
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.create-order-btn {
  background-color: var(--secondary-color);
  color: var(--primary-color);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.create-order-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-btn {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.user-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.main-content {
  width: 95%;
  max-width: none;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  
  .header-content {
    justify-content: space-between;
  }
}
</style>
