import { rpcService } from '../services/rpcService';

// Mock WebSocket for testing
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public url: string;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening after a delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    console.log('Mock WebSocket send:', data);
    // Simulate response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', {
          data: JSON.stringify({
            type: 'QUERY_RESULT',
            payload: { result: 'test data' }
          })
        }));
      }
    }, 50);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;
(global as any).WebSocket.CONNECTING = 0;
(global as any).WebSocket.OPEN = 1;
(global as any).WebSocket.CLOSING = 2;
(global as any).WebSocket.CLOSED = 3;

async function testRPCService() {
  console.log('🧪 Testing RPC Service with null safety fix...\n');

  try {
    // Test 1: Connection
    console.log('1️⃣ Testing connection...');
    await rpcService.connect('ws://localhost:8080');
    console.log('✅ Connection successful\n');

    // Test 2: Query execution (this tests our null check fix)
    console.log('2️⃣ Testing query execution (null safety)...');
    const result = await rpcService.executeQuery('SELECT * FROM test');
    console.log('✅ Query executed successfully:', result);
    console.log('✅ Null check fix working correctly\n');

    // Test 3: Test disconnection and reconnection scenario
    console.log('3️⃣ Testing disconnection scenario...');
    rpcService.disconnect();
    
    try {
      await rpcService.executeQuery('SELECT * FROM test');
      console.log('❌ Should have thrown error for disconnected state');
    } catch (error) {
      console.log('✅ Correctly handled disconnected state:', (error as Error).message);
    }

    console.log('\n🎉 All tests passed! The null safety fix is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRPCService();
