import { ParsedQuery } from './sqlParser';

export interface CacheEntry {
  query: string;
  queryHash: string;
  result: any[];
  timestamp: number;
  executionTime: number;
  hitCount: number;
  lastAccessed: number;
}

export interface QueryOptimization {
  useIndex: boolean;
  suggestedIndexes: string[];
  estimatedRows: number;
  optimizedQuery?: string;
  warnings: string[];
}

export class QueryCache {
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize = 1000;
  private maxCacheAge = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private generateQueryHash(query: string): string {
    // Simple hash function for query caching
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  get(query: string): CacheEntry | null {
    const hash = this.generateQueryHash(query.toLowerCase().trim());
    const entry = this.cache.get(hash);
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxCacheAge) {
      this.cache.delete(hash);
      return null;
    }

    // Update access statistics
    entry.hitCount++;
    entry.lastAccessed = Date.now();
    
    return entry;
  }

  set(query: string, result: any[], executionTime: number): void {
    const hash = this.generateQueryHash(query.toLowerCase().trim());
    const now = Date.now();

    const entry: CacheEntry = {
      query: query.trim(),
      queryHash: hash,
      result: [...result], // Deep copy to prevent mutations
      timestamp: now,
      executionTime,
      hitCount: 0,
      lastAccessed: now
    };

    this.cache.set(hash, entry);

    // Enforce cache size limit
    if (this.cache.size > this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }
  }

