import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, Users, DollarSign, Zap } from 'lucide-react';

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'defi' | 'nft' | 'analytics' | 'trading';
  widgets: Array<{
    type: string;
    title: string;
    query: string;
    position: { x: number; y: number; w: number; h: number };
    config: any;
  }>;
  preview: string;
}

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'starknet-overview',
    name: 'StarkNet Overview',
    description: 'Comprehensive overview of StarkNet network activity',
    category: 'analytics',
    preview: '/templates/starknet-overview.png',
    widgets: [
      {
        type: 'kpi',
        title: 'Total Transactions (24h)',
        query: `SELECT COUNT(*) as value, 'Total Transactions' as label, 
                ROUND(((COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE(timestamp))) / LAG(COUNT(*)) OVER (ORDER BY DATE(timestamp))) * 100, 2) as change
                FROM starknet_transactions 
                WHERE timestamp >= DATE('now', '-24 hours')`,
        position: { x: 0, y: 0, w: 3, h: 4 },
        config: { xAxis: 'label', yAxis: 'value', aggregation: 'sum' }
      },
      {
        type: 'kpi',
        title: 'Active Contracts',
        query: `SELECT COUNT(DISTINCT contract_address) as value, 'Active Contracts' as label
                FROM contract_calls 
                WHERE timestamp >= DATE('now', '-24 hours')`,
        position: { x: 3, y: 0, w: 3, h: 4 },
        config: { xAxis: 'label', yAxis: 'value', aggregation: 'count' }
      },
      {
        type: 'gauge',
        title: 'Network Utilization',
        query: `SELECT AVG(gas_used) as value, 500000 as max, 'Gas Usage' as label
                FROM starknet_transactions 
                WHERE timestamp >= DATE('now', '-1 hour')`,
        position: { x: 6, y: 0, w: 3, h: 4 },
        config: { xAxis: 'label', yAxis: 'value', aggregation: 'avg' }
      },
      {
        type: 'counter',
        title: 'Unique Users',
        query: `SELECT COUNT(DISTINCT from_address) as count
                FROM starknet_transactions 
                WHERE timestamp >= DATE('now', '-24 hours')`,
        position: { x: 9, y: 0, w: 3, h: 4 },
        config: { xAxis: '', yAxis: 'count', aggregation: 'count' }
      },
      {
        type: 'line',
        title: 'Transaction Volume Trend',
        query: `SELECT DATE(timestamp) as date, COUNT(*) as transaction_count 
                FROM starknet_transactions 
                WHERE timestamp >= DATE('now', '-30 days') 
                GROUP BY DATE(timestamp) 
                ORDER BY date`,
        position: { x: 0, y: 4, w: 6, h: 6 },
        config: { xAxis: 'date', yAxis: 'transaction_count', aggregation: 'sum' }
      },
      {
        type: 'pie',
        title: 'Gas Usage Distribution',
        query: `SELECT CASE 
                  WHEN gas_used < 50000 THEN 'Low' 
                  WHEN gas_used < 200000 THEN 'Medium' 
                  ELSE 'High' 
                END as gas_category, 
                COUNT(*) as transaction_count 
                FROM starknet_transactions 
                WHERE timestamp >= DATE('now', '-24 hours') 
                GROUP BY gas_category`,
        position: { x: 6, y: 4, w: 6, h: 6 },
        config: { xAxis: 'gas_category', yAxis: 'transaction_count', aggregation: 'count' }
      },
      {
        type: 'table',
        title: 'Recent Transactions',
        query: `SELECT transaction_hash, from_address, to_address, gas_used, timestamp 
                FROM starknet_transactions 
                ORDER BY timestamp DESC 
                LIMIT 10`,
        position: { x: 0, y: 10, w: 12, h: 6 },
        config: { xAxis: '', yAxis: '', aggregation: 'count' }
      }
    ]
  },
  {
    id: 'defi-analytics',
    name: 'DeFi Analytics',
    description: 'Track DeFi protocols and token movements on StarkNet',
    category: 'defi',
    preview: '/templates/defi-analytics.png',
    widgets: [
      {
        type: 'kpi',
        title: 'Total Value Locked',
        query: `SELECT SUM(amount * price_usd) as value, 'TVL (USD)' as label
                FROM token_balances tb
                JOIN token_prices tp ON tb.token_address = tp.token_address
                WHERE tb.timestamp >= DATE('now', '-1 hour')`,
        position: { x: 0, y: 0, w: 4, h: 4 },
        config: { xAxis: 'label', yAxis: 'value', aggregation: 'sum' }
      },
      {
        type: 'progress',
        title: 'Daily Volume Progress',
        query: `SELECT SUM(volume_usd) as current, 10000000 as target
                FROM dex_trades 
                WHERE DATE(timestamp) = DATE('now')`,
        position: { x: 4, y: 0, w: 4, h: 4 },
        config: { xAxis: '', yAxis: 'current', aggregation: 'sum' }
      },
      {
        type: 'counter',
        title: 'Active Traders',
        query: `SELECT COUNT(DISTINCT trader_address) as count
                FROM dex_trades 
                WHERE timestamp >= DATE('now', '-24 hours')`,
        position: { x: 8, y: 0, w: 4, h: 4 },
        config: { xAxis: '', yAxis: 'count', aggregation: 'count' }
      },
      {
        type: 'area',
        title: 'TVL Trend',
        query: `SELECT DATE(timestamp) as date, SUM(amount * price_usd) as tvl
                FROM token_balances tb
                JOIN token_prices tp ON tb.token_address = tp.token_address
                WHERE timestamp >= DATE('now', '-30 days')
                GROUP BY DATE(timestamp)
                ORDER BY date`,
        position: { x: 0, y: 4, w: 8, h: 6 },
        config: { xAxis: 'date', yAxis: 'tvl', aggregation: 'sum' }
      },
      {
        type: 'bar',
        title: 'Top Tokens by Volume',
        query: `SELECT token_symbol, SUM(volume_usd) as volume
                FROM dex_trades 
                WHERE timestamp >= DATE('now', '-24 hours')
                GROUP BY token_symbol
                ORDER BY volume DESC
                LIMIT 10`,
        position: { x: 8, y: 4, w: 4, h: 6 },
        config: { xAxis: 'token_symbol', yAxis: 'volume', aggregation: 'sum' }
      },
      {
        type: 'sankey',
        title: 'Token Flow',
        query: `SELECT from_token as source, to_token as target, SUM(amount_usd) as value
                FROM token_swaps 
                WHERE timestamp >= DATE('now', '-24 hours')
                GROUP BY from_token, to_token
                ORDER BY value DESC
                LIMIT 20`,
        position: { x: 0, y: 10, w: 12, h: 6 },
        config: { xAxis: 'source', yAxis: 'target', aggregation: 'sum' }
      }
    ]
  },
  {
    id: 'trading-dashboard',
    name: 'Trading Dashboard',
    description: 'Real-time trading metrics and price analysis',
    category: 'trading',
    preview: '/templates/trading-dashboard.png',
    widgets: [
      {
        type: 'candlestick',
        title: 'ETH/USDC Price Chart',
        query: `SELECT DATE(timestamp) as date, 
                MIN(price) as low, MAX(price) as high, 
                FIRST_VALUE(price) OVER (PARTITION BY DATE(timestamp) ORDER BY timestamp) as open,
                LAST_VALUE(price) OVER (PARTITION BY DATE(timestamp) ORDER BY timestamp) as close
                FROM token_prices 
                WHERE token_symbol = 'ETH' AND timestamp >= DATE('now', '-30 days')
                GROUP BY DATE(timestamp)
                ORDER BY date`,
        position: { x: 0, y: 0, w: 8, h: 8 },
        config: { xAxis: 'date', yAxis: 'price', aggregation: 'avg' }
      },
      {
        type: 'kpi',
        title: '24h Volume',
        query: `SELECT SUM(volume_usd) as value, '24h Volume' as label,
                ROUND(((SUM(volume_usd) - LAG(SUM(volume_usd)) OVER (ORDER BY DATE(timestamp))) / LAG(SUM(volume_usd)) OVER (ORDER BY DATE(timestamp))) * 100, 2) as change
                FROM dex_trades 
                WHERE timestamp >= DATE('now', '-24 hours')`,
        position: { x: 8, y: 0, w: 4, h: 4 },
        config: { xAxis: 'label', yAxis: 'value', aggregation: 'sum' }
      },
      {
        type: 'gauge',
        title: 'Market Sentiment',
        query: `SELECT 
                CASE 
                  WHEN AVG(price_change_24h) > 5 THEN 85
                  WHEN AVG(price_change_24h) > 0 THEN 65
                  WHEN AVG(price_change_24h) > -5 THEN 45
                  ELSE 25
                END as value,
                100 as max
                FROM token_prices 
                WHERE timestamp >= DATE('now', '-1 hour')`,
        position: { x: 8, y: 4, w: 4, h: 4 },
        config: { xAxis: '', yAxis: 'value', aggregation: 'avg' }
      },
      {
        type: 'heatmap',
        title: 'Trading Activity Heatmap',
        query: `SELECT DATE(timestamp) as x, HOUR(timestamp) as y, COUNT(*) as value
                FROM dex_trades 
                WHERE timestamp >= DATE('now', '-7 days')
                GROUP BY DATE(timestamp), HOUR(timestamp)`,
        position: { x: 0, y: 8, w: 6, h: 6 },
        config: { xAxis: 'x', yAxis: 'y', aggregation: 'count' }
      },
      {
        type: 'table',
        title: 'Top Gainers',
        query: `SELECT token_symbol, price, price_change_24h, volume_24h
                FROM token_prices 
                WHERE timestamp >= DATE('now', '-1 hour')
                ORDER BY price_change_24h DESC
                LIMIT 10`,
        position: { x: 6, y: 8, w: 6, h: 6 },
        config: { xAxis: '', yAxis: '', aggregation: 'count' }
      }
    ]
  }
];

export const DashboardTemplateSelector: React.FC<{
  onSelectTemplate: (template: DashboardTemplate) => void;
  onClose: () => void;
}> = ({ onSelectTemplate, onClose }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'defi': return <DollarSign className="w-5 h-5" />;
      case 'trading': return <TrendingUp className="w-5 h-5" />;
      case 'analytics': return <BarChart3 className="w-5 h-5" />;
      case 'nft': return <Zap className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'defi': return 'from-green-500 to-emerald-500';
      case 'trading': return 'from-blue-500 to-cyan-500';
      case 'analytics': return 'from-purple-500 to-pink-500';
      case 'nft': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Templates</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Choose a template to get started quickly</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DASHBOARD_TEMPLATES.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 group-hover:shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(template.category)} text-white`}>
                      {getCategoryIcon(template.category)}
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {template.category}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {template.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {template.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {template.widgets.length} widgets
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Use Template
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
