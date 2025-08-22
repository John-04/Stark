import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Database, BarChart3, ExternalLink, Zap } from 'lucide-react';
import AnimatedCard from '../components/ui/AnimatedCard';

const Docs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950 font-['Inter',sans-serif] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center gap-3 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl"
            >
              <BookOpen className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white">
              Welcome to Starklytics
            </h1>
          </motion.div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-medium">
            Your gateway to understanding and analyzing the Starknet ecosystem.
          </p>
        </motion.div>

        <div className="space-y-10">
          <AnimatedCard glow={true} gradient={true}>
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Database className="w-8 h-8 mr-3 text-blue-500" />
                Why Starknet Data Analysis Matters
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Starknet is a cutting-edge Layer 2 scaling solution for Ethereum, enabling dApps to achieve massive scale without compromising security. As the ecosystem grows, the ability to analyze on-chain data becomes crucial for developers, investors, and users alike.
              </p>
              <ul className="mt-6 space-y-4 text-lg text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">▶</span>
                  <div>
                    <span className="font-bold">For Developers:</span> Understand user behavior, optimize smart contracts, and identify new opportunities.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">▶</span>
                  <div>
                    <span className="font-bold">For Analysts:</span> Uncover trends, track protocol performance, and provide valuable insights to the community.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 font-bold mr-3">▶</span>
                  <div>
                    <span className="font-bold">For Everyone:</span> Gain a deeper understanding of the Starknet ecosystem, from DeFi and NFTs to gaming and identity.
                  </div>
                </li>
              </ul>
            </div>
          </AnimatedCard>

          <AnimatedCard glow={true} gradient={true}>
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-purple-500" />
                Getting Started with Starklytics
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                Starklytics empowers you to query, analyze, and visualize Starknet data with ease. Here's how to get started:
              </p>
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700 dark:text-gray-300">
                <li>
                  <span className="font-bold">Connect Your Wallet:</span> Securely connect your ArgentX or Braavos wallet to get started.
                </li>
                <li>
                  <span className="font-bold">Use the Query Editor:</span> Write custom SQL queries to explore Starknet data. We provide a powerful and intuitive editor to help you get the data you need.
                </li>
                <li>
                  <span className="font-bold">Build Dashboards:</span> Turn your queries into beautiful, interactive dashboards. Visualize your findings and share them with the world.
                </li>
                <li>
                  <span className="font-bold">Explore Bounties:</span> Participate in data analysis bounties, or create your own to get the insights you need.
                </li>
              </ol>
            </div>
          </AnimatedCard>

          <AnimatedCard glow={true} gradient={true}>
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Zap className="w-8 h-8 mr-3 text-yellow-500" />
                Understanding the Sepolia RPC
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                The Sepolia RPC is a critical component for developers building on Starknet. RPC (Remote Procedure Call) is a protocol that allows a program on one computer to execute a program on another computer without needing to understand the network's details. In the context of Starknet, the Sepolia RPC provides a gateway to the Sepolia testnet, which is a public testing environment for Starknet applications.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                When you interact with the Sepolia testnet, you are not directly connecting to the blockchain. Instead, you are sending requests to an RPC endpoint, which is a URL that provides access to a Starknet node. This node is a computer that is connected to the Starknet network and can execute transactions, query data, and perform other operations.
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                How It Works
              </h3>
              <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700 dark:text-gray-300">
                <li>
                  <span className="font-bold">Request:</span> Your application sends a request to the Sepolia RPC endpoint. This request is a JSON object that specifies the operation you want to perform, such as sending a transaction or querying a smart contract.
                </li>
                <li>
                  <span className="font-bold">Execution:</span> The RPC node receives the request and executes the specified operation on the Sepolia testnet.
                </li>
                <li>
                  <span className="font-bold">Response:</span> The RPC node sends a response back to your application, which contains the result of the operation. This response is also a JSON object.
                </li>
              </ol>
            </div>
          </AnimatedCard>

          <AnimatedCard glow={true} gradient={true}>
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <ExternalLink className="w-8 h-8 mr-3 text-green-500" />
                Useful Links
              </h2>
              <ul className="space-y-4 text-lg">
                <li>
                  <a href="https://www.starknet.io/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500 font-medium transition-colors">
                    Official Starknet Website
                  </a>
                </li>
                <li>
                  <a href="https://book.starknet.io/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500 font-medium transition-colors">
                    The Starknet Book
                  </a>
                </li>
                <li>
                  <a href="https://voyager.online/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500 font-medium transition-colors">
                    Voyager - Starknet Block Explorer
                  </a>
                </li>
                <li>
                  <a href="https://starkscan.co/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500 font-medium transition-colors">
                    Starkscan - Starknet Block Explorer
                  </a>
                </li>
              </ul>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
};

export default Docs;
