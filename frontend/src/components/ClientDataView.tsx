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

  const { columns, toggleVisibility, moveColumn, reorderColumn } = useTableColumns('client_roster', DEFAULT_COLUMNS);
  const visibleCols = columns.filter(c => c.isVisible);

  const loadData = () => {
    setLoading(true);
    getClients(currentPage, itemsPerPage, search, sortField, sortDir)
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
  }, [currentPage, itemsPerPage, search, sortField, sortDir]);

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

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600" /> Client Master Database
        </h2>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search PAN, Name, RM or Alerts..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none w-72 text-sm"
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
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    {visibleCols.map(col => renderCell(client, col.id))}
                  </tr>
                ))}
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
            totalItems={totalItems}
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