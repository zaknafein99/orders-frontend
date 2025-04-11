<template>
  <div class="items-view">
    <h1>Gestión de Inventario</h1>
    <ItemsManagement />
  </div>
</template>

<script setup>
import ItemsManagement from '../components/ItemsManagement.vue'
</script>

<style>
.items-view {
  padding: 1rem;
}

.items-view h1 {
  margin-bottom: 1.5rem;
  color: var(--dark-color);
  font-size: 1.75rem;
  text-align: center;
}
</style> 