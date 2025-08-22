import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { SQLQueryEngine, QueryExecutionOptions } from '../services/sqlQueryEngine';
import { StarkNetDataSchema } from '../services/starknetDataSchema';
import { StarkNetIndexer } from '../services/starknetIndexer';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Validation schemas
const QueryExecuteSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  options: z.object({
    useCache: z.boolean().default(true),
    timeout: z.number().min(1000).max(30000).default(10000),
    maxRows: z.number().min(1).max(10000).default(1000)
  }).optional()
});

const QueryValidateSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty')
});

export class QueryExecutionRoutes {
  constructor(
    private queryEngine: SQLQueryEngine,
    private dataSchema: StarkNetDataSchema,
    private indexer: StarkNetIndexer
  ) {}

  setupRoutes(app: Express): void {
    // Rate limiting middleware
    const rateLimit = this.createRateLimitMiddleware();

    // POST /api/v1/query/execute - Execute SQL query
    app.post('/api/v1/query/execute', rateLimit, async (req: Request, res: Response) => {
      try {
        const validation = QueryExecuteSchema.safeParse(req.body);
        
        if (!validation.success) {
          return res.status(400).json({
            error: 'Invalid request body',
            details: validation.error.errors
          });
        }

        const { query, options = {} } = validation.data;
        const userId = this.extractUserId(req);
        
        const executionOptions: QueryExecutionOptions = {
          ...options,
          userId
        };

        const startTime = Date.now();
        const result = await this.queryEngine.executeQuery(query, executionOptions);
        const executionTime = Date.now() - startTime;

        // Log query execution
        const executionId = randomUUID();
        const resultSizeBytes = JSON.stringify(result.data).length;
        
        await this.dataSchema.logQueryExecution(
          executionId,
          userId,
          query,
          executionTime,
          resultSizeBytes,
          result.rowCount,
          result.cached
        );

        res.json({
          success: true,
          executionId,
          result: {
            data: result.data,
            columns: result.columns,
            rowCount: result.rowCount,
            executionTimeMs: result.executionTimeMs,
            cached: result.cached
          },
          metadata: {
            query,
            executedAt: new Date().toISOString(),
            userId
          }
        });

      } catch (error) {
        logger.error('Query execution failed:', error);
        res.status(500).json({
          error: 'Query execution failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // POST /api/v1/query/validate - Validate SQL query
    app.post('/api/v1/query/validate', rateLimit, async (req: Request, res: Response) => {
      try {
        const validation = QueryValidateSchema.safeParse(req.body);
        
        if (!validation.success) {
          return res.status(400).json({
            error: 'Invalid request body',
            details: validation.error.errors
          });
        }

        const { query } = validation.data;
        const result = await this.queryEngine.validateQuery(query);

        res.json({
          success: true,
          validation: result
        });

      } catch (error) {
        logger.error('Query validation failed:', error);
        res.status(500).json({
          error: 'Query validation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // GET /api/v1/query/:id/results - Get query results by execution ID
    app.get('/api/v1/query/:id/results', async (req: Request, res: Response) => {
      try {
        const executionId = req.params.id;
        const userId = this.extractUserId(req);

        // In a real implementation, you'd store and retrieve results
        // For now, return a placeholder response
        res.json({
          success: true,
          message: 'Query results retrieval not yet implemented',
          executionId
        });

      } catch (error) {
        logger.error('Failed to get query results:', error);
        res.status(500).json({
          error: 'Failed to get query results',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // GET /api/v1/query/:id/history - Get query execution history
    app.get('/api/v1/query/history', async (req: Request, res: Response) => {
      try {
        const userId = this.extractUserId(req);
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        // Get query history from database
        const history = await this.dataSchema.getQueryHistory(userId, limit, offset);

        res.json({
          success: true,
          history,
          pagination: {
            limit,
            offset,
            total: history.length
          }
        });

      } catch (error) {
        logger.error('Failed to get query history:', error);
        res.status(500).json({
          error: 'Failed to get query history',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // GET /api/v1/query/templates - Get query templates
    app.get('/api/v1/query/templates', (req: Request, res: Response) => {
      const templates = [
        {
          id: 'recent-blocks',
          name: 'Recent Blocks',
          description: 'Get the most recent blocks with transaction counts',
          query: 'SELECT block_number, timestamp, transaction_count FROM blocks ORDER BY block_number DESC LIMIT 10',
          category: 'blocks'
        },
        {
          id: 'transaction-types',
          name: 'Transaction Types Analysis',
          description: 'Analyze distribution of transaction types',
          query: 'SELECT type, COUNT(*) as count FROM transactions GROUP BY type ORDER BY count DESC',
          category: 'transactions'
        },
        {
          id: 'active-contracts',
          name: 'Recently Deployed Contracts',
          description: 'Show recently deployed contracts',
          query: 'SELECT contract_address, class_hash, deployed_at_block FROM contracts ORDER BY deployed_at_block DESC LIMIT 20',
          category: 'contracts'
        },
        {
          id: 'contract-events',
          name: 'Contract Event Activity',
          description: 'Show contracts with most event activity',
          query: 'SELECT from_address, COUNT(*) as event_count FROM events WHERE block_number > (SELECT MAX(block_number) - 1000 FROM blocks) GROUP BY from_address ORDER BY event_count DESC LIMIT 15',
          category: 'events'
        },
        {
          id: 'block-activity',
          name: 'Block Activity with Transactions',
          description: 'Join blocks with transaction data',
          query: 'SELECT b.block_number, b.timestamp, COUNT(t.transaction_hash) as tx_count FROM blocks b LEFT JOIN transactions t ON b.block_number = t.block_number WHERE b.block_number > (SELECT MAX(block_number) - 100 FROM blocks) GROUP BY b.block_number, b.timestamp ORDER BY b.block_number DESC LIMIT 10',
          category: 'analysis'
        }
      ];

      res.json({
        success: true,
        templates
      });
    });

    // GET /api/v1/query/stats - Get query engine statistics
    app.get('/api/v1/query/stats', async (req: Request, res: Response) => {
      try {
        const queryStats = this.queryEngine.getStats();
        const dataStats = await this.dataSchema.getDataStats();
        const indexerStats = await this.indexer.getIndexerStats();

        res.json({
          success: true,
          stats: {
            queryEngine: queryStats,
            data: dataStats,
            indexer: indexerStats
          }
        });

      } catch (error) {
        logger.error('Failed to get stats:', error);
        res.status(500).json({
          error: 'Failed to get stats',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // POST /api/v1/indexer/start - Start data indexing
    app.post('/api/v1/indexer/start', async (req: Request, res: Response) => {
      try {
        if (this.indexer.isIndexerRunning()) {
          return res.status(400).json({
            error: 'Indexer is already running'
          });
        }

        await this.indexer.startSync();
        
        res.json({
          success: true,
          message: 'Indexer started successfully'
        });

      } catch (error) {
        logger.error('Failed to start indexer:', error);
        res.status(500).json({
          error: 'Failed to start indexer',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // POST /api/v1/indexer/stop - Stop data indexing
    app.post('/api/v1/indexer/stop', async (req: Request, res: Response) => {
      try {
        await this.indexer.stopSync();
        
        res.json({
          success: true,
          message: 'Indexer stopped successfully'
        });

      } catch (error) {
        logger.error('Failed to stop indexer:', error);
        res.status(500).json({
          error: 'Failed to stop indexer',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private createRateLimitMiddleware() {
    const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
    const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

    return (req: Request, res: Response, next: Function) => {
      const userId = this.extractUserId(req);
      const now = Date.now();
      
      const userLimit = rateLimitStore.get(userId);
      
      if (!userLimit || now > userLimit.resetTime) {
        // Reset or create new limit window
        rateLimitStore.set(userId, {
          count: 1,
          resetTime: now + RATE_LIMIT_WINDOW
        });
        return next();
      }
      
      if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed`,
          retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        });
      }
      
      userLimit.count++;
      next();
    };
  }

  private extractUserId(req: Request): string {
    // Extract user ID from request (JWT token, API key, etc.)
    // For now, use a default user ID or extract from headers
    return req.headers['x-user-id'] as string || 
           req.headers['authorization']?.replace('Bearer ', '') || 
           'anonymous';
  }
}
