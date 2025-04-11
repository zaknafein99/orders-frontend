<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full text-center">
      <div class="text-primary-600 text-9xl font-extrabold">
        404
      </div>
      <h2 class="mt-2 text-3xl font-extrabold text-slate-800">
        {{ $t('pageNotFound') }}
      </h2>
      <p class="mt-4 text-slate-600">
        {{ $t('pageDoesNotExist') }}
      </p>
      <div class="mt-8">
        <router-link 
          to="/" 
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <i class="fas fa-home mr-2"></i>
          {{ $t('backToHome') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// No additional logic needed
</script>
