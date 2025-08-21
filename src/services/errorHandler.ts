export enum ErrorType {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  RESOURCE_ERROR = 'RESOURCE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  DATA_ERROR = 'DATA_ERROR'
}

export interface QueryError {
  type: ErrorType;
  message: string;
  code: string;
  details?: any;
  timestamp: number;
  query?: string;
  userId?: string;
  stackTrace?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: QueryError[];
  warnings: string[];
}

export class QueryErrorHandler {
  private errorLog: QueryError[] = [];
  private maxLogSize = 1000;

  validateQuery(query: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Basic syntax validation
    if (!query || query.trim().length === 0) {
      result.errors.push(this.createError(
        ErrorType.SYNTAX_ERROR,
        'Empty query provided',
        'EMPTY_QUERY',
        { query }
      ));
      result.isValid = false;
    }

    // Check for potentially dangerous operations
    const dangerousPatterns = [
      /DROP\s+TABLE/i,
      /DELETE\s+FROM/i,
      /UPDATE\s+\w+\s+SET/i,
      /INSERT\s+INTO/i,
      /CREATE\s+TABLE/i,
      /ALTER\s+TABLE/i,
      /TRUNCATE/i,
      /EXEC\s*\(/i,
      /EXECUTE\s*\(/i,
      /xp_cmdshell/i,
      /sp_executesql/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        result.errors.push(this.createError(
          ErrorType.PERMISSION_ERROR,
          'Query contains prohibited operations',
          'DANGEROUS_OPERATION',
          { pattern: pattern.source, query }
        ));
        result.isValid = false;
      }
    }

    // Check for SQL injection patterns
    const injectionPatterns = [
      /('|(\\'))+.*(;|--|\/\*|\*\/)/i,
      /(union|select).*(from|where)/i,
      /\b(or|and)\s+\d+\s*=\s*\d+/i,
      /\b(or|and)\s+['"].*['"].*['"].*['"]/i,
      /\b(having|where)\s+\d+\s*=\s*\d+/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(query)) {
        result.warnings.push('Query contains patterns that might indicate SQL injection attempt');
        break;
      }
    }

    // Check query length
    if (query.length > 10000) {
      result.warnings.push('Query is very long and may impact performance');
    }

    // Check for missing LIMIT clause on potentially large tables
    const largeTables = ['transactions', 'events', 'storage_diffs'];
    const hasLimitClause = /LIMIT\s+\d+/i.test(query);
    
    if (!hasLimitClause) {
      for (const table of largeTables) {
        if (new RegExp(`FROM\\s+${table}`, 'i').test(query)) {
          result.warnings.push(`Consider adding LIMIT clause when querying ${table} table`);
          break;
        }
      }
    }

    // Check for SELECT * on large tables
    if (/SELECT\s+\*/i.test(query)) {
      for (const table of largeTables) {
        if (new RegExp(`FROM\\s+${table}`, 'i').test(query)) {
          result.warnings.push(`Consider selecting specific columns instead of * from ${table} table`);
          break;
        }
      }
    }

    return result;
  }

  handleExecutionError(error: any, query: string, userId?: string): QueryError {
    let errorType = ErrorType.EXECUTION_ERROR;
    let message = 'Query execution failed';
    let code = 'EXECUTION_FAILED';

    if (error instanceof Error) {
      message = error.message;
      
      // Classify error types based on message content
      if (error.message.includes('timeout')) {
        errorType = ErrorType.TIMEOUT_ERROR;
        code = 'QUERY_TIMEOUT';
      } else if (error.message.includes('rate limit')) {
        errorType = ErrorType.RATE_LIMIT_ERROR;
        code = 'RATE_LIMIT_EXCEEDED';
      } else if (error.message.includes('permission') || error.message.includes('access denied')) {
        errorType = ErrorType.PERMISSION_ERROR;
        code = 'ACCESS_DENIED';
      } else if (error.message.includes('connection')) {
        errorType = ErrorType.CONNECTION_ERROR;
        code = 'CONNECTION_FAILED';
      } else if (error.message.includes('memory') || error.message.includes('resource')) {
        errorType = ErrorType.RESOURCE_ERROR;
        code = 'RESOURCE_EXHAUSTED';
      } else if (error.message.includes('syntax')) {
        errorType = ErrorType.SYNTAX_ERROR;
        code = 'INVALID_SYNTAX';
      } else if (error.message.includes('data') || error.message.includes('column')) {
        errorType = ErrorType.DATA_ERROR;
        code = 'DATA_INVALID';
      }
    }

    const queryError = this.createError(
      errorType,
      message,
      code,
      { originalError: error, query },
      userId,
      query
    );

    this.logError(queryError);
    return queryError;
  }

