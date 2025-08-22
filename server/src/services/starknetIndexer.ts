import { RpcProvider } from 'starknet';
import { StarkNetDataSchema, StarkNetBlock, StarkNetTransaction, StarkNetEvent, StarkNetContract } from './starknetDataSchema';
import { logger } from '../utils/logger';

export interface IndexerConfig {
  rpcUrl: string;
  startBlock?: number;
  batchSize?: number;
  syncInterval?: number;
}

export class StarkNetIndexer {
  private provider: RpcProvider;
  private isRunning = false;
  private syncInterval?: NodeJS.Timeout;

  constructor(
    private config: IndexerConfig,
    private dataSchema: StarkNetDataSchema
  ) {
    this.provider = new RpcProvider({ nodeUrl: config.rpcUrl });
  }

  async startSync(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Indexer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting StarkNet data synchronization');

    try {
      // Initial sync
      await this.syncLatestBlocks();

      // Set up periodic sync
      if (this.config.syncInterval) {
        this.syncInterval = setInterval(async () => {
          try {
            await this.syncLatestBlocks();
          } catch (error) {
            logger.error('Periodic sync failed:', error);
          }
        }, this.config.syncInterval);
      }

    } catch (error) {
      logger.error('Failed to start sync:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stopSync(): Promise<void> {
    this.isRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    logger.info('StarkNet data synchronization stopped');
  }

  async syncLatestBlocks(): Promise<void> {
    try {
      const latestBlockNumber = await this.provider.getBlockNumber();
      const lastSyncedBlock = await this.dataSchema.getLatestBlockNumber() || this.config.startBlock || 0;
      
      const blocksToSync = Math.min(
        latestBlockNumber - lastSyncedBlock,
        this.config.batchSize || 10
      );

      if (blocksToSync <= 0) {
        logger.debug('No new blocks to sync');
        return;
      }

      logger.info(`Syncing ${blocksToSync} blocks from ${lastSyncedBlock + 1} to ${lastSyncedBlock + blocksToSync}`);

      for (let i = 1; i <= blocksToSync; i++) {
        const blockNumber = lastSyncedBlock + i;
        await this.indexBlock(blockNumber);
      }

      logger.info(`Successfully synced ${blocksToSync} blocks`);

    } catch (error) {
      logger.error('Failed to sync latest blocks:', error);
      throw error;
    }
  }

  async indexBlock(blockNumber: number): Promise<void> {
    try {
      const blockWithTxs = await this.provider.getBlockWithTxs(blockNumber);
      
      // Handle both finalized and pending blocks with proper type checking
      const isPendingBlock = 'status' in blockWithTxs && blockWithTxs.status === 'PENDING';
      
      const block: StarkNetBlock = {
        block_hash: ('block_hash' in blockWithTxs) ? blockWithTxs.block_hash : 'pending',
        block_number: ('block_number' in blockWithTxs && blockWithTxs.block_number !== undefined) 
          ? blockWithTxs.block_number 
          : blockNumber,
        timestamp: new Date(blockWithTxs.timestamp * 1000),
        parent_hash: ('parent_hash' in blockWithTxs) ? blockWithTxs.parent_hash : '0x0',
        sequencer_address: ('sequencer_address' in blockWithTxs) ? blockWithTxs.sequencer_address || '0x0' : '0x0',
        state_root: ('new_root' in blockWithTxs) ? blockWithTxs.new_root || '0x0' : '0x0',
        transaction_count: blockWithTxs.transactions.length
      };

      await this.dataSchema.insertBlock(block);

      // Index transactions
      for (let i = 0; i < blockWithTxs.transactions.length; i++) {
        const tx = blockWithTxs.transactions[i];
        await this.indexTransaction(tx, blockNumber, i);
      }

      logger.debug(`Indexed block ${blockNumber} with ${blockWithTxs.transactions.length} transactions`);

    } catch (error) {
      logger.error(`Failed to index block ${blockNumber}:`, error);
      throw error;
    }
  }

  async indexTransaction(tx: any, blockNumber: number, transactionIndex: number): Promise<void> {
    try {
      const transaction: StarkNetTransaction = {
        transaction_hash: tx.transaction_hash,
        block_number: blockNumber,
        transaction_index: transactionIndex,
        type: tx.type || 'UNKNOWN',
        sender_address: tx.sender_address || tx.contract_address || '0x0',
        calldata: JSON.stringify(tx.calldata || []),
        signature: JSON.stringify(tx.signature || []),
        max_fee: tx.max_fee || '0',
        version: tx.version || '0',
        nonce: tx.nonce || '0'
      };

      await this.dataSchema.insertTransaction(transaction);

      // Get transaction receipt for events
      try {
        const receipt = await this.provider.getTransactionReceipt(tx.transaction_hash);
        // Check if receipt is successful and has events
        // In StarkNet.js v6+, check finality_status and execution_status differently
        const isSuccessful = (
          ('finality_status' in receipt && receipt.finality_status === 'ACCEPTED_ON_L2') ||
          ('finality_status' in receipt && receipt.finality_status === 'ACCEPTED_ON_L1')
        ) && (
          !('execution_status' in receipt) || 
          ('execution_status' in receipt && receipt.execution_status === 'SUCCEEDED')
        );
        
        if (isSuccessful && 'events' in receipt && receipt.events) {
          await this.indexEvents(receipt.events, tx.transaction_hash, blockNumber);
        }
      } catch (receiptError) {
        logger.warn(`Failed to get receipt for transaction ${tx.transaction_hash}:`, receiptError);
      }

      // Index contract deployment if it's a deploy transaction
      if (tx.type === 'DEPLOY' || tx.type === 'DEPLOY_ACCOUNT') {
        await this.indexContractDeployment(tx, blockNumber);
      }

    } catch (error) {
      logger.error(`Failed to index transaction ${tx.transaction_hash}:`, error);
      throw error;
    }
  }

  async indexEvents(events: any[], transactionHash: string, blockNumber: number): Promise<void> {
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      const starknetEvent: StarkNetEvent = {
        transaction_hash: transactionHash,
        event_index: i,
        from_address: event.from_address || '0x0',
        keys: JSON.stringify(event.keys || []),
        data: JSON.stringify(event.data || []),
        block_number: blockNumber,
        timestamp: new Date() // Will be updated with actual block timestamp
      };

      await this.dataSchema.insertEvent(starknetEvent);
    }
  }

  async indexContractDeployment(tx: any, blockNumber: number): Promise<void> {
    try {
      const contract: StarkNetContract = {
        contract_address: tx.contract_address || tx.sender_address,
        class_hash: tx.class_hash || '0x0',
        deployed_at_block: blockNumber,
        deployer_address: tx.sender_address || '0x0',
        constructor_calldata: JSON.stringify(tx.constructor_calldata || tx.calldata || [])
      };

      await this.dataSchema.insertContract(contract);

    } catch (error) {
      logger.error(`Failed to index contract deployment:`, error);
    }
  }

  async backfillBlocks(fromBlock: number, toBlock: number): Promise<void> {
    logger.info(`Starting backfill from block ${fromBlock} to ${toBlock}`);
    
    const batchSize = this.config.batchSize || 10;
    
    for (let start = fromBlock; start <= toBlock; start += batchSize) {
      const end = Math.min(start + batchSize - 1, toBlock);
      
      logger.info(`Backfilling blocks ${start} to ${end}`);
      
      for (let blockNumber = start; blockNumber <= end; blockNumber++) {
        try {
          await this.indexBlock(blockNumber);
        } catch (error) {
          logger.error(`Failed to backfill block ${blockNumber}:`, error);
          // Continue with next block instead of failing entire backfill
        }
      }
      
      // Small delay between batches to avoid overwhelming the RPC
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info(`Backfill completed from block ${fromBlock} to ${toBlock}`);
  }

  async getIndexerStats() {
    const dataStats = await this.dataSchema.getDataStats();
    const latestChainBlock = await this.provider.getBlockNumber();
    
    return {
      ...dataStats,
      latestChainBlock,
      syncProgress: dataStats.latestBlock ? (dataStats.latestBlock / latestChainBlock) * 100 : 0,
      isRunning: this.isRunning,
      rpcUrl: this.config.rpcUrl
    };
  }

  isIndexerRunning(): boolean {
    return this.isRunning;
  }
}
