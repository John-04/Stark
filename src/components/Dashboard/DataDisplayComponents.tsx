import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';

interface DataDisplayProps {
  data: any[];
  config?: any;
  title?: string;
}

// KPI Card Component
export const KPICard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
}> = ({ title, value, change, changeType = 'neutral', icon, color = 'blue' }) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decrease': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return 'text-green-600';
      case 'decrease': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        {icon && (
          <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className="ml-1 text-sm font-medium">
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Counter Component
export const Counter: React.FC<{
  value: number;
  label: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, label, color = 'blue', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className={`${sizeClasses[size]} font-bold text-${color}-600 dark:text-${color}-400 mb-2`}
      >
        {value.toLocaleString()}
      </motion.div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
    </motion.div>
  );
};

// Progress Bar Component
export const ProgressBar: React.FC<{
  value: number;
  max: number;
  label: string;
  color?: string;
  showPercentage?: boolean;
}> = ({ value, max, label, color = 'blue', showPercentage = true }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {showPercentage && (
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {percentage.toFixed(1)}%
          </span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-3 bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-full relative overflow-hidden`}
        >
          <motion.div
            animate={{ x: ["0%", "100%"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </motion.div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{value.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </motion.div>
  );
};

// Gauge Chart Component
export const GaugeChart: React.FC<{
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: number;
}> = ({ value, max, label, color = 'blue', size = 120 }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180; // Half circle
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} className="overflow-visible">
          {/* Background arc */}
          <path
            d={`M 10 ${size / 2} A ${size / 2 - 10} ${size / 2 - 10} 0 0 1 ${size - 10} ${size / 2}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: percentage / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            d={`M 10 ${size / 2} A ${size / 2 - 10} ${size / 2 - 10} 0 0 1 ${size - 10} ${size / 2}`}
            fill="none"
            stroke={`rgb(59 130 246)`} // blue-500
            strokeWidth="8"
            strokeLinecap="round"
            style={{ pathLength: percentage / 100 }}
          />
          {/* Needle */}
          <motion.line
            initial={{ rotate: -90 }}
            animate={{ rotate: angle - 90 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            x1={size / 2}
            y1={size / 2}
            x2={size / 2}
            y2="20"
            stroke="#374151"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
          />
          {/* Center dot */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r="4"
            fill="#374151"
          />
        </svg>
      </div>
      
      <div className="text-center mt-2">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Max: {max.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Data Table Component
export const DataTable: React.FC<DataDisplayProps & {
  pageSize?: number;
  sortable?: boolean;
}> = ({ data, title, pageSize = 10, sortable = true }) => {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  const columns = Object.keys(data[0]);
  
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const paginatedData = sortedData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const totalPages = Math.ceil(data.length / pageSize);

  const handleSort = (column: string) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      key: column,
      direction: prev?.key === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                    sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.replace(/_/g, ' ')}</span>
                    {sortable && sortConfig?.key === column && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUp className="w-3 h-3" /> : 
                        <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((row, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                  >
                    {typeof row[column] === 'number' 
                      ? row[column].toLocaleString() 
                      : String(row[column])
                    }
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, data.length)} of {data.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-500"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-500"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
