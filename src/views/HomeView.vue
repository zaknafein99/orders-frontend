<template>
  <div class="home">
    <div class="layout">
      <div class="sidebar">
        <CustomerSearch />
      </div>
      <div class="main-content">
        <OrderTables />
      </div>
    </div>
  </div>
</template>

<script setup>
import CustomerSearch from '../components/CustomerSearch.vue'
import OrderTables from '../components/OrderTables.vue'
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 0.6rem;
  margin: 0 0.2rem;
}

.sidebar {
  height: 100%;
  background-color: var(--search-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: 1rem;
}

.main-content {
  height: 100%;
  background-color: var(--tables-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: 1rem;
}

/* Responsive layout */
@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 220px 1fr;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .sidebar {
    order: 1;
  }
  
  .main-content {
    order: 2;
  }
}
</style>
