<template>
  <div class="dashboard p-6">
    <!-- Loading Indicator -->
    <div v-if="loading" class="fixed inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg flex items-center">
        <div class="spinner mr-3"></div>
        <p>{{ $t('loading') }}</p>
      </div>
    </div>

    <!-- Dashboard content - always rendered -->
    <div>
      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-slate-700 mb-2">{{ $t('todaySales') }}</h3>
          <div class="flex justify-between items-center">
            <div>
              <p class="text-2xl font-bold text-primary-600">${{ formatNumber(statistics.today?.totalSales || 0) }}</p>
              <p class="text-sm text-slate-500">{{ statistics.today?.orderCount || 0 }} {{ $t('orders') }}</p>
            </div>
            <i class="fas fa-chart-line text-2xl text-primary-500"></i>
          </div>
        </div>

        <div class="card bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-slate-700 mb-2">{{ $t('monthlySales') }}</h3>
          <div class="flex justify-between items-center">
            <div>
              <p class="text-2xl font-bold text-primary-600">${{ formatNumber(statistics.month?.totalSales || 0) }}</p>
              <p class="text-sm text-slate-500">{{ statistics.month?.orderCount || 0 }} {{ $t('orders') }}</p>
            </div>
            <i class="fas fa-calendar-alt text-2xl text-primary-500"></i>
          </div>
        </div>

        <div class="card bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-slate-700 mb-2">{{ $t('pendingOrders') }}</h3>
          <div class="flex justify-between items-center">
            <div>
              <p class="text-2xl font-bold text-warning-600">{{ statistics.pendingOrders || 0 }}</p>
              <p class="text-sm text-slate-500">{{ $t('awaitingDelivery') }}</p>
            </div>
            <i class="fas fa-clock text-2xl text-warning-500"></i>
          </div>
        </div>

        <div class="card bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold text-slate-700 mb-2">{{ $t('averageOrderValue') }}</h3>
          <div class="flex justify-between items-center">
            <div>
              <p class="text-2xl font-bold text-success-600">${{ formatNumber(statistics.averageOrderValue || 0) }}</p>
              <p class="text-sm text-slate-500">{{ $t('perOrder') }}</p>
            </div>
            <i class="fas fa-dollar-sign text-2xl text-success-500"></i>
          </div>
        </div>
      </div>

      <!-- Truck Sales Reports -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Daily Sales -->
        <div class="card bg-white p-4 rounded-lg shadow">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-slate-700">{{ $t('dailyTruckSales', { default: 'Ventas Diarias por Móvil'}) }}</h3>
            <div class="flex items-center gap-2">
              <input 
                type="date" 
                v-model="selectedDate" 
                class="form-input"
                @change="fetchDailySales"
              >
              <button 
                @click="downloadDailySalesPDF" 
                class="btn btn-primary flex items-center gap-2"
                :disabled="loading"
              >
                <i class="fas fa-file-pdf"></i>
                {{ $t('downloadPDF', { default: 'Descargar PDF'}) }}
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ $t('truck', { default: 'Móvil'}) }}</th>
                  <th>{{ $t('orders') }}</th>
                  <th>{{ $t('totalSales') }}</th>
                  <th>{{ $t('actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(sales, truckId) in dailySales.truckSales" :key="truckId">
                  <td>{{ $t('truck', { default: 'Móvil'}) }} {{ truckId }}</td>
                  <td>{{ sales.orderCount }}</td>
                  <td>${{ formatNumber(sales.totalSales) }}</td>
                  <td>
                    <button 
                      @click="downloadTruckDeliveryReport(truckId, selectedDate, selectedDate)" 
                      class="btn btn-sm btn-primary flex items-center justify-center gap-1"
                      :disabled="loading"
                    >
                      <i class="fas fa-file-pdf"></i>
                      {{ $t('downloadPDF', { default: 'Descargar PDF'}) }} 
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 text-sm text-slate-500">
            <p><i class="fas fa-info-circle mr-1"></i> {{ $t('truckPdfInfo', { default: 'Click en el botón PDF al lado de un móvil para descargar su reporte diario.' }) }}</p>
          </div>
        </div>

        <!-- Weekly Sales -->
        <div class="card bg-white p-4 rounded-lg shadow">
          <div class="card-header">
            <h3 class="card-title">{{ $t('weeklySales') }}</h3>
            <div class="card-date">
              <input 
                type="date" 
                v-model="selectedWeekStart" 
                class="form-control" 
              />
            </div>
          </div>
          <div class="card-body">
            <div v-if="weeklySales.startDate && weeklySales.endDate" class="mb-3 text-center text-sm text-gray-600">
              {{ formatDate(new Date(weeklySales.startDate), t('locale')) }} - {{ formatDate(new Date(weeklySales.endDate), t('locale')) }}
            </div>
            <div class="overflow-x-auto">
              <table class="table" v-if="weeklySales.dailySales && weeklySales.dailySales.length > 0">
                <thead>
                  <tr>
                    <th>{{ $t('date') }}</th>
                    <th>{{ $t('orders') }}</th>
                    <th>{{ $t('totalSales') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="day in weeklySales.dailySales" :key="day.date" 
                      :class="{'bg-primary-50': day.isToday}">
                    <td>
                      <div class="flex items-center">
                        <span v-if="day.isToday" class="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                        {{ day.formattedDate }}
                        <span v-if="day.isToday" class="ml-2 text-xs text-primary-600 font-medium">
                          ({{ $t('today') }})
                        </span>
                      </div>
                    </td>
                    <td>{{ day.orderCount }}</td>
                    <td>${{ formatNumber(day.totalSales) }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="text-center py-8 text-slate-500">
                <i class="fas fa-calendar-week text-4xl mb-2"></i>
                <p>{{ $t('noWeeklySalesData', { default: 'No hay datos de ventas semanales disponibles' }) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sales Chart - ALWAYS rendered -->
      <div class="card bg-white p-4 rounded-lg shadow mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-4">{{ $t('monthlySalesChart') }}</h3>
        <div id="chartContainer" style="height: 300px; position: relative;">
          <canvas ref="salesChartCanvas" id="salesChart"></canvas>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import axios from 'axios'
import DashboardService from '../services/DashboardService'
import TruckService from '../services/TruckService'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  LineController,
  BarController
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { format, isValid, parseISO, startOfWeek, endOfWeek, addDays, eachDayOfInterval } from 'date-fns'
import { enUS, es } from 'date-fns/locale'
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters'
import { useI18n } from 'vue-i18n'

// Initialize i18n
const { t } = useI18n()

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

// Set chart default locale based on i18n setting
const chartLocale = t('locale') === 'es-ES' ? es : enUS;

// Initialize refs for component state
let salesChart = null;
let chartInitAttempts = 0;
const MAX_CHART_INIT_ATTEMPTS = 5;

// Date selections
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'))
const selectedWeekStart = ref(getStartOfWeek())
const selectedTruckId = ref('')
const reportStartDate = ref(format(new Date(), 'yyyy-MM-dd'))
const reportEndDate = ref(format(addDays(new Date(), 7), 'yyyy-MM-dd'))
const trucks = ref([])

// Canvas reference
const salesChartCanvas = ref(null)

// Data - Initialize with default values to prevent undefined errors
const statistics = ref({
  today: { totalSales: 0, orderCount: 0 },
  month: { totalSales: 0, orderCount: 0 },
  pendingOrders: 0,
  averageOrderValue: 0
})
const dailySales = ref({ truckSales: {} })
const weeklySales = ref({ dailySales: [] })
const loading = ref(true)
const chartData = ref([]) // Store chart data

// Function to get the start of the current week (Monday)
function getStartOfWeek() {
  const today = new Date()
  const day = today.getDay() // 0 is Sunday, 1 is Monday, etc.
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday (go back to previous Monday)
  const monday = new Date(today.setDate(diff))
  return format(monday, 'yyyy-MM-dd')
}

// Watch for date changes to refresh data
watch(selectedWeekStart, (newDate, oldDate) => {
  if (newDate !== oldDate) {
    console.log(`Weekly start date changed from ${oldDate} to ${newDate}, refreshing data`);
    fetchWeeklySales();
  }
});

watch(selectedDate, (newDate, oldDate) => {
  if (newDate !== oldDate) {
    console.log(`Daily date changed from ${oldDate} to ${newDate}, refreshing data`);
    fetchDailySales();
  }
});

onMounted(async () => {
  loading.value = true;
  try {
    // Fetch all required data
    await fetchAllData();
    
    // Initialize chart after data is loaded
    // The chartData ref is already populated by fetchAllData -> prepareChartData (which calls initializeChart)
    // So, direct call to initChart() here might be redundant if fetchAllData already triggers it.
    // However, ensure chartData.value is up-to-date before initializing.
    if (chartData.value && chartData.value.length > 0) {
      initializeChart(chartData.value);
    } else {
      // If fetchAllData didn't populate chartData (e.g. error or no data), try fetching monthly sales again for chart
      const statsResponse = await DashboardService.getStatistics(); // Assuming this was fetched in fetchAllData
      const monthlySalesForChart = statsResponse.month?.dailySales || [];
      console.log('[DashboardView] Data for onMounted initChart:', JSON.parse(JSON.stringify(monthlySalesForChart)));
      initializeChart(monthlySalesForChart);
    }
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  } finally {
    loading.value = false;
  }
})

onBeforeUnmount(() => {
  // Clean up chart when component is destroyed
  if (salesChart) {
    salesChart.destroy()
    salesChart = null
  }
})

// Fetch all data at once
const fetchAllData = async () => {
  try {
    const [statsResponse, dailyResponse, weeklyResponse, trucksResponse] = await Promise.all([
      DashboardService.getStatistics(),
      DashboardService.getDailySales(selectedDate.value),
      DashboardService.getWeeklySales(selectedWeekStart.value),
      TruckService.getAllTrucks()
    ])

    // Update state with fetched data
    statistics.value = statsResponse
    dailySales.value = dailyResponse
    
    // Process weekly sales data
    if (weeklyResponse.dailySales) {
      const today = new Date().toISOString().split('T')[0]
      weeklySales.value = {
        ...weeklyResponse,
        dailySales: weeklyResponse.dailySales.map(day => ({
          ...day,
          isToday: day.date === today,
          formattedDate: formatDate(new Date(day.date), t('locale'))
        }))
      }
    }
    
    // Store trucks
    trucks.value = trucksResponse

    // Prepare chart data
    const monthlySalesData = statsResponse.month?.dailySales || []
    console.log('[DashboardView] Monthly sales data for chart in fetchAllData:', JSON.parse(JSON.stringify(monthlySalesData)));
    chartData.value = monthlySalesData; // Store it in the ref
    // initializeChart will be called from onMounted or if data was already present
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }
}

const fetchStatistics = async () => {
  try {
    const response = await DashboardService.getStatistics()
    statistics.value = {
      today: {
        ...statistics.value.today,
        ...(response?.today || {})
      },
      month: {
        ...statistics.value.month,
        ...(response?.month || {})
      }
    }
  } catch (error) {
    console.error(t('errorFetchingStatistics'), error)
  }
}

const fetchDailySales = async () => {
  try {
    const response = await DashboardService.getDailySales(selectedDate.value)
    dailySales.value = response
  } catch (error) {
    console.error(t('errorFetchingDailySales'), error)
  }
}

const fetchWeeklySales = async () => {
  try {
    console.log(`Fetching weekly sales for start date: ${selectedWeekStart.value}`);
    const response = await DashboardService.getWeeklySales(selectedWeekStart.value)
    console.log('Weekly sales response:', response);
    
    // Make sure we have dailySales data
    if (response && Array.isArray(response.dailySales)) {
      const startDate = new Date(selectedWeekStart.value);
      
      // Create a complete week array with all 7 days, even if no orders on some days
      const completeWeekData = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        
        // Find if we have data for this date
        const existingData = response.dailySales.find(day => 
          day.date === formattedDate || 
          (day.date && new Date(day.date).toDateString() === currentDate.toDateString())
        );
        
        // Get current locale from i18n
        const currentLocale = t('locale') || navigator.language || 'es-ES';
        
        completeWeekData.push({
          date: formattedDate,
          formattedDate: formatDate(currentDate, currentLocale),
          // Use data if exists, otherwise use zeros
          orderCount: existingData ? existingData.orderCount : 0,
          totalSales: existingData ? existingData.totalSales : 0,
          // Highlight today's date
          isToday: new Date().toDateString() === currentDate.toDateString()
        });
      }
      
      // Update the weeklySales object with processed data
      weeklySales.value = {
        ...response,
        startDate: selectedWeekStart.value,
        endDate: format(new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        dailySales: completeWeekData
      };
      console.log('Processed weekly sales data:', weeklySales.value);
    } else {
      console.warn('No dailySales array found in weekly sales response');
      weeklySales.value = { dailySales: [] };
    }
  } catch (error) {
    console.error(t('errorFetchingWeeklySales'), error)
    weeklySales.value = { dailySales: [] };
  }
}

const fetchMonthlySales = async () => {
  try {
    // Get first day of the current month for the API call
    const currentDate = new Date(selectedDate.value);
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedDate = format(firstDayOfMonth, 'yyyy-MM-dd');
    
    console.log(`Fetching monthly sales for date: ${formattedDate}`);
    const response = await DashboardService.getMonthlySales(formattedDate);
    console.log('Monthly data response:', response);
    
    let extractedData = [];
    
    // Check various possible data structures in the response
    if (response) {
      if (Array.isArray(response.dailySales)) {
        // Direct dailySales array
        extractedData = response.dailySales;
      } else if (response.month && Array.isArray(response.month.dailySales)) {
        // dailySales nested in month object
        extractedData = response.month.dailySales;
      } else if (Array.isArray(response)) {
        // Response itself is an array
        extractedData = response;
      } else if (typeof response === 'object') {
        // Extract data from any array property we can find
        for (const key in response) {
          if (Array.isArray(response[key])) {
            extractedData = response[key];
            break;
          }
        }
      }
    }
    
    console.log('Extracted chart data:', extractedData);
    // Store the data for later use
    chartData.value = extractedData;
    
    // Only update chart if loading is complete
    if (!loading.value) {
      initializeChart(extractedData);
    }
  } catch (error) {
    console.error(t('errorFetchingMonthlySales'), error);
    chartData.value = [];
    if (!loading.value) {
      initializeChart([]);
    }
  }
}

// Separate chart initialization function
const initializeChart = (data) => {
  console.log('[DashboardView] Initializing chart with data:', JSON.parse(JSON.stringify(data)));
  // Schedule for next tick to ensure DOM is updated
  nextTick(() => {
    try {
      // Make sure the chart container exists
      const chartContainer = document.getElementById('chartContainer');
      if (!chartContainer) {
        console.error('[DashboardView] Chart container not found');
        throw new Error('Chart container not found');
      }
      
      // Ensure we have a canvas - create one if needed
      let canvas = getChartCanvas();
      if (!canvas) {
        console.warn('[DashboardView] Canvas not found by ref or ID, creating new canvas element');
        canvas = document.createElement('canvas');
        canvas.id = 'salesChart';
        chartContainer.innerHTML = ''; // Clear container before appending
        chartContainer.appendChild(canvas);
        salesChartCanvas.value = canvas; // Attempt to update ref
      }
      console.log('[DashboardView] Canvas element for chart:', canvas);
      updateSalesChart(data);
    } catch (error) {
      console.error('[DashboardView] Failed to initialize chart structure:', error);
      // Retry initialization with increasing delay
      if (chartInitAttempts < MAX_CHART_INIT_ATTEMPTS) {
        chartInitAttempts++;
        const delay = chartInitAttempts * 200; // Increase delay with each attempt
        console.log(`[DashboardView] Retrying chart initialization in ${delay}ms (attempt ${chartInitAttempts}/${MAX_CHART_INIT_ATTEMPTS})`);
        setTimeout(() => initializeChart(data), delay);
      } else {
        console.error(`[DashboardView] Failed to initialize chart after ${MAX_CHART_INIT_ATTEMPTS} attempts`);
      }
    }
  });
};

const updateSalesChart = async (data) => {
  console.log('[DashboardView] updateSalesChart called with data:', JSON.parse(JSON.stringify(data)));
  
  // Wait for DOM update to ensure canvas is rendered
  await nextTick();
  
  // Get canvas with fallbacks
  const canvas = getChartCanvas();
  console.log('[DashboardView] Canvas in updateSalesChart:', canvas);
  
  // Ensure canvas exists
  if (!canvas) {
    console.error('[DashboardView] Chart canvas element NOT FOUND in updateSalesChart, retrying in 100ms...');
    // Try again after a short delay
    setTimeout(() => updateSalesChart(data), 100);
    return;
  }
  
  // Safely destroy any existing chart
  if (salesChart) {
    try {
      salesChart.destroy();
    } catch (error) {
      console.warn('Error destroying existing chart:', error);
      // Continue anyway
    }
    salesChart = null;
  }
  
  // Create an empty chart if there's no data
  if (!data || data.length === 0) {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context from canvas');
        return;
      }
      
      salesChart = new ChartJS(canvas, {
        type: 'bar',
        data: {
          datasets: [{
            label: t('monthlySales'),
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: t('monthlySalesChart'),
              font: {
                size: 16
              }
            },
            tooltip: {
              enabled: false
            },
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              type: 'time',
              adapters: {
                date: {
                  locale: chartLocale
                }
              },
              time: {
                unit: 'day',
                displayFormats: {
                  day: 'dd MMM'
                }
              },
              title: {
                display: true,
                text: t('date')
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: t('sales')
              }
            }
          }
        }
      });
      
      // Add a "No data" label
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText(t('noMonthlySalesData'), canvas.width / 2, canvas.height / 2);
      ctx.restore();
    } catch (error) {
      console.error('[DashboardView] Error creating empty chart:', error);
    }
    
    return;
  }

  try {
    console.log('[DashboardView] Proceeding to create chart with data.');
    // Process the data to ensure dates are properly formatted
    const processedData = data.map(item => {
      // Handle different data formats
      let dateValue, salesValue;
      
      if (typeof item === 'object') {
        if (item.date) {
          // If date is a string, ensure it's properly formatted
          dateValue = typeof item.date === 'string' 
            ? (item.date.includes('T') ? new Date(item.date) : new Date(item.date + 'T00:00:00'))
            : new Date(item.date);
        } else if (item.key || item.day) {
          // Handle alternate date formats
          dateValue = new Date(item.key || item.day || selectedDate.value);
        } else {
          // Fallback to current date
          dateValue = new Date();
        }
        
        // Handle different sales property names
        salesValue = item.totalSales || item.sales || item.value || 0;
      } else {
        // Handle primitive format
        dateValue = new Date();
        salesValue = item || 0;
      }
      
      return {
        x: dateValue,
        y: salesValue
      };
    });
    
    const sortedData = [...processedData].sort((a, b) => a.x - b.x);
    
    const chartData = {
      datasets: [{
        label: t('monthlySales'),
        data: sortedData,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      }]
    };

    salesChart = new ChartJS(canvas, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: t('monthlySalesChart'),
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                const dateObj = context[0].raw.x;
                // Use current locale for date formatting
                return new Intl.DateTimeFormat(t('locale'), {
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                }).format(dateObj);
              },
              label: function(context) {
                return `${t('sales')}: $${formatNumber(context.raw.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            adapters: {
              date: {
                locale: chartLocale
              }
            },
            time: {
              unit: 'day',
              displayFormats: {
                day: 'dd MMM'
              }
            },
            title: {
              display: true,
              text: t('date')
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: t('sales')
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating chart:', error);
  }
}

// Add this function to safely get the canvas element
const getChartCanvas = () => {
  // Try the ref first
  if (salesChartCanvas.value) {
    return salesChartCanvas.value;
  }
  
  // Fallback to getElementById
  const canvasElement = document.getElementById('salesChart');
  if (canvasElement) {
    return canvasElement;
  }
  
  // Last resort - query selector
  return document.querySelector('canvas#salesChart');
};

const downloadDailySalesPDF = async () => {
  try {
    loading.value = true;
    await DashboardService.downloadDailySalesPDF(selectedDate.value);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    // You might want to show an error message to the user here
  } finally {
    loading.value = false;
  }
};

const downloadTruckDeliveryReport = async (truckId = null, startDate = null, endDate = null) => {
  try {
    loading.value = true;
    // Use provided parameters or fall back to the form values
    const truck = truckId || selectedTruckId.value;
    const start = startDate || reportStartDate.value;
    const end = endDate || reportEndDate.value;
    
    await DashboardService.downloadTruckDeliveryReport(truck, start, end);
  } catch (error) {
    console.error('Error downloading truck delivery report:', error);
    // You might want to show an error message to the user here
  } finally {
    loading.value = false;
  }
};

// Function to fetch all trucks
const fetchTrucks = async () => {
  try {
    const response = await TruckService.getAllTrucks();
    trucks.value = response;
  } catch (error) {
    console.error('Error fetching trucks:', error);
  }
};
</script>

<style scoped>
.dashboard {
  min-height: calc(100vh - 4rem);
}

.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 3px solid #3498db;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

