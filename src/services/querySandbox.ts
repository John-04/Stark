import { sqlParser, ParsedQuery } from './sqlParser';
import { queryCache, QueryOptimizer } from './queryCache';
import { starknetSync } from './starknetSync';

export interface SandboxConfig {
  maxExecutionTime: number; // milliseconds
  maxMemoryUsage: number; // bytes
  maxResultRows: number;
  allowedTables: string[];
  rateLimitPerMinute: number;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  executionTime: number;
  rowCount: number;
  fromCache: boolean;
  optimization?: any;
  warnings: string[];
}

export interface ResourceUsage {
  executionTime: number;
  memoryUsed: number;
  rowsProcessed: number;
  cacheHits: number;
  cacheMisses: number;
}

export class QueryExecutionSandbox {
  private config: SandboxConfig;
  private executionHistory: Map<string, number[]> = new Map(); // Track execution times per IP/user
  private resourceUsage: ResourceUsage = {
    executionTime: 0,
    memoryUsed: 0,
    rowsProcessed: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  constructor(config?: Partial<SandboxConfig>) {
    this.config = {
      maxExecutionTime: 30000, // 30 seconds
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxResultRows: 10000,
      allowedTables: ['blocks', 'transactions', 'events', 'contracts', 'storage_diffs'],
      rateLimitPerMinute: 60,
      ...config
    };
  }

  async executeQuery(query: string, userId?: string): Promise<QueryResult> {
    const startTime = Date.now();
    const result: QueryResult = {
      success: false,
      executionTime: 0,
      rowCount: 0,
      fromCache: false,
      warnings: []
    };

    try {
      // Rate limiting check
      if (userId && !this.checkRateLimit(userId)) {
        result.error = 'Rate limit exceeded. Please wait before executing another query.';
        return result;
      }

      // Check cache first
      const cachedResult = queryCache.get(query);
      if (cachedResult) {
        result.success = true;
        result.data = cachedResult.result;
        result.executionTime = cachedResult.executionTime;
        result.rowCount = cachedResult.result.length;
        result.fromCache = true;
        this.resourceUsage.cacheHits++;
        return result;
      }

      this.resourceUsage.cacheMisses++;

      // Parse and validate query
      const parsedQuery = sqlParser.parse(query);
      if (!parsedQuery.isValid) {
        result.error = `Query validation failed: ${parsedQuery.errors.join(', ')}`;
        return result;
      }

      // Check table permissions
      for (const table of parsedQuery.tables) {
        if (!this.config.allowedTables.includes(table.toLowerCase())) {
          result.error = `Access denied to table: ${table}`;
          return result;
        }
      }

      // Get query optimization
      const optimization = QueryOptimizer.optimize(parsedQuery);
      result.optimization = optimization;
      result.warnings = optimization.warnings;

      // Execute query with resource limits
      const queryData = await this.executeWithLimits(parsedQuery);
      
      result.success = true;
      result.data = queryData;
      result.rowCount = queryData.length;
      result.executionTime = Date.now() - startTime;

      // Cache successful results
      if (result.success && result.data) {
        queryCache.set(query, result.data, result.executionTime);
      }

      // Update resource usage
      this.resourceUsage.executionTime += result.executionTime;
      this.resourceUsage.rowsProcessed += result.rowCount;

      // Track execution time for rate limiting
      if (userId) {
        this.trackExecution(userId, result.executionTime);
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown execution error';
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  private async executeWithLimits(parsedQuery: ParsedQuery): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Query execution timeout (${this.config.maxExecutionTime}ms)`));
      }, this.config.maxExecutionTime);

      // Execute the actual query
      this.executeQueryAgainstData(parsedQuery)
        .then(data => {
          clearTimeout(timeout);
          
          if (data.length > this.config.maxResultRows) {
            data = data.slice(0, this.config.maxResultRows);
          }
          
          resolve(data);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private async executeQueryAgainstData(parsedQuery: ParsedQuery): Promise<any[]> {
    // This is a simplified implementation that would normally connect to PostgreSQL
    // For now, we'll simulate data based on the query structure
    
    const mockData = await this.generateMockData(parsedQuery);
    
    // Apply WHERE conditions
    let filteredData = this.applyWhereConditions(mockData, parsedQuery.conditions);
    
    // Apply JOINs (simplified)
    if (parsedQuery.joins.length > 0) {
      filteredData = this.applyJoins(filteredData, parsedQuery.joins);
    }
    
    // Apply GROUP BY
    if (parsedQuery.groupBy.length > 0) {
      filteredData = this.applyGroupBy(filteredData, parsedQuery.groupBy);
    }
    
    // Apply ORDER BY
    if (parsedQuery.orderBy.length > 0) {
      filteredData = this.applyOrderBy(filteredData, parsedQuery.orderBy);
    }
    
    // Apply LIMIT and OFFSET
    if (parsedQuery.offset) {
      filteredData = filteredData.slice(parsedQuery.offset);
    }
    
    if (parsedQuery.limit) {
      filteredData = filteredData.slice(0, parsedQuery.limit);
    }
    
    // Select only requested columns
    if (parsedQuery.columns.length > 0 && !parsedQuery.columns.includes('*')) {
      filteredData = filteredData.map(row => {
        const selectedRow: any = {};
        for (const col of parsedQuery.columns) {
          if (row.hasOwnProperty(col)) {
            selectedRow[col] = row[col];
          }
        }
        return selectedRow;
      });
    }
    
    return filteredData;
  }

  private async generateMockData(parsedQuery: ParsedQuery): Promise<any[]> {
    const mockData: any[] = [];
    const primaryTable = parsedQuery.tables[0];
    
    switch (primaryTable?.toLowerCase()) {
      case 'blocks':
        for (let i = 0; i < 100; i++) {
          mockData.push({
            block_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            block_number: 100000 + i,
            timestamp: Date.now() / 1000 - (i * 12), // 12 seconds per block
            parent_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            sequencer_address: `0x${Math.random().toString(16).substr(2, 40)}`,
            state_root: `0x${Math.random().toString(16).substr(2, 64)}`,
            transaction_count: Math.floor(Math.random() * 50)
          });
        }
        break;
        
      case 'transactions':
        for (let i = 0; i < 500; i++) {
          mockData.push({
            transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            block_number: 100000 + Math.floor(i / 5),
            transaction_index: i % 5,
            type: ['INVOKE', 'DEPLOY', 'DECLARE'][Math.floor(Math.random() * 3)],
            sender_address: `0x${Math.random().toString(16).substr(2, 40)}`,
            calldata: [`0x${Math.random().toString(16).substr(2, 8)}`],
            signature: [`0x${Math.random().toString(16).substr(2, 64)}`],
            max_fee: (Math.random() * 1000000).toString(),
            version: '1',
            nonce: Math.floor(Math.random() * 100).toString()
          });
        }
        break;
        
      case 'events':
        for (let i = 0; i < 1000; i++) {
          mockData.push({
            transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            event_index: i % 10,
            from_address: `0x${Math.random().toString(16).substr(2, 40)}`,
            keys: [`0x${Math.random().toString(16).substr(2, 64)}`],
            data: [`0x${Math.random().toString(16).substr(2, 8)}`],
            block_number: 100000 + Math.floor(i / 10),
            timestamp: Date.now() / 1000 - (Math.floor(i / 10) * 12)
          });
        }
        break;
        
      case 'contracts':
        for (let i = 0; i < 200; i++) {
          mockData.push({
            contract_address: `0x${Math.random().toString(16).substr(2, 40)}`,
            class_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            deployed_at_block: 100000 + i,
            deployer_address: `0x${Math.random().toString(16).substr(2, 40)}`,
            constructor_calldata: [`0x${Math.random().toString(16).substr(2, 8)}`]
          });
        }
        break;
        
      case 'storage_diffs':
        for (let i = 0; i < 800; i++) {
          mockData.push({
            contract_address: `0x${Math.random().toString(16).substr(2, 40)}`,
            storage_key: `0x${Math.random().toString(16).substr(2, 64)}`,
            old_value: `0x${Math.random().toString(16).substr(2, 64)}`,
            new_value: `0x${Math.random().toString(16).substr(2, 64)}`,
            block_number: 100000 + Math.floor(i / 4),
            transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`
          });
        }
        break;
        
      default:
        throw new Error(`Unknown table: ${primaryTable}`);
    }
    
