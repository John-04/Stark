import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, LineChart, PieChart, Plus } from 'lucide-react';

interface SavedQuery {
  id: string;
  name: string;
  query: string;
  visualizationType: string;
}

interface SavedQueriesProps {
  onAddWidget: (query: SavedQuery) => void;
}

const SavedQueries: React.FC<SavedQueriesProps> = ({ onAddWidget }) => {
  const { user } = useAuth();
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);

  useEffect(() => {
    const fetchSavedQueries = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/queries', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setSavedQueries(data);
        }
      } catch (error) {
        console.error('Failed to fetch saved queries:', error);
      }
    };

    if (user) {
      fetchSavedQueries();
    }
  }, [user]);

  const getIcon = (visualizationType: string) => {
    switch (visualizationType) {
      case 'bar':
        return <BarChart className="w-6 h-6 text-blue-500" />;
      case 'line':
        return <LineChart className="w-6 h-6 text-green-500" />;
      case 'pie':
        return <PieChart className="w-6 h-6 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Saved Queries</h3>
      <div className="space-y-2">
        {savedQueries.map((query) => (
          <div
            key={query.id}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              {getIcon(query.visualizationType)}
              <div>
                <div className="font-medium text-sm">{query.name}</div>
                <div className="text-xs text-gray-500 mt-1 truncate">{query.query}</div>
              </div>
            </div>
            <button
              onClick={() => onAddWidget(query)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Dashboard</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedQueries;
