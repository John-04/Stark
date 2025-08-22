const { RpcProvider } = require('starknet');

async function testStarkNetRPC() {
  console.log('🔍 Testing StarkNet RPC Connection...\n');
  
  const rpcUrl = process.env.STARKNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io';
  console.log(`📡 RPC URL: ${rpcUrl}`);
  
  try {
    // Initialize StarkNet provider
    const provider = new RpcProvider({
      nodeUrl: rpcUrl
    });
    
    console.log('✅ StarkNet provider initialized');
    
    // Test 1: Get chain ID
    console.log('\n🧪 Test 1: Getting chain ID...');
    const chainId = await provider.getChainId();
    console.log(`✅ Chain ID: ${chainId}`);
    
    // Test 2: Get latest block number
    console.log('\n🧪 Test 2: Getting latest block number...');
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Latest block number: ${blockNumber}`);
    
    // Test 3: Get block details
    console.log('\n🧪 Test 3: Getting block details...');
    const block = await provider.getBlock('latest');
    console.log(`✅ Latest block hash: ${block.block_hash}`);
    console.log(`✅ Block timestamp: ${block.timestamp}`);
    console.log(`✅ Number of transactions: ${block.transactions.length}`);
    
    console.log('\n🎉 All StarkNet RPC tests passed!');
    console.log('✅ StarkNet connection is working correctly');
    
  } catch (error) {
    console.error('\n❌ StarkNet RPC test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Suggestions:');
      console.log('- Check your internet connection');
      console.log('- Verify the RPC URL is accessible');
      console.log('- Try a different StarkNet RPC endpoint');
    }
    
    process.exit(1);
  }
}

testStarkNetRPC();
