import React, { useState } from 'react';

export const RPCTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test');
  const [logs, setLogs] = useState<string[]>([]);
  const [serverUrl] = useState('https://33b60227a006.ngrok-free.app');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testServerHealth = async () => {
    setLogs([]);
    addLog(`Testing StarkNet SQL Query Sandbox server at: ${serverUrl}`);
    setStatus('Testing server...');

    try {
      const response = await fetch(`${serverUrl}/api/v1/query/stats`, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStatus('Server is running ✅');
        addLog('✅ Server is responding');
        addLog(`📊 Server stats: ${JSON.stringify(data.stats, null, 2)}`);
        return true;
      } else {
        setStatus('Server error ❌');
        addLog(`❌ Server responded with status: ${response.status}`);
        const errorText = await response.text();
        addLog(`Error details: ${errorText}`);
        return false;
      }
    } catch (error) {
      setStatus('Server unreachable ❌');
      addLog(`❌ Failed to reach server: ${error}`);
      return false;
    }
  };

  const testStarkNetQuery = async () => {
    addLog('🧪 Testing StarkNet SQL query execution...');
    setStatus('Executing query...');

    try {
      const response = await fetch(`${serverUrl}/api/v1/query/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: 'SELECT block_number, timestamp, transaction_count FROM blocks ORDER BY block_number DESC LIMIT 5',
          options: {
            useCache: true,
            timeout: 10000,
            maxRows: 100
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setStatus('Query executed ✅');
        addLog('✅ StarkNet query executed successfully');
        addLog(`📊 Query result: ${JSON.stringify(result, null, 2)}`);
      } else {
        const error = await response.text();
        setStatus('Query failed ❌');
        addLog(`❌ Query failed with status ${response.status}: ${error}`);
      }
    } catch (error) {
      setStatus('Query error ❌');
      addLog(`❌ Query execution error: ${error}`);
    }
  };

  const testStarkNetRPC = async () => {
    addLog('🔗 Testing StarkNet RPC connection through indexer...');
    setStatus('Testing RPC...');

    try {
      // Test indexer stats to see if RPC is working
      const response = await fetch(`${serverUrl}/api/v1/query/stats`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const indexerStats = data.stats?.indexer;
        
        if (indexerStats) {
          addLog('✅ StarkNet RPC connection is working!');
          addLog(`📊 Indexer stats: ${JSON.stringify(indexerStats, null, 2)}`);
          setStatus('RPC connection verified ✅');
          
          // Test starting/stopping indexer
          addLog('🔄 Testing indexer control...');
          const startResponse = await fetch(`${serverUrl}/api/v1/indexer/start`, { 
            method: 'POST',
            headers: {
              'ngrok-skip-browser-warning': 'true',
              'Accept': 'application/json'
            }
          });
          const startResult = await startResponse.json();
          addLog(`Indexer start: ${JSON.stringify(startResult)}`);
        } else {
          addLog('⚠️ Indexer stats not available - RPC may not be connected');
          setStatus('RPC status unclear ⚠️');
        }
      }
    } catch (error) {
      addLog(`❌ Failed to test RPC connection: ${error}`);
      setStatus('RPC test failed ❌');
    }
  };

  const testQueryTemplates = async () => {
    addLog('📝 Testing query templates...');
    
    try {
      const response = await fetch(`${serverUrl}/api/v1/query/templates`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        addLog('✅ Query templates loaded successfully');
        addLog(`📋 Available templates: ${data.templates.length}`);
        data.templates.forEach((template: any) => {
          addLog(`  - ${template.name}: ${template.description}`);
        });
      }
    } catch (error) {
      addLog(`❌ Failed to load templates: ${error}`);
    }
  };

  const runFullTest = async () => {
    setLogs([]);
    addLog('🚀 Starting comprehensive StarkNet RPC test...');
    
    const serverHealthy = await testServerHealth();
    if (serverHealthy) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testStarkNetRPC();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testQueryTemplates();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testStarkNetQuery();
      
      addLog('🎉 Full test completed!');
      setStatus('All tests completed ✅');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">RPC Endpoint Test</h2>
      
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p><strong>Backend Server:</strong> {serverUrl}</p>
        <p><strong>Status:</strong> <span className={status.includes('✅') ? 'text-green-600' : status.includes('❌') ? 'text-red-600' : 'text-yellow-600'}>{status}</span></p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          This tests the StarkNet RPC connection through your backend SQL Query Sandbox server.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={runFullTest}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
        >
          🚀 Run Full Test
        </button>
        
        <button
          onClick={testServerHealth}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          🏥 Test Server Health
        </button>
        
        <button
          onClick={testStarkNetRPC}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          🔗 Test StarkNet RPC
        </button>
        
        <button
          onClick={testStarkNetQuery}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          🧪 Test SQL Query
        </button>
        
        <button
          onClick={testQueryTemplates}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          📝 Test Templates
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          🗑️ Clear Logs
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
        <div className="mb-2 text-gray-300">StarkNet RPC Test Console:</div>
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Click "Connect" to start testing.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
      </div>
    </div>
  );
};
