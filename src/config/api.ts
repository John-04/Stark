// API Configuration for StarkNet SQL Sandbox
export const API_CONFIG = {
  RPC_BASE_URL: '/api/rpc',  // Use proxy to avoid CORS
  ENDPOINTS: {
    QUERY: '',  // Direct RPC call to root
    DATA: '/data',
    SCHEMAS: '/schemas',
    HEALTH: '/health'
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  TIMEOUT: 30000 // 30 seconds
};

export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = API_CONFIG.RPC_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = API_CONFIG.HEADERS;
  }

  async executeRPCQuery(query: string): Promise<any> {
    try {
      // Since the SQL Sandbox queries are working, let's use the same format
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({
          query: query,
          chain: 'starknet'
        })
      });

      if (!response.ok) {
        throw new Error(`RPC request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`RPC Error: ${result.error.message || result.error}`);
      }

      return result;
    } catch (error) {
      console.error('RPC Query failed:', error);
      throw error;
    }
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    return response;
  }

  async post(endpoint: string, data: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async get(endpoint: string): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Test with a simple query
      await this.executeRPCQuery('SELECT * FROM starknet_transactions LIMIT 1');
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiClient = new APIClient();
