import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClientDetails, getClientHistory } from "../api/data.api";
import { markPortfolioReviewed } from "../api/rm.api";
import {
  ArrowLeft,
  User,
  AlertTriangle,
  CheckCircle,
  Briefcase,
  TrendingUp,
  Search,
  FileSpreadsheet,
  Printer
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Pagination from "./Pagination";
import { useTableColumns } from "../hooks/useTableColumns";
import { ColumnManager } from "./ColumnManager";

interface Props {
  user?: any;
  rmCanViewClients?: boolean;
}

const DEFAULT_COLUMNS = [
  { id: 'fundNameRaw', label: 'Scheme Name', isVisible: true },
  { id: 'researchFund', label: 'Research Fund Mapping', isVisible: true },
  { id: 'folioNumber', label: 'Folio Number', isVisible: true },
  { id: 'allocation', label: 'Allocation', isVisible: false },
  { id: 'equity', label: 'Equity', isVisible: false },
  { id: 'debt', label: 'Debt', isVisible: false },
  { id: 'hybrid', label: 'Hybrid', isVisible: false },
  { id: 'liquid', label: 'Liquid', isVisible: false },
  { id: 'other', label: 'Other', isVisible: false },
  { id: 'arbitrage', label: 'Arbitrage', isVisible: false },
  { id: 'investedAmount', label: 'Invested', isVisible: true },
  { id: 'currentNav', label: 'Cur. NAV', isVisible: true },
  { id: 'currentValue', label: 'Current Value', isVisible: true },
  { id: 'gain', label: 'Gain', isVisible: true },
  { id: 'cagr', label: 'CAGR', isVisible: true },
  { id: 'quartile', label: 'Quartile', isVisible: true },
];

export default function ClientDetailView({ user, rmCanViewClients = true }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [isReviewing, setIsReviewing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("fundNameRaw");
  const [sortDir, setSortDir] = useState("asc");

  const { columns, toggleVisibility, moveColumn, reorderColumn } = useTableColumns('client_holdings', DEFAULT_COLUMNS);
  const visibleCols = columns.filter(c => c.isVisible);

  useEffect(() => {
    if (!id) return;
    Promise.all([getClientDetails(id), getClientHistory(id)])
      .then(([clientRes, historyRes]) => {
        setClient(clientRes.data);

        const formattedHistory = (historyRes.data || []).map((h: any) => {
          const d = new Date(h.date);
          return {
            ...h,
            formattedDate: `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`,
          };
        });
        setHistory(formattedHistory);

        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load client details");
        setLoading(false);
      });
  }, [id]);

  const handleMarkReviewed = async () => {
    if (!id) return;
    setIsReviewing(true);
    try {
      await markPortfolioReviewed(id);
      alert("Portfolio marked as reviewed successfully!");
    } catch (e) {
      alert("Failed to mark as reviewed.");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-400 opacity-50">↕</span>;
    return <span className="ml-1 text-blue-600 font-bold">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  if (loading)
    return (
      <div className="text-center py-20 text-gray-500 font-medium">
        Loading client portfolio...
      </div>
    );
  if (error)
    return (
      <div className="text-center py-20 text-red-500 font-medium">{error}</div>
    );
  if (!client) return null;

  let processedHoldings = [...(client.holdings || [])];

  if (searchQuery) {
    const s = searchQuery.toLowerCase();
    processedHoldings = processedHoldings.filter(h => 
      h.fundNameRaw?.toLowerCase().includes(s) || 
      h.folioNumber?.toLowerCase().includes(s) || 
      h.researchFund?.category?.toLowerCase().includes(s)
    );
  }

  processedHoldings.sort((a, b) => {
    const getSortVal = (h: any, field: string) => {
      if (field === 'category') return h.researchFund?.category || '';
      if (field === 'quartile') return h.researchFund?.quartile || '';
      return h[field];
    };
    const valA = getSortVal(a, sortField);
    const valB = getSortVal(b, sortField);

    let comparison = 0;
    if (typeof valA === 'string' && typeof valB === 'string') {
      comparison = valA.localeCompare(valB);
    } else {
      comparison = (valA || 0) - (valB || 0);
    }

    return sortDir === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(processedHoldings.length / itemsPerPage);
  const currentData = processedHoldings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const renderCell = (holding: any, colId: string) => {
    const rf = holding.researchFund;
    let qColor = "bg-gray-100 text-gray-500 border-gray-200";
    if (rf) {
      if (rf.quartile?.includes("Q1") || rf.quartile?.includes("TOP")) qColor = "bg-green-100 text-green-800 border-green-200";
      else if (rf.quartile?.includes("Q4") || rf.quartile?.includes("BOTTOM")) qColor = "bg-red-100 text-red-800 border-red-200";
      else if (rf.quartile?.includes("Q2")) qColor = "bg-blue-100 text-blue-800 border-blue-200";
      else if (rf.quartile?.includes("Q3")) qColor = "bg-orange-100 text-orange-800 border-orange-200";
    }
    const badge = rf?.quartile?.replace("-TOP QUARTILE", "").replace("-UPPER MID QUARTILE", "").replace("-LOWER MID QUARTILE", "").replace("-BOTTOM QUARTILE", "") || "UNMAPPED";

    switch(colId) {
      case 'fundNameRaw': return <td key={colId} className="py-0.5 px-1.5 font-bold text-gray-900 truncate max-w-[200px]" title={holding.fundNameRaw}>{holding.fundNameRaw}</td>;
      case 'researchFund': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 truncate max-w-[150px]" title={rf?.name || 'Unmapped'}>{rf?.name || "-"}</td>;
      case 'folioNumber': return <td key={colId} className="py-0.5 px-1.5 text-gray-500 font-mono text-[10px]">{holding.folioNumber || "-"}</td>;
      case 'allocation': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">{holding.allocation || "-"}</td>;
      case 'equity': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">{holding.equity ? "₹" + holding.equity.toLocaleString('en-IN') : "-"}</td>;
      case 'debt': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">{holding.debt ? "₹" + holding.debt.toLocaleString('en-IN') : "-"}</td>;
      case 'hybrid': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">{holding.hybrid ? "₹" + holding.hybrid.toLocaleString('en-IN') : "-"}</td>;
      case 'liquid': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">{holding.liquid ? "₹" + holding.liquid.toLocaleString('en-IN') : "-"}</td>;
      case 'other': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">{holding.other ? "₹" + holding.other.toLocaleString('en-IN') : "-"}</td>;
      case 'arbitrage': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">{holding.arbitrage ? "₹" + holding.arbitrage.toLocaleString('en-IN') : "-"}</td>;
      case 'category': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 truncate max-w-[100px]" title={rf?.category || 'Unmapped'}>{rf?.category || "-"}</td>;
      case 'units': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">{holding.units ? holding.units.toLocaleString('en-IN', { maximumFractionDigits: 3 }) : "-"}</td>;
      case 'investedAmount': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right font-medium">{holding.investedAmount ? "₹" + holding.investedAmount.toLocaleString('en-IN') : "-"}</td>;
      case 'currentNav': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 text-right">{holding.currentNav ? "₹" + holding.currentNav.toLocaleString('en-IN') : "-"}</td>;
      case 'currentValue': return <td key={colId} className="py-0.5 px-1.5 text-gray-900 text-right font-bold">{holding.currentValue ? "₹" + holding.currentValue.toLocaleString('en-IN') : "-"}</td>;
      case 'gain': return <td key={colId} className={`py-0.5 px-1.5 text-right font-bold ${holding.gain > 0 ? "text-green-600" : holding.gain < 0 ? "text-red-600" : "text-gray-600"}`}>{holding.gain ? (holding.gain > 0 ? "+" : "") + "₹" + holding.gain.toLocaleString('en-IN') : "-"}</td>;
      case 'cagr': return <td key={colId} className={`py-0.5 px-1.5 text-right font-bold ${holding.cagr > 0 ? "text-green-600" : holding.cagr < 0 ? "text-red-600" : "text-gray-600"}`}>{holding.cagr ? (holding.cagr > 0 ? "+" : "") + holding.cagr.toFixed(1) + "%" : "-"}</td>;
      case 'quartile': return (
        <td key={colId} className="py-0.5 px-1.5 text-center">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${qColor}`}>
            {badge}
          </span>
        </td>
      );
      default: return <td key={colId}></td>;
    }
  };

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 pb-12">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          table { 
            width: 100% !important;
            table-layout: auto !important;
          }
          th, td { 
            font-size: 9px !important; 
            padding: 4px 2px !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          /* Ensure table rows do not split across pages */
          tr { page-break-inside: avoid; }
        }
      `}</style>
      <div className="flex justify-between items-center mb-6 print:hidden">
          <button
            onClick={() => navigate((user?.role === 'ADMIN' || rmCanViewClients) ? "/clients" : "/")}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft size={18} /> {(user?.role === 'ADMIN' || rmCanViewClients) ? "Back to Clients" : "Back to Action Center"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const response = await fetch(`http://localhost:5000/api/data/clients/${id}/export`, {
                    method: 'POST',
                    headers: { 
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                      columns: visibleCols.map(c => ({ id: c.id, label: c.label })) 
                    })
                  });
                  if (!response.ok) throw new Error('Download failed');
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${client.name}_Portfolio.xlsx`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  a.remove();
                } catch (err) {
                  console.error(err);
                  alert("Failed to download Excel");
                }
              }}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FileSpreadsheet size={18} /> Download Excel
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Printer size={18} /> Print PDF
            </button>
            <button
              onClick={handleMarkReviewed}
              disabled={isReviewing}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle size={18} />{" "}
              {isReviewing ? "Marking..." : "Mark Portfolio as Reviewed"}
            </button>
          </div>
        </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="text-blue-600" size={32} /> {client.name}
          </h2>
          <div className="mt-2 text-gray-500 flex items-center gap-4 text-xs font-medium">
            <span>PAN: {client.pan}</span>
            {client.familyHead && (
              <span>• Family Head: {client.familyHead}</span>
            )}
            <span>• RM: {client.rm?.name}</span>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 min-w-[200px] text-right">
          <p className="text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">
            Total AUM
          </p>
          <p className="text-3xl font-extrabold text-blue-900">
            ₹{client.totalAum?.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 print:hidden">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Invested Amount</p>
          <p className="text-lg font-bold text-gray-800">
            {client.totalInvested ? "₹" + client.totalInvested.toLocaleString('en-IN') : "N/A"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Gain</p>
          <p className={`text-lg font-bold ${client.totalGain > 0 ? "text-green-600" : client.totalGain < 0 ? "text-red-600" : "text-gray-800"}`}>
            {client.totalGain ? (client.totalGain > 0 ? "+" : "") + "₹" + client.totalGain.toLocaleString('en-IN') : "N/A"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Overall Return</p>
          <p className={`text-lg font-bold ${client.overallAbsoluteReturn > 0 ? "text-green-600" : client.overallAbsoluteReturn < 0 ? "text-red-600" : "text-gray-800"}`}>
            {client.overallAbsoluteReturn ? (client.overallAbsoluteReturn > 0 ? "+" : "") + client.overallAbsoluteReturn.toFixed(2) + "%" : "N/A"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Overall CAGR</p>
          <p className={`text-lg font-bold ${client.overallCagr > 0 ? "text-green-600" : client.overallCagr < 0 ? "text-red-600" : "text-gray-800"}`}>
            {client.overallCagr ? (client.overallCagr > 0 ? "+" : "") + client.overallCagr.toFixed(2) + "%" : "N/A"}
          </p>
        </div>
      </div>

      {client.notifications && client.notifications.length > 0 && (
        <div className="mb-8 print:hidden flex flex-col gap-3">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-500" /> Active Alerts
          </h3>
          {client.notifications.map((n: any) => (
            <div
              key={n.id}
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-red-800 font-bold">{n.message}</h4>
                  <p className="text-red-600 text-sm mt-1">
                    Affecting: {n.fundNameRaw} (
                    {n.currentValue
                      ? "₹" + n.currentValue.toLocaleString('en-IN')
                      : "Value Unknown"}
                    )
                  </p>
                </div>
                <div className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded">
                  {n.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 print:hidden">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <TrendingUp className="text-blue-500" /> AUM History (6 Months)
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...history].reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(val) => "₹" + (val / 100000).toFixed(0) + "L"}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    "₹" + value.toLocaleString('en-IN'),
                    "AUM",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalAum"
                  name="Total AUM"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="equityAum"
                  name="Equity AUM"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="debtAum"
                  name="Debt AUM"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Briefcase className="text-gray-500" /> Portfolio Holdings
          </h3>
          
          <div className="flex items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search schemes or folios..." 
                value={searchQuery}
                onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <ColumnManager columns={columns} onToggle={toggleVisibility} onMove={moveColumn} onReorder={reorderColumn} />
          </div>
        </div>

        {client.holdings?.length === 0 ? (
          <p className="text-gray-500 italic text-center py-10">No holdings found for this client.</p>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-auto h-[calc(100vh-280px)] border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 shadow-sm">
                  <tr className="bg-gray-100 border-y border-gray-200">
                    {visibleCols.map(col => (
                      <th 
                        key={col.id}
                        className={`bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors ${['units', 'investedAmount', 'currentNav', 'currentValue', 'gain', 'cagr'].includes(col.id) ? 'text-right' : col.id === 'quartile' ? 'text-center' : ''}`}
                        onClick={() => handleSort(col.id)}
                      >
                        {col.label} <SortIcon field={col.id} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[11px] bg-white divide-y divide-gray-100">
                  {currentData.map((holding: any) => (
                    <tr
                      key={holding.id}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      {visibleCols.map(col => renderCell(holding, col.id))}
                    </tr>
                  ))}
                  {currentData.length === 0 && (
                    <tr>
                      <td
                        colSpan={visibleCols.length}
                        className="text-center py-6 text-gray-500"
                      >
                        No holdings match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={processedHoldings.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => {
                setItemsPerPage(num);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
