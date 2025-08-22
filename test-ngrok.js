// Simple test to check if ngrok endpoint is accessible
const ngrokUrl = 'https://33b60227a006.ngrok-free.app';

console.log('Testing ngrok endpoint:', ngrokUrl);

fetch(ngrokUrl, {
  method: 'GET',
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
})
.then(response => {
  console.log('✅ Response status:', response.status);
  console.log('✅ Response headers:', Object.fromEntries(response.headers.entries()));
  return response.text();
})
.then(text => {
  console.log('✅ Response body:', text.substring(0, 200));
})
.catch(error => {
  console.error('❌ Connection failed:', error.message);
});
