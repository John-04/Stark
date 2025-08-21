import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { Play, Save, Download, RefreshCw, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';

interface QueryEditorProps {
  onExecuteQuery: (query: string) => Promise<any>;
  onValidateQuery: (query: string) => Promise<any>;
  isExecuting?: boolean;
  theme?: 'light' | 'dark';
}

export const QueryEditor: React.FC<QueryEditorProps> = ({
  onExecuteQuery,
  onValidateQuery,
  isExecuting = false,
  theme = 'dark'
}) => {
  const [query, setQuery] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [savedQueries, setSavedQueries] = useState<Array<{ name: string; query: string }>>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [queryName, setQueryName] = useState('');

  // Load saved queries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('starknet_saved_queries');
    if (saved) {
      try {
        setSavedQueries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved queries:', e);
      }
    }
  }, []);

  // Validate query as user types (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setValidation(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const result = await onValidateQuery(query);
        setValidation(result);
      } catch (error) {
        console.error('Validation error:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, onValidateQuery]);

  const handleExecute = async () => {
    if (!query.trim()) return;
    await onExecuteQuery(query);
  };

  const handleSaveQuery = () => {
    if (!queryName.trim() || !query.trim()) return;

    const newQuery = { name: queryName, query };
    const updated = [...savedQueries, newQuery];
    setSavedQueries(updated);
    localStorage.setItem('starknet_saved_queries', JSON.stringify(updated));
    
    setQueryName('');
    setShowSaveDialog(false);
  };

  const loadQuery = (savedQuery: { name: string; query: string }) => {
    setQuery(savedQuery.query);
  };

  const deleteQuery = (index: number) => {
    const updated = savedQueries.filter((_, i) => i !== index);
    setSavedQueries(updated);
    localStorage.setItem('starknet_saved_queries', JSON.stringify(updated));
  };

  const exportQuery = () => {
    const blob = new Blob([query], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'starknet_query.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getValidationIcon = () => {
    if (!validation) return null;
    
    if (validation.isValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const exampleQueries = [
    {
      name: "Recent Blocks",
      query: "SELECT block_number, timestamp, transaction_count FROM blocks ORDER BY block_number DESC LIMIT 10"
    },
    {
      name: "Transaction Types",
      query: "SELECT type, COUNT(*) as count FROM transactions GROUP BY type ORDER BY count DESC"
    },
    {
      name: "Active Contracts",
      query: "SELECT contract_address, class_hash, deployed_at_block FROM contracts ORDER BY deployed_at_block DESC LIMIT 20"
    }
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">StarkNet SQL Query Editor</h2>
          {getValidationIcon()}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center space-x-1"
            disabled={!query.trim()}
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <button
            onClick={exportQuery}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center space-x-1"
            disabled={!query.trim()}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          {/* Example Queries */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Example Queries</h3>
            <div className="space-y-2">
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(example.query)}
                  className="w-full text-left p-2 text-sm bg-gray-700 hover:bg-gray-600 rounded"
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>

          {/* Saved Queries */}
          {savedQueries.length > 0 && (
            <div className="p-4 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Saved Queries</h3>
              <div className="space-y-2">
                {savedQueries.map((saved, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <button
                      onClick={() => loadQuery(saved)}
                      className="flex-1 text-left p-2 text-sm bg-gray-700 hover:bg-gray-600 rounded mr-2"
                    >
                      {saved.name}
                    </button>
                    <button
                      onClick={() => deleteQuery(index)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Query Editor */}
          <div className="flex-1 relative">
            <CodeMirror
              value={query}
              onChange={(value) => setQuery(value)}
              extensions={[sql()]}
              theme={theme === 'dark' ? oneDark : undefined}
              placeholder="Enter your SQL query here..."
              className="h-full"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: false
              }}
            />
          </div>

          {/* Validation Messages */}
          {validation && (
            <div className="p-3 border-t border-gray-700 bg-gray-800">
              {validation.errors.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center space-x-2 text-red-400 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Errors:</span>
                  </div>
                  <ul className="text-sm text-red-300 ml-6 space-y-1">
                    {validation.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center space-x-2 text-yellow-400 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Warnings:</span>
                  </div>
                  <ul className="text-sm text-yellow-300 ml-6 space-y-1">
                    {validation.warnings.map((warning: string, index: number) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.suggestions.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 text-blue-400 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Suggestions:</span>
                  </div>
                  <ul className="text-sm text-blue-300 ml-6 space-y-1">
                    {validation.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Execute Button */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <button
              onClick={handleExecute}
              disabled={isExecuting || !query.trim() || (validation && !validation.isValid)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded font-medium flex items-center justify-center space-x-2"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Query</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Save Query</h3>
            <input
              type="text"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="Enter query name..."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuery}
                disabled={!queryName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
