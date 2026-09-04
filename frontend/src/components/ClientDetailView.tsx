import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClientDetails, getClientHistory } from "../api/data.api";
import { markPortfolioReviewed } from "../api/rm.api";
import {
  ArrowLeft,
  User,
  AlertTriangle,
  TrendingDown,
  CheckCircle,
  Briefcase,
  TrendingUp,
  Download,
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

export default function ClientDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isReviewing, setIsReviewing] = useState(false);

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

  const holdings = client.holdings || [];
  const totalPages = Math.ceil(holdings.length / itemsPerPage);
  const currentData = holdings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> Back to Clients
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

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="text-blue-600" size={32} /> {client.name}
          </h2>
          <div className="mt-2 text-gray-500 flex items-center gap-4 text-sm font-medium">
            <span>PAN: {client.pan}</span>
            {client.familyHead && (
              <span>• Family Head: {client.familyHead}</span>
            )}
            <span>• RM: {client.rm?.name}</span>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 min-w-[200px] text-right">
          <p className="text-blue-800 text-sm font-bold uppercase tracking-wider mb-1">
            Total AUM
          </p>
          <p className="text-3xl font-extrabold text-blue-900">
            ₹{client.totalAum?.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
            Invested Amount
          </p>
          <p className="text-xl font-bold text-gray-800">
            {client.totalInvested
              ? "₹" + client.totalInvested.toLocaleString()
              : "N/A"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
            Total Gain
          </p>
          <p
            className={`text-xl font-bold ${client.totalGain > 0 ? "text-green-600" : client.totalGain < 0 ? "text-red-600" : "text-gray-800"}`}
          >
            {client.totalGain
              ? (client.totalGain > 0 ? "+" : "") +
                "₹" +
                client.totalGain.toLocaleString()
              : "N/A"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
            Overall CAGR
          </p>
          <p
            className={`text-xl font-bold ${client.overallCagr > 0 ? "text-emerald-600" : "text-gray-800"}`}
          >
            {client.overallCagr ? client.overallCagr + "%" : "N/A"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
            Absolute Return
          </p>
          <p
            className={`text-xl font-bold ${client.overallAbsoluteReturn > 0 ? "text-emerald-600" : "text-gray-800"}`}
          >
            {client.overallAbsoluteReturn
              ? client.overallAbsoluteReturn + "%"
              : "N/A"}
          </p>
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingDown className="text-blue-600 rotate-180" /> Wealth
            Trajectory
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="formattedDate" />
                <YAxis
                  tickFormatter={(val) => "₹" + (val / 100000).toFixed(1) + "L"}
                />
                <Tooltip
                  formatter={(value: number) => [
                    "₹" + value.toLocaleString(),
                    "AUM",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalAum"
                  name="Total AUM"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="equityAum"
                  name="Equity"
                  stroke="#16a34a"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="debtAum"
                  name="Debt"
                  stroke="#dc2626"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          Mutual Fund Holdings
        </h3>

        {holdings.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            No mutual fund holdings found for this client.
          </p>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-auto h-[calc(100vh-280px)]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 shadow-sm">
                  <tr className="bg-gray-100 border-y border-gray-200">
                    <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                      Scheme Name
                    </th>
                    <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                      Folio
                    </th>
                    <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-right">
                      Invested
                    </th>
                    <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-right">
                      Current Value
                    </th>
                    <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-right">
                      Gain
                    </th>
                    <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-right">
                      CAGR
                    </th>
                    <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-center">
                      Quartile
                    </th>
                    <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-center">
                      Alerts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((holding: any) => {
                    const rf = holding.researchFund;
                    let qColor = "bg-gray-100 text-gray-600";
                    let alert = null;

                    if (rf) {
                      if (
                        rf.quartile?.includes("Q1") ||
                        rf.quartile?.includes("TOP")
                      )
                        qColor = "bg-green-100 text-green-800";
                      if (rf.quartile?.includes("Q2"))
                        qColor = "bg-blue-100 text-blue-800";
                      if (rf.quartile?.includes("Q3")) {
                        qColor = "bg-yellow-100 text-yellow-800";
                        alert = (
                          <span className="flex items-center gap-1 text-yellow-600 text-xs font-bold">
                            <AlertTriangle size={14} /> REVIEW
                          </span>
                        );
                      }
                      if (
                        rf.quartile?.includes("Q4") ||
                        rf.quartile?.includes("BOTTOM")
                      ) {
                        qColor = "bg-red-100 text-red-800";
                        alert = (
                          <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                            <TrendingDown size={14} /> EXIT
                          </span>
                        );
                      }
                    }

                    return (
                      <tr
                        key={holding.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-gray-800 font-medium">
                          {holding.fundNameRaw}
                          {!rf && (
                            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              Unmapped
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {holding.folioNumber || "-"}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          ₹{holding.investedAmount?.toLocaleString() || "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-800">
                          ₹{holding.currentValue?.toLocaleString() || "-"}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-medium ${holding.gain > 0 ? "text-green-600" : "text-gray-600"}`}
                        >
                          {holding.gain
                            ? (holding.gain > 0 ? "+" : "") +
                              "₹" +
                              holding.gain.toLocaleString()
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600">
                          {holding.cagr ? holding.cagr + "%" : "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {rf ? (
                            <span
                              className={
                                "px-2 py-1 rounded-full text-xs font-semibold " +
                                qColor
                              }
                            >
                              {rf.quartile || "Unrated"}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center flex justify-center">
                          {alert || <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={holdings.length}
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
    </div>
  );
}
