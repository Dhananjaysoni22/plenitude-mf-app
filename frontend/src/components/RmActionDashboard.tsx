import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRmIntelligence } from '../api/rm.api';
import { PhoneCall, Target, Zap, Search, Users } from 'lucide-react';
import { MarketStrategyWidget } from './MarketStrategyWidget';
import Pagination from './Pagination';
import { useTableColumns } from '../hooks/useTableColumns';
import { ColumnManager } from './ColumnManager';

const DEFAULT_COLUMNS = [
  { id: 'name', label: 'Client Name', isVisible: true },
  { id: 'pan', label: 'PAN', isVisible: true },
  { id: 'familyHead', label: 'Family Head', isVisible: false },
  { id: 'totalAum', label: 'Total AUM', isVisible: true },
  { id: 'equityAum', label: 'Equity AUM', isVisible: true },
  { id: 'debtAum', label: 'Debt AUM', isVisible: true },
  { id: 'transferAmount', label: 'Strategy Transfer', isVisible: true },
  { id: 'alerts', label: 'Alerts', isVisible: true },
  { id: 'daysSinceReview', label: 'Last Review', isVisible: true },
];

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
  const [groupByFamily, setGroupByFamily] = useState(false);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

  const { columns, toggleVisibility, moveColumn, reorderColumn } = useTableColumns('rm_action_roster', DEFAULT_COLUMNS);
  const visibleCols = columns.filter(c => c.isVisible);

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

  const renderCell = (client: any, colId: string) => {
    switch(colId) {
      case 'name': return (
        <td key={colId} className="py-0.5 px-1.5 font-bold text-gray-900 truncate max-w-[150px]">
          {client.name}
          <Link id={`client-link-${client.clientId}`} to={`/clients/${client.clientId}`} className="hidden" />
        </td>
      );
      case 'pan': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 truncate">{client.pan || '-'}</td>;
      case 'totalAum': return <td key={colId} className="py-0.5 px-1.5 text-gray-900 text-right font-medium">₹{(client.totalAum || 0).toLocaleString('en-IN')}</td>;
      case 'equityAum': return (
        <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">
          <span className={client.isOverExposed ? 'text-amber-600 font-bold' : ''}>
            ₹{(client.equityAum || 0).toLocaleString('en-IN')} ({client.equityRatio.toFixed(1)}%)
          </span>
        </td>
      );
      case 'debtAum': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">₹{(client.debtAum || 0).toLocaleString('en-IN')} ({(100 - client.equityRatio).toFixed(1)}%)</td>;
      case 'transferAmount': return (
        <td key={colId} className="py-0.5 px-1.5 text-right font-bold whitespace-nowrap">
          {client.transferAmount > 0 ? (
            client.transferDirection === 'DEBT_TO_EQUITY' ? (
              <span className="text-green-600">Move ₹{(client.transferAmount).toLocaleString('en-IN', {maximumFractionDigits:0})} ({client.totalAum > 0 ? ((client.transferAmount / client.totalAum) * 100).toFixed(1) : 0}%) to Equity</span>
            ) : (
              <span className="text-red-600">Move ₹{(client.transferAmount).toLocaleString('en-IN', {maximumFractionDigits:0})} ({client.totalAum > 0 ? ((client.transferAmount / client.totalAum) * 100).toFixed(1) : 0}%) to Debt</span>
            )
          ) : (
            <span className="text-gray-400">Target Reached</span>
          )}
        </td>
      );
      case 'alerts': return (
        <td key={colId} className="py-0.5 px-1.5 text-center">
          <div className="flex flex-wrap gap-1 justify-center">
            {client.alertTypes?.map((t: string) => {
              const badge = t.replace('_ALERT', '');
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
      );
      case 'familyHead': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 truncate max-w-[150px]">{client.familyHead || '-'}</td>;
      case 'daysSinceReview': return (
        <td key={colId} className={`py-0.5 px-1.5 text-right font-medium ${client.isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
          {client.daysSinceReview}d
        </td>
      );
      default: return <td key={colId}></td>;
    }
  };

  const renderFamilyCell = (group: any, colId: string, isExpanded: boolean) => {
    switch(colId) {
      case 'name': return (
        <td key={colId} className="py-1 px-1.5 font-extrabold text-gray-900 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs w-3 text-center select-none font-mono">
              {isExpanded ? '▼' : '▶'}
            </span>
            <span className="text-blue-800 font-bold hover:underline">{group.familyHead}</span>
            <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-200">
              {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        </td>
      );
      case 'pan': return (
        <td key={colId} className="py-1 px-1.5 text-gray-500 font-mono text-[10px]">
          {group.members.length > 1 ? `${group.members.length} PANs` : group.members[0].pan || '-'}
        </td>
      );
      case 'familyHead': return <td key={colId} className="py-1 px-1.5 font-bold text-gray-800 truncate max-w-[150px]">{group.familyHead}</td>;
      case 'totalAum': return <td key={colId} className="py-1 px-1.5 text-right font-extrabold text-gray-900">₹{(group.totalAum || 0).toLocaleString('en-IN')}</td>;
      case 'equityAum':
        const eqRatio = group.totalAum > 0 ? (group.equityAum / group.totalAum) * 100 : 0;
        return (
          <td key={colId} className="py-1 px-1.5 text-gray-700 text-right font-bold">
            ₹{(group.equityAum || 0).toLocaleString('en-IN')} ({eqRatio.toFixed(1)}%)
          </td>
        );
      case 'debtAum':
        const debtRatio = group.totalAum > 0 ? (group.debtAum / group.totalAum) * 100 : 0;
        return (
          <td key={colId} className="py-1 px-1.5 text-gray-700 text-right font-bold">
            ₹{(group.debtAum || 0).toLocaleString('en-IN')} ({debtRatio.toFixed(1)}%)
          </td>
        );
      case 'transferAmount':
        return (
          <td key={colId} className="py-1 px-1.5 text-right font-bold whitespace-nowrap">
            {group.transferAmount > 0 ? (
              <span className={group.transferDirection === 'DEBT_TO_EQUITY' ? 'text-green-700' : 'text-red-700'}>
                {group.transferDirection === 'MIXED' ? 'Mixed' : group.transferDirection === 'DEBT_TO_EQUITY' ? 'Move to Eq' : 'Move to Debt'} ₹{group.transferAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            ) : (
              <span className="text-gray-400">Target Reached</span>
            )}
          </td>
        );
      case 'alerts':
        return (
          <td key={colId} className="py-1 px-1.5 text-center">
            {group.alerts > 0 ? (
              <div className="flex flex-wrap gap-1 justify-center">
                {group.alertTypes.map((t: string) => {
                  const badge = t.replace('_ALERT', '');
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
              </div>
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </td>
        );
      case 'daysSinceReview':
        const minDays = Math.min(...group.members.map((m: any) => m.daysSinceReview || 0));
        const maxDays = Math.max(...group.members.map((m: any) => m.daysSinceReview || 0));
        return (
          <td key={colId} className="py-1 px-1.5 text-right font-semibold text-gray-700">
            {minDays === maxDays ? `${minDays}d` : `${minDays}-${maxDays}d`}
          </td>
        );
      default: return <td key={colId}></td>;
    }
  };

  const toggleFamily = (fh: string) => {
    setExpandedFamilies(prev => {
      const next = new Set(prev);
      if (next.has(fh)) next.delete(fh);
      else next.add(fh);
      return next;
    });
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium">Loading RM Dashboard...</div>;
  if (error) return <div className="text-center py-20 text-red-500 font-medium">{error}</div>;
  if (!data) return null;

  const atRiskAmount = data.quartiles.find((q: any) => q.name.includes('Q4'))?.value || 0;

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 pb-12">
      <MarketStrategyWidget />

      <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <Target className="text-blue-600" size={32} /> RM Action Center
      </h2>
      <p className="text-gray-500 mb-8">Intelligent daily insights. Prioritize your calls and mitigate risk.</p>

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
          <div className="flex flex-wrap items-center gap-3">
            {/* Group by Family Head Toggle */}
            <button
              onClick={() => setGroupByFamily(!groupByFamily)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                groupByFamily 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="Toggle grouping clients by Family Head"
            >
              <Users size={14} />
              {groupByFamily ? 'Grouped by Family' : 'Group by Family'}
            </button>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by Client, PAN, or risk..." 
                value={searchQuery}
                onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
                className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <ColumnManager columns={columns} onToggle={toggleVisibility} onMove={moveColumn} onReorder={reorderColumn} />
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
                c.familyHead?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.alertTypes?.some((a: string) => a.toLowerCase().includes(searchQuery.toLowerCase()))
              );

            processedList.sort((a: any, b: any) => {
              if (sortField === 'alerts') return sortDir === 'asc' ? a.alerts - b.alerts : b.alerts - a.alerts;
              if (sortField === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
              if (sortField === 'familyHead') return sortDir === 'asc' ? (a.familyHead || '').localeCompare(b.familyHead || '') : (b.familyHead || '').localeCompare(a.familyHead || '');
              if (sortField === 'pan') return sortDir === 'asc' ? (a.pan || '').localeCompare(b.pan || '') : (b.pan || '').localeCompare(a.pan || '');
              if (sortField === 'totalAum') return sortDir === 'asc' ? a.totalAum - b.totalAum : b.totalAum - a.totalAum;
              if (sortField === 'equityAum') return sortDir === 'asc' ? a.equityAum - b.equityAum : b.equityAum - a.equityAum;
              if (sortField === 'debtAum') return sortDir === 'asc' ? a.debtAum - b.debtAum : b.debtAum - a.debtAum;
              if (sortField === 'transferAmount') return sortDir === 'asc' ? a.transferAmount - b.transferAmount : b.transferAmount - a.transferAmount;
              if (sortField === 'daysSinceReview') return sortDir === 'asc' ? a.daysSinceReview - b.daysSinceReview : b.daysSinceReview - a.daysSinceReview;
              return 0;
            });

            // Grouping by Family Head
            const familyGroups = (() => {
              if (!groupByFamily) return [];
              const map = new Map<string, any[]>();
              processedList.forEach((c: any) => {
                const fh = (c.familyHead && c.familyHead.trim()) || c.name.trim();
                if (!map.has(fh)) map.set(fh, []);
                map.get(fh)!.push(c);
              });

              const list: any[] = [];
              map.forEach((members, familyHead) => {
                const totalAum = members.reduce((sum, m) => sum + (m.totalAum || 0), 0);
                const equityAum = members.reduce((sum, m) => sum + (m.equityAum || 0), 0);
                const debtAum = members.reduce((sum, m) => sum + (m.debtAum || 0), 0);
                const transferAmount = members.reduce((sum, m) => sum + (m.transferAmount || 0), 0);
                const alerts = members.reduce((sum, m) => sum + (m.alerts || 0), 0);
                const alertTypes = Array.from(new Set(members.flatMap((m: any) => m.alertTypes || [])));
                const d2e = members.some((m: any) => m.transferDirection === 'DEBT_TO_EQUITY');
                const e2d = members.some((m: any) => m.transferDirection === 'EQUITY_TO_DEBT');
                const transferDirection = d2e && e2d ? 'MIXED' : d2e ? 'DEBT_TO_EQUITY' : e2d ? 'EQUITY_TO_DEBT' : '';

                list.push({
                  familyHead,
                  members,
                  totalAum,
                  equityAum,
                  debtAum,
                  transferAmount,
                  transferDirection,
                  alerts,
                  alertTypes
                });
              });

              list.sort((a, b) => {
                if (sortField === 'alerts') return sortDir === 'asc' ? a.alerts - b.alerts : b.alerts - a.alerts;
                if (sortField === 'name' || sortField === 'familyHead') return sortDir === 'asc' ? a.familyHead.localeCompare(b.familyHead) : b.familyHead.localeCompare(a.familyHead);
                if (sortField === 'totalAum') return sortDir === 'asc' ? a.totalAum - b.totalAum : b.totalAum - a.totalAum;
                if (sortField === 'equityAum') return sortDir === 'asc' ? a.equityAum - b.equityAum : b.equityAum - a.equityAum;
                if (sortField === 'debtAum') return sortDir === 'asc' ? a.debtAum - b.debtAum : b.debtAum - a.debtAum;
                if (sortField === 'transferAmount') return sortDir === 'asc' ? a.transferAmount - b.transferAmount : b.transferAmount - a.transferAmount;
                return sortDir === 'asc' ? a.familyHead.localeCompare(b.familyHead) : b.familyHead.localeCompare(a.familyHead);
              });

              return list;
            })();

            const totalItems = groupByFamily ? familyGroups.length : processedList.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const paginatedItems = groupByFamily 
              ? familyGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              : processedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            return (
              <>
                {groupByFamily && familyGroups.length > 0 && (
                  <div className="flex items-center gap-2 text-xs mb-3 px-1">
                    <button 
                      onClick={() => setExpandedFamilies(new Set(familyGroups.map(g => g.familyHead)))}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Expand All ({familyGroups.length} Families)
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      onClick={() => setExpandedFamilies(new Set())}
                      className="text-gray-500 hover:underline font-medium"
                    >
                      Collapse All
                    </button>
                  </div>
                )}
                <div className="overflow-auto h-[calc(100vh-280px)] border border-gray-200 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 shadow-sm">
                      <tr className="bg-gray-100 border-y border-gray-200">
                        {visibleCols.map(col => (
                          <th key={col.id} className={`bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors ${['totalAum', 'equityAum', 'debtAum', 'transferAmount', 'daysSinceReview'].includes(col.id) ? 'text-right' : col.id === 'alerts' ? 'text-center' : ''}`} onClick={() => handleSort(col.id)}>
                            {col.label} <SortIcon field={col.id} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-[11px] bg-white divide-y divide-gray-100">
                      {!groupByFamily ? (
                        paginatedItems.map((client: any, idx: number) => (
                          <tr key={idx} className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => document.getElementById(`client-link-${client.clientId}`)?.click()}>
                            {visibleCols.map(col => renderCell(client, col.id))}
                          </tr>
                        ))
                      ) : (
                        paginatedItems.map((group: any) => {
                          const isExpanded = expandedFamilies.has(group.familyHead);
                          return (
                            <React.Fragment key={group.familyHead}>
                              <tr
                                className="bg-slate-100/95 font-bold border-t-2 border-b border-slate-300 hover:bg-slate-200/80 transition-colors cursor-pointer"
                                onClick={() => toggleFamily(group.familyHead)}
                              >
                                {visibleCols.map(col => renderFamilyCell(group, col.id, isExpanded))}
                              </tr>
                              {isExpanded && group.members.map((member: any) => (
                                <tr
                                  key={member.clientId}
                                  className="bg-white hover:bg-blue-50/40 transition-colors cursor-pointer border-b border-gray-100"
                                  onClick={() => document.getElementById(`client-link-${member.clientId}`)?.click()}
                                >
                                  {visibleCols.map(col => {
                                    if (col.id === 'name') {
                                      return (
                                        <td key={col.id} className="py-0.5 px-1.5 pl-6 text-gray-800 truncate max-w-[150px]">
                                          <span className="text-gray-400 mr-1.5 text-xs">↳</span>
                                          <span className="font-semibold text-gray-900">{member.name}</span>
                                          <Link id={`client-link-${member.clientId}`} to={`/clients/${member.clientId}`} className="hidden" />
                                        </td>
                                      );
                                    }
                                    return renderCell(member, col.id);
                                  })}
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })
                      )}
                      {paginatedItems.length === 0 && (
                        <tr>
                          <td colSpan={visibleCols.length} className="text-center py-6 text-gray-500">
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
                  onItemsPerPageChange={(num) => {
                    setItemsPerPage(num);
                    setCurrentPage(1);
                  }}
                />
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}
