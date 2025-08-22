import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface QueryExecutionOptions {
  useCache?: boolean;
  timeout?: number;
  maxRows?: number;
}

export interface QueryResult {
  data: any[];
  columns: string[];
  rowCount: number;
  executionTimeMs: number;
  cached: boolean;
}

export interface QueryExecutionResponse {
  success: boolean;
  executionId: string;
  result: QueryResult;
  metadata: {
    query: string;
    executedAt: string;
    userId: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  query: string;
  category: string;
}

export interface QueryStats {
  queryEngine: {
    cacheSize: number;
    cacheHitRate: number;
    availableTables: string[];
  };
  data: {
    blocks: number;
    transactions: number;
    events: number;
    contracts: number;
    latestBlock: number | null;
  };
  indexer: {
    latestChainBlock: number;
    syncProgress: number;
    isRunning: boolean;
    rpcUrl: string;
  };
}

class QueryService {
  private userId: string;

  constructor() {
    // Generate or retrieve user ID
    this.userId = localStorage.getItem('starknet_user_id') || this.generateUserId();
    localStorage.setItem('starknet_user_id', this.userId);
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async executeQuery(query: string, options: QueryExecutionOptions = {}): Promise<QueryExecutionResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/query/execute`, {
        query,
        options: {
          useCache: true,
          timeout: 10000,
          maxRows: 1000,
          ...options
        }
      }, {
        headers: {
          'X-User-ID': this.userId,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Query execution failed');
      }
      throw new Error('Network error occurred');
    }
  }

  async validateQuery(query: string): Promise<{ success: boolean; validation: ValidationResult }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/query/validate`, {
        query
      }, {
        headers: {
          'X-User-ID': this.userId,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Query validation failed');
      }
      throw new Error('Network error occurred');
    }
  }

  async getQueryTemplates(): Promise<{ success: boolean; templates: QueryTemplate[] }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/query/templates`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to get query templates');
      }
      throw new Error('Network error occurred');
    }
  }

  async getQueryHistory(limit = 50, offset = 0): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/query/history`, {
        params: { limit, offset },
        headers: {
          'X-User-ID': this.userId
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to get query history');
      }
      throw new Error('Network error occurred');
    }
  }

  async getStats(): Promise<{ success: boolean; stats: QueryStats }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/query/stats`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to get stats');
      }
      throw new Error('Network error occurred');
    }
  }

  async startIndexer(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/indexer/start`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to start indexer');
      }
      throw new Error('Network error occurred');
    }
  }

  async stopIndexer(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/indexer/stop`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to stop indexer');
      }
      throw new Error('Network error occurred');
    }
  }

  // WebSocket connection for real-time queries
  createWebSocketConnection(): WebSocket {
    const wsUrl = API_BASE_URL.replace('http', 'ws');
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to StarkNet SQL Query Sandbox WebSocket');
      
      // Subscribe to real-time updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        data: { userId: this.userId }
      }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return ws;
  }

  // Execute query via WebSocket for real-time results
  executeQueryWebSocket(ws: WebSocket, query: string, options: QueryExecutionOptions = {}): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'query',
        data: {
          query,
          userId: this.userId,
          options: {
            useCache: true,
            timeout: 10000,
            maxRows: 1000,
            ...options
          }
        }
      }));
    } else {
      throw new Error('WebSocket connection is not open');
    }
  }

  // Validate query via WebSocket
  validateQueryWebSocket(ws: WebSocket, query: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'validate',
        data: {
          query,
          userId: this.userId
        }
      }));
    } else {
      throw new Error('WebSocket connection is not open');
    }
  }

  getUserId(): string {
    return this.userId;
  }
}

export const queryService = new QueryService();
export default queryService;
