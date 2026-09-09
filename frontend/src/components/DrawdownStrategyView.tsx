import React, { useEffect, useState } from 'react';
import { getDrawdownData } from '../api/data.api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingDown, Target } from 'lucide-react';

export default function DrawdownStrategyView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDrawdownData()
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8">Loading Strategy Data...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 text-gray-800">
        <TrendingDown className="text-blue-600" size={32} /> Market Drawdown Strategy
      </h1>
      <p className="text-gray-600 mb-8">Live NIFTY 50 monitoring and dynamic allocation targets.</p>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-full">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Live NIFTY 50 Drawdown</p>
            <h2 className="text-3xl font-bold text-gray-900">-{data.currentDrawdown.toFixed(2)}%</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
            <Target size={28} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Active Strategy (Step {data.activeRule?.step || 1})</p>
            <h2 className="text-3xl font-bold text-blue-600">{data.activeRule?.equityAllocation}% Equity</h2>
            <p className="text-xs font-medium text-gray-400 mt-1">and {data.activeRule?.debtAllocation}% Debt/Cash</p>
          </div>
        </div>
      </div>

      {/* History Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Drawdown History (Last 7 Days)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} 
                tick={{fontSize: 12}}
              />
              <YAxis 
                tickFormatter={(val) => `-${val}%`} 
                tick={{fontSize: 12}}
              />
              <RechartsTooltip 
                formatter={(value: number) => [`-${value.toFixed(2)}%`, 'Drawdown']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#fee2e2" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategy Grid Table */}
      <h3 className="text-lg font-bold text-gray-800 mb-4">31-Step Strategy Master Grid</h3>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 relative">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Step</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Drawdown Range</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Equity %</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Debt/Cash %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.allRules?.map((rule: any) => {
                const isActive = data.activeRule?.id === rule.id;
                return (
                  <tr key={rule.id} className={isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 transition-colors'}>
                    <td className="px-3 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                      {rule.step} {isActive && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full shadow-sm">ACTIVE</span>}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-500">{rule.minDrawdown.toFixed(2)}% - {rule.maxDrawdown.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 font-bold">{rule.equityAllocation.toFixed(1)}%</td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-900 font-bold">{rule.debtAllocation.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
