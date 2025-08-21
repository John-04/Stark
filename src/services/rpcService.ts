import { rpcConfig, RPC_EVENTS } from '../config/rpc';

class RPCService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(endpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(endpoint.replace('http', 'ws'));

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        };

        this.ws.onclose = () => {
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          reject(error);
        };
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
        if (this.ws?.url) {
          this.connect(this.ws.url);
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
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to RPC endpoint');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Query timed out'));
      }, rpcConfig.queryTimeout);

      const handleResponse = (payload: any) => {
        clearTimeout(timeoutId);
        this.unsubscribe(RPC_EVENTS.QUERY_RESULT, handleResponse);
        resolve(payload);
      };

      this.subscribe(RPC_EVENTS.QUERY_RESULT, handleResponse);

      if (!this.ws) {
        clearTimeout(timeoutId);
        reject(new Error('WebSocket connection lost'));
        return;
      }

      this.ws.send(JSON.stringify({
        type: 'query',
        payload: { query }
      }));
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

export const rpcService = new RPCService();
