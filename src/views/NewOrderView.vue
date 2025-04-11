&lt;template&gt;
  &lt;div class="new-order"&gt;
    &lt;div class="flex items-center mb-6"&gt;
      &lt;button class="btn btn-outline mr-4" @click="$router.back()"&gt;
        &lt;i class="fas fa-arrow-left mr-2"&gt;&lt;/i&gt;
        {{ $t('back') }}
      &lt;/button&gt;
      &lt;h1 class="text-2xl font-semibold"&gt;{{ $t('newOrder') }}&lt;/h1&gt;
    &lt;/div&gt;

    &lt;div class="card"&gt;
      &lt;form @submit.prevent="submitOrder" class="space-y-6"&gt;
        &lt;!-- Customer Selection --&gt;
        &lt;div class="form-group"&gt;
          &lt;label for="customer" class="form-label"&gt;{{ $t('customer') }}&lt;/label&gt;
          &lt;select id="customer" class="form-select"&gt;
            &lt;option value="" disabled selected&gt;{{ $t('selectCustomer') }}&lt;/option&gt;
          &lt;/select&gt;
        &lt;/div&gt;

        &lt;!-- Items --&gt;
        &lt;div class="space-y-4"&gt;
          &lt;div class="flex justify-between items-center"&gt;
            &lt;h2 class="text-lg font-medium"&gt;{{ $t('items') }}&lt;/h2&gt;
            &lt;button type="button" class="btn btn-outline btn-sm"&gt;
              &lt;i class="fas fa-plus mr-1"&gt;&lt;/i&gt;
              {{ $t('addItem') }}
            &lt;/button&gt;
          &lt;/div&gt;

          &lt;div class="table-container"&gt;
            &lt;table class="table"&gt;
              &lt;thead&gt;
                &lt;tr&gt;
                  &lt;th&gt;{{ $t('item') }}&lt;/th&gt;
                  &lt;th&gt;{{ $t('quantity') }}&lt;/th&gt;
                  &lt;th&gt;{{ $t('price') }}&lt;/th&gt;
                  &lt;th&gt;{{ $t('subtotal') }}&lt;/th&gt;
                  &lt;th&gt;&lt;/th&gt;
                &lt;/tr&gt;
              &lt;/thead&gt;
              &lt;tbody&gt;
                &lt;tr v-if="true" class="text-center"&gt;
                  &lt;td colspan="5" class="py-8"&gt;
                    &lt;i class="fas fa-cart-plus text-4xl text-slate-400 mb-2"&gt;&lt;/i&gt;
                    &lt;p class="text-slate-500"&gt;{{ $t('noItems') }}&lt;/p&gt;
                  &lt;/td&gt;
                &lt;/tr&gt;
              &lt;/tbody&gt;
            &lt;/table&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        &lt;!-- Order Summary --&gt;
        &lt;div class="bg-slate-50 p-4 rounded-lg"&gt;
          &lt;h3 class="font-medium mb-3"&gt;{{ $t('orderSummary') }}&lt;/h3&gt;
          &lt;div class="space-y-2"&gt;
            &lt;div class="flex justify-between"&gt;
              &lt;span class="text-slate-600"&gt;{{ $t('subtotal') }}&lt;/span&gt;
              &lt;span class="font-medium"&gt;$0.00&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class="flex justify-between"&gt;
              &lt;span class="text-slate-600"&gt;{{ $t('tax') }} (10%)&lt;/span&gt;
              &lt;span class="font-medium"&gt;$0.00&lt;/span&gt;
            &lt;/div&gt;
            &lt;div class="flex justify-between text-lg font-semibold pt-2 border-t"&gt;
              &lt;span&gt;{{ $t('total') }}&lt;/span&gt;
              &lt;span&gt;$0.00&lt;/span&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        &lt;!-- Actions --&gt;
        &lt;div class="flex justify-end space-x-4"&gt;
          &lt;button type="button" class="btn btn-outline" @click="$router.back()"&gt;
            {{ $t('cancel') }}
          &lt;/button&gt;
          &lt;button type="submit" class="btn btn-primary"&gt;
            {{ $t('createOrder') }}
          &lt;/button&gt;
        &lt;/div&gt;
      &lt;/form&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
// New order component logic will be added here
const submitOrder = () => {
  // Handle order submission
}
&lt;/script&gt;

&lt;style scoped&gt;
.new-order {
  @apply w-full;
}

.form-group {
  @apply space-y-1;
}

.form-label {
  @apply block text-sm font-medium text-slate-700;
}
&lt;/style&gt;
