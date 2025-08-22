import WebSocket from 'ws';
import { logger } from './utils/logger';
import { executeQuery } from './database';
import { z } from 'zod';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
  queryEngine?: any;
}

type WebSocketClient = ExtendedWebSocket;

// Message validation schema
const MessageSchema = z.object({
  type: z.enum(['query', 'validate', 'ping', 'subscribe']),
  data: z.object({
    query: z.string().optional(),
    userId: z.string().optional(),
    options: z.object({
      useCache: z.boolean().default(true),
      timeout: z.number().default(10000),
      maxRows: z.number().default(1000)
    }).optional()
  }),
});

// Global query engine reference (will be set by main server)
let globalQueryEngine: any = null;

export const setQueryEngine = (queryEngine: any) => {
  globalQueryEngine = queryEngine;
};

export const setupWebSocketHandlers = (wss: any) => {
  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.isAlive = true;

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to StarkNet SQL Query Sandbox',
      timestamp: new Date().toISOString()
    }));

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const validation = MessageSchema.safeParse(message);

        if (!validation.success) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            details: validation.error.errors
          }));
          return;
        }

        const { type, data: messageData } = validation.data;

        switch (type) {
          case 'query':
            await handleQueryExecution(ws, messageData);
            break;

          case 'validate':
            await handleQueryValidation(ws, messageData);
            break;

          case 'subscribe':
            handleSubscription(ws, messageData);
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;

          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type'
            }));
        }

      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message',
          details: error instanceof Error ? error.message : String(error)
        }));

        logger.error('WebSocket message processing failed:', error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      logger.info('WebSocket client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });

    // Heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    logger.info('WebSocket client connected');
  });

  // Setup ping interval to check client connections
  const interval = setInterval(() => {
    wss.clients.forEach((client: any) => {
      const ws = client as WebSocketClient;
      if (!ws.isAlive) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  logger.info('WebSocket server initialized');
};

async function handleQueryExecution(ws: ExtendedWebSocket, messageData: any) {
  if (!messageData.query) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Query is required'
    }));
    return;
  }

  try {
    const startTime = Date.now();
    
    // Use new query engine if available, fallback to old method
    let results;
    let executionTime;
    
    if (globalQueryEngine) {
      const result = await globalQueryEngine.executeQuery(messageData.query, {
        userId: messageData.userId,
        ...messageData.options
      });
      
      results = result.data;
      executionTime = result.executionTimeMs;
      
      ws.send(JSON.stringify({
        type: 'query_result',
        data: results,
        columns: result.columns,
        rowCount: result.rowCount,
        executionTime,
        cached: result.cached,
        query: messageData.query,
        timestamp: new Date().toISOString()
      }));
      
    } else {
      // Fallback to old method
      results = await executeQuery(messageData.query);
      executionTime = Date.now() - startTime;
      
      ws.send(JSON.stringify({
        type: 'query_result',
        data: results,
        executionTime,
        query: messageData.query,
        timestamp: new Date().toISOString()
      }));
    }

    logger.info('Query executed via WebSocket', {
      userId: messageData.userId,
      executionTime,
      resultCount: results.length
    });

  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Query execution failed',
      details: error instanceof Error ? error.message : String(error),
      query: messageData.query,
      timestamp: new Date().toISOString()
    }));

    logger.error('WebSocket query execution failed:', error instanceof Error ? error : String(error));
  }
}

async function handleQueryValidation(ws: ExtendedWebSocket, messageData: any) {
  if (!messageData.query) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Query is required for validation'
    }));
    return;
  }

  try {
    if (globalQueryEngine) {
      const validation = await globalQueryEngine.validateQuery(messageData.query);
      
      ws.send(JSON.stringify({
        type: 'validation_result',
        validation,
        query: messageData.query,
        timestamp: new Date().toISOString()
      }));
    } else {
      // Basic validation fallback
      const isValid = messageData.query.toUpperCase().includes('SELECT');
      ws.send(JSON.stringify({
        type: 'validation_result',
        validation: {
          isValid,
          errors: isValid ? [] : ['Only SELECT queries are allowed'],
          warnings: [],
          suggestions: []
        },
        query: messageData.query,
        timestamp: new Date().toISOString()
      }));
    }

  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Query validation failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }));

    logger.error('WebSocket query validation failed:', error);
  }
}

function handleSubscription(ws: ExtendedWebSocket, messageData: any) {
  // Store user ID for future real-time updates
  ws.userId = messageData.userId;
  
  ws.send(JSON.stringify({
    type: 'subscription_confirmed',
    message: 'Subscribed to real-time updates',
    userId: messageData.userId,
    timestamp: new Date().toISOString()
  }));

  logger.info('Client subscribed to real-time updates', { userId: messageData.userId });
}

// Function to broadcast updates to all connected clients
export function broadcastUpdate(updateType: string, data: any) {
  // This would be called by the indexer when new data is available
  // Implementation depends on how the WebSocket server instance is accessible
  logger.info('Broadcasting update', { updateType, data });
}
