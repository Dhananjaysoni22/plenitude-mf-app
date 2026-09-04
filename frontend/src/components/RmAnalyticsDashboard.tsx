import React, { useEffect, useState } from 'react';
import { getRmAnalytics } from '../api/analytics.api';
import { getSystemSettings, updateSystemSettings } from '../api/data.api';
import { TrendingUp, Users, AlertTriangle, ShieldCheck, Trophy, Shield, Zap, Target, Settings } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function RmAnalyticsDashboard() {
  const [data, setData] = useState<{ rms: any[]; whales: any[]; unmappedHoldingsCount: number; unmappedUniqueCount: number } | null>(null);
  const [thresholdDays, setThresholdDays] = useState(45);
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getRmAnalytics(), getSystemSettings()])
      .then(([resAnalytics, resSettings]) => {
        setData(resAnalytics.data);
        if (resSettings.data && resSettings.data.reviewThresholdDays) {
          setThresholdDays(resSettings.data.reviewThresholdDays);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load analytics');
        setLoading(false);
      });
  }, []);

  const handleUpdateThreshold = async () => {
    setIsUpdatingThreshold(true);
    try {
      await updateSystemSettings({ reviewThresholdDays: thresholdDays });
      alert('Review threshold updated successfully!');
    } catch (e) {
      alert('Failed to update threshold.');
    } finally {
      setIsUpdatingThreshold(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500 font-medium">Loading God-Mode Analytics...</div>;
  if (error) return <div className="p-8 text-red-500 font-medium">{error}</div>;
  if (!data) return null;

  const { rms, whales } = data;

  const totalFirmAum = rms.reduce((acc, curr) => acc + curr.totalAum, 0);
  const totalFirmClients = rms.reduce((acc, curr) => acc + curr.totalClients, 0);

  // Derive Top Performers
  let topGrowthRm = rms[0];
  let topQualityRm = rms[0];
  
  rms.forEach(rm => {
    if (rm.growth30Day > (topGrowthRm?.growth30Day || 0)) topGrowthRm = rm;
    if (rm.qualityPercentage > (topQualityRm?.qualityPercentage || 0)) topQualityRm = rm;
  });

  const allMonths = [...new Set(rms.flatMap(rm => rm.history.map((h: any) => h.date)))].sort();
  const lineChartData = allMonths.map(month => {
    const dataPoint: any = { name: month };
    rms.forEach(rm => {
      const match = rm.history.find((h: any) => h.date === month);
      if (match) dataPoint[rm.name] = match.aum;
    });
    return dataPoint;
  });

  const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Target className="text-blue-600" size={32} /> Firm-Wide Analytics Command Center
        </h2>
        
        {/* System Settings for Admin */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
          <Settings className="text-gray-500" size={20} />
          <span className="text-sm font-semibold text-gray-700">Portfolio Review Threshold (Days):</span>
          <input 
            type="number" 
            min="1" 
            className="border border-gray-300 rounded px-2 py-1 w-20 text-sm focus:outline-none focus:border-blue-500"
            value={thresholdDays}
            onChange={(e) => setThresholdDays(parseInt(e.target.value) || 45)}
          />
          <button 
            onClick={handleUpdateThreshold}
            disabled={isUpdatingThreshold}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            {isUpdatingThreshold ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* System Health / Unmapped Bottlenecks */}
      {data.unmappedHoldingsCount > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg mb-8 flex items-start gap-4">
          <AlertTriangle className="text-orange-500 mt-1" size={24} />
          <div>
            <h3 className="text-orange-800 font-bold text-lg">System Health Warning: {data.unmappedHoldingsCount} Unmapped Client Holdings</h3>
            <p className="text-orange-600 text-sm mt-1">There are {data.unmappedUniqueCount} unique mutual funds that are not yet mapped to Research Funds. This prevents accurate analytics. Please go to the Mapping page to resolve them.</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl shadow-lg text-white">
          <p className="text-blue-100 text-sm font-medium mb-1 flex items-center gap-2"><TrendingUp size={16}/> Total Firm AUM</p>
          <p className="text-4xl font-extrabold">₹{(totalFirmAum / 10000000).toFixed(2)} Cr</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
          <p className="text-indigo-100 text-sm font-medium mb-1 flex items-center gap-2"><Users size={16}/> Total Active Clients</p>
          <p className="text-4xl font-extrabold">{totalFirmClients}</p>
        </div>
        
        {topGrowthRm && (
          <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-amber-300 flex items-center gap-4 relative overflow-hidden">
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <Trophy size={28} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Top Wealth Generator</p>
              <p className="font-extrabold text-gray-900 text-lg">{topGrowthRm.name}</p>
              <p className="text-green-600 text-sm font-bold">+₹{(topGrowthRm.growth30Day / 100000).toFixed(1)}L (30 Days)</p>
            </div>
          </div>
        )}

        {topQualityRm && (
          <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-emerald-300 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
              <Shield size={28} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Safest Portfolio Book</p>
              <p className="font-extrabold text-gray-900 text-lg">{topQualityRm.name}</p>
              <p className="text-emerald-600 text-sm font-bold">{topQualityRm.qualityPercentage.toFixed(1)}% Top Tier</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Multi-RM Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> 6-Month AUM Trajectory (RM Race)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => '₹' + (val / 10000000).toFixed(1) + 'Cr'} />
                <Tooltip formatter={(value: number) => ['₹' + (value / 10000000).toFixed(2) + ' Cr', 'AUM']} />
                <Legend />
                {rms.map((rm, i) => (
                  <Line key={rm.id} type="monotone" dataKey={rm.name} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Whale Clients Risk */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="text-amber-500" /> Key Person Risk (Top 5 Whales)
          </h3>
          <p className="text-xs text-gray-500 mb-4">Firm-wide largest clients and the RM controlling them.</p>
          <div className="space-y-4">
            {whales.map((whale, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{whale.clientName}</p>
                  <p className="text-xs text-gray-500 font-medium">Managed by {whale.rmName}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-blue-700">₹{(whale.totalAum / 10000000).toFixed(2)} Cr</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Asset Allocation Stacked Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Asset Allocation Profile (Equity Risk)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rms} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => '₹' + (val / 10000000).toFixed(1) + 'Cr'} />
                <Tooltip formatter={(value: number) => ['₹' + (value / 10000000).toFixed(2) + ' Cr', 'AUM']} />
                <Legend />
                <Bar dataKey="equityAum" name="Equity" stackId="a" fill="#16a34a" />
                <Bar dataKey="debtAum" name="Debt" stackId="a" fill="#dc2626" />
                <Bar dataKey="hybridAum" name="Hybrid" stackId="a" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Firm-Wide Dead Money (Q4 Exposure) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
             <AlertTriangle className="text-red-500" /> Firm-Wide Dead Money (Q4 Exposure)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rms} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => '₹' + (val / 100000).toFixed(0) + 'L'} />
                <Tooltip formatter={(value: number) => ['₹' + (value / 100000).toFixed(2) + ' Lakhs', 'Stuck in Q4']} />
                <Bar dataKey="q4Aum" name="Q4 AUM (Reputation Risk)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RM Accountability Matrix (Leaderboard Table) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
           <Shield className="text-blue-600" /> RM Accountability & Performance Matrix
        </h3>
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">RM Name</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-right">30-Day Growth</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-center w-48">Advisory Quality</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-center">Overdue Reviews</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-center">Avg Resolution SLA</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-center">Active Alerts</th>
            </tr>
          </thead>
          <tbody>
            {rms.map((rm: any) => {
              const overdueRate = rm.totalClients > 0 ? (rm.overdueReviews / rm.totalClients) * 100 : 0;
              return (
              <tr key={rm.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4 font-bold text-gray-800 text-sm">{rm.name}</td>
                <td className="py-4 px-4 text-right text-sm">
                  {rm.growth30Day > 0 ? (
                    <span className="text-green-600 font-bold">+₹{(rm.growth30Day / 100000).toFixed(1)}L</span>
                  ) : (
                    <span className="text-red-500 font-bold">₹{(rm.growth30Day / 100000).toFixed(1)}L</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col items-center gap-1 w-full">
                    <span className="text-xs font-bold text-gray-600">{rm.qualityPercentage.toFixed(1)}% Top Tier</span>
                    <div className="w-full bg-red-100 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-green-500 h-full" style={{ width: `${rm.qualityPercentage}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                   {rm.overdueReviews > 0 ? (
                     <span className="text-orange-600 font-bold">{rm.overdueReviews} Clients ({overdueRate.toFixed(0)}%)</span>
                   ) : (
                     <span className="text-green-600 font-bold">0 Clients</span>
                   )}
                </td>
                <td className="py-4 px-4 text-center text-sm font-medium">
                  {rm.alerts.avgResolutionDays > 0 ? `${rm.alerts.avgResolutionDays.toFixed(1)} Days` : '-'}
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex justify-center flex-col gap-1 items-center">
                    {rm.alerts.pending > 0 && <span className="text-yellow-600 text-xs font-bold flex items-center gap-1"><AlertTriangle size={12}/> {rm.alerts.pending} Pending</span>}
                    {rm.alerts.escalated > 0 && <span className="text-red-600 text-xs font-bold flex items-center gap-1"><AlertTriangle size={12}/> {rm.alerts.escalated} Escalated</span>}
                    {rm.alerts.pending === 0 && rm.alerts.escalated === 0 && <span className="text-green-600 text-xs font-bold flex items-center gap-1"><ShieldCheck size={12}/> Clean</span>}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
