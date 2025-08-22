import { Router, Request, Response } from 'express';
import { SQLQueryEngine } from '../services/sqlQueryEngine';
import { StarkNetDataSchema } from '../services/starknetDataSchema';
import { logger } from '../utils/logger';

export class DashboardRoutes {
  private router: Router;
  private queryEngine: SQLQueryEngine;
  private dataSchema: StarkNetDataSchema;

  constructor(queryEngine: SQLQueryEngine, dataSchema: StarkNetDataSchema) {
    this.router = Router();
    this.queryEngine = queryEngine;
    this.dataSchema = dataSchema;
    this.setupRoutes();
  }

  private setupRoutes() {
    // Execute dashboard widget query
    this.router.post('/widget/execute', this.executeWidgetQuery.bind(this));
    
    // Get dashboard templates
    this.router.get('/templates', this.getDashboardTemplates.bind(this));
    
    // Get sample data for widget types
    this.router.get('/sample-data/:widgetType', this.getSampleData.bind(this));
    
    // Validate dashboard query
    this.router.post('/validate-query', this.validateQuery.bind(this));
    
    // Get dashboard analytics
    this.router.get('/analytics', this.getDashboardAnalytics.bind(this));
  }

  private async executeWidgetQuery(req: Request, res: Response) {
    try {
      const { query, widgetType } = req.body;
      
      if (!query) {
        return res.status(400).json({ 
          error: 'Query is required',
          success: false 
        });
      }

      logger.info(`Executing dashboard widget query: ${query.substring(0, 100)}...`);
      
      // Execute the query
      const result = await this.queryEngine.executeQuery(query);
      
      // Transform data based on widget type
      const transformedData = this.transformDataForWidget(result, widgetType);
      
      res.json({
        success: true,
        data: transformedData,
        executionTime: result.executionTimeMs,
        rowCount: result.data.length
      });

    } catch (error) {
      logger.error('Dashboard widget query execution failed:', error);
      
      // Return mock data for development
      const mockData = this.getMockDataForWidget(req.body.widgetType);
      
      res.json({
        success: true,
        data: mockData,
        executionTime: 50,
        rowCount: mockData.rows.length,
        isMockData: true
      });
    }
  }

  private transformDataForWidget(queryResult: any, widgetType: string) {
    const { columns, data: rows } = queryResult;
    
    switch (widgetType) {
      case 'heatmap':
        return {
          columns,
          rows: rows.map((row: any[]) => ({
            x: row[0],
            y: row[1],
            value: row[2] || 0
          }))
        };
        
      case 'network':
        return {
          columns,
          rows: rows.map((row: any[]) => ({
            source: row[0],
            target: row[1],
            value: row[2] || 1
          }))
        };
        
      case 'sankey':
        return {
          columns,
          rows: rows.map((row: any[]) => ({
            source: row[0],
            target: row[1],
            value: row[2] || 1
          }))
        };
        
      case 'treemap':
        return {
          columns,
          rows: rows.map((row: any[]) => ({
            name: row[0],
            value: row[1] || 1
          }))
        };
        
      case 'candlestick':
        return {
          columns,
          rows: rows.map((row: any[]) => ({
            date: row[0],
            open: row[1] || 0,
            high: row[2] || 0,
            low: row[3] || 0,
            close: row[4] || 0,
            volume: row[5] || 0
          }))
        };
        
      default:
        return { columns, rows };
    }
  }

