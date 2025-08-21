import { Provider, Block, Event, GetTransactionReceiptResponse, GetBlockResponse } from 'starknet';

// Define transaction interface based on StarkNet transaction structure
interface Transaction {
  transaction_hash: string;
  type: string;
  sender_address?: string;
  contract_address?: string;
  calldata?: string[];
  signature?: string[];
  max_fee?: string;
  version?: string;
  nonce?: string;
}

export interface SyncStatus {
  isConnected: boolean;
  currentBlock: number;
  lastSyncedBlock: number;
  syncProgress: number;
  error?: string;
}

export interface BlockData {
  block_hash: string;
  block_number: number;
  timestamp: number;
  parent_hash: string;
  sequencer_address: string;
  state_root: string;
  transaction_count: number;
}

export interface TransactionData {
  transaction_hash: string;
  block_number: number;
  transaction_index: number;
  type: string;
  sender_address: string;
  calldata: string[];
  signature: string[];
  max_fee: string;
  version: string;
  nonce: string;
}

export interface EventData {
  transaction_hash: string;
  event_index: number;
  from_address: string;
  keys: string[];
  data: string[];
  block_number: number;
  timestamp: number;
}

export interface ContractData {
  contract_address: string;
  class_hash: string;
  deployed_at_block: number;
  deployer_address: string;
  constructor_calldata: string[];
}

export interface StorageDiffData {
  contract_address: string;
  storage_key: string;
  old_value: string;
  new_value: string;
  block_number: number;
  transaction_hash: string;
}

export class StarkNetDataSync {
  private provider: Provider;
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: ((type: string, data: any) => void)[] = [];
  private status: SyncStatus = {
    isConnected: false,
    currentBlock: 0,
    lastSyncedBlock: 0,
    syncProgress: 0
  };

  constructor(providerUrl: string = 'https://starknet-mainnet.public.blastapi.io') {
    this.provider = new Provider({ 
      nodeUrl: providerUrl 
    });
  }

  async connect(): Promise<void> {
    try {
      // Test connection by getting the latest block
      const latestBlock = await this.provider.getBlock('latest');
      this.status.isConnected = true;
      this.status.currentBlock = latestBlock.block_number;
      this.status.error = undefined;
      
      console.log('Connected to StarkNet provider');
    } catch (error) {
      this.status.isConnected = false;
      this.status.error = error instanceof Error ? error.message : 'Connection failed';
      throw error;
    }
  }

