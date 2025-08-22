import { Database } from 'sqlite';
import { logger } from '../utils/logger';
import { z } from 'zod';

export interface QueryResult {
  data: any[];
  columns: string[];
  rowCount: number;
  executionTimeMs: number;
  cached: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface QueryExecutionOptions {
  userId?: string;
  useCache?: boolean;
  timeout?: number;
  maxRows?: number;
}

// Query validation schema
const QuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  options: z.object({
    userId: z.string().optional(),
    useCache: z.boolean().default(true),
    timeout: z.number().min(1000).max(30000).default(10000),
    maxRows: z.number().min(1).max(10000).default(1000)
  }).optional()
});

export class SQLQueryEngine {
  private cache = new Map<string, { result: QueryResult; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DANGEROUS_KEYWORDS = [
    'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 
    'REPLACE', 'MERGE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
  ];

  constructor(private db: Database) {}

  async executeQuery(
    query: string, 
    options: QueryExecutionOptions = {}
  ): Promise<QueryResult> {
    const startTime = Date.now();
    
    // Validate input
    const validation = QuerySchema.safeParse({ query, options });
    if (!validation.success) {
      throw new Error(`Invalid query parameters: ${validation.error.message}`);
    }

    const { useCache = true, timeout = 10000, maxRows = 1000 } = options;

    // Check cache first
    if (useCache) {
      const cached = this.getCachedResult(query);
      if (cached) {
        return cached;
      }
    }

    // Validate query safety
    const validationResult = await this.validateQuery(query);
    if (!validationResult.isValid) {
      throw new Error(`Query validation failed: ${validationResult.errors.join(', ')}`);
    }

    try {
      // Set query timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout exceeded')), timeout);
      });

      // Execute query with limit
      const limitedQuery = this.addLimitToQuery(query, maxRows);
      const queryPromise = this.db.all(limitedQuery);

      const rows = await Promise.race([queryPromise, timeoutPromise]);
      const executionTime = Date.now() - startTime;

      // Get column names
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      const result: QueryResult = {
        data: rows,
        columns,
        rowCount: rows.length,
        executionTimeMs: executionTime,
        cached: false
      };

      // Cache successful results
      if (useCache && executionTime < 5000) { // Only cache fast queries
        this.cacheResult(query, result);
      }

      logger.info(`Query executed successfully in ${executionTime}ms`, {
        userId: options.userId,
        rowCount: rows.length,
        executionTime
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Query execution failed', {
        error: errorMessage,
        query: query.substring(0, 100),
        userId: options.userId,
        executionTime
      });
      throw error;
    }
  }

  async validateQuery(query: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for dangerous keywords
    const upperQuery = query.toUpperCase();
    for (const keyword of this.DANGEROUS_KEYWORDS) {
      if (upperQuery.includes(keyword)) {
        errors.push(`Dangerous operation '${keyword}' is not allowed`);
      }
    }

    // Check for basic SQL syntax
    if (!upperQuery.includes('SELECT')) {
      errors.push('Only SELECT queries are allowed');
    }

    // Check for potential performance issues
    if (!upperQuery.includes('LIMIT') && !upperQuery.includes('WHERE')) {
      warnings.push('Query may return large result set. Consider adding LIMIT or WHERE clause');
    }

    // Check for table existence
    const tables = this.extractTableNames(query);
    for (const table of tables) {
      if (!await this.tableExists(table)) {
        errors.push(`Table '${table}' does not exist`);
      }
    }

    // Suggestions for optimization
    if (upperQuery.includes('SELECT *')) {
      suggestions.push('Consider selecting specific columns instead of using SELECT *');
    }

    if (upperQuery.includes('ORDER BY') && !upperQuery.includes('LIMIT')) {
      suggestions.push('ORDER BY without LIMIT may be slow on large datasets');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  async optimizeQuery(query: string): Promise<string> {
    let optimized = query;

    // Add LIMIT if not present and no aggregation
    if (!query.toUpperCase().includes('LIMIT') && 
        !query.toUpperCase().includes('COUNT') &&
        !query.toUpperCase().includes('SUM') &&
        !query.toUpperCase().includes('AVG')) {
      optimized += ' LIMIT 1000';
    }

    return optimized;
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      availableTables: this.getAvailableTables()
    };
  }

  private getCachedResult(query: string): QueryResult | null {
    const cached = this.cache.get(query);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return { ...cached.result, cached: true };
    }
    
    if (cached) {
      this.cache.delete(query); // Remove expired cache
    }
    
    return null;
  }

  private cacheResult(query: string, result: QueryResult): void {
    // Limit cache size
    if (this.cache.size >= 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(query, {
      result: { ...result, cached: false },
      timestamp: Date.now()
    });
  }

  private addLimitToQuery(query: string, maxRows: number): string {
    const upperQuery = query.toUpperCase();
    if (upperQuery.includes('LIMIT')) {
      return query;
    }
    return `${query} LIMIT ${maxRows}`;
  }

  private extractTableNames(query: string): string[] {
    const regex = /FROM\s+(\w+)/gi;
    const matches = [];
    let match;
    
    while ((match = regex.exec(query)) !== null) {
      matches.push(match[1].toLowerCase());
    }
    
    return matches;
  }

  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return !!result;
    } catch {
      return false;
    }
  }

  private calculateCacheHitRate(): number {
    // This would need to be tracked over time in a real implementation
    return 0.75; // Placeholder
  }

  private async getAvailableTables(): Promise<string[]> {
    try {
      const tables = await this.db.all(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      return tables.map(t => t.name);
    } catch {
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}
