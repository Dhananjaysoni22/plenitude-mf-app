import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

export default function DrawdownStrategyView() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosClient.get('/data/drawdown')
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8">Loading Strategy Data...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Market Drawdown Strategy</h1>
      <p className="text-gray-600 mb-8">This grid automatically recommends the Target Equity allocation based on the live NIFTY 50 Drawdown.</p>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drawdown Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equity %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debt/Cash %</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.allRules?.map((rule: any) => {
              const isActive = data.activeRule?.id === rule.id;
              return (
                <tr key={rule.id} className={isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rule.step} {isActive && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">ACTIVE</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.minDrawdown.toFixed(2)}% - {rule.maxDrawdown.toFixed(2)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{rule.equityAllocation.toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{rule.debtAllocation.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
