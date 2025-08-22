import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StarknetDashboard: React.FC = () => {
  const [address, setAddress] = useState('');
  const [contractData, setContractData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContractData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:3001/starknet/contract/${address}`);
      setContractData(response.data);
    } catch (err) {
      setError('Failed to fetch contract data');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = () => {
    if (!contractData || !contractData.events) return [];
    const eventsByDate: { [key: string]: number } = {};
    contractData.events.forEach((event: any) => {
      const date = new Date(event.timestamp * 1000).toLocaleDateString();
      if (!eventsByDate[date]) {
        eventsByDate[date] = 0;
      }
      eventsByDate[date]++;
    });
    return Object.keys(eventsByDate).map(date => ({
      date,
      count: eventsByDate[date],
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Starknet Dashboard</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter contract address"
          className="border p-2 rounded w-full"
        />
        <button
          onClick={fetchContractData}
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {contractData && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 border rounded">
              <h3 className="font-bold">Total Events</h3>
              <p>{contractData.eventCount}</p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-bold">First Event</h3>
              <p>{contractData.firstEvent ? new Date(contractData.firstEvent.timestamp * 1000).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-bold">Last Event</h3>
              <p>{contractData.lastEvent ? new Date(contractData.lastEvent.timestamp * 1000).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
          <h2 className="text-xl font-bold">Event Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
          <h2 className="text-xl font-bold mt-4">Events</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Event</th>
                  <th className="py-2 px-4 border-b">Transaction Hash</th>
                  <th className="py-2 px-4 border-b">Block Number</th>
                </tr>
              </thead>
              <tbody>
                {contractData.events.map((event: any, index: number) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{event.name}</td>
                    <td className="py-2 px-4 border-b">{event.transaction_hash}</td>
                    <td className="py-2 px-4 border-b">{event.block_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StarknetDashboard;
