import { rpcConfig, RPC_EVENTS } from '../config/rpc';

class RPCService {
  private endpoint: string | null = null;
  private reconnectAttempts = 0;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(endpoint: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Test HTTP connectivity first
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok || response.status === 404) {
          // Connection successful (404 is fine, means server is responding)
          this.endpoint = endpoint;
          this.reconnectAttempts = 0;
          resolve();
        } else {
          reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: any) {
    const { type, payload } = data;
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(payload));
    }
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < rpcConfig.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        // Attempt to reconnect
        if (this.endpoint) {
          this.connect(this.endpoint);
        }
      }, rpcConfig.reconnectInterval);
    }
  }

  subscribe(event: keyof typeof RPC_EVENTS, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  unsubscribe(event: keyof typeof RPC_EVENTS, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  async executeQuery(query: string): Promise<any> {
    if (!this.endpoint) {
      throw new Error('Not connected to RPC endpoint');
    }

    // Try different common endpoints for SQL queries
    const possibleEndpoints = [
      `${this.endpoint}/query`,
      `${this.endpoint}/sql`,
      `${this.endpoint}/execute`,
      `${this.endpoint}/api/query`,
      `${this.endpoint}` // POST to root
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });

        if (response.ok) {
          const result = await response.json();
          return { endpoint: endpoint, result };
        } else if (response.status !== 404) {
          // If it's not a 404, it might be a valid endpoint with other issues
          throw new Error(`Query failed at ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        if (error.message.includes('Query failed at')) {
          throw error; // Re-throw non-404 errors
        }
        // Continue to next endpoint for network errors
      }
    }

    throw new Error('No valid query endpoint found. Tried: ' + possibleEndpoints.join(', '));
  }

  disconnect() {
    this.endpoint = null;
    this.listeners.clear();
  }
}

export const rpcService = new RPCService();