    return mockData;
  }

  private applyWhereConditions(data: any[], conditions: any[]): any[] {
    if (conditions.length === 0) return data;
    
    return data.filter(row => {
      for (const condition of conditions) {
        const value = row[condition.column];
        const conditionValue = condition.value.replace(/['"]/g, ''); // Remove quotes
        
        let matches = false;
        switch (condition.operator.toUpperCase()) {
          case '=':
            matches = value == conditionValue;
            break;
          case '!=':
          case '<>':
            matches = value != conditionValue;
            break;
          case '<':
            matches = value < parseFloat(conditionValue);
            break;
          case '>':
            matches = value > parseFloat(conditionValue);
            break;
          case '<=':
            matches = value <= parseFloat(conditionValue);
            break;
          case '>=':
            matches = value >= parseFloat(conditionValue);
            break;
          case 'LIKE':
            matches = String(value).toLowerCase().includes(conditionValue.toLowerCase());
            break;
          default:
            matches = true;
        }
        
        if (!matches) return false;
      }
      return true;
    });
  }

  private applyJoins(data: any[], joins: any[]): any[] {
    // Simplified JOIN implementation
    return data; // For now, return original data
  }

  private applyGroupBy(data: any[], groupBy: string[]): any[] {
    if (groupBy.length === 0) return data;
    
    const grouped = new Map();
    
    for (const row of data) {
      const key = groupBy.map(col => row[col]).join('|');
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(row);
    }
    
    return Array.from(grouped.values()).map(group => group[0]); // Return first item from each group
  }

  private applyOrderBy(data: any[], orderBy: any[]): any[] {
    if (orderBy.length === 0) return data;
    
    return data.sort((a, b) => {
      for (const order of orderBy) {
        const aVal = a[order.column];
        const bVal = b[order.column];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
        
        if (order.direction === 'DESC') comparison *= -1;
        
        if (comparison !== 0) return comparison;
      }
      return 0;
    });
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userHistory = this.executionHistory.get(userId) || [];
    
    // Remove executions older than 1 minute
    const recentExecutions = userHistory.filter(time => now - time < 60000);
    
    if (recentExecutions.length >= this.config.rateLimitPerMinute) {
      return false;
    }
    
    recentExecutions.push(now);
    this.executionHistory.set(userId, recentExecutions);
    return true;
  }

  private trackExecution(userId: string, executionTime: number): void {
    // Track execution for analytics/monitoring
    console.log(`User ${userId} executed query in ${executionTime}ms`);
  }

  getResourceUsage(): ResourceUsage {
    return { ...this.resourceUsage };
  }

  resetResourceUsage(): void {
    this.resourceUsage = {
      executionTime: 0,
      memoryUsed: 0,
      rowsProcessed: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  updateConfig(newConfig: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): SandboxConfig {
    return { ...this.config };
  }
}

export const querySandbox = new QueryExecutionSandbox();
