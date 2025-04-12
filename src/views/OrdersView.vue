<template>
  <div class="orders">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">{{ $t('orders') }}</h1>
      <button class="btn btn-primary">
        <i class="fas fa-plus mr-2"></i>
        {{ $t('createOrder') }}
      </button>
    </div>

    <div class="card">
      <div class="orders-content">
        <div class="table-container">
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
              <tr v-if="true" class="text-center">
                <td colspan="6" class="py-8">
                  <i class="fas fa-box-open text-4xl text-slate-400 mb-2"></i>
                  <p class="text-slate-500">{{ $t('noOrders') }}</p>
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
// Orders component logic will be added here
</script>

<style scoped>
.orders {
  @apply w-full;
}
</style>
