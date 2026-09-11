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
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('alerts');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showOnlyQ4, setShowOnlyQ4] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'alerts' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-400 opacity-50">↕</span>;
    return <span className="ml-1 text-blue-600 font-bold">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

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

      {/* Smart Call List */}
      <div id="roster-table" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PhoneCall className="text-blue-600" /> Master Client Roster & Alerts
            {showOnlyQ4 && <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full border border-red-200">Q4 Filter Active</span>}
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by Client, PAN, or risk..." 
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        
        {data.callList.length === 0 ? (
          <p className="text-gray-500 italic">No clients assigned to your profile yet.</p>
        ) : (
          (() => {
            let processedList = data.callList
              .filter((c: any) => showOnlyQ4 ? c.alertTypes?.includes('Q4_ALERT') : true)
              .filter((c: any) => 
                c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                c.pan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.alertTypes?.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase()))
              );

            processedList.sort((a: any, b: any) => {
              if (sortField === 'alerts') return sortDir === 'asc' ? a.alerts - b.alerts : b.alerts - a.alerts;
              if (sortField === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
              if (sortField === 'pan') return sortDir === 'asc' ? (a.pan || '').localeCompare(b.pan || '') : (b.pan || '').localeCompare(a.pan || '');
              if (sortField === 'totalAum') return sortDir === 'asc' ? a.totalAum - b.totalAum : b.totalAum - a.totalAum;
              if (sortField === 'equityAum') return sortDir === 'asc' ? a.equityAum - b.equityAum : b.equityAum - a.equityAum;
              if (sortField === 'debtAum') return sortDir === 'asc' ? a.debtAum - b.debtAum : b.debtAum - a.debtAum;
              if (sortField === 'transferAmount') return sortDir === 'asc' ? a.transferAmount - b.transferAmount : b.transferAmount - a.transferAmount;
              if (sortField === 'daysSinceReview') return sortDir === 'asc' ? a.daysSinceReview - b.daysSinceReview : b.daysSinceReview - a.daysSinceReview;
              return 0;
            });

            const totalItems = processedList.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const paginatedList = processedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            return (
              <>
                <div className="overflow-auto h-[calc(100vh-280px)] border border-gray-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 shadow-sm">
                      <tr className="bg-gray-100 border-y border-gray-200">
                        <th className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('name')}>
                          Client Name <SortIcon field="name" />
                        </th>
                        <th className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('pan')}>
                          PAN <SortIcon field="pan" />
                        </th>
                        <th className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors text-right" onClick={() => handleSort('totalAum')}>
                          Total AUM <SortIcon field="totalAum" />
                        </th>
                        <th className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors text-right" onClick={() => handleSort('equityAum')}>
                          Equity AUM <SortIcon field="equityAum" />
                        </th>
                        <th className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors text-right" onClick={() => handleSort('debtAum')}>
                          Debt AUM <SortIcon field="debtAum" />
                        </th>
                        <th className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors text-right" onClick={() => handleSort('transferAmount')}>
                          Strategy Transfer <SortIcon field="transferAmount" />
                        </th>
                        <th className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors text-center" onClick={() => handleSort('alerts')}>
                          Alerts <SortIcon field="alerts" />
                        </th>
                        <th className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors text-right" onClick={() => handleSort('daysSinceReview')}>
                          Last Review <SortIcon field="daysSinceReview" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] bg-white divide-y divide-gray-100">
                      {paginatedList.map((client: any, idx: number) => (
                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => document.getElementById(`client-link-${client.clientId}`)?.click()}>
                          <td className="py-0.5 px-1.5 font-bold text-gray-900 truncate max-w-[150px]">
                            {client.name}
                            <Link id={`client-link-${client.clientId}`} to={`/clients/${client.clientId}`} className="hidden" />
                          </td>
                          <td className="py-0.5 px-1.5 text-gray-600 truncate">{client.pan || '-'}</td>
                          <td className="py-0.5 px-1.5 text-gray-900 text-right font-medium">₹{(client.totalAum || 0).toLocaleString('en-IN')}</td>
                          <td className="py-0.5 px-1.5 text-gray-600 text-right">
                            <span className={client.isOverExposed ? 'text-amber-600 font-bold' : ''}>
                              ₹{(client.equityAum || 0).toLocaleString('en-IN')} ({client.equityRatio.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="py-0.5 px-1.5 text-gray-600 text-right">
                            ₹{(client.debtAum || 0).toLocaleString('en-IN')}
                            {client.totalAum > 0 && ` (${((client.debtAum / client.totalAum) * 100).toFixed(1)}%)`}
                          </td>
                          <td className="py-0.5 px-1.5 text-right font-bold whitespace-nowrap">
                            {client.transferAmount > 0 ? (
                              client.transferDirection === 'DEBT_TO_EQUITY' ? (
                                <span className="text-green-600">
                                  Move ₹{Math.round(client.transferAmount).toLocaleString('en-IN')}
                                  {client.totalAum > 0 && ` (${((client.transferAmount / client.totalAum) * 100).toFixed(1)}%)`} to Equity
                                </span>
                              ) : (
                                <span className="text-red-600">
                                  Move ₹{Math.round(client.transferAmount).toLocaleString('en-IN')}
                                  {client.totalAum > 0 && ` (${((client.transferAmount / client.totalAum) * 100).toFixed(1)}%)`} to Debt
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400">Target Reached</span>
                            )}
                          </td>
                          <td className="py-0.5 px-1.5 text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {client.alertTypes?.map((t: string) => {
                                let badge = t.replace('_ALERT', '');
                                let color = 'bg-gray-100 text-gray-800 border-gray-200';
                                if (badge === 'Q4') color = 'bg-red-100 text-red-800 border-red-200';
                                else if (badge === 'Q3') color = 'bg-orange-100 text-orange-800 border-orange-200';
                                else if (badge === 'DRAWDOWN') color = 'bg-purple-100 text-purple-800 border-purple-200';
                                
                                return (
                                  <span key={t} className={`font-bold px-1 py-0.5 rounded text-[9px] border ${color}`}>
                                    {badge}
                                  </span>
                                );
                              })}
                              {(!client.alertTypes || client.alertTypes.length === 0) && client.isOverdue && (
                                <span className="font-bold px-1 py-0.5 rounded text-[9px] border bg-amber-100 text-amber-800 border-amber-200">OVERDUE</span>
                              )}
                              {(!client.alertTypes || client.alertTypes.length === 0) && !client.isOverdue && (
                                <span className="text-gray-300">-</span>
                              )}
                            </div>
                          </td>
                          <td className={`py-0.5 px-1.5 text-right font-medium ${client.isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                            {client.daysSinceReview}d
                          </td>
                        </tr>
                      ))}
                      {paginatedList.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-6 text-gray-500">
                            No clients match your filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
                />
              </>
            );
          })()
        )}
      </div>

    </div>
  );
}