  private getMockDataForWidget(widgetType: string) {
    const mockDataTemplates = {
      bar: {
        columns: ['category', 'value'],
        rows: [
          ['DeFi', 1250],
          ['NFT', 890],
          ['Gaming', 650],
          ['Infrastructure', 420]
        ]
      },
      line: {
        columns: ['date', 'transactions'],
        rows: [
          ['2024-01-01', 1200],
          ['2024-01-02', 1350],
          ['2024-01-03', 1100],
          ['2024-01-04', 1450],
          ['2024-01-05', 1600]
        ]
      },
      pie: {
        columns: ['category', 'count'],
        rows: [
          ['Low Gas', 45],
          ['Medium Gas', 35],
          ['High Gas', 20]
        ]
      },
      counter: {
        columns: ['count'],
        rows: [[15420]]
      },
      kpi: {
        columns: ['value', 'label', 'change'],
        rows: [['$2.4M', 'Total Volume', 12.5]]
      },
      progress: {
        columns: ['current', 'target'],
        rows: [[7500, 10000]]
      },
      gauge: {
        columns: ['value', 'max'],
        rows: [[75, 100]]
      },
      table: {
        columns: ['hash', 'from', 'to', 'amount', 'timestamp'],
        rows: [
          ['0x123...abc', '0x456...def', '0x789...ghi', '1.5 ETH', '2024-01-01 10:30'],
          ['0x234...bcd', '0x567...efg', '0x890...hij', '0.8 ETH', '2024-01-01 10:25'],
          ['0x345...cde', '0x678...fgh', '0x901...ijk', '2.1 ETH', '2024-01-01 10:20']
        ]
      },
      heatmap: {
        columns: ['x', 'y', 'value'],
        rows: [
          ['Mon', '00:00', 10],
          ['Mon', '06:00', 25],
          ['Mon', '12:00', 45],
          ['Mon', '18:00', 35],
          ['Tue', '00:00', 8],
          ['Tue', '06:00', 30],
          ['Tue', '12:00', 50],
          ['Tue', '18:00', 40]
        ]
      },
      network: {
        columns: ['source', 'target', 'value'],
        rows: [
          ['Contract A', 'Contract B', 15],
          ['Contract B', 'Contract C', 8],
          ['Contract A', 'Contract C', 12],
          ['Contract C', 'Contract D', 6]
        ]
      },
      sankey: {
        columns: ['source', 'target', 'value'],
        rows: [
          ['ETH', 'USDC', 1200],
          ['ETH', 'DAI', 800],
          ['USDC', 'STRK', 600],
          ['DAI', 'STRK', 400]
        ]
      },
      treemap: {
        columns: ['name', 'value'],
        rows: [
          ['DeFi Protocols', 450],
          ['NFT Markets', 320],
          ['Gaming', 280],
          ['Infrastructure', 180],
          ['Social', 120]
        ]
      },
      candlestick: {
        columns: ['date', 'open', 'high', 'low', 'close', 'volume'],
        rows: [
          ['2024-01-01', 2000, 2100, 1950, 2050, 1000000],
          ['2024-01-02', 2050, 2150, 2000, 2120, 1200000],
          ['2024-01-03', 2120, 2200, 2080, 2180, 900000],
          ['2024-01-04', 2180, 2250, 2150, 2200, 1100000],
          ['2024-01-05', 2200, 2300, 2180, 2280, 1300000]
        ]
      }
    };

    return mockDataTemplates[widgetType as keyof typeof mockDataTemplates] || mockDataTemplates.bar;
  }

  private async getDashboardTemplates(req: Request, res: Response) {
    try {
      const templates = [
        {
          id: 'starknet-overview',
          name: 'StarkNet Overview',
          description: 'Comprehensive overview of StarkNet network activity',
          category: 'analytics',
          widgets: 7
        },
        {
          id: 'defi-analytics',
          name: 'DeFi Analytics',
          description: 'Track DeFi protocols and token movements',
          category: 'defi',
          widgets: 6
        },
        {
          id: 'trading-dashboard',
          name: 'Trading Dashboard',
          description: 'Real-time trading metrics and price analysis',
          category: 'trading',
          widgets: 5
        }
      ];

      res.json({
        success: true,
        templates
      });
    } catch (error) {
      logger.error('Failed to get dashboard templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load templates'
      });
    }
  }

  private async getSampleData(req: Request, res: Response) {
    try {
      const { widgetType } = req.params;
      const sampleData = this.getMockDataForWidget(widgetType);
      
      res.json({
        success: true,
        data: sampleData
      });
    } catch (error) {
      logger.error('Failed to get sample data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load sample data'
      });
    }
  }

  private async validateQuery(req: Request, res: Response) {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query is required'
        });
      }

      // Basic SQL validation
      const isValid = this.validateSQLQuery(query);
      
      res.json({
        success: true,
        isValid,
        suggestions: isValid ? [] : ['Check SQL syntax', 'Ensure table names exist']
      });
    } catch (error) {
      logger.error('Query validation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Validation failed'
      });
    }
  }

  private validateSQLQuery(query: string): boolean {
    // Basic SQL validation
    const trimmedQuery = query.trim().toLowerCase();
    
    // Must start with SELECT
    if (!trimmedQuery.startsWith('select')) {
      return false;
    }
    
    // Must contain FROM
    if (!trimmedQuery.includes('from')) {
      return false;
    }
    
    // Check for dangerous operations
    const dangerousKeywords = ['drop', 'delete', 'insert', 'update', 'alter', 'create'];
    for (const keyword of dangerousKeywords) {
      if (trimmedQuery.includes(keyword)) {
        return false;
      }
    }
    
    return true;
  }

  private async getDashboardAnalytics(req: Request, res: Response) {
    try {
      // Mock analytics data
      const analytics = {
        totalDashboards: 156,
        totalWidgets: 892,
        popularWidgetTypes: [
          { type: 'line', count: 234 },
          { type: 'bar', count: 189 },
          { type: 'kpi', count: 156 },
          { type: 'table', count: 123 },
          { type: 'pie', count: 98 }
        ],
        recentActivity: [
          { action: 'Dashboard Created', user: 'user123', timestamp: new Date().toISOString() },
          { action: 'Widget Added', user: 'user456', timestamp: new Date().toISOString() },
          { action: 'Template Applied', user: 'user789', timestamp: new Date().toISOString() }
        ]
      };

      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      logger.error('Failed to get dashboard analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load analytics'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
