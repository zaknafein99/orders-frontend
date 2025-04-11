import axios from 'axios';

// Set up base API URL
const API_URL = 'http://localhost:8080';
// Specify which order to test
const TEST_ORDER_ID = 1404; // Change this to a valid order ID with items

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

// Get a specific order
async function getOrder(token, orderId) {
  try {
    // First try pending orders
    const pendingResponse = await axios.get(`${API_URL}/orders/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (pendingResponse.data && Array.isArray(pendingResponse.data)) {
      const order = pendingResponse.data.find(o => o.id === orderId);
      if (order) {
        return order;
      }
    }
    
    // If not found in pending, check delivered orders
    const deliveredResponse = await axios.get(`${API_URL}/orders/delivered`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (deliveredResponse.data && Array.isArray(deliveredResponse.data)) {
      const order = deliveredResponse.data.find(o => o.id === orderId);
      if (order) {
        return order;
      }
    }
    
    throw new Error(`Order with ID ${orderId} not found`);
  } catch (error) {
    console.error(`Failed to fetch order ${orderId}:`, error.message);
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
    
    // Get the specific order
    const testOrder = await getOrder(token, TEST_ORDER_ID);
    console.log(`Found order ${testOrder.id} for testing:`, JSON.stringify(testOrder, null, 2));
    
    if (testOrder.status === 'DELIVERED') {
      console.log('This order is already marked as delivered. Cannot test delivery process.');
      return;
    }
    
    // Check the items in this order and their quantities before delivery
    console.log('Items in the order:');
    if (!testOrder.items || testOrder.items.length === 0) {
      console.log('This order has no items. Cannot test inventory updates.');
      return;
    }
    
    for (const item of testOrder.items) {
      console.log(`Item ${item.id}: ${item.name}, Order Quantity: ${item.quantity}`);
      
      // Check the current item quantity in the database
      try {
        const itemDetails = await getItem(token, item.id);
        console.log(`Current inventory quantity for item ${item.id}: ${itemDetails.quantity}`);
      } catch (error) {
        console.log(`Could not get current quantity for item ${item.id}`);
      }
    }
    
    // Mark the order as delivered
    const deliveredOrder = await markOrderAsDelivered(token, testOrder.id);
    console.log('Order marked as delivered. Status:', deliveredOrder.status);
    
    // Wait a moment for database updates to complete
    console.log('Waiting 2 seconds for database updates to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check item quantities after delivery
    console.log('\nChecking item quantities after delivery:');
    for (const item of testOrder.items) {
      try {
        const itemDetails = await getItem(token, item.id);
        console.log(`New inventory quantity for item ${item.id}: ${itemDetails.quantity}`);
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