  private createError(
    type: ErrorType,
    message: string,
    code: string,
    details?: any,
    userId?: string,
    query?: string
  ): QueryError {
    return {
      type,
      message,
      code,
      details,
      timestamp: Date.now(),
      userId,
      query,
      stackTrace: new Error().stack
    };
  }

  private logError(error: QueryError): void {
    this.errorLog.push(error);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console for debugging
    console.error('Query Error:', {
      type: error.type,
      code: error.code,
      message: error.message,
      timestamp: new Date(error.timestamp).toISOString(),
      userId: error.userId
    });
  }

  getErrorLog(limit?: number): QueryError[] {
    const log = [...this.errorLog].reverse(); // Most recent first
    return limit ? log.slice(0, limit) : log;
  }

  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    recentErrors: number;
    topErrors: Array<{ code: string; count: number }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const errorsByType = {} as Record<ErrorType, number>;
    const errorsByCode = new Map<string, number>();
    let recentErrors = 0;

    for (const error of this.errorLog) {
      // Count by type
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      
      // Count by code
      errorsByCode.set(error.code, (errorsByCode.get(error.code) || 0) + 1);
      
      // Count recent errors
      if (error.timestamp > oneHourAgo) {
        recentErrors++;
      }
    }

    // Get top 5 most common errors
    const topErrors = Array.from(errorsByCode.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      recentErrors,
      topErrors
    };
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Helper method to create user-friendly error messages
  getUserFriendlyMessage(error: QueryError): string {
    switch (error.type) {
      case ErrorType.SYNTAX_ERROR:
        return `SQL syntax error: ${error.message}. Please check your query syntax.`;
      
      case ErrorType.VALIDATION_ERROR:
        return `Query validation failed: ${error.message}`;
      
      case ErrorType.TIMEOUT_ERROR:
        return 'Query execution timed out. Try simplifying your query or adding more specific WHERE conditions.';
      
      case ErrorType.RATE_LIMIT_ERROR:
        return 'You have exceeded the rate limit. Please wait a moment before executing another query.';
      
      case ErrorType.PERMISSION_ERROR:
        return `Access denied: ${error.message}. You may not have permission to access the requested data.`;
      
      case ErrorType.RESOURCE_ERROR:
        return 'Query requires too many resources. Try limiting your result set or simplifying the query.';
      
      case ErrorType.CONNECTION_ERROR:
        return 'Unable to connect to the database. Please try again later.';
      
      case ErrorType.DATA_ERROR:
        return `Data error: ${error.message}. Please check your column names and data types.`;
      
      default:
        return `Query execution failed: ${error.message}`;
    }
  }

  // Method to suggest fixes for common errors
  getSuggestions(error: QueryError): string[] {
    const suggestions: string[] = [];

    switch (error.type) {
      case ErrorType.SYNTAX_ERROR:
        suggestions.push('Check for missing commas, parentheses, or quotes');
        suggestions.push('Verify that all keywords are spelled correctly');
        suggestions.push('Make sure table and column names exist');
        break;

      case ErrorType.TIMEOUT_ERROR:
        suggestions.push('Add WHERE clauses to filter data');
        suggestions.push('Use LIMIT to reduce result set size');
        suggestions.push('Consider breaking complex queries into smaller parts');
        break;

      case ErrorType.RESOURCE_ERROR:
        suggestions.push('Reduce the LIMIT value');
        suggestions.push('Add more specific WHERE conditions');
        suggestions.push('Avoid SELECT * on large tables');
        break;

      case ErrorType.PERMISSION_ERROR:
        suggestions.push('Check if you have access to the requested tables');
        suggestions.push('Only SELECT operations are allowed in the sandbox');
        break;

      case ErrorType.DATA_ERROR:
        suggestions.push('Verify column names match the table schema');
        suggestions.push('Check data types in WHERE conditions');
        suggestions.push('Use appropriate comparison operators');
        break;
    }

    return suggestions;
  }
}

export const errorHandler = new QueryErrorHandler();
