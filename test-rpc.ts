// Simple HTTP test for the new RPC endpoint
const testEndpoint = 'https://33b60227a006.ngrok-free.app';

async function testRPCEndpoint() {
  console.log('Testing RPC endpoint:', testEndpoint);
  
  try {
    // Test basic HTTP connectivity
    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning
      }
    });
    
    console.log('✅ HTTP Response Status:', response.status);
    console.log('✅ Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const text = await response.text();
      console.log('✅ Response Body:', text);
    }
    
    // Test WebSocket connection (what the RPC service actually uses)
    console.log('\nTesting WebSocket connection...');
    const wsUrl = testEndpoint.replace('https://', 'wss://');
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      ws.close();
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket connection failed:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
  } catch (error) {
    console.error('❌ HTTP request failed:', error);
  }
}

// Run the test
testRPCEndpoint();
