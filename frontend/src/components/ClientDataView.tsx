import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getClients } from "../api/data.api";
import { Users, Search } from "lucide-react";
import Pagination from "./Pagination";
import { useTableColumns } from "../hooks/useTableColumns";
import { ColumnManager } from "./ColumnManager";

const DEFAULT_COLUMNS = [
  { id: 'name', label: 'Client Name', isVisible: true },
  { id: 'pan', label: 'PAN', isVisible: true },
  { id: 'familyHead', label: 'Family Head', isVisible: true },
  { id: 'subBroker', label: 'Sub Broker', isVisible: true },
  { id: 'rm', label: 'RM', isVisible: true },
  { id: 'totalAum', label: 'Total AUM', isVisible: true },
  { id: 'equityAum', label: 'Equity AUM', isVisible: true },
  { id: 'debtAum', label: 'Debt AUM', isVisible: true },
  { id: 'hybridAum', label: 'Hybrid AUM', isVisible: true },
  { id: 'totalUnits', label: 'Units', isVisible: true },
  { id: 'transferAmount', label: 'Strategy Transfer', isVisible: true },
  { id: 'alertScore', label: 'Alerts', isVisible: true },
];

export default function ClientDataView() {
  const [clients, setClients] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortField, setSortField] = useState("alertScore");
  const [sortDir, setSortDir] = useState("desc");
  const navigate = useNavigate();

  const [groupByFamily, setGroupByFamily] = useState(false);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

  const { columns, toggleVisibility, moveColumn, reorderColumn } = useTableColumns('client_roster', DEFAULT_COLUMNS);
  const visibleCols = columns.filter(c => c.isVisible);

  const loadData = () => {
    setLoading(true);
    const limit = groupByFamily ? 5000 : itemsPerPage;
    const page = groupByFamily ? 1 : currentPage;
    getClients(page, limit, search, sortField, sortDir)
      .then((res) => {
        setClients(res.data.data || res.data);
        setTotalItems(res.data.total || res.data.length || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [groupByFamily, currentPage, itemsPerPage, search, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (field === 'rm') return; // Cannot easily sort by RM relation via this generic sort
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (field === 'rm') return null;
    if (sortField !== field) return <span className="ml-1 text-gray-400 opacity-50">↕</span>;
    return <span className="ml-1 text-blue-600 font-bold">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const familyGroups = React.useMemo(() => {
    if (!groupByFamily) return [];
    const map = new Map<string, any[]>();
    clients.forEach(c => {
      const fh = (c.familyHead && c.familyHead.trim()) || c.name.trim();
      if (!map.has(fh)) map.set(fh, []);
      map.get(fh)!.push(c);
    });

    const list: any[] = [];
    map.forEach((members, familyHead) => {
      const totalAum = members.reduce((acc, m) => acc + (m.totalAum || 0), 0);
      const equityAum = members.reduce((acc, m) => acc + (m.equityAum || 0), 0);
      const debtAum = members.reduce((acc, m) => acc + (m.debtAum || 0), 0);
      const hybridAum = members.reduce((acc, m) => acc + (m.hybridAum || 0), 0);
      const totalUnits = members.reduce((acc, m) => acc + (m.totalUnits || 0), 0);
      const transferAmount = members.reduce((acc, m) => acc + (m.transferAmount || 0), 0);
      const d2e = members.some(m => m.transferDirection === 'DEBT_TO_EQUITY');
      const e2d = members.some(m => m.transferDirection === 'EQUITY_TO_DEBT');
      const transferDirection = d2e && e2d ? 'MIXED' : d2e ? 'DEBT_TO_EQUITY' : e2d ? 'EQUITY_TO_DEBT' : '';
      const totalAlerts = members.reduce((acc, m) => acc + (m.notifications?.length || 0), 0);
      const rmName = members.find(m => m.rm?.name)?.rm?.name || '-';

      list.push({
        familyHead,
        members,
        totalAum,
        equityAum,
        debtAum,
        hybridAum,
        totalUnits,
        transferAmount,
        transferDirection,
        totalAlerts,
        rmName
      });
    });

    list.sort((a, b) => {
      if (sortField === 'totalAum') return sortDir === 'asc' ? a.totalAum - b.totalAum : b.totalAum - a.totalAum;
      if (sortField === 'equityAum') return sortDir === 'asc' ? a.equityAum - b.equityAum : b.equityAum - a.equityAum;
      if (sortField === 'debtAum') return sortDir === 'asc' ? a.debtAum - b.debtAum : b.debtAum - a.debtAum;
      if (sortField === 'hybridAum') return sortDir === 'asc' ? a.hybridAum - b.hybridAum : b.hybridAum - a.hybridAum;
      if (sortField === 'totalUnits') return sortDir === 'asc' ? a.totalUnits - b.totalUnits : b.totalUnits - a.totalUnits;
      if (sortField === 'transferAmount') return sortDir === 'asc' ? a.transferAmount - b.transferAmount : b.transferAmount - a.transferAmount;
      if (sortField === 'alertScore') return sortDir === 'asc' ? a.totalAlerts - b.totalAlerts : b.totalAlerts - a.totalAlerts;
      return sortDir === 'asc' ? a.familyHead.localeCompare(b.familyHead) : b.familyHead.localeCompare(a.familyHead);
    });

    return list;
  }, [clients, groupByFamily, sortField, sortDir]);

  const toggleFamily = (fh: string) => {
    setExpandedFamilies(prev => {
      const next = new Set(prev);
      if (next.has(fh)) next.delete(fh);
      else next.add(fh);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedFamilies(new Set(familyGroups.map(g => g.familyHead)));
  };

  const handleCollapseAll = () => {
    setExpandedFamilies(new Set());
  };

  const renderFamilyCell = (group: any, colId: string, isExpanded: boolean) => {
    switch (colId) {
      case 'name':
        return (
          <td key={colId} className="py-1 px-1.5 font-extrabold text-gray-900 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-xs w-3 text-center select-none font-mono">
                {isExpanded ? '▼' : '▶'}
              </span>
              <span className="text-blue-800 font-bold">{group.familyHead}</span>
              <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-200">
                {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
              </span>
            </div>
          </td>
        );
      case 'pan':
        return (
          <td key={colId} className="py-1 px-1.5 text-gray-500 font-mono text-[10px]">
            {group.members.length > 1 ? `${group.members.length} PANs` : group.members[0].pan || "-"}
          </td>
        );
      case 'familyHead':
        return <td key={colId} className="py-1 px-1.5 font-bold text-gray-800 truncate max-w-[150px]">{group.familyHead}</td>;
      case 'subBroker':
        return <td key={colId} className="py-1 px-1.5 text-gray-700 font-medium truncate max-w-[150px]">{group.members[0]?.subBroker || "-"}</td>;
      case 'rm':
        return <td key={colId} className="py-1 px-1.5 text-gray-700 font-medium truncate max-w-[150px]">{group.rmName}</td>;
      case 'totalAum':
        return <td key={colId} className="py-1 px-1.5 text-right font-extrabold text-gray-900">₹{group.totalAum?.toLocaleString('en-IN') || 0}</td>;
      case 'equityAum':
        return <td key={colId} className="py-1 px-1.5 text-right font-bold text-gray-700">₹{group.equityAum?.toLocaleString('en-IN') || 0}</td>;
      case 'debtAum':
        return <td key={colId} className="py-1 px-1.5 text-right font-bold text-gray-700">₹{group.debtAum?.toLocaleString('en-IN') || 0}</td>;
      case 'hybridAum':
        return <td key={colId} className="py-1 px-1.5 text-right font-bold text-gray-700">₹{group.hybridAum?.toLocaleString('en-IN') || 0}</td>;
      case 'totalUnits':
        return <td key={colId} className="py-1 px-1.5 text-right font-bold text-gray-700">{group.totalUnits ? group.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 3 }) : "-"}</td>;
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
      case 'alertScore':
        return (
          <td key={colId} className="py-1 px-1.5 text-center">
            {group.totalAlerts > 0 ? (
              <span className="bg-orange-100 text-orange-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-orange-200">
                {group.totalAlerts} Alert{group.totalAlerts > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </td>
        );
      default:
        return <td key={colId}></td>;
    }
  };

  const renderCell = (client: any, colId: string) => {
    switch (colId) {
      case 'name':
        return (
          <td key={colId} className="py-0.5 px-1.5 font-bold text-gray-900 truncate max-w-[200px]" title={client.name}>
            {client.name}
          </td>
        );
      case 'pan':
        return <td key={colId} className="py-0.5 px-1.5 text-gray-600 truncate max-w-[100px]">{client.pan || "-"}</td>;
      case 'familyHead':
        return <td key={colId} className="py-0.5 px-1.5 text-gray-600 truncate max-w-[150px]">{client.familyHead || "-"}</td>;
      case 'subBroker':
        return <td key={colId} className="py-0.5 px-1.5 text-gray-600 truncate max-w-[150px]">{client.subBroker || "-"}</td>;
      case 'rm':
        return <td key={colId} className="py-0.5 px-1.5 text-gray-600 truncate max-w-[150px]">{client.rm?.name || "-"}</td>;
      case 'totalAum':
        return <td key={colId} className="py-0.5 px-1.5 text-gray-900 text-right font-medium">₹{client.totalAum?.toLocaleString('en-IN') || 0}</td>;
      case 'equityAum':
        return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">₹{client.equityAum?.toLocaleString('en-IN') || 0}</td>;
      case 'debtAum':
        return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">₹{client.debtAum?.toLocaleString('en-IN') || 0}</td>;
      case 'hybridAum':
        return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">₹{client.hybridAum?.toLocaleString('en-IN') || 0}</td>;
      case 'totalUnits':
        return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">{client.totalUnits ? client.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 3 }) : "-"}</td>;
      case 'transferAmount':
        return (
          <td key={colId} className="py-0.5 px-1.5 text-right font-bold whitespace-nowrap">
            {client.transferAmount > 0 ? (
              client.transferDirection === 'DEBT_TO_EQUITY' ? (
                <span className="text-green-600">Move {client.totalAum > 0 ? ((client.transferAmount / client.totalAum) * 100).toFixed(1) : 0}% to Equity</span>
              ) : (
                <span className="text-red-600">Move {client.totalAum > 0 ? ((client.transferAmount / client.totalAum) * 100).toFixed(1) : 0}% to Debt</span>
              )
            ) : (
              <span className="text-gray-400">Target Reached</span>
            )}
          </td>
        );
      case 'alertScore':
        return (
          <td key={colId} className="py-0.5 px-1.5 text-center">
            {client.notifications && client.notifications.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-center">
                {Array.from(new Set(client.notifications.map((n: any) => n.type))).map(
                  (t: any) => {
                    let badge = t.replace("_ALERT", "");
                    let color = "bg-orange-100 text-orange-800 border-orange-200";
                    if (badge === "Q4") color = "bg-red-100 text-red-800 border-red-200";
                    else if (badge === "DRAWDOWN") color = "bg-purple-100 text-purple-800 border-purple-200";
                    return (
                      <span key={t} className={`font-bold px-1 py-0.5 rounded text-[9px] border ${color}`}>
                        {badge}
                      </span>
                    );
                  }
                )}
              </div>
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </td>
        );
      default:
        return <td key={colId}></td>;
    }
  };

  const displayTotalItems = groupByFamily ? familyGroups.length : totalItems;
  const totalPages = Math.ceil(displayTotalItems / itemsPerPage);
  const displayFamilyGroups = groupByFamily 
    ? familyGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600" /> Client Master Database
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Group by Family Head Toggle */}
          <button
            onClick={() => {
              setGroupByFamily(!groupByFamily);
              setCurrentPage(1);
            }}
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

          {groupByFamily && (
            <div className="flex items-center gap-2 text-xs">
              <button 
                onClick={handleExpandAll}
                className="text-blue-600 hover:underline font-medium"
              >
                Expand All
              </button>
              <span className="text-gray-300">|</span>
              <button 
                onClick={handleCollapseAll}
                className="text-gray-500 hover:underline font-medium"
              >
                Collapse All
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search PAN, Name, RM..."
              className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none w-64 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <ColumnManager columns={columns} onToggle={toggleVisibility} onMove={moveColumn} onReorder={reorderColumn} />
        </div>
      </div>

      {loading && clients.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="overflow-auto h-[calc(100vh-280px)] border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-100 border-y border-gray-200">
                  {visibleCols.map((col) => (
                    <th
                      key={col.id}
                      className={`bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap ${col.id !== 'rm' ? 'cursor-pointer hover:bg-gray-200 transition-colors' : ''} ${['totalAum', 'equityAum', 'debtAum', 'hybridAum', 'totalUnits', 'transferAmount'].includes(col.id) ? 'text-right' : col.id === 'alertScore' ? 'text-center' : ''}`}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label} <SortIcon field={col.id} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[11px] bg-white divide-y divide-gray-100">
                {!groupByFamily ? (
                  clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      {visibleCols.map(col => renderCell(client, col.id))}
                    </tr>
                  ))
                ) : (
                  displayFamilyGroups.map((group) => {
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
                            key={member.id}
                            className="bg-white hover:bg-blue-50/40 transition-colors cursor-pointer border-b border-gray-100"
                            onClick={() => navigate(`/clients/${member.id}`)}
                          >
                            {visibleCols.map(col => {
                              if (col.id === 'name') {
                                return (
                                  <td key={col.id} className="py-0.5 px-1.5 pl-6 text-gray-800 truncate max-w-[200px]" title={member.name}>
                                    <span className="text-gray-400 mr-1.5 text-xs">↳</span>
                                    <span className="font-semibold text-gray-900">{member.name}</span>
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
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={visibleCols.length} className="text-center py-10 text-gray-500">
                      No clients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={displayTotalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(num) => {
              setItemsPerPage(num);
              setCurrentPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}