import axios from 'axios';

// Set up base API URL
const API_URL = 'http://localhost:8080';

// Authentication
async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth`, {
      email: 'admin@gmail.com',
      password: 'password'
    });
    
    console.log('Authentication successful');
    return response.data.accessToken;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

// Get all pending orders
async function getPendingOrders(token) {
  try {
    const response = await axios.get(`${API_URL}/orders/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Pending orders:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch pending orders:', error.message);
    throw error;
  }
}

// Get a specific item
async function getItem(token, itemId) {
  try {
    const response = await axios.get(`${API_URL}/item/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Item ${itemId} details:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch item ${itemId}:`, error.message);
    throw error;
  }
}

// Mark an order as delivered
async function markOrderAsDelivered(token, orderId) {
  try {
    console.log(`Attempting to mark order ${orderId} as delivered...`);
    const response = await axios.post(`${API_URL}/orders/${orderId}/deliver`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Order ${orderId} marked as delivered:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to mark order ${orderId} as delivered:`, error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
}

// Main function to run the test
async function runTest() {
  try {
    // Login to get token
    const token = await login();
    
    // Get pending orders
    const pendingOrders = await getPendingOrders(token);
    
    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('No pending orders found to test with.');
      return;
    }
    
    // Select the first pending order for testing
    const testOrder = pendingOrders[0];
    console.log(`Selected order ${testOrder.id} for testing`);
    
    // Check the items in this order and their quantities before delivery
    console.log('Items in the order:');
    for (const item of testOrder.items) {
      console.log(`Item ${item.id}: ${item.name}, Quantity: ${item.quantity}`);
      
      // Check the current item quantity in the database
      try {
        const itemDetails = await getItem(token, item.id);
        console.log(`Current quantity in database for item ${item.id}: ${itemDetails.quantity}`);
      } catch (error) {
        console.log(`Could not get current quantity for item ${item.id}`);
      }
    }
    
    // Mark the order as delivered
    const deliveredOrder = await markOrderAsDelivered(token, testOrder.id);
    console.log('Order marked as delivered:', deliveredOrder);
    
    // Check item quantities after delivery
    console.log('\nChecking item quantities after delivery:');
    for (const item of testOrder.items) {
      try {
        const itemDetails = await getItem(token, item.id);
        console.log(`New quantity in database for item ${item.id}: ${itemDetails.quantity}`);
      } catch (error) {
        console.log(`Could not get updated quantity for item ${item.id}`);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
runTest(); 