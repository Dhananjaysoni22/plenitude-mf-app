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

  const resolveAlert = async (id: string) => {
    try {
      await resolveNotification(id);
      await fetchNotifications();
    } catch (e) {
      console.error(e);
      alert("Failed to resolve alert");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifs = notifications.filter((n) => {
    if (statusFilter === "ALL") return true;
    return n.status === statusFilter;
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
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="text-red-500" />{" "}
            {user?.role === "ADMIN"
              ? "Firm-Wide Alert Dashboard"
              : "My To-Do Alerts"}
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            {user?.role === "ADMIN"
              ? "Monitor all RM alerts and escalate unresolved issues."
              : "Action items for your clients based on Q3/Q4 fund performance."}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Tasks</option>
            <option value="ESCALATED">Escalated (&gt; 7 Days)</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {user?.role === "ADMIN" && (
            <button
              onClick={triggerEngine}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
            >
              <PlayCircle size={16} /> Run Alert Engine
            </button>
          )}
        </div>
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
                    className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-start justify-between gap-4 ${notif.status === "RESOLVED" ? "bg-gray-50 border-gray-200 opacity-75" : isQ4 ? "bg-red-50 border-red-100" : "bg-orange-50 border-orange-100"}`}
                  >
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
                            {isQ4
                              ? "Exit Strategy Required"
                              : "Review Strategy Needed"}
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
                        <button
                          onClick={() => resolveAlert(notif.id)}
                          className="flex-shrink-0 mt-4 md:mt-0 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-300 text-gray-700 px-4 py-2 rounded-md transition-colors text-sm font-medium shadow-sm"
                        >
                          <CheckCircle size={16} /> Mark as Resolved
                        </button>
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
