import { Database } from 'sqlite';
import { logger } from '../utils/logger';

export interface StarkNetBlock {
  block_hash: string;
  block_number: number;
  timestamp: Date;
  parent_hash: string;
  sequencer_address: string;
  state_root: string;
  transaction_count: number;
}

export interface StarkNetTransaction {
  transaction_hash: string;
  block_number: number;
  transaction_index: number;
  type: string;
  sender_address: string;
  calldata: string;
  signature: string;
  max_fee: string;
  version: string;
  nonce: string;
}

export interface StarkNetEvent {
  transaction_hash: string;
  event_index: number;
  from_address: string;
  keys: string;
  data: string;
  block_number: number;
  timestamp: Date;
}

export interface StarkNetContract {
  contract_address: string;
  class_hash: string;
  deployed_at_block: number;
  deployer_address: string;
  constructor_calldata: string;
}

export interface StarkNetStorageDiff {
  contract_address: string;
  storage_key: string;
  old_value: string;
  new_value: string;
  block_number: number;
  transaction_hash: string;
}

export class StarkNetDataSchema {
  constructor(private db: Database) {}

  async initializeSchema(): Promise<void> {
    try {
      await this.createTables();
      await this.createIndexes();
      logger.info('StarkNet data schema initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize StarkNet data schema:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // Blocks table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS blocks (
        block_hash TEXT PRIMARY KEY,
        block_number INTEGER UNIQUE NOT NULL,
        timestamp DATETIME NOT NULL,
        parent_hash TEXT NOT NULL,
        sequencer_address TEXT NOT NULL,
        state_root TEXT NOT NULL,
        transaction_count INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_hash TEXT PRIMARY KEY,
        block_number INTEGER NOT NULL,
        transaction_index INTEGER NOT NULL,
        type TEXT NOT NULL,
        sender_address TEXT,
        calldata TEXT,
        signature TEXT,
        max_fee TEXT,
        version TEXT,
        nonce TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (block_number) REFERENCES blocks (block_number)
      )
    `);

    // Events table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_hash TEXT NOT NULL,
        event_index INTEGER NOT NULL,
        from_address TEXT NOT NULL,
        keys TEXT NOT NULL,
        data TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_hash) REFERENCES transactions (transaction_hash),
        FOREIGN KEY (block_number) REFERENCES blocks (block_number)
      )
    `);

    // Contracts table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS contracts (
        contract_address TEXT PRIMARY KEY,
        class_hash TEXT NOT NULL,
        deployed_at_block INTEGER NOT NULL,
        deployer_address TEXT,
        constructor_calldata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deployed_at_block) REFERENCES blocks (block_number)
      )
    `);

    // Storage diffs table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS storage_diffs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_address TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        transaction_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_address) REFERENCES contracts (contract_address),
        FOREIGN KEY (block_number) REFERENCES blocks (block_number),
        FOREIGN KEY (transaction_hash) REFERENCES transactions (transaction_hash)
      )
    `);

    // Query execution history
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS query_executions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query_text TEXT NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        result_size_bytes INTEGER NOT NULL,
        row_count INTEGER NOT NULL,
        cached BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private async createIndexes(): Promise<void> {
    // Block indexes
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_blocks_number ON blocks (block_number)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks (timestamp)');

    // Transaction indexes
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_block ON transactions (block_number)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions (sender_address)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type)');

    // Event indexes
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_events_block ON events (block_number)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_events_from_address ON events (from_address)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_events_transaction ON events (transaction_hash)');

    // Contract indexes
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_contracts_deployed_block ON contracts (deployed_at_block)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_contracts_deployer ON contracts (deployer_address)');

    // Storage diff indexes
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_storage_diffs_contract ON storage_diffs (contract_address)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_storage_diffs_block ON storage_diffs (block_number)');

    // Query execution indexes
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_query_executions_user ON query_executions (user_id)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_query_executions_created ON query_executions (created_at)');
  }

  async insertBlock(block: StarkNetBlock): Promise<void> {
    await this.db.run(`
      INSERT OR REPLACE INTO blocks 
      (block_hash, block_number, timestamp, parent_hash, sequencer_address, state_root, transaction_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      block.block_hash,
      block.block_number,
      block.timestamp.toISOString(),
      block.parent_hash,
      block.sequencer_address,
      block.state_root,
      block.transaction_count
    ]);
  }

  async insertTransaction(transaction: StarkNetTransaction): Promise<void> {
    await this.db.run(`
      INSERT OR REPLACE INTO transactions 
      (transaction_hash, block_number, transaction_index, type, sender_address, calldata, signature, max_fee, version, nonce)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transaction.transaction_hash,
      transaction.block_number,
      transaction.transaction_index,
      transaction.type,
      transaction.sender_address,
      transaction.calldata,
      transaction.signature,
      transaction.max_fee,
      transaction.version,
      transaction.nonce
    ]);
  }

  async insertEvent(event: StarkNetEvent): Promise<void> {
    await this.db.run(`
      INSERT INTO events 
      (transaction_hash, event_index, from_address, keys, data, block_number, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      event.transaction_hash,
      event.event_index,
      event.from_address,
      event.keys,
      event.data,
      event.block_number,
      event.timestamp.toISOString()
    ]);
  }

  async insertContract(contract: StarkNetContract): Promise<void> {
    await this.db.run(`
      INSERT OR REPLACE INTO contracts 
      (contract_address, class_hash, deployed_at_block, deployer_address, constructor_calldata)
      VALUES (?, ?, ?, ?, ?)
    `, [
      contract.contract_address,
      contract.class_hash,
      contract.deployed_at_block,
      contract.deployer_address,
      contract.constructor_calldata
    ]);
  }

  async insertStorageDiff(storageDiff: StarkNetStorageDiff): Promise<void> {
    await this.db.run(`
      INSERT INTO storage_diffs 
      (contract_address, storage_key, old_value, new_value, block_number, transaction_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      storageDiff.contract_address,
      storageDiff.storage_key,
      storageDiff.old_value,
      storageDiff.new_value,
      storageDiff.block_number,
      storageDiff.transaction_hash
    ]);
  }

  async logQueryExecution(
    id: string,
    userId: string,
    queryText: string,
    executionTimeMs: number,
    resultSizeBytes: number,
    rowCount: number,
    cached: boolean = false
  ): Promise<void> {
    await this.db.run(`
      INSERT INTO query_executions 
      (id, user_id, query_text, execution_time_ms, result_size_bytes, row_count, cached)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, queryText, executionTimeMs, resultSizeBytes, rowCount, cached]);
  }

  async getLatestBlockNumber(): Promise<number | null> {
    const result = await this.db.get('SELECT MAX(block_number) as latest FROM blocks');
    return result?.latest || null;
  }

  async getBlockCount(): Promise<number> {
    const result = await this.db.get('SELECT COUNT(*) as count FROM blocks');
    return result?.count || 0;
  }

  async getTransactionCount(): Promise<number> {
    const result = await this.db.get('SELECT COUNT(*) as count FROM transactions');
    return result?.count || 0;
  }

  async getEventCount(): Promise<number> {
    const result = await this.db.get('SELECT COUNT(*) as count FROM events');
    return result?.count || 0;
  }

  async getContractCount(): Promise<number> {
    const result = await this.db.get('SELECT COUNT(*) as count FROM contracts');
    return result?.count || 0;
  }

  async getQueryHistory(userId: string, limit: number, offset: number): Promise<any[]> {
    return await this.db.all(`
      SELECT id, query_text, execution_time_ms, result_size_bytes, row_count, cached, created_at
      FROM query_executions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);
  }

  async getDataStats() {
    return {
      blocks: await this.getBlockCount(),
      transactions: await this.getTransactionCount(),
      events: await this.getEventCount(),
      contracts: await this.getContractCount(),
      latestBlock: await this.getLatestBlockNumber()
    };
  }

  async seedSampleData(): Promise<void> {
    // Insert sample blocks
    const sampleBlocks: StarkNetBlock[] = [
      {
        block_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        block_number: 100000,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        parent_hash: '0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba',
        sequencer_address: '0xsequencer1234567890abcdef1234567890abcdef1234567890abcdef123456',
        state_root: '0xstate1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        transaction_count: 5
      },
      {
        block_hash: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef1',
        block_number: 100001,
        timestamp: new Date('2024-01-01T00:05:00Z'),
        parent_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        sequencer_address: '0xsequencer1234567890abcdef1234567890abcdef1234567890abcdef123456',
        state_root: '0xstate2345678901bcdef12345678901bcdef12345678901bcdef12345678901bc',
        transaction_count: 3
      }
    ];

    for (const block of sampleBlocks) {
      await this.insertBlock(block);
    }

    // Insert sample transactions
    const sampleTransactions: StarkNetTransaction[] = [
      {
        transaction_hash: '0xtx1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
        block_number: 100000,
        transaction_index: 0,
        type: 'INVOKE',
        sender_address: '0xsender1234567890abcdef1234567890abcdef1234567890abcdef123456789',
        calldata: '0xcalldata123',
        signature: '0xsignature123',
        max_fee: '1000000000000000',
        version: '1',
        nonce: '1'
      },
      {
        transaction_hash: '0xtx2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcd',
        block_number: 100000,
        transaction_index: 1,
        type: 'DEPLOY',
        sender_address: '0xsender2345678901bcdef12345678901bcdef12345678901bcdef123456789',
        calldata: '0xcalldata456',
        signature: '0xsignature456',
        max_fee: '2000000000000000',
        version: '1',
        nonce: '2'
      }
    ];

    for (const transaction of sampleTransactions) {
      await this.insertTransaction(transaction);
    }

    logger.info('Sample StarkNet data seeded successfully');
  }
}
