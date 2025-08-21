export interface ParsedQuery {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER';
  tables: string[];
  columns: string[];
  conditions: WhereCondition[];
  joins: JoinClause[];
  orderBy: OrderByClause[];
  groupBy: string[];
  having: WhereCondition[];
  limit?: number;
  offset?: number;
  isValid: boolean;
  errors: string[];
  estimatedComplexity: number;
}

export interface WhereCondition {
  column: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  on: string;
}

export interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

// StarkNet specific table schemas
export const STARKNET_SCHEMAS = {
  blocks: {
    columns: ['block_hash', 'block_number', 'timestamp', 'parent_hash', 'sequencer_address', 'state_root', 'transaction_count'],
    indexed: ['block_number', 'timestamp', 'block_hash']
  },
  transactions: {
    columns: ['transaction_hash', 'block_number', 'transaction_index', 'type', 'sender_address', 'calldata', 'signature', 'max_fee', 'version', 'nonce'],
    indexed: ['transaction_hash', 'block_number', 'sender_address', 'type']
  },
  events: {
    columns: ['transaction_hash', 'event_index', 'from_address', 'keys', 'data', 'block_number', 'timestamp'],
    indexed: ['transaction_hash', 'from_address', 'block_number']
  },
  contracts: {
    columns: ['contract_address', 'class_hash', 'deployed_at_block', 'deployer_address', 'constructor_calldata'],
    indexed: ['contract_address', 'class_hash', 'deployed_at_block']
  },
  storage_diffs: {
    columns: ['contract_address', 'storage_key', 'old_value', 'new_value', 'block_number', 'transaction_hash'],
    indexed: ['contract_address', 'storage_key', 'block_number']
  }
};

