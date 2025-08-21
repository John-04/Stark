import { Pool, PoolClient, QueryResult } from 'pg';
import { ParsedQuery } from './sqlParser';
import { BlockData, TransactionData, EventData, ContractData, StorageDiffData } from './starknetSync';

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number; // maximum number of clients in the pool
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface TableSchema {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    indexed: boolean;
  }>;
  indexes: string[];
}

export class PostgreSQLClient {
  private pool: Pool | null = null;
  private isConnected = false;
  private schemas: Map<string, TableSchema> = new Map();

  constructor(private config: PostgresConfig) {}

  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl,
        max: this.config.max || 20,
        idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      console.log('Connected to PostgreSQL database');

      // Initialize schemas
      await this.initializeSchemas();
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('Disconnected from PostgreSQL database');
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    try {
      return await client.query(query, params);
    } finally {
      client.release();
    }
  }

  async executeParsedQuery(parsedQuery: ParsedQuery): Promise<any[]> {
    const sqlQuery = this.buildSQLFromParsed(parsedQuery);
    const result = await this.executeQuery(sqlQuery);
    return result.rows;
  }

  private buildSQLFromParsed(parsedQuery: ParsedQuery): string {
    let sql = `SELECT ${parsedQuery.columns.join(', ')} FROM ${parsedQuery.tables.join(', ')}`;

    // Add JOINs
    for (const join of parsedQuery.joins) {
      sql += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
    }

    // Add WHERE clause
    if (parsedQuery.conditions.length > 0) {
      sql += ' WHERE ';
      const conditions = parsedQuery.conditions.map(cond => {
        let condStr = `${cond.column} ${cond.operator} $${parsedQuery.conditions.indexOf(cond) + 1}`;
        if (cond.logicalOperator) {
          condStr += ` ${cond.logicalOperator}`;
        }
        return condStr;
      });
      sql += conditions.join(' ');
    }

    // Add GROUP BY
    if (parsedQuery.groupBy.length > 0) {
      sql += ` GROUP BY ${parsedQuery.groupBy.join(', ')}`;
    }

    // Add ORDER BY
    if (parsedQuery.orderBy.length > 0) {
      const orderClauses = parsedQuery.orderBy.map(order => `${order.column} ${order.direction}`);
      sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // Add LIMIT and OFFSET
    if (parsedQuery.limit) {
      sql += ` LIMIT ${parsedQuery.limit}`;
      if (parsedQuery.offset) {
        sql += ` OFFSET ${parsedQuery.offset}`;
      }
    }

    return sql;
  }

  async initializeSchemas(): Promise<void> {
    await this.createTablesIfNotExist();
    await this.loadSchemas();
  }

  private async createTablesIfNotExist(): Promise<void> {
    const createQueries = [
      // Blocks table
      `CREATE TABLE IF NOT EXISTS blocks (
        block_hash VARCHAR(66) PRIMARY KEY,
        block_number BIGINT UNIQUE NOT NULL,
        timestamp BIGINT NOT NULL,
        parent_hash VARCHAR(66),
        sequencer_address VARCHAR(66),
        state_root VARCHAR(66),
        transaction_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Transactions table
      `CREATE TABLE IF NOT EXISTS transactions (
        transaction_hash VARCHAR(66) PRIMARY KEY,
        block_number BIGINT NOT NULL,
        transaction_index INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        sender_address VARCHAR(66),
        calldata TEXT[],
        signature TEXT[],
        max_fee VARCHAR(100),
        version VARCHAR(10),
        nonce VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (block_number) REFERENCES blocks(block_number)
      )`,

      // Events table
      `CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        transaction_hash VARCHAR(66) NOT NULL,
        event_index INTEGER NOT NULL,
        from_address VARCHAR(66) NOT NULL,
        keys TEXT[],
        data TEXT[],
        block_number BIGINT NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_hash) REFERENCES transactions(transaction_hash),
        FOREIGN KEY (block_number) REFERENCES blocks(block_number)
      )`,

      // Contracts table
      `CREATE TABLE IF NOT EXISTS contracts (
        contract_address VARCHAR(66) PRIMARY KEY,
        class_hash VARCHAR(66) NOT NULL,
        deployed_at_block BIGINT NOT NULL,
        deployer_address VARCHAR(66),
        constructor_calldata TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deployed_at_block) REFERENCES blocks(block_number)
      )`,

      // Storage diffs table
      `CREATE TABLE IF NOT EXISTS storage_diffs (
        id SERIAL PRIMARY KEY,
        contract_address VARCHAR(66) NOT NULL,
        storage_key VARCHAR(66) NOT NULL,
        old_value VARCHAR(66),
        new_value VARCHAR(66),
        block_number BIGINT NOT NULL,
        transaction_hash VARCHAR(66) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_address) REFERENCES contracts(contract_address),
        FOREIGN KEY (block_number) REFERENCES blocks(block_number),
        FOREIGN KEY (transaction_hash) REFERENCES transactions(transaction_hash)
      )`
    ];

    for (const query of createQueries) {
      await this.executeQuery(query);
    }

    // Create indexes for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_blocks_number ON blocks(block_number)',
      'CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_block ON transactions(block_number)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_address)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)',
      'CREATE INDEX IF NOT EXISTS idx_events_transaction ON events(transaction_hash)',
      'CREATE INDEX IF NOT EXISTS idx_events_from_address ON events(from_address)',
      'CREATE INDEX IF NOT EXISTS idx_events_block ON events(block_number)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_class_hash ON contracts(class_hash)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_deployed_at ON contracts(deployed_at_block)',
      'CREATE INDEX IF NOT EXISTS idx_storage_diffs_contract ON storage_diffs(contract_address)',
      'CREATE INDEX IF NOT EXISTS idx_storage_diffs_key ON storage_diffs(storage_key)',
      'CREATE INDEX IF NOT EXISTS idx_storage_diffs_block ON storage_diffs(block_number)'
    ];

    for (const query of indexQueries) {
      await this.executeQuery(query);
    }

    console.log('Database tables and indexes created successfully');
  }

  private async loadSchemas(): Promise<void> {
    const schemaQuery = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        CASE WHEN idx.column_name IS NOT NULL THEN true ELSE false END as is_indexed
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      LEFT JOIN (
        SELECT DISTINCT
          t.relname as table_name,
          a.attname as column_name
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = ANY(ix.indkey)
        WHERE t.relkind = 'r'
      ) idx ON c.table_name = idx.table_name AND c.column_name = idx.column_name
      WHERE t.table_schema = 'public' 
      AND t.table_name IN ('blocks', 'transactions', 'events', 'contracts', 'storage_diffs')
      ORDER BY t.table_name, c.ordinal_position
    `;

    const result = await this.executeQuery(schemaQuery);
    const schemaMap = new Map<string, any[]>();

    // Group columns by table
    for (const row of result.rows) {
      if (!schemaMap.has(row.table_name)) {
        schemaMap.set(row.table_name, []);
      }
      schemaMap.get(row.table_name)!.push(row);
    }

    // Convert to TableSchema objects
    for (const [tableName, columns] of schemaMap.entries()) {
      const schema: TableSchema = {
        tableName,
        columns: columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          primaryKey: col.is_primary_key,
          indexed: col.is_indexed
        })),
        indexes: columns.filter(col => col.is_indexed).map(col => col.column_name)
      };
      this.schemas.set(tableName, schema);
    }

    console.log('Database schemas loaded successfully');
  }

  // Data insertion methods
  async insertBlock(blockData: BlockData): Promise<void> {
    const query = `
      INSERT INTO blocks (block_hash, block_number, timestamp, parent_hash, sequencer_address, state_root, transaction_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (block_hash) DO UPDATE SET
        timestamp = EXCLUDED.timestamp,
        parent_hash = EXCLUDED.parent_hash,
        sequencer_address = EXCLUDED.sequencer_address,
        state_root = EXCLUDED.state_root,
        transaction_count = EXCLUDED.transaction_count
    `;

    await this.executeQuery(query, [
      blockData.block_hash,
      blockData.block_number,
      blockData.timestamp,
      blockData.parent_hash,
      blockData.sequencer_address,
      blockData.state_root,
      blockData.transaction_count
    ]);
  }

  async insertTransaction(txData: TransactionData): Promise<void> {
    const query = `
      INSERT INTO transactions (transaction_hash, block_number, transaction_index, type, sender_address, calldata, signature, max_fee, version, nonce)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (transaction_hash) DO UPDATE SET
        block_number = EXCLUDED.block_number,
        transaction_index = EXCLUDED.transaction_index,
        type = EXCLUDED.type,
        sender_address = EXCLUDED.sender_address,
        calldata = EXCLUDED.calldata,
        signature = EXCLUDED.signature,
        max_fee = EXCLUDED.max_fee,
        version = EXCLUDED.version,
        nonce = EXCLUDED.nonce
    `;

    await this.executeQuery(query, [
      txData.transaction_hash,
      txData.block_number,
      txData.transaction_index,
      txData.type,
      txData.sender_address,
      txData.calldata,
      txData.signature,
      txData.max_fee,
      txData.version,
      txData.nonce
    ]);
  }

  async insertEvent(eventData: EventData): Promise<void> {
    const query = `
      INSERT INTO events (transaction_hash, event_index, from_address, keys, data, block_number, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await this.executeQuery(query, [
      eventData.transaction_hash,
      eventData.event_index,
      eventData.from_address,
      eventData.keys,
      eventData.data,
      eventData.block_number,
      eventData.timestamp
    ]);
  }

  async insertContract(contractData: ContractData): Promise<void> {
    const query = `
      INSERT INTO contracts (contract_address, class_hash, deployed_at_block, deployer_address, constructor_calldata)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (contract_address) DO UPDATE SET
        class_hash = EXCLUDED.class_hash,
        deployed_at_block = EXCLUDED.deployed_at_block,
        deployer_address = EXCLUDED.deployer_address,
        constructor_calldata = EXCLUDED.constructor_calldata
    `;

    await this.executeQuery(query, [
      contractData.contract_address,
      contractData.class_hash,
      contractData.deployed_at_block,
      contractData.deployer_address,
      contractData.constructor_calldata
    ]);
  }

  async insertStorageDiff(storageDiff: StorageDiffData): Promise<void> {
    const query = `
      INSERT INTO storage_diffs (contract_address, storage_key, old_value, new_value, block_number, transaction_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await this.executeQuery(query, [
      storageDiff.contract_address,
      storageDiff.storage_key,
      storageDiff.old_value,
      storageDiff.new_value,
      storageDiff.block_number,
      storageDiff.transaction_hash
    ]);
  }

  // Batch insertion methods for better performance
  async batchInsertBlocks(blocks: BlockData[]): Promise<void> {
    if (blocks.length === 0) return;

    const client = await this.pool!.connect();
    try {
      await client.query('BEGIN');
      
      for (const block of blocks) {
        await this.insertBlock(block);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async batchInsertTransactions(transactions: TransactionData[]): Promise<void> {
    if (transactions.length === 0) return;

    const client = await this.pool!.connect();
    try {
      await client.query('BEGIN');
      
      for (const tx of transactions) {
        await this.insertTransaction(tx);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getSchema(tableName: string): TableSchema | undefined {
    return this.schemas.get(tableName);
  }

  getAllSchemas(): Map<string, TableSchema> {
    return new Map(this.schemas);
  }

  isConnected(): boolean {
    return this.isConnected;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      if (!this.pool) {
        return { connected: false, error: 'Pool not initialized' };
      }

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      return { connected: true };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Default configuration for local development
export const defaultPostgresConfig: PostgresConfig = {
  host: 'localhost',
  port: 5432,
  database: 'starknet_data',
  user: 'postgres',
  password: 'password',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};

export const postgresClient = new PostgreSQLClient(defaultPostgresConfig);
