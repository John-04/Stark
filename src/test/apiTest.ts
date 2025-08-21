// Test file for RPC API integration
import { sqlSandboxService } from '../services/sqlSandboxService';
import { apiClient, API_CONFIG } from '../config/api';

// Test the RPC API integration
export async function testRPCIntegration() {
  console.log('🧪 Starting RPC API Integration Tests...');
  
  try {
    // Test 1: Initialize the SQL Sandbox Service
    console.log('\n1️⃣ Testing SQL Sandbox Initialization...');
    await sqlSandboxService.initialize();
    console.log('✅ SQL Sandbox initialized successfully');
    
    // Test 2: Check API Status
    console.log('\n2️⃣ Testing API Status Check...');
    const apiStatus = await sqlSandboxService.getAPIStatus();
    console.log('📊 API Status:', {
      connected: apiStatus.connected,
      endpoint: apiStatus.endpoint,
      features: apiStatus.features
    });
    
    // Test 3: Test Schema Fetching
    console.log('\n3️⃣ Testing Schema Fetching...');
    try {
      const schemas = await sqlSandboxService.getTableSchemas();
      console.log('📋 Schemas retrieved:', Object.keys(schemas));
    } catch (error) {
      console.log('⚠️ Schema fetching failed, using fallback:', error);
    }
    
    // Test 4: Test Query Execution
    console.log('\n4️⃣ Testing Query Execution...');
    const testQuery = 'SELECT * FROM blocks LIMIT 5';
    try {
      const result = await sqlSandboxService.executeQuery(testQuery);
      console.log('🔍 Query Result:', {
        success: result.success,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        fromCache: result.fromCache,
        dataPreview: result.data?.slice(0, 2) // Show first 2 rows
      });
    } catch (error) {
      console.log('⚠️ Query execution failed:', error);
    }
    
    // Test 5: Test Direct API Calls
    console.log('\n5️⃣ Testing Direct API Calls...');
    
    // Test health endpoint
    try {
      const healthCheck = await apiClient.checkHealth();
      console.log('❤️ Health Check:', healthCheck);
    } catch (error) {
      console.log('⚠️ Health check failed:', error);
    }
    
    // Test query endpoint directly
    try {
      const directQuery = await apiClient.post(API_CONFIG.ENDPOINTS.QUERY, {
        query: 'SELECT COUNT(*) as total FROM blocks',
        parsedQuery: { tables: ['blocks'], columns: ['COUNT(*)'], conditions: [], joins: [], groupBy: [], orderBy: [], limit: null, offset: null }
      });
      console.log('🎯 Direct Query Result:', directQuery);
    } catch (error) {
      console.log('⚠️ Direct query failed:', error);
    }
    
    // Test 6: Test Reconnection
    console.log('\n6️⃣ Testing API Reconnection...');
    const reconnectResult = await sqlSandboxService.reconnectAPI();
    console.log('🔄 Reconnection Result:', reconnectResult);
    
    console.log('\n✅ RPC API Integration Tests Complete!');
    
  } catch (error) {
    console.error('❌ Test Suite Failed:', error);
  }
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to window for manual testing
  (window as any).testRPCIntegration = testRPCIntegration;
  console.log('🔧 Test function available as window.testRPCIntegration()');
}
