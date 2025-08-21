import React, { useState, useEffect } from 'react';
import { QueryEditor } from './QueryEditor';
import { ResultsTable } from './ResultsTable';
import { sqlSandboxService } from '../../services/sqlSandboxService';
import { Activity, Database, Zap, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

interface SandboxStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageExecutionTime: number;
  cacheHitRate: number;
}

export const SandboxDashboard: React.FC = () => {
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stats, setStats] = useState<SandboxStats | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeSandbox();
  }, []);

  const initializeSandbox = async () => {
    try {
      // Initialize without PostgreSQL for demo purposes
      await sqlSandboxService.initialize({
        enableRealTimeSync: false // Disable for demo
      });
      setIsInitialized(true);
      updateStats();
    } catch (error) {
      console.error('Failed to initialize sandbox:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
    }
  };

  const updateStats = async () => {
    try {
      const sandboxStats = sqlSandboxService.getStats();
      setStats(sandboxStats);
    } catch (error) {
      console.error('Failed to get stats:', error);
    }
  };

  const handleExecuteQuery = async (query: string) => {
    setIsExecuting(true);
    try {
      const result = await sqlSandboxService.executeQuery(query, {
        userId: 'demo-user',
        useCache: true
      });
      setQueryResult(result);
      updateStats();
    } catch (error) {
      setQueryResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        rowCount: 0,
        fromCache: false,
        warnings: []
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleValidateQuery = async (query: string) => {
    try {
      return await sqlSandboxService.validateQuery(query);
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation error'],
        warnings: [],
        suggestions: []
      };
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          {initError ? (
            <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-300 mb-2">Initialization Failed</h2>
              <p className="text-red-200 text-sm">{initError}</p>
              <button
                onClick={initializeSandbox}
                className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded"
              >
                Retry
              </button>
            </div>
          ) : (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Initializing StarkNet SQL Sandbox...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">StarkNet Data SQL Query Sandbox</h1>
              <p className="text-sm text-gray-400">Query blockchain data with SQL</p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span>{stats.totalQueries} queries</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>{stats.successfulQueries} successful</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span>{Math.round(stats.averageExecutionTime)}ms avg</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>{Math.round(stats.cacheHitRate)}% cache hit</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Query Editor */}
        <div className="w-1/2 border-r border-gray-700">
          <QueryEditor
            onExecuteQuery={handleExecuteQuery}
            onValidateQuery={handleValidateQuery}
            isExecuting={isExecuting}
            theme="dark"
          />
        </div>

        {/* Results */}
        <div className="w-1/2">
          <ResultsTable
            data={queryResult?.data || []}
            isLoading={isExecuting}
            error={queryResult?.success === false ? queryResult.error : undefined}
            executionTime={queryResult?.executionTime}
            fromCache={queryResult?.fromCache}
            optimization={queryResult?.optimization}
            warnings={queryResult?.warnings}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Available tables: blocks, transactions, events, contracts, storage_diffs</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Sandbox Mode: Demo Data</span>
            <span>•</span>
            <span>Resource Limits: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
