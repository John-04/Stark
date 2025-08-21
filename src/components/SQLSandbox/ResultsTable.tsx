import React, { useState, useMemo } from 'react';
import { Download, Search, Filter, ChevronLeft, ChevronRight, BarChart3, Table as TableIcon } from 'lucide-react';

interface ResultsTableProps {
  data: any[];
  isLoading?: boolean;
  error?: string;
  executionTime?: number;
  fromCache?: boolean;
  optimization?: any;
  warnings?: string[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  data = [],
  isLoading = false,
  error,
  executionTime,
  fromCache,
  optimization,
  warnings = []
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Get columns from data
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const csvContent = [
      columns.join(','),
      ...data.map(row => 
        columns.map(col => {
          const value = row[col];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'starknet_query_results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'string' && value.startsWith('0x')) {
      // Truncate long hex values
      return value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;
    }
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 text-white">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span>Executing query...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-900 text-white">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-300 mb-2">Query Error</h3>
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Query Results</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{filteredAndSortedData.length} rows</span>
              {executionTime && (
                <span>• {executionTime}ms</span>
              )}
              {fromCache && (
                <span className="bg-green-800 px-2 py-1 rounded text-xs">Cached</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-700 rounded">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-l ${viewMode === 'table' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 rounded-r ${viewMode === 'chart' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={exportToCSV}
              disabled={data.length === 0}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 rounded">
            <h4 className="text-sm font-medium text-yellow-300 mb-1">Warnings:</h4>
            <ul className="text-sm text-yellow-200 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Optimization Info */}
        {optimization && (
          <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded">
            <h4 className="text-sm font-medium text-blue-300 mb-1">Query Optimization:</h4>
            <div className="text-sm text-blue-200 space-y-1">
              <div>Estimated rows: {optimization.estimatedRows}</div>
              {optimization.suggestedIndexes.length > 0 && (
                <div>Suggested indexes: {optimization.suggestedIndexes.join(', ')}</div>
              )}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search results..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
          </select>
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-1 overflow-auto">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <TableIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No data to display</p>
              <p className="text-sm">Execute a query to see results here</p>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 sticky top-0">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      onClick={() => handleSort(column)}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-700 border-b border-gray-700"
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column}</span>
                        {sortColumn === column && (
                          <span className="text-blue-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-800 hover:bg-gray-800"
                  >
                    {columns.map((column) => (
                      <td
                        key={column}
                        className="px-4 py-3 text-sm text-gray-300"
                      >
                        <div className="max-w-xs truncate" title={String(row[column])}>
                          {formatValue(row[column])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="text-center text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chart view coming soon</p>
              <p className="text-sm">Visualizations for query results</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
