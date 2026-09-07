import React, { useEffect, useState } from 'react';
import { TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

export const MarketStrategyWidget = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    axiosClient.get('/data/drawdown').then(res => {
      setData(res.data);
    });
  }, []);

  if (!data) return null;

  return (
    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl shadow-lg p-6 mb-6 text-white flex flex-col md:flex-row items-center justify-between">
      
      <div className="flex items-center gap-6 mb-4 md:mb-0">
        <div className="bg-white/10 p-4 rounded-full">
          <Activity size={32} className="text-blue-300" />
        </div>
        <div>
          <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Live NIFTY 50 Drawdown</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold text-white">-{data.currentDrawdown.toFixed(2)}%</h2>
          </div>
        </div>
      </div>

      <div className="h-16 w-32 hidden lg:block opacity-75">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.history}>
            <YAxis domain={['auto', 'auto']} hide />
            <Area type="monotone" dataKey="drawdown" stroke="#93c5fd" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-black/20 p-4 rounded-lg border border-white/10 flex-1 md:ml-8">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={18} className="text-yellow-400" />
          <h3 className="font-semibold text-white">Recommended Strategy (Step {data.activeRule?.step || 1})</h3>
        </div>
        {data.activeRule ? (
          <p className="text-blue-100">
            Current market conditions recommend an allocation of <span className="font-bold text-white">{data.activeRule.equityAllocation}% Equity</span> and <span className="font-bold text-white">{data.activeRule.debtAllocation}% Debt/Cash</span>.
          </p>
        ) : (
          <p className="text-blue-100">No strategy mapped for this drawdown.</p>
        )}
      </div>
      
    </div>
  );
};
