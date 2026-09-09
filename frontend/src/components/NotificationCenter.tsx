import React, { useEffect, useState } from "react";
import {
  getNotifications,
  triggerAlertEngine,
  resolveNotification,
} from "../api/notification.api";
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  PlayCircle,
  CheckCircle,
  Clock,
  Search,
} from "lucide-react";
import Pagination from "./Pagination";

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "ESCALATED" | "RESOLVED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const triggerEngine = async () => {
    try {
      setLoading(true);
      await triggerAlertEngine();
      await fetchNotifications();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const submitResolve = async (id: string) => {
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

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifs = notifications.filter((n) => {
    if (statusFilter !== "ALL" && n.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const clientName = n.client?.name?.toLowerCase() || "";
      const msg = n.message?.toLowerCase() || "";
      return clientName.includes(query) || msg.includes(query);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredNotifs.length / itemsPerPage);
  const currentData = filteredNotifs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getStatusBadge = (status: string) => {
    if (status === "RESOLVED")
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
          <CheckCircle size={12} /> RESOLVED
        </span>
      );
    if (status === "ESCALATED")
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
          <AlertOctagon size={12} /> ESCALATED (&gt; 7 DAYS)
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
        <Clock size={12} /> PENDING
      </span>
    );
  };

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="text-gray-500" /> Security & Strategy Alerts
        </h2>
        {user?.role === "ADMIN" && (
          <button
            onClick={triggerEngine}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <PlayCircle size={18} /> Trigger Alert Engine
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Client Name or Alert Message..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          className="border border-gray-300 rounded-md px-4 py-2 font-medium text-gray-700 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e: any) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Alerts</option>
          <option value="PENDING">Pending Action</option>
          <option value="ESCALATED">Escalated</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-10">Loading alerts...</p>
      ) : (
        <div className="flex flex-col">
          <div className="space-y-4 overflow-y-auto h-[calc(100vh-280px)] pr-2">
            {filteredNotifs.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-10 text-center border border-dashed border-gray-300 mt-4">
                <p className="text-gray-500">No alerts found in this view.</p>
              </div>
            ) : (
              currentData.map((notif) => {
                const isQ4 = notif.type === "Q4_ALERT";
                const isPending =
                  notif.status === "PENDING" || notif.status === "ESCALATED";

                return (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border flex flex-col gap-4 ${notif.status === "RESOLVED" ? "bg-gray-50 border-gray-200 opacity-75" : isQ4 ? "bg-red-50 border-red-100" : "bg-orange-50 border-orange-100"}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {notif.status === "RESOLVED" ? (
                            <CheckCircle className="text-green-500" />
                          ) : isQ4 ? (
                            <AlertOctagon className="text-red-500" />
                          ) : (
                            <AlertTriangle className="text-orange-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4
                              className={`font-semibold ${notif.status === "RESOLVED" ? "text-gray-600" : isQ4 ? "text-red-800" : "text-orange-800"}`}
                            >
                              {notif.type === 'DRAWDOWN_ALERT' ? "Drawdown Rebalance Required" : isQ4 ? "Exit Strategy Required" : "Review Strategy Needed"}
                            </h4>
                            {getStatusBadge(notif.status)}
                          </div>
                          <p className="text-gray-700 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-2 font-medium">
                            Client:{" "}
                            <span className="text-gray-800">
                              {notif.client?.name}
                            </span>{" "}
                            |
                            {user?.role === "ADMIN" && (
                              <span>
                                {" "}
                                RM:{" "}
                                <span className="text-gray-800">
                                  {notif.rm?.name}
                                </span>{" "}
                                |{" "}
                              </span>
                            )}
                            Generated:{" "}
                            {new Date(notif.createdAt).toLocaleDateString()}
                            {notif.resolvedAt && (
                              <span>
                                {" "}
                                | Resolved:{" "}
                                {new Date(notif.resolvedAt).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {isPending &&
                        (user?.role === "RM" || user?.role === "ADMIN") && (
                          <div className="flex-shrink-0">
                            {resolvingId === notif.id ? (
                              <div className="flex flex-col gap-2 min-w-[250px]">
                                <textarea 
                                  className="w-full text-sm p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500" 
                                  placeholder="What action did you take?"
                                  rows={2}
                                  value={resolutionNote}
                                  onChange={(e) => setResolutionNote(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => submitResolve(notif.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 rounded">Submit & Resolve</button>
                                  <button onClick={() => {setResolvingId(null); setResolutionNote("");}} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-1.5 rounded">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setResolvingId(notif.id)}
                                className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-300 text-gray-700 px-4 py-2 rounded-md transition-colors text-sm font-medium shadow-sm"
                              >
                                <CheckCircle size={16} /> Mark as Resolved
                              </button>
                            )}
                          </div>
                        )}
                    </div>
                    {notif.status === "RESOLVED" && notif.resolutionNote && (
                      <div className="ml-10 bg-white border border-gray-200 p-3 rounded-md shadow-sm">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">RM Resolution Note</p>
                        <p className="text-sm text-gray-800">{notif.resolutionNote}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredNotifs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
