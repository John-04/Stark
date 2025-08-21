import React, { useState } from 'react';
import { sqlSandboxService } from '../services/sqlSandboxService';
import { apiClient, API_CONFIG } from '../config/api';

export const APITest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult('🧪 Starting RPC API Integration Tests...');
    
    try {
      // Test 1: Initialize SQL Sandbox
      addResult('1️⃣ Testing SQL Sandbox Initialization...');
      await sqlSandboxService.initialize();
      addResult('✅ SQL Sandbox initialized successfully');
      
      // Test 2: Check API Status
      addResult('2️⃣ Testing API Status Check...');
      const apiStatus = await sqlSandboxService.getAPIStatus();
      addResult(`📊 API Connected: ${apiStatus.connected}, Endpoint: ${apiStatus.endpoint}`);
      addResult(`📊 Features: ${JSON.stringify(apiStatus.features)}`);
      
      // Test 3: Test Schema Fetching
      addResult('3️⃣ Testing Schema Fetching...');
      try {
        const schemas = await sqlSandboxService.getTableSchemas();
        addResult(`📋 Schemas retrieved: ${Object.keys(schemas).join(', ')}`);
      } catch (error) {
        addResult(`⚠️ Schema fetching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 4: Test Query Execution
      addResult('4️⃣ Testing Query Execution...');
      const testQueries = [
        'SELECT * FROM transactions LIMIT 5',
        'SELECT * FROM blocks LIMIT 3', 
        'SELECT * FROM events LIMIT 2'
      ];
      
      for (const testQuery of testQueries) {
        try {
          addResult(`🔍 Testing: ${testQuery}`);
          const result = await sqlSandboxService.executeQuery(testQuery);
          addResult(`✅ Success: ${result.rowCount} rows, ${result.executionTime}ms`);
          if (result.data && result.data.length > 0) {
            addResult(`📄 Sample: ${JSON.stringify(result.data[0]).substring(0, 100)}...`);
          }
        } catch (error) {
          addResult(`⚠️ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Test 5: Direct API Health Check
      addResult('5️⃣ Testing Direct API Health Check...');
      try {
        const healthCheck = await apiClient.checkHealth();
        addResult(`❤️ Health Check Result: ${healthCheck}`);
      } catch (error) {
        addResult(`⚠️ Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 6: Test Direct RPC Query Call
      addResult('6️⃣ Testing Direct RPC Query Call...');
      try {
        const directQuery = await apiClient.executeRPCQuery('SELECT * FROM starknet_transactions LIMIT 3');
        addResult(`🎯 Direct RPC Success: ${Array.isArray(directQuery) ? directQuery.length : 'N/A'} rows`);
        if (directQuery && directQuery.length > 0) {
          addResult(`📄 Direct Sample: ${JSON.stringify(directQuery[0]).substring(0, 100)}...`);
        }
      } catch (error) {
        addResult(`⚠️ Direct RPC query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      addResult('✅ All tests completed!');
      
    } catch (error) {
      addResult(`❌ Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">RPC API Integration Test</h2>
        <p className="text-gray-600 mb-6">
          Test the integration between the SQL Sandbox and your RPC API endpoint: 
          <code className="bg-gray-100 px-2 py-1 rounded text-sm ml-2">
            {API_CONFIG.RPC_BASE_URL}
          </code>
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Debug Info:</strong> Check browser console for detailed SQL query logs and API responses.
          </p>
        </div>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={runTests}
            disabled={isRunning}
            className={`px-6 py-2 rounded-lg font-medium ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? 'Running Tests...' : 'Run API Tests'}
          </button>
          
          <button
            onClick={clearResults}
            className="px-6 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Clear Results
          </button>
        </div>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-gray-500">Click "Run API Tests" to start testing...</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
