# StarkNet Data SQL Query Sandbox

A comprehensive SQL query sandbox for analyzing StarkNet blockchain data with real-time synchronization, query optimization, and resource management.

## Features

### 🔍 SQL Parser for StarkNet Data
- Custom SQL parser designed specifically for StarkNet blockchain data
- Supports SELECT queries on blocks, transactions, events, contracts, and storage diffs
- Syntax validation and error reporting
- Query complexity analysis and resource estimation

### ⚡ Query Optimization & Caching
- Intelligent query optimization with index recommendations
- In-memory caching layer for improved performance
- Query execution time tracking and statistics
- Automatic cache invalidation and cleanup

### 🔄 Real-time Data Synchronization
- Live synchronization from StarkNet blockchain
- Configurable sync intervals and block ranges
- Event-driven data updates
- Support for historical data backfill

### 🛡️ Query Execution Sandbox
- Resource limits and timeout protection
- Rate limiting per user
- Memory usage monitoring
- Safe query execution environment

### 🚨 Error Handling & Validation
- Comprehensive error classification and reporting
- SQL injection protection
- Query validation with suggestions
- User-friendly error messages

### 🗄️ PostgreSQL Integration
- Full PostgreSQL database support
- Optimized table schemas for blockchain data
- Batch insertion for performance
- Connection pooling and management

## Available Tables

### `blocks`
- `block_hash` - Unique block identifier
- `block_number` - Sequential block number
- `timestamp` - Block creation timestamp
- `parent_hash` - Previous block hash
- `sequencer_address` - Block sequencer address
- `state_root` - State root hash
- `transaction_count` - Number of transactions in block

### `transactions`
- `transaction_hash` - Unique transaction identifier
- `block_number` - Block containing the transaction
- `transaction_index` - Position within block
- `type` - Transaction type (INVOKE, DEPLOY, etc.)
- `sender_address` - Transaction sender
- `calldata` - Transaction call data
- `signature` - Transaction signature
- `max_fee` - Maximum fee
- `version` - Transaction version
- `nonce` - Transaction nonce

### `events`
- `transaction_hash` - Associated transaction
- `event_index` - Position within transaction
- `from_address` - Contract emitting the event
- `keys` - Event keys
- `data` - Event data
- `block_number` - Block number
- `timestamp` - Event timestamp

### `contracts`
- `contract_address` - Contract address
- `class_hash` - Contract class hash
- `deployed_at_block` - Deployment block number
- `deployer_address` - Deployer address
- `constructor_calldata` - Constructor parameters

### `storage_diffs`
- `contract_address` - Contract address
- `storage_key` - Storage slot key
- `old_value` - Previous value
- `new_value` - Updated value
- `block_number` - Block number
- `transaction_hash` - Associated transaction

## Example Queries

### Recent Blocks
```sql
SELECT block_number, timestamp, transaction_count 
FROM blocks 
ORDER BY block_number DESC 
LIMIT 10;
```

### Transaction Types Analysis
```sql
SELECT type, COUNT(*) as count 
FROM transactions 
GROUP BY type 
ORDER BY count DESC;
```

### Contract Activity
```sql
SELECT from_address, COUNT(*) as event_count 
FROM events 
WHERE block_number > 100000 
GROUP BY from_address 
ORDER BY event_count DESC 
LIMIT 15;
```

### Block Activity with Joins
```sql
SELECT b.block_number, b.timestamp, COUNT(t.transaction_hash) as tx_count 
FROM blocks b 
LEFT JOIN transactions t ON b.block_number = t.block_number 
WHERE b.block_number > 100000 
GROUP BY b.block_number, b.timestamp 
ORDER BY b.block_number DESC 
LIMIT 10;
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (optional, for production use)
- StarkNet RPC endpoint access

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **PostgreSQL Setup (Optional)**
   ```bash
   # Create database
   createdb starknet_data
   
   # Update connection config in src/services/postgresClient.ts
   ```

3. **Environment Configuration**
   ```bash
   # Create .env file
   STARKNET_RPC_URL=https://starknet-mainnet.public.blastapi.io
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=starknet_data
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access SQL Sandbox**
   Navigate to `http://localhost:5173/sql-sandbox`

## Usage

### Basic Query Execution
1. Open the SQL Sandbox at `/sql-sandbox`
2. Enter your SQL query in the editor
3. Click "Execute Query" to run
4. View results in the results table

### Query Validation
- Real-time syntax validation as you type
- Error highlighting and suggestions
- Performance warnings for expensive queries

### Saving Queries
- Save frequently used queries for later
- Export queries as SQL files
- Load example queries to get started

### Performance Optimization
- View query execution statistics
- Get index recommendations
- Monitor cache hit rates
- Track resource usage

## API Reference

### SQLSandboxService

#### `initialize(config?: SandboxInitConfig)`
Initialize the sandbox with optional PostgreSQL and sync configuration.

#### `executeQuery(query: string, options?: QueryExecutionOptions)`
Execute a SQL query with optional user context and caching.

#### `validateQuery(query: string)`
Validate query syntax and return errors/warnings.

#### `optimizeQuery(query: string)`
Get optimization suggestions for a query.

#### `getStats()`
Retrieve sandbox performance statistics.

### Configuration Options

```typescript
interface SandboxInitConfig {
  postgresConfig?: PostgresConfig;
  enableRealTimeSync?: boolean;
  syncFromBlock?: number;
}

interface QueryExecutionOptions {
  userId?: string;
  useCache?: boolean;
  timeout?: number;
  maxRows?: number;
}
```

## Security Features

- **Query Validation**: Prevents dangerous operations (DROP, DELETE, etc.)
- **Resource Limits**: Execution timeout and memory limits
- **Rate Limiting**: Per-user query rate limits
- **SQL Injection Protection**: Pattern detection and prevention
- **Sandbox Environment**: Isolated query execution

## Performance Features

- **Query Caching**: Automatic caching of query results
- **Index Optimization**: Intelligent index recommendations
- **Connection Pooling**: Efficient database connection management
- **Batch Processing**: Optimized bulk data operations

## Monitoring & Analytics

- Query execution statistics
- Error tracking and classification
- Cache performance metrics
- Resource usage monitoring
- Real-time sync status

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify PostgreSQL is running
   - Check connection configuration
   - Ensure database exists

2. **Query Timeouts**
   - Add WHERE clauses to filter data
   - Use LIMIT to reduce result sets
   - Check query complexity

3. **Validation Errors**
   - Review error messages and suggestions
   - Check table and column names
   - Verify SQL syntax

### Performance Tips

1. **Use Indexes**: Query indexed columns when possible
2. **Limit Results**: Always use LIMIT for large datasets
3. **Filter Early**: Add WHERE clauses to reduce data processing
4. **Cache Results**: Enable caching for repeated queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting guide
- Review example queries
- Consult the API documentation
