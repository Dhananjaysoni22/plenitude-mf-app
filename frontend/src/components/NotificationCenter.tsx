import React, { useEffect, useState } from "react";
import {
  getNotifications,
  triggerAlertEngine,
  resolveNotification,
} from "../api/notification.api";
import {
  Bell,
  PlayCircle,
  Search,
} from "lucide-react";
import Pagination from "./Pagination";
import { useNavigate } from "react-router-dom";
import { useTableColumns } from "../hooks/useTableColumns";
import { ColumnManager } from "./ColumnManager";

interface DashboardProps {
  user: any;
}

const DEFAULT_COLUMNS = [
  { id: 'date', label: 'Date', isVisible: true },
  { id: 'client', label: 'Client Name', isVisible: true },
  { id: 'priority', label: 'Alert Priority', isVisible: true },
  { id: 'detail', label: 'Alert Detail', isVisible: true },
  { id: 'status', label: 'Status', isVisible: true },
  { id: 'action', label: 'Action', isVisible: true },
];

export default function NotificationCenter({ user }: DashboardProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("priority");
  const [sortDir, setSortDir] = useState("desc");

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const navigate = useNavigate();

  const { columns, toggleVisibility, moveColumn, reorderColumn } = useTableColumns('alert_center', DEFAULT_COLUMNS);
  const visibleCols = columns.filter(c => c.isVisible);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications(currentPage, itemsPerPage, searchQuery, sortField, sortDir);
      setNotifications(res.data.data || res.data);
      setTotalItems(res.data.total || res.data.length || 0);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchNotifications();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, itemsPerPage, searchQuery, sortField, sortDir]);

  const triggerEngine = async () => {
    try {
      const res = await triggerAlertEngine();
      alert(res.data.message);
      fetchNotifications();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to trigger engine");
    }
  };

  const submitResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!resolutionNote.trim()) {
      alert("Please provide a description of what you did to resolve this.");
      return;
    }
    try {
      await resolveNotification(id, resolutionNote);
      setResolvingId(null);
      setResolutionNote("");
      await fetchNotifications();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to resolve alert");
    }
  };

  const handleSort = (field: string) => {
    if (field === 'detail' || field === 'action') return;
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === 'priority' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (field === 'detail' || field === 'action') return null;
    if (sortField !== field) return <span className="ml-1 text-gray-400 opacity-50">↕</span>;
    return <span className="ml-1 text-blue-600 font-bold">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const renderCell = (notif: any, colId: string) => {
    let alertBadge = notif.type;
    let colorClass = "bg-gray-100 text-gray-800 border-gray-200";
    if (notif.type === 'Q4_ALERT') { alertBadge = 'Q4 Risk'; colorClass = "bg-red-100 text-red-800 border-red-200"; }
    if (notif.type === 'Q3_ALERT') { alertBadge = 'Q3 Risk'; colorClass = "bg-orange-100 text-orange-800 border-orange-200"; }
    if (notif.type === 'DRAWDOWN_ALERT') { alertBadge = 'Drawdown Rebalance'; colorClass = "bg-purple-100 text-purple-800 border-purple-200"; }

    switch (colId) {
      case 'date': return <td key={colId} className="py-1 px-1.5 text-gray-600 whitespace-nowrap font-medium">{new Date(notif.createdAt).toLocaleDateString('en-GB')}</td>;
      case 'client': return <td key={colId} className="py-1 px-1.5 text-gray-900 font-bold truncate max-w-[150px]">{notif.client?.name}</td>;
      case 'priority': return (
        <td key={colId} className="py-1 px-1.5">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}>
            {alertBadge}
          </span>
        </td>
      );
      case 'detail': return <td key={colId} className="py-1 px-1.5 text-gray-700 max-w-[400px] truncate" title={notif.message}>{notif.message}</td>;
      case 'status': return (
        <td key={colId} className="py-1 px-1.5 font-bold">
          {notif.status === 'RESOLVED' && <span className="text-green-600">RESOLVED</span>}
          {notif.status === 'PENDING' && <span className="text-amber-600">PENDING</span>}
          {notif.status === 'ESCALATED' && <span className="text-red-600">ESCALATED</span>}
        </td>
      );
      case 'action': return (
        <td key={colId} className="py-1 px-1.5 text-right">
          {resolvingId === notif.id ? (
            <div className="flex flex-col items-end gap-1" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                autoFocus
                placeholder="Resolution note..."
                className="border border-gray-300 rounded px-2 py-0.5 text-[10px] w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitResolve(notif.id, e as any)}
              />
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setResolvingId(null); }} className="text-gray-500 hover:text-gray-700 font-bold">Cancel</button>
                <button onClick={(e) => submitResolve(notif.id, e)} className="text-blue-600 hover:text-blue-800 font-bold">Save</button>
              </div>
            </div>
          ) : notif.status !== "RESOLVED" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setResolvingId(notif.id);
                setResolutionNote("");
              }}
              className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold hover:bg-blue-100 transition-colors"
            >
              Resolve
            </button>
          ) : (
            <span className="text-gray-400 text-[10px] truncate max-w-[100px]" title={notif.resolutionNote || ''}>
              {notif.resolutionNote || "No notes"}
            </span>
          )}
        </td>
      );
      default: return <td key={colId}></td>;
    }
  };

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="text-blue-600" /> Security & Strategy Alerts
        </h2>
        {user?.role === "ADMIN" && (
          <button
            onClick={triggerEngine}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
          >
            <PlayCircle size={16} /> Trigger Alert Engine
          </button>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search alerts or clients..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none w-72 text-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <ColumnManager columns={columns} onToggle={toggleVisibility} onMove={moveColumn} onReorder={reorderColumn} />
      </div>

      {loading && notifications.length === 0 ? (
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
                      className={`bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap ${['detail', 'action'].includes(col.id) ? '' : 'cursor-pointer hover:bg-gray-200 transition-colors'} ${col.id === 'action' ? 'text-right' : ''}`}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label} <SortIcon field={col.id} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[11px] bg-white divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <tr
                    key={notif.id}
                    className={`hover:bg-blue-50 transition-colors cursor-pointer ${notif.status === 'RESOLVED' ? 'opacity-60 bg-gray-50' : ''}`}
                    onClick={() => navigate(`/clients/${notif.clientId}`)}
                  >
                    {visibleCols.map(col => renderCell(notif, col.id))}
                  </tr>
                ))}
                {notifications.length === 0 && (
                  <tr>
                    <td colSpan={visibleCols.length} className="text-center py-6 text-gray-500">
                      No alerts match your search.
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
