import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRmIntelligence, markPortfolioReviewed } from '../api/rm.api';
import { AlertTriangle, TrendingDown, PhoneCall, ShieldAlert, Target, Zap, Search } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MarketStrategyWidget } from './MarketStrategyWidget';
import Pagination from './Pagination';

export default function RmActionDashboard() {
  const [data, setData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showOnlyQ4, setShowOnlyQ4] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await getRmIntelligence();
      setData(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load RM Action Center');
      setLoading(false);
    }
  };

  const markReviewed = async (clientId: string) => {
    try {
      await markPortfolioReviewed(clientId);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-gray-500 font-medium">Loading Intelligence...</div>;
  if (error) return <div className="p-8 text-red-500 font-medium">{error}</div>;
  if (!data) return null;

  const PIE_COLORS = ['#16a34a', '#84cc16', '#eab308', '#dc2626', '#9ca3af'];

  const atRiskAmount = data.quartiles.find((q: any) => q.name.includes('Q4'))?.value || 0;

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 pb-12">
      
      <MarketStrategyWidget />

      <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <Target className="text-blue-600" size={32} /> RM Action Center
      </h2>
      <p className="text-gray-500 mb-8">Intelligent daily insights. Prioritize your calls and mitigate risk.</p>

      {/* Hero Opportunity Banner */}
      {atRiskAmount > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-5 rounded-r-xl mb-8 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Zap className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-red-800 font-extrabold text-lg">INR {(atRiskAmount / 100000).toFixed(1)} Lakhs at High Risk (Q4 Exposure)</h3>
              <p className="text-red-600 text-sm font-medium">This capital is currently sitting in bottom-quartile funds. Call these clients immediately to restructure.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowOnlyQ4(!showOnlyQ4);
              setCurrentPage(1);
              if (!showOnlyQ4) {
                 document.getElementById('roster-table')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors"
          >
            {showOnlyQ4 ? "Clear Q4 Filter" : "Generate Q4 Call List"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Portfolio Quality Donut */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Overall Portfolio Quality</h3>
          <p className="text-xs text-gray-500 mb-4">Total book broken down by research quartile.</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.quartiles.filter((q: any) => q.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.quartiles.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => ['INR ' + (value / 100000).toFixed(1) + ' L', 'AUM']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flight Risk Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
             <TrendingDown className="text-red-500" /> Flight Risk Tracker
          </h3>
          <p className="text-xs text-gray-500 mb-4">Bottom 5 clients with the largest 30-day negative growth.</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.flightRisk} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(val) => '-INR ' + (Math.abs(val) / 100000).toFixed(0) + 'L'} reversed />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <RechartsTooltip formatter={(value: number) => ['-INR ' + (Math.abs(value) / 100000).toFixed(1) + ' L', 'Loss']} />
                <Bar dataKey="growth" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Smart Call List */}
      <div id="roster-table" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PhoneCall className="text-blue-600" /> Master Client Roster & Alerts
            {showOnlyQ4 && <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full border border-red-200">Q4 Filter Active</span>}
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by Client, PAN, or risk (Q3, Q4, Drawdown)..." 
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        
        {data.callList.length === 0 ? (
          <p className="text-gray-500 italic">No clients assigned to your profile yet.</p>
        ) : (
          <>
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-gray-100 shadow-sm border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-3 font-bold text-gray-700 uppercase tracking-wider">Client & PAN</th>
                    <th className="py-2 px-3 font-bold text-gray-700 uppercase tracking-wider">Alerts & Risks</th>
                    <th className="py-2 px-3 font-bold text-gray-700 uppercase tracking-wider">Equity Allocation</th>
                    <th className="py-2 px-3 font-bold text-gray-700 uppercase tracking-wider">Last Review</th>
                    <th className="py-2 px-3 font-bold text-gray-700 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.callList
                    .filter((c: any) => showOnlyQ4 ? c.alertTypes?.includes('Q4_ALERT') : true)
                    .filter((c: any) => 
                      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      c.pan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.alertTypes?.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((client: any, idx: number) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors bg-white">
                      <td className="py-2 px-3 whitespace-nowrap">
                        <p className="font-bold text-gray-900">{client.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{client.pan || 'N/A'}</p>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {client.alertTypes?.map((t: string) => {
                             let badge = t;
                             let color = 'bg-gray-100 text-gray-800 border-gray-200';
                             if(t === 'Q4_ALERT') { badge = 'Q4 Risk'; color = 'bg-red-50 text-red-700 border-red-200'; }
                             if(t === 'Q3_ALERT') { badge = 'Q3 Risk'; color = 'bg-yellow-50 text-yellow-700 border-yellow-200'; }
                             if(t === 'DRAWDOWN_ALERT') { badge = 'Rebalance'; color = 'bg-amber-50 text-amber-700 border-amber-200'; }
                             return <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${color}`}>{badge}</span>
                          })}
                          {(!client.alertTypes || client.alertTypes.length === 0) && client.isOverdue && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border bg-orange-50 text-orange-700 border-orange-200">Overdue Review</span>
                          )}
                          {(!client.alertTypes || client.alertTypes.length === 0) && !client.isOverdue && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-400">Stable</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <p className={`font-semibold ${client.isOverExposed ? 'text-amber-600' : 'text-gray-700'}`}>
                          {client.equityRatio.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">INR {(client.equityAum || 0).toLocaleString()}</p>
                      </td>
                      <td className={`py-2 px-3 ${client.isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                        {client.daysSinceReview}d
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <Link to={`/clients/${client.clientId}`} className="text-blue-600 hover:text-blue-800 font-bold hover:underline">
                          View 360
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(data.callList.filter((c: any) => showOnlyQ4 ? c.alertTypes?.includes('Q4_ALERT') : true).filter((c:any) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.pan?.toLowerCase().includes(searchQuery.toLowerCase()) || c.alertTypes?.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase()))).length / itemsPerPage)}
                totalItems={data.callList.filter((c: any) => showOnlyQ4 ? c.alertTypes?.includes('Q4_ALERT') : true).filter((c:any) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.pan?.toLowerCase().includes(searchQuery.toLowerCase()) || c.alertTypes?.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase()))).length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
              />
          </>
        )}
      </div>

    </div>
  );
}