  async startSync(fromBlock?: number): Promise<void> {
    if (this.isRunning) {
      console.log('Sync already running');
      return;
    }

    await this.connect();
    
    this.isRunning = true;
    this.status.lastSyncedBlock = fromBlock || this.status.currentBlock - 100; // Start from 100 blocks ago if not specified

    // Initial sync
    await this.syncBlocks();

    // Set up periodic sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.syncBlocks();
      }
    }, 30000);

    console.log('StarkNet data sync started');
  }

  stopSync(): void {
    this.isRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('StarkNet data sync stopped');
  }

  private async syncBlocks(): Promise<void> {
    try {
      const latestBlock = await this.provider.getBlock('latest');
      this.status.currentBlock = latestBlock.block_number;

      // Sync blocks from last synced to current
      const blocksToSync = Math.min(
        this.status.currentBlock - this.status.lastSyncedBlock,
        10 // Limit to 10 blocks per sync to avoid overwhelming
      );

      if (blocksToSync <= 0) {
        this.status.syncProgress = 100;
        return;
      }

      for (let i = 0; i < blocksToSync; i++) {
        const blockNumber = this.status.lastSyncedBlock + i + 1;
        await this.syncBlock(blockNumber);
        this.status.lastSyncedBlock = blockNumber;
        
        // Update progress
        this.status.syncProgress = Math.min(
          ((this.status.lastSyncedBlock - (this.status.currentBlock - blocksToSync)) / blocksToSync) * 100,
          100
        );
      }

      this.status.error = undefined;
    } catch (error) {
      this.status.error = error instanceof Error ? error.message : 'Sync error';
      console.error('Sync error:', error);
    }
  }

  private async syncBlock(blockNumber: number): Promise<void> {
    try {
      const block = await this.provider.getBlock(blockNumber);
      const blockData = this.transformBlockData(block);
      
      // Notify listeners about new block (pass transformed block data)
      this.notifyListeners('block', blockData);

      // Sync transactions in this block
      if (block.transactions && block.transactions.length > 0) {
        for (let i = 0; i < block.transactions.length; i++) {
          const txHash = typeof block.transactions[i] === 'string' 
            ? block.transactions[i] as string
            : (block.transactions[i] as any).transaction_hash;
          
          await this.syncTransaction(txHash, blockNumber, i);
        }
      }
    } catch (error) {
      console.error(`Error syncing block ${blockNumber}:`, error);
    }
  }

  private async syncTransaction(txHash: string, blockNumber: number, txIndex: number): Promise<void> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      const txData = this.transformTransactionData(tx, blockNumber, txIndex);
      this.notifyListeners('transaction', txData);

      // Sync events from this transaction
      // In StarkNet v7+, events are in different locations depending on receipt type
      const events = this.extractEventsFromReceipt(receipt);
      if (events && events.length > 0) {
        for (let i = 0; i < events.length; i++) {
          const eventData = this.transformEventData(events[i], txHash, i, blockNumber);
          this.notifyListeners('event', eventData);
        }
      }

      // Check for contract deployments
      if (tx.type === 'DEPLOY_ACCOUNT' || tx.type === 'DEPLOY') {
        const contractData = this.transformContractData(tx, blockNumber);
        if (contractData) {
          this.notifyListeners('contract', contractData);
        }
      }

    } catch (error) {
      console.error(`Error syncing transaction ${txHash}:`, error);
    }
  }

  private transformBlockData(blockResponse: GetBlockResponse): BlockData {
    return {
      block_hash: blockResponse.block_hash || '',
      block_number: blockResponse.block_number || 0,
      timestamp: blockResponse.timestamp || Date.now() / 1000,
      parent_hash: blockResponse.parent_hash || '',
      sequencer_address: blockResponse.sequencer_address || '',
      state_root: blockResponse.new_root || '',
      transaction_count: Array.isArray(blockResponse.transactions) ? blockResponse.transactions.length : 0
    };
  }

  private transformTransactionData(tx: Transaction, blockNumber: number, txIndex: number): TransactionData {
    return {
      transaction_hash: tx.transaction_hash || '',
      block_number: blockNumber,
      transaction_index: txIndex,
      type: tx.type || 'UNKNOWN',
      sender_address: (tx as any).sender_address || (tx as any).contract_address || '',
      calldata: (tx as any).calldata || [],
      signature: (tx as any).signature || [],
      max_fee: (tx as any).max_fee || '0',
      version: (tx as any).version || '0',
      nonce: (tx as any).nonce || '0'
    };
  }

  private transformEventData(event: Event, txHash: string, eventIndex: number, blockNumber: number): EventData {
    return {
      transaction_hash: txHash,
      event_index: eventIndex,
      from_address: event.from_address || '',
      keys: event.keys || [],
      data: event.data || [],
      block_number: blockNumber,
      timestamp: Date.now() / 1000
    };
  }

  private transformContractData(tx: Transaction, blockNumber: number): ContractData | null {
    if (tx.type !== 'DEPLOY_ACCOUNT' && tx.type !== 'DEPLOY') {
      return null;
    }

    return {
      contract_address: (tx as any).contract_address || '',
      class_hash: (tx as any).class_hash || '',
      deployed_at_block: blockNumber,
      deployer_address: (tx as any).sender_address || '',
      constructor_calldata: (tx as any).constructor_calldata || []
    };
  }


  addListener(callback: (type: string, data: any) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (type: string, data: any) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(type: string, data: any): void {
    for (const listener of this.listeners) {
      try {
        listener(type, data);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    }
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  async getBlockRange(fromBlock: number, toBlock: number): Promise<BlockData[]> {
    const blocks: BlockData[] = [];
    
    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
      try {
        const block = await this.provider.getBlock(blockNumber);
        blocks.push(this.transformBlockData(block));
      } catch (error) {
        console.error(`Error fetching block ${blockNumber}:`, error);
      }
    }
    
    return blocks;
  }

  async getTransactionsByBlock(blockNumber: number): Promise<TransactionData[]> {
    try {
      const block = await this.provider.getBlock(blockNumber);
      const transactions: TransactionData[] = [];
      
      if (block.transactions && block.transactions.length > 0) {
        for (let i = 0; i < block.transactions.length; i++) {
          const txHash = typeof block.transactions[i] === 'string' 
            ? block.transactions[i] as string
            : (block.transactions[i] as any).transaction_hash;
          
          const tx = await this.provider.getTransaction(txHash);
          transactions.push(this.transformTransactionData(tx, blockNumber, i));
        }
      }
      
      return transactions;
    } catch (error) {
      console.error(`Error fetching transactions for block ${blockNumber}:`, error);
      return [];
    }
  }

  private extractEventsFromReceipt(receipt: GetTransactionReceiptResponse): Event[] {
    // In StarkNet v7+, events can be in different locations depending on receipt type
    if ('events' in receipt && Array.isArray(receipt.events)) {
      return receipt.events as Event[];
    }
    
    // For invoke receipts, events might be in execution_resources
    if ('execution_resources' in receipt && 
        receipt.execution_resources && 
        typeof receipt.execution_resources === 'object' &&
        receipt.execution_resources !== null &&
        'events' in receipt.execution_resources) {
      return (receipt.execution_resources as any).events || [];
    }
    
    // Check if it's a successful receipt with events
    // Use finality_status or execution_result instead of execution_status
    const isSuccessful = ('finality_status' in receipt && receipt.finality_status === 'ACCEPTED_ON_L2') ||
                        ('finality_status' in receipt && receipt.finality_status === 'ACCEPTED_ON_L1') ||
                        ('execution_result' in receipt && (receipt as any).execution_result?.status === 'SUCCEEDED');
    
    if (isSuccessful && 'events' in receipt) {
      return (receipt as any).events || [];
    }
    
    return [];
  }

  async getEventsByTransaction(txHash: string): Promise<EventData[]> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      const events: EventData[] = [];
      
      // Safely extract block number from receipt
      let blockNumber = 0;
      if ('block_number' in receipt && receipt.block_number) {
        // Handle different possible types for block_number
        const blockNum = receipt.block_number;
        if (typeof blockNum === 'number') {
          blockNumber = blockNum;
        } else if (typeof blockNum === 'string') {
          blockNumber = parseInt(blockNum, 10);
        } else if (typeof blockNum === 'object' && blockNum !== null && 'toString' in blockNum) {
          // Handle BigInt or other numeric objects
          blockNumber = Number(blockNum.toString());
        }
      } else if ('block_hash' in receipt && receipt.block_hash) {
        // If block_number not available but block_hash is, fetch the block
        try {
          // Safely extract block hash string
          let blockHash: string;
          const hashValue = receipt.block_hash;
          
          if (typeof hashValue === 'string') {
            blockHash = hashValue;
          } else if (typeof hashValue === 'object' && hashValue !== null && 'toString' in hashValue) {
            blockHash = hashValue.toString();
          } else {
            throw new Error('Invalid block_hash format');
          }
          
          const block = await this.provider.getBlock(blockHash);
          if (block.block_number !== undefined) {
            blockNumber = block.block_number;
          }
        } catch (blockError) {
          console.warn(`Could not fetch block number for transaction ${txHash}:`, blockError);
        }
      }
      
      const extractedEvents = this.extractEventsFromReceipt(receipt);
      if (extractedEvents.length > 0) {
        for (let i = 0; i < extractedEvents.length; i++) {
          events.push(this.transformEventData(extractedEvents[i], txHash, i, blockNumber));
        }
      }
      
      return events;
    } catch (error) {
      console.error(`Error fetching events for transaction ${txHash}:`, error);
      return [];
    }
  }
}

export const starknetSync = new StarkNetDataSync();
