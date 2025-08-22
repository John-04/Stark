# StarkNet SQL Query Sandbox Server

A comprehensive backend server for executing SQL queries against StarkNet blockchain data with real-time synchronization, query optimization, and resource management.

## Features

### ✅ Implemented Components

- **SQL Query Engine**: Complete SQL parser and execution engine for StarkNet data
- **Data Schema**: Full database schema for blocks, transactions, events, contracts, and storage diffs
- **StarkNet Indexer**: Real-time data synchronization from StarkNet blockchain
- **REST API**: Complete API endpoints including `POST /api/v1/query/execute`
- **WebSocket Support**: Real-time query execution and validation
- **Rate Limiting**: Per-user rate limiting and resource management
- **Query Validation**: Comprehensive SQL validation with security checks
- **Query Caching**: Intelligent caching layer for improved performance
- **Error Handling**: Robust error handling and logging

### 🔧 API Endpoints

#### Query Execution
- `POST /api/v1/query/execute` - Execute SQL queries
- `POST /api/v1/query/validate` - Validate SQL queries
- `GET /api/v1/query/history` - Get query execution history
- `GET /api/v1/query/templates` - Get predefined query templates
- `GET /api/v1/query/stats` - Get query engine statistics

#### Indexer Management
- `POST /api/v1/indexer/start` - Start data indexing
- `POST /api/v1/indexer/stop` - Stop data indexing

#### Legacy Endpoints
- `GET /health` - Health check
- `GET /queries/:userId` - Get saved queries
- `POST /queries` - Save query

### 🗄️ Database Schema

The server includes complete StarkNet data tables:

- **blocks**: Block data with hash, number, timestamp, transaction count
- **transactions**: Transaction details with type, sender, calldata, fees
- **events**: Event logs with keys, data, and contract addresses
- **contracts**: Contract deployments with class hash and deployer info
- **storage_diffs**: Storage state changes
- **query_executions**: Query execution history and performance metrics

### 🔌 WebSocket Support

Real-time query execution via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3001');

// Execute query
ws.send(JSON.stringify({
  type: 'query',
  data: {
    query: 'SELECT * FROM blocks LIMIT 10',
    userId: 'user123',
    options: { useCache: true, maxRows: 100 }
  }
}));

// Validate query
ws.send(JSON.stringify({
  type: 'validate',
  data: { query: 'SELECT * FROM blocks' }
}));
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Dependencies Installation

The server requires these key dependencies:

```bash
npm install sqlite3 sqlite express ws cors dotenv winston zod starknet
```

### Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```env
PORT=3001
STARKNET_RPC_URL=https://starknet-mainnet.public.blastapi.io
ENABLE_INDEXER=true
START_BLOCK=100000
```

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Usage Examples

### REST API Query Execution

```bash
curl -X POST http://localhost:3001/api/v1/query/execute \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT block_number, timestamp, transaction_count FROM blocks ORDER BY block_number DESC LIMIT 10",
    "options": {
      "useCache": true,
      "maxRows": 1000,
      "timeout": 10000
    }
  }'
```

### Query Templates

Get predefined query templates:

```bash
curl http://localhost:3001/api/v1/query/templates
```

### System Statistics

```bash
curl http://localhost:3001/api/v1/query/stats
```

## Architecture

### Core Services

1. **SQLQueryEngine**: Handles query parsing, validation, execution, and caching
2. **StarkNetDataSchema**: Manages database schema and data operations
3. **StarkNetIndexer**: Synchronizes blockchain data in real-time
4. **QueryExecutionRoutes**: REST API endpoints for query operations

### Security Features

- SQL injection prevention
- Query timeout limits
- Resource usage limits
- Rate limiting per user
- Dangerous operation blocking (DROP, DELETE, etc.)

### Performance Features

- Query result caching (5-minute TTL)
- Connection pooling
- Batch data processing
- Index optimization
- Query execution statistics

## Development

### Project Structure

```
server/
├── src/
│   ├── services/
│   │   ├── sqlQueryEngine.ts      # Query execution engine
│   │   ├── starknetDataSchema.ts  # Database schema
│   │   └── starknetIndexer.ts     # Blockchain data indexer
│   ├── routes/
│   │   ├── queryExecutionRoutes.ts # API endpoints
│   │   └── routes.ts               # Legacy routes
│   ├── utils/
│   │   └── logger.ts              # Logging utility
│   ├── database.ts                # Database initialization
│   ├── websocket.ts              # WebSocket handlers
│   └── index.ts                  # Main server file
├── .env.example                  # Environment configuration
└── README.md                     # This file
```

### Adding New Features

1. **New Query Types**: Extend `SQLQueryEngine.validateQuery()`
2. **Additional Tables**: Update `StarkNetDataSchema.createTables()`
3. **Custom Endpoints**: Add routes in `QueryExecutionRoutes`
4. **WebSocket Events**: Extend message handlers in `websocket.ts`

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure SQLite dependencies are installed
   - Check DATABASE_PATH configuration

2. **RPC Connection Failures**
   - Verify STARKNET_RPC_URL is accessible
   - Check network connectivity

3. **Query Timeouts**
   - Add WHERE clauses to filter data
   - Use LIMIT to reduce result sets
   - Check query complexity

### Logging

The server uses Winston for structured logging. Logs include:
- Query execution times
- Error details with context
- Indexer synchronization status
- WebSocket connection events

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License
