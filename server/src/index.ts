import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { setupWebSocketHandlers, setQueryEngine } from './websocket';
import { logger } from './utils/logger';
import { setupRoutes } from './routes';
import { initializeDatabase } from './database';
import { SQLQueryEngine } from './services/sqlQueryEngine';
import { StarkNetDataSchema } from './services/starknetDataSchema';
import { StarkNetIndexer } from './services/starknetIndexer';
import { QueryExecutionRoutes } from './routes/queryExecutionRoutes';
import { DashboardRoutes } from './routes/dashboardRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:3000',
    'https://33b60227a006.ngrok-free.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'ngrok-skip-browser-warning', 'Accept']
}));
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// Initialize services
let queryEngine: SQLQueryEngine;
let dataSchema: StarkNetDataSchema;
let indexer: StarkNetIndexer;
let queryRoutes: QueryExecutionRoutes;
let dashboardRoutes: DashboardRoutes;

// Setup WebSocket handlers
setupWebSocketHandlers(wss);

// Setup original REST routes
setupRoutes(app);

// Initialize database and services
initializeDatabase()
  .then(async (db) => {
    // Initialize StarkNet data schema
    dataSchema = new StarkNetDataSchema(db);
    await dataSchema.initializeSchema();
    
    // Seed sample data for development
    if (process.env.NODE_ENV !== 'production') {
      await dataSchema.seedSampleData();
    }

    // Initialize query engine
    queryEngine = new SQLQueryEngine(db);

    // Set query engine for WebSocket handlers
    setQueryEngine(queryEngine);

    // Initialize StarkNet indexer
    const rpcUrl = process.env.STARKNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io';
    indexer = new StarkNetIndexer({
      rpcUrl,
      startBlock: parseInt(process.env.START_BLOCK || '100000'),
      batchSize: parseInt(process.env.BATCH_SIZE || '10'),
      syncInterval: parseInt(process.env.SYNC_INTERVAL || '30000') // 30 seconds
    }, dataSchema);

    // Setup query execution routes
    queryRoutes = new QueryExecutionRoutes(queryEngine, dataSchema, indexer);
    queryRoutes.setupRoutes(app);

    // Setup dashboard routes
    dashboardRoutes = new DashboardRoutes(queryEngine, dataSchema);
    app.use('/api/v1/dashboard', dashboardRoutes.getRouter());

    // Start indexer if enabled
    if (process.env.ENABLE_INDEXER !== 'false') {
      try {
        await indexer.startSync();
        logger.info('StarkNet indexer started successfully');
      } catch (error) {
        logger.warn('Failed to start indexer, continuing without it:', error);
      }
    }

    // Start server
    server.listen(port, () => {
      logger.info(`🚀 StarkNet SQL Query Sandbox server running on port ${port}`);
      logger.info(`📊 Query execution endpoint: http://localhost:${port}/api/v1/query/execute`);
      logger.info(`🔌 WebSocket endpoint: ws://localhost:${port}`);
      logger.info(`📈 Stats endpoint: http://localhost:${port}/api/v1/query/stats`);
    });
  })
  .catch((error) => {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  if (indexer) {
    await indexer.stopSync();
  }
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  if (indexer) {
    await indexer.stopSync();
  }
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
