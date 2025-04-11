<template>
  <div class="test-container">
    <h1>Test Component</h1>
    <p>If you can see this, Vue is rendering correctly.</p>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const count = ref(0);

function increment() {
  count.value++;
  console.log('Button clicked, count:', count.value);
}
</script>

<style scoped>
.test-container {
  padding: 20px;
  margin: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  text-align: center;
}

h1 {
  color: #3498db;
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #2980b9;
}
</style>