  private evictLeastRecentlyUsed(): void {
    let oldestEntry: string | null = null;
    let oldestTime = Date.now();

    for (const [hash, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestEntry = hash;
      }
    }

    if (oldestEntry) {
      this.cache.delete(oldestEntry);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [hash, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxCacheAge) {
        expiredKeys.push(hash);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hitCount, 0),
      averageExecutionTime: entries.length > 0 
        ? entries.reduce((sum, entry) => sum + entry.executionTime, 0) / entries.length 
        : 0,
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(entry => entry.timestamp)) 
        : null
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export class QueryOptimizer {
  private static readonly INDEX_RECOMMENDATIONS = {
    blocks: {
      'block_number': 'Primary key index for efficient block lookups',
      'timestamp': 'Time-based queries and range scans',
      'block_hash': 'Hash-based lookups'
    },
    transactions: {
      'transaction_hash': 'Primary key index for transaction lookups',
      'block_number': 'Block-based filtering and joins',
      'sender_address': 'Address-based queries',
      'type': 'Transaction type filtering'
    },
    events: {
      'transaction_hash': 'Transaction-event joins',
      'from_address': 'Contract event filtering',
      'block_number': 'Block-based event queries'
    },
    contracts: {
      'contract_address': 'Primary key for contract lookups',
      'class_hash': 'Class-based contract queries',
      'deployed_at_block': 'Deployment time filtering'
    },
    storage_diffs: {
      'contract_address': 'Contract storage queries',
      'storage_key': 'Specific storage slot lookups',
      'block_number': 'Historical storage state queries'
    }
  };

  static optimize(parsedQuery: ParsedQuery): QueryOptimization {
    const optimization: QueryOptimization = {
      useIndex: false,
      suggestedIndexes: [],
      estimatedRows: 0,
      warnings: []
    };

    // Analyze table access patterns
    for (const table of parsedQuery.tables) {
      const tableIndexes = this.INDEX_RECOMMENDATIONS[table as keyof typeof this.INDEX_RECOMMENDATIONS];
      if (!tableIndexes) continue;

      // Check if query can benefit from indexes
      for (const condition of parsedQuery.conditions) {
        if (condition.column in tableIndexes) {
          optimization.useIndex = true;
          optimization.suggestedIndexes.push(`${table}.${condition.column}`);
        }
      }

      // Check joins for index opportunities
      for (const join of parsedQuery.joins) {
        const joinColumns = join.on.split(/[=\s]+/).filter(col => col.length > 0);
        for (const col of joinColumns) {
          if (col in tableIndexes) {
            optimization.suggestedIndexes.push(`${table}.${col}`);
          }
        }
      }
    }

    // Estimate result size
    optimization.estimatedRows = this.estimateResultSize(parsedQuery);

    // Generate warnings for potentially expensive operations
    this.generateWarnings(parsedQuery, optimization);

    // Generate optimized query suggestions
    optimization.optimizedQuery = this.generateOptimizedQuery(parsedQuery);

    return optimization;
  }

  private static estimateResultSize(parsedQuery: ParsedQuery): number {
    let baseSize = 1000; // Default estimate

    // Adjust based on table size estimates
    for (const table of parsedQuery.tables) {
      switch (table) {
        case 'blocks':
          baseSize *= 0.1; // Blocks are relatively few
          break;
        case 'transactions':
          baseSize *= 10; // Many transactions per block
          break;
        case 'events':
          baseSize *= 50; // Many events per transaction
          break;
        case 'contracts':
          baseSize *= 0.5; // Moderate number of contracts
          break;
        case 'storage_diffs':
          baseSize *= 20; // Many storage changes
          break;
      }
    }

    // Reduce estimate based on WHERE conditions
    if (parsedQuery.conditions.length > 0) {
      baseSize *= Math.pow(0.1, parsedQuery.conditions.length);
    }

    // Apply LIMIT
    if (parsedQuery.limit) {
      baseSize = Math.min(baseSize, parsedQuery.limit);
    }

    return Math.ceil(baseSize);
  }

  private static generateWarnings(parsedQuery: ParsedQuery, optimization: QueryOptimization): void {
    // Warn about missing WHERE clauses on large tables
    if (parsedQuery.conditions.length === 0) {
      const largeTables = ['transactions', 'events', 'storage_diffs'];
      for (const table of parsedQuery.tables) {
        if (largeTables.includes(table)) {
          optimization.warnings.push(`Consider adding WHERE clause for table '${table}' to improve performance`);
        }
      }
    }

    // Warn about potentially expensive JOINs
    if (parsedQuery.joins.length > 2) {
      optimization.warnings.push('Multiple JOINs detected - consider breaking into smaller queries');
    }

    // Warn about missing LIMIT
    if (!parsedQuery.limit || parsedQuery.limit > 1000) {
      optimization.warnings.push('Consider adding LIMIT clause to prevent large result sets');
    }

    // Warn about ORDER BY without index
    for (const orderBy of parsedQuery.orderBy) {
      let hasIndex = false;
      for (const table of parsedQuery.tables) {
        const indexes = this.INDEX_RECOMMENDATIONS[table as keyof typeof this.INDEX_RECOMMENDATIONS];
        if (indexes && orderBy.column in indexes) {
          hasIndex = true;
          break;
        }
      }
      if (!hasIndex) {
        optimization.warnings.push(`ORDER BY '${orderBy.column}' may be slow without index`);
      }
    }
  }

  private static generateOptimizedQuery(parsedQuery: ParsedQuery): string {
    let optimized = `SELECT ${parsedQuery.columns.join(', ')}\nFROM ${parsedQuery.tables.join(', ')}`;

    // Add JOINs
    for (const join of parsedQuery.joins) {
      optimized += `\n${join.type} JOIN ${join.table} ON ${join.on}`;
    }

    // Add WHERE clause
    if (parsedQuery.conditions.length > 0) {
      optimized += '\nWHERE ';
      const conditions = parsedQuery.conditions.map(cond => {
        let condStr = `${cond.column} ${cond.operator} ${cond.value}`;
        if (cond.logicalOperator) {
          condStr += ` ${cond.logicalOperator}`;
        }
        return condStr;
      });
      optimized += conditions.join(' ');
    }

    // Add GROUP BY
    if (parsedQuery.groupBy.length > 0) {
      optimized += `\nGROUP BY ${parsedQuery.groupBy.join(', ')}`;
    }

    // Add ORDER BY
    if (parsedQuery.orderBy.length > 0) {
      const orderClauses = parsedQuery.orderBy.map(order => `${order.column} ${order.direction}`);
      optimized += `\nORDER BY ${orderClauses.join(', ')}`;
    }

    // Add LIMIT
    if (parsedQuery.limit) {
      optimized += `\nLIMIT ${parsedQuery.limit}`;
      if (parsedQuery.offset) {
        optimized += ` OFFSET ${parsedQuery.offset}`;
      }
    }

    return optimized;
  }
}

export const queryCache = new QueryCache();
