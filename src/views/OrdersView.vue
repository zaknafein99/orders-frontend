&lt;template&gt;
  &lt;div class="orders"&gt;
    &lt;div class="flex justify-between items-center mb-6"&gt;
      &lt;h1 class="text-2xl font-semibold"&gt;{{ $t('orders') }}&lt;/h1&gt;
      &lt;button class="btn btn-primary"&gt;
        &lt;i class="fas fa-plus mr-2"&gt;&lt;/i&gt;
        {{ $t('createOrder') }}
      &lt;/button&gt;
    &lt;/div&gt;

    &lt;div class="card"&gt;
      &lt;div class="orders-content"&gt;
        &lt;div class="table-container"&gt;
          &lt;table class="table"&gt;
            &lt;thead&gt;
              &lt;tr&gt;
                &lt;th&gt;{{ $t('orderNumber') }}&lt;/th&gt;
                &lt;th&gt;{{ $t('customer') }}&lt;/th&gt;
                &lt;th&gt;{{ $t('status') }}&lt;/th&gt;
                &lt;th&gt;{{ $t('total') }}&lt;/th&gt;
                &lt;th&gt;{{ $t('createdAt') }}&lt;/th&gt;
                &lt;th&gt;{{ $t('actions') }}&lt;/th&gt;
              &lt;/tr&gt;
            &lt;/thead&gt;
            &lt;tbody&gt;
              &lt;tr v-if="true" class="text-center"&gt;
                &lt;td colspan="6" class="py-8"&gt;
                  &lt;i class="fas fa-box-open text-4xl text-slate-400 mb-2"&gt;&lt;/i&gt;
                  &lt;p class="text-slate-500"&gt;{{ $t('noOrders') }}&lt;/p&gt;
                &lt;/td&gt;
              &lt;/tr&gt;
            &lt;/tbody&gt;
          &lt;/table&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
// Orders component logic will be added here
&lt;/script&gt;

&lt;style scoped&gt;
.orders {
  @apply w-full;
}
&lt;/style&gt;
