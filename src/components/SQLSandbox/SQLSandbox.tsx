import React, { useState, useEffect } from 'react';
import { QueryEditor } from './QueryEditor';
import { ResultsTable } from './ResultsTable';
import { SandboxDashboard } from './SandboxDashboard';
import { queryService, QueryResult, ValidationResult } from '../../services/queryService';
import { toast } from 'react-hot-toast';

export const SQLSandbox: React.FC = () => {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = queryService.createWebSocketConnection();
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'connected':
          toast.success('Connected to StarkNet SQL Query Sandbox');
          break;
          
        case 'query_result':
          setQueryResult({
            data: message.data,
            columns: message.columns || [],
            rowCount: message.rowCount || message.data.length,
            executionTimeMs: message.executionTime,
            cached: message.cached || false
          });
          setIsExecuting(false);
          setError(null);
          toast.success(`Query executed in ${message.executionTime}ms`);
          break;
          
        case 'validation_result':
          // Handle validation results if needed
          break;
          
        case 'error':
          setError(message.message);
          setIsExecuting(false);
          toast.error(message.message);
          break;
          
        case 'subscription_confirmed':
          console.log('Subscribed to real-time updates');
          break;
      }
    };

    ws.onclose = () => {
      toast.error('Disconnected from server');
    };

    setWsConnection(ws);

    return () => {
      ws.close();
    };
  }, []);

  const handleExecuteQuery = async (query: string): Promise<any> => {
    setIsExecuting(true);
    setError(null);

    try {
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        // Use WebSocket for real-time execution
        queryService.executeQueryWebSocket(wsConnection, query);
      } else {
        // Fallback to REST API
        const response = await queryService.executeQuery(query);
        setQueryResult(response.result);
        setIsExecuting(false);
        toast.success(`Query executed in ${response.result.executionTimeMs}ms`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Query execution failed');
      setIsExecuting(false);
      toast.error('Query execution failed');
    }
  };

  const handleValidateQuery = async (query: string): Promise<ValidationResult> => {
    try {
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        // Use WebSocket for real-time validation
        queryService.validateQueryWebSocket(wsConnection, query);
        // Return a placeholder - actual result will come via WebSocket
        return { isValid: true, errors: [], warnings: [], suggestions: [] };
      } else {
        // Fallback to REST API
        const response = await queryService.validateQuery(query);
        return response.validation;
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
        suggestions: []
      };
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold text-white">StarkNet SQL Query Sandbox</h1>
        <p className="text-gray-400 mt-1">
          Execute SQL queries against StarkNet blockchain data in real-time
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Query Editor */}
        <div className="w-1/2 flex flex-col border-r border-gray-700">
          <QueryEditor
            onExecuteQuery={handleExecuteQuery}
            onValidateQuery={handleValidateQuery}
            isExecuting={isExecuting}
            theme="dark"
          />
        </div>

        {/* Right Panel - Results and Dashboard */}
        <div className="w-1/2 flex flex-col">
          {/* Dashboard */}
          <div className="h-48 border-b border-gray-700">
            <SandboxDashboard />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden">
            {error ? (
              <div className="p-4 bg-red-900/20 border border-red-500/20 m-4 rounded">
                <h3 className="text-red-400 font-semibold mb-2">Query Error</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            ) : queryResult ? (
              <ResultsTable
                data={queryResult.data}
                columns={queryResult.columns}
                isLoading={isExecuting}
                executionTime={queryResult.executionTimeMs}
                cached={queryResult.cached}
                rowCount={queryResult.rowCount}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg">Execute a query to see results</p>
                  <p className="text-sm mt-2">
                    Try one of the example queries or write your own SQL
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
