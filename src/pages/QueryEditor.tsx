import React, { useState, useEffect, useRef } from 'react';
import { Crown, Play, Save, Lock, Download, Database, BookOpen, Sparkles, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: 'query_result' | 'error';
  payload: any;
  duration?: number;
}

interface SavedQuery {
  id: number;
  name: string;
  query: string;
  created_at: string;
}

interface QueryHistoryItem {
  query: string;
  timestamp: Date;
  status: 'success' | 'error';
  duration: number;
}

const QueryEditor = () => {
  const { user, error: authError } = useAuth();
  const [query, setQuery] = useState('-- Write your SQL query here\nSELECT * FROM starknet_transactions\nWHERE block_number > 100000\nLIMIT 100;');
  const [selectedDataset, setSelectedDataset] = useState('core');
  const [results, setResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [rpcEndpoint, setRpcEndpoint] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedQueries, setSavedQueries] = useState<Array<{ id: number; name: string; query: string; created_at: string }>>([]);
  const [queryHistory, setQueryHistory] = useState<Array<{ query: string; timestamp: Date; status: 'success' | 'error'; duration: number }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedVisualization, setSelectedVisualization] = useState('bar');
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:3000');

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('query_result', (data) => {
      setResults(data.rows);
      setLastUpdate(new Date());
      setQueryHistory(prev => [{
        query,
        timestamp: new Date(),
        status: 'success',
        duration: data.duration || 0
      }, ...prev]);
    });

    socketRef.current.on('error', (error) => {
      setError(error.message);
      setQueryHistory(prev => [{
        query,
        timestamp: new Date(),
        status: 'error',
        duration: 0
      }, ...prev]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [query]);

  const updateResults = (newData: any) => {
    setResults(prevResults => {
      // Update results based on real-time data
      // This is a placeholder implementation
      return Array.isArray(newData) ? [...newData, ...prevResults].slice(0, 1000) : prevResults;
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Please connect your wallet to access the query editor</h1>
        </div>
      </div>
    );
  }

  // WebSocket connection
  const connectToRPC = () => {
    const endpoint = prompt('Enter RPC endpoint URL:', 'ws://localhost:3001');
    if (endpoint) {
      try {
        const ws = new WebSocket(endpoint);
        
        ws.onopen = () => {
          setIsConnected(true);
          setIsError(false);
          setErrorMessage('');
        };

        ws.onclose = () => {
          setIsConnected(false);
          setIsError(true);
          setErrorMessage('Connection lost. Trying to reconnect...');
          // Attempt to reconnect after 5 seconds
          setTimeout(connectToRPC, 5000);
        };

        ws.onerror = (error) => {
          setIsError(true);
          setErrorMessage('Connection error: ' + error.toString());
          setIsConnected(false);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'query_result') {
              setResults(data.payload);
              setLastUpdate(new Date());
              
              // Add to query history
              setQueryHistory(prev => [{
                query,
                timestamp: new Date(),
                status: 'success',
                duration: data.duration || 0
              }, ...prev]);
            } else if (data.type === 'error') {
              setIsError(true);
              setErrorMessage(data.payload.message);
              
              // Add to query history
              setQueryHistory(prev => [{
                query,
                timestamp: new Date(),
                status: 'error',
                duration: 0
              }, ...prev]);
            }
          } catch (error) {
            setIsError(true);
            setErrorMessage('Failed to parse server response: ' + handleError(error));
          }
        };

        return ws;
      } catch (error) {
        setIsError(true);
        setErrorMessage('Failed to connect: ' + handleError(error));
      }
    }
  };

  // Save query
  const saveQuery = async (name: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          name,
          query,
          visualizationType: selectedVisualization,
        }),
      });

      if (!response.ok) throw new Error('Failed to save query');

      // Refresh saved queries
      loadSavedQueries();
    } catch (error) {
      setIsError(true);
      setErrorMessage('Failed to save query: ' + handleError(error));
    }
  };

  // Load saved queries
  const loadSavedQueries = async () => {
    try {
      const response = await fetch(`http://localhost:3001/queries`);
      if (!response.ok) throw new Error('Failed to load queries');
      
      const queries = await response.json();
      setSavedQueries(queries);
    } catch (error) {
      setIsError(true);
      setErrorMessage('Failed to load saved queries: ' + handleError(error));
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (autoRefresh && isConnected) {
      intervalId = setInterval(() => {
        // Re-run the current query
        if (query.trim()) {
          // Execute query using WebSocket
          socketRef.current?.emit('query', { query });
        }
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, isConnected, query]);
  
  // Fix error type in catch blocks
  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  };
  
  // Update catch blocks to use handleError
  // Example:
  // catch (error) {
  //   setIsError(true);
  //   setErrorMessage('Failed to save query: ' + handleError(error));
  // }

  const datasets = [
    { id: 'core', name: 'Starknet Core', description: 'Blocks, transactions, events' },
    { id: 'defi', name: 'DeFi Protocols', description: 'DEX, lending, liquidity' },
    { id: 'nft', name: 'NFT Data', description: 'Collections, trades, metadata' },
    { id: 'bridge', name: 'Bridge Activity', description: 'L1-L2 transfers, deposits' }
  ];

  const executeQuery = () => {
    if (user.queriesUsed >= user.queryLimit && !user.isPremium) {
      return;
    }

    setIsExecuting(true);
    setError(null);

    socketRef.current?.emit('query', { query });

    // Update query count
    user.queriesUsed += 1;

    // The results will be updated by the socket listener.
    // We just need to set isExecuting to false after a short delay.
    setTimeout(() => {
      setIsExecuting(false);
    }, 1000);
  };

  const canExecuteQuery = user.isPremium || user.queriesUsed < user.queryLimit;
  const canSaveQuery = user.isPremium;
  const canExportResults = user.isPremium;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SQL Query Editor</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Query Starknet data with SQL - {user.queriesUsed}/{user.queryLimit} queries used this month
          </p>
        </div>
        
        {!user.isPremium && (
          <Link
            to="/premium"
            className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:from-yellow-500 hover:to-yellow-700"
          >
            <Crown className="h-4 w-4" />
            <span>Upgrade to Premium</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Dataset Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Select Dataset</h3>
          <div className="space-y-2">
            {datasets.map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => setSelectedDataset(dataset.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedDataset === dataset.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-medium text-sm">{dataset.name}</div>
                <div className="text-xs text-gray-500 mt-1">{dataset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Query Editor and Results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Query Editor */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Query Editor</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedVisualization}
                  onChange={(e) => setSelectedVisualization(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
                <button
                  onClick={() => {
                    if (canSaveQuery) {
                      const name = prompt('Enter query name:');
                      if (name) {
                        saveQuery(name);
                      }
                    }
                  }}
                  disabled={!canSaveQuery}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    canSaveQuery
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {!canSaveQuery && <Lock className="h-4 w-4" />}
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={executeQuery}
                  disabled={!canExecuteQuery || isExecuting}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    canExecuteQuery
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Play className="h-4 w-4" />
                  <span>{isExecuting ? 'Running...' : 'Run Query'}</span>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-64 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your SQL query here..."
              />
            </div>
            
            {!canExecuteQuery && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm">
                    Query limit reached. <Link to="/premium" className="underline">Upgrade to Premium</Link> for unlimited queries.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Query Results */}
          {results.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Results ({results.length} rows)
                </h3>
                <button
                  onClick={() => canExportResults ? null : null}
                  disabled={!canExportResults}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    canExportResults
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {!canExportResults && <Lock className="h-4 w-4" />}
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {Object.keys(results[0] || {}).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-medium text-gray-900 dark:text-white">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="py-2 px-3 text-gray-700 dark:text-gray-300">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryEditor;
