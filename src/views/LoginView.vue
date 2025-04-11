<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-800">
          <i class="fas fa-boxes text-primary-600 mr-2"></i> 
          {{ $t('appTitle') }}
        </h2>
        <p class="mt-2 text-center text-sm text-slate-600">
          {{ $t('loginToContinue') }}
        </p>
      </div>
      
      <div class="card mt-8 p-6">
        <form class="space-y-6" @submit.prevent="login">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700">
              {{ $t('email') }}
            </label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-envelope text-slate-500"></i>
              </div>
              <input
                id="email"
                v-model="authData.email"
                type="email"
                required
                class="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md"
                :placeholder="$t('email')"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700">
              {{ $t('password') }}
            </label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-key text-slate-500"></i>
              </div>
              <input
                id="password"
                v-model="authData.password"
                type="password"
                required
                class="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md"
                :placeholder="$t('password')"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
              <i v-else class="fas fa-sign-in-alt mr-2"></i>
              {{ isLoading ? $t('loggingIn') : $t('login') }}
            </button>
          </div>
        </form>

        <div v-if="authError" class="mt-4 p-3 rounded-md bg-danger-50 border border-danger-200">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas fa-exclamation-circle text-danger-500"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-danger-700">{{ authError }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-slate-100 text-slate-500">
              {{ $t('ordersManagementSystem') }}
            </span>
          </div>
        </div>
        <p class="mt-6 text-center text-sm text-slate-500">
          &copy; {{ new Date().getFullYear() }} {{ $t('allRightsReserved') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AuthService from '../services/AuthService'

const router = useRouter()

// Authentication data
const authData = reactive({
  email: 'admin@gmail.com',
  password: 'password'
})

const isLoading = ref(false)
const authError = ref('')

const login = async () => {
  isLoading.value = true
  authError.value = ''
  
  try {
    console.log('Attempting login with:', authData)
    
    // Use AuthService for login
    await AuthService.login(authData.email, authData.password)
    
    console.log('Authentication successful')
    
    // Redirect to home page
    router.push('/')
  } catch (error) {
    console.error('Authentication error:', error)
    authError.value = error.response?.data?.message || error.message || 'Authentication failed'
  } finally {
    isLoading.value = false
  }
}
</script>