export class StarkNetSQLParser {
  private keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'ON',
    'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'AND', 'OR',
    'IN', 'NOT', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN'
  ];

  private operators = ['=', '!=', '<>', '<', '>', '<=', '>=', 'LIKE', 'IN', 'BETWEEN', 'IS'];

  parse(query: string): ParsedQuery {
    const result: ParsedQuery = {
      type: 'SELECT',
      tables: [],
      columns: [],
      conditions: [],
      joins: [],
      orderBy: [],
      groupBy: [],
      having: [],
      isValid: true,
      errors: [],
      estimatedComplexity: 0
    };

    try {
      const normalizedQuery = this.normalizeQuery(query);
      const tokens = this.tokenize(normalizedQuery);
      
      if (tokens.length === 0) {
        result.isValid = false;
        result.errors.push('Empty query');
        return result;
      }

      // Determine query type
      result.type = this.getQueryType(tokens[0]);
      
      // Validate query type (only allow SELECT for safety)
      if (result.type !== 'SELECT') {
        result.isValid = false;
        result.errors.push('Only SELECT queries are allowed in the sandbox');
        return result;
      }

      // Parse SELECT query
      this.parseSelectQuery(tokens, result);
      
      // Validate tables exist in StarkNet schema
      this.validateTables(result);
      
      // Calculate complexity
      result.estimatedComplexity = this.calculateComplexity(result);
      
      // Apply resource limits
      this.applyResourceLimits(result);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private normalizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ')
      .trim()
      .toUpperCase();
  }

  private tokenize(query: string): string[] {
    // Simple tokenizer - split by spaces but preserve quoted strings
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < query.length; i++) {
      const char = query[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        current += char;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      tokens.push(current.trim());
    }

    return tokens;
  }

  private getQueryType(firstToken: string): ParsedQuery['type'] {
    switch (firstToken.toUpperCase()) {
      case 'SELECT': return 'SELECT';
      case 'INSERT': return 'INSERT';
      case 'UPDATE': return 'UPDATE';
      case 'DELETE': return 'DELETE';
      case 'CREATE': return 'CREATE';
      case 'DROP': return 'DROP';
      case 'ALTER': return 'ALTER';
      default: return 'SELECT';
    }
  }

  private parseSelectQuery(tokens: string[], result: ParsedQuery): void {
    let i = 1; // Skip SELECT
    
    // Parse columns
    while (i < tokens.length && tokens[i].toUpperCase() !== 'FROM') {
      if (tokens[i] !== ',') {
        result.columns.push(tokens[i]);
      }
      i++;
    }

    if (i >= tokens.length || tokens[i].toUpperCase() !== 'FROM') {
      result.errors.push('Missing FROM clause');
      result.isValid = false;
      return;
    }

    i++; // Skip FROM

    // Parse tables and joins
    while (i < tokens.length) {
      const token = tokens[i].toUpperCase();
      
      if (token === 'WHERE') {
        i++;
        i = this.parseWhereClause(tokens, i, result.conditions);
        break;
      } else if (['INNER', 'LEFT', 'RIGHT', 'FULL'].includes(token)) {
        i = this.parseJoinClause(tokens, i, result.joins);
      } else if (token === 'ORDER') {
        i = this.parseOrderBy(tokens, i, result.orderBy);
        break;
      } else if (token === 'GROUP') {
        i = this.parseGroupBy(tokens, i, result.groupBy);
      } else if (token === 'LIMIT') {
        i = this.parseLimit(tokens, i, result);
        break;
      } else if (!['JOIN', 'BY'].includes(token)) {
        result.tables.push(tokens[i]);
      }
      i++;
    }
  }

  private parseWhereClause(tokens: string[], startIndex: number, conditions: WhereCondition[]): number {
    let i = startIndex;
    
    while (i < tokens.length) {
      const token = tokens[i].toUpperCase();
      
      if (['ORDER', 'GROUP', 'HAVING', 'LIMIT'].includes(token)) {
        break;
      }
      
      if (i + 2 < tokens.length && this.operators.includes(tokens[i + 1].toUpperCase())) {
        conditions.push({
          column: tokens[i],
          operator: tokens[i + 1],
          value: tokens[i + 2],
          logicalOperator: i + 3 < tokens.length && ['AND', 'OR'].includes(tokens[i + 3].toUpperCase()) 
            ? tokens[i + 3].toUpperCase() as 'AND' | 'OR' 
            : undefined
        });
        i += 3;
        if (i < tokens.length && ['AND', 'OR'].includes(tokens[i].toUpperCase())) {
          i++;
        }
      } else {
        i++;
      }
    }
    
    return i;
  }

  private parseJoinClause(tokens: string[], startIndex: number, joins: JoinClause[]): number {
    let i = startIndex;
    const joinType = tokens[i].toUpperCase() as 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
    
    i++; // Skip join type
    if (i < tokens.length && tokens[i].toUpperCase() === 'JOIN') {
      i++; // Skip JOIN
      if (i < tokens.length) {
        const table = tokens[i];
        i++; // Skip table name
        
        if (i < tokens.length && tokens[i].toUpperCase() === 'ON') {
          i++; // Skip ON
          let onClause = '';
          while (i < tokens.length && !['WHERE', 'ORDER', 'GROUP', 'LIMIT', 'INNER', 'LEFT', 'RIGHT', 'FULL'].includes(tokens[i].toUpperCase())) {
            onClause += tokens[i] + ' ';
            i++;
          }
          
          joins.push({
            type: joinType,
            table: table,
            on: onClause.trim()
          });
        }
      }
    }
    
    return i;
  }

  private parseOrderBy(tokens: string[], startIndex: number, orderBy: OrderByClause[]): number {
    let i = startIndex + 1; // Skip ORDER
    if (i < tokens.length && tokens[i].toUpperCase() === 'BY') {
      i++; // Skip BY
      
      while (i < tokens.length && !['GROUP', 'LIMIT'].includes(tokens[i].toUpperCase())) {
        if (tokens[i] !== ',') {
          const column = tokens[i];
          const direction = (i + 1 < tokens.length && ['ASC', 'DESC'].includes(tokens[i + 1].toUpperCase())) 
            ? tokens[i + 1].toUpperCase() as 'ASC' | 'DESC' 
            : 'ASC';
          
          orderBy.push({ column, direction });
          
          if (direction !== 'ASC') {
            i++; // Skip direction if specified
          }
        }
        i++;
      }
    }
    
    return i;
  }

  private parseGroupBy(tokens: string[], startIndex: number, groupBy: string[]): number {
    let i = startIndex + 1; // Skip GROUP
    if (i < tokens.length && tokens[i].toUpperCase() === 'BY') {
      i++; // Skip BY
      
      while (i < tokens.length && !['HAVING', 'ORDER', 'LIMIT'].includes(tokens[i].toUpperCase())) {
        if (tokens[i] !== ',') {
          groupBy.push(tokens[i]);
        }
        i++;
      }
    }
    
    return i;
  }

  private parseLimit(tokens: string[], startIndex: number, result: ParsedQuery): number {
    let i = startIndex + 1; // Skip LIMIT
    
    if (i < tokens.length) {
      const limitValue = parseInt(tokens[i]);
      if (!isNaN(limitValue)) {
        result.limit = limitValue;
        i++;
        
        if (i < tokens.length && tokens[i].toUpperCase() === 'OFFSET') {
          i++; // Skip OFFSET
          if (i < tokens.length) {
            const offsetValue = parseInt(tokens[i]);
            if (!isNaN(offsetValue)) {
              result.offset = offsetValue;
              i++;
            }
          }
        }
      }
    }
    
    return i;
  }

  private validateTables(result: ParsedQuery): void {
    const validTables = Object.keys(STARKNET_SCHEMAS);
    
    for (const table of result.tables) {
      if (!validTables.includes(table.toLowerCase())) {
        result.errors.push(`Unknown table: ${table}. Available tables: ${validTables.join(', ')}`);
        result.isValid = false;
      }
    }
  }

  private calculateComplexity(result: ParsedQuery): number {
    let complexity = 1;
    
    // Base complexity for tables
    complexity += result.tables.length * 2;
    
    // Joins increase complexity significantly
    complexity += result.joins.length * 5;
    
    // Conditions add moderate complexity
    complexity += result.conditions.length * 2;
    
    // Group by and order by add complexity
    complexity += result.groupBy.length * 3;
    complexity += result.orderBy.length * 2;
    
    // Large result sets increase complexity
    if (!result.limit || result.limit > 1000) {
      complexity += 10;
    }
    
    return complexity;
  }

  private applyResourceLimits(result: ParsedQuery): void {
    const MAX_COMPLEXITY = 50;
    const MAX_LIMIT = 10000;
    const DEFAULT_LIMIT = 1000;
    
    if (result.estimatedComplexity > MAX_COMPLEXITY) {
      result.errors.push(`Query too complex (${result.estimatedComplexity}). Maximum allowed: ${MAX_COMPLEXITY}`);
      result.isValid = false;
    }
    
    if (!result.limit) {
      result.limit = DEFAULT_LIMIT;
    } else if (result.limit > MAX_LIMIT) {
      result.errors.push(`LIMIT too large (${result.limit}). Maximum allowed: ${MAX_LIMIT}`);
      result.isValid = false;
    }
  }
}

export const sqlParser = new StarkNetSQLParser();
