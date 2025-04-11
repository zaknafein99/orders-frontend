&lt;template&gt;
  &lt;div class="profile"&gt;
    &lt;h1 class="text-2xl font-semibold mb-6"&gt;{{ $t('profile') }}&lt;/h1&gt;
    
    &lt;div class="card max-w-2xl"&gt;
      &lt;form @submit.prevent="updateProfile" class="space-y-6"&gt;
        &lt;div class="space-y-4"&gt;
          &lt;div class="form-group"&gt;
            &lt;label for="name" class="form-label"&gt;{{ $t('name') }}&lt;/label&gt;
            &lt;input type="text" id="name" class="form-input" /&gt;
          &lt;/div&gt;

          &lt;div class="form-group"&gt;
            &lt;label for="email" class="form-label"&gt;{{ $t('email') }}&lt;/label&gt;
            &lt;input type="email" id="email" class="form-input" readonly /&gt;
          &lt;/div&gt;

          &lt;div class="form-group"&gt;
            &lt;label for="currentPassword" class="form-label"&gt;{{ $t('currentPassword') }}&lt;/label&gt;
            &lt;input type="password" id="currentPassword" class="form-input" /&gt;
          &lt;/div&gt;

          &lt;div class="form-group"&gt;
            &lt;label for="newPassword" class="form-label"&gt;{{ $t('newPassword') }}&lt;/label&gt;
            &lt;input type="password" id="newPassword" class="form-input" /&gt;
          &lt;/div&gt;

          &lt;div class="form-group"&gt;
            &lt;label for="confirmPassword" class="form-label"&gt;{{ $t('confirmPassword') }}&lt;/label&gt;
            &lt;input type="password" id="confirmPassword" class="form-input" /&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        &lt;div class="flex justify-end space-x-4"&gt;
          &lt;button type="button" class="btn btn-outline" @click="resetForm"&gt;
            {{ $t('reset') }}
          &lt;/button&gt;
          &lt;button type="submit" class="btn btn-primary"&gt;
            {{ $t('saveChanges') }}
          &lt;/button&gt;
        &lt;/div&gt;
      &lt;/form&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
const updateProfile = () => {
  // Handle profile update
}

const resetForm = () => {
  // Reset form to initial values
}
&lt;/script&gt;

&lt;style scoped&gt;
.profile {
  @apply w-full;
}

.form-group {
  @apply space-y-1;
}

.form-label {
  @apply block text-sm font-medium text-slate-700;
}
&lt;/style&gt;
