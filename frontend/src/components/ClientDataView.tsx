import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getClients } from "../api/data.api";
import { Users, Search } from "lucide-react";
import Pagination from "./Pagination";

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

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentData = clients;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      // Alerts naturally sort descending (highest priority first)
      setSortDir(field === "alertScore" ? "desc" : "asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-400 opacity-50">↕</span>;
    return <span className="ml-1 text-blue-600 font-bold">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600" /> Client Database
        </h2>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, PAN, RM, or alert..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none w-72"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {loading && currentData.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="overflow-auto h-[calc(100vh-280px)]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-100 border-y border-gray-200">
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Client Name <SortIcon field="name" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('pan')}
                  >
                    PAN <SortIcon field="pan" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('familyHead')}
                  >
                    Family Head <SortIcon field="familyHead" />
                  </th>
                  <th className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap">
                    RM
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap text-right cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('totalAum')}
                  >
                    Total AUM <SortIcon field="totalAum" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap text-right cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('equityAum')}
                  >
                    Equity AUM <SortIcon field="equityAum" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap text-right cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('debtAum')}
                  >
                    Debt AUM <SortIcon field="debtAum" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap text-right cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('hybridAum')}
                  >
                    Hybrid AUM <SortIcon field="hybridAum" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap text-right cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('totalUnits')}
                  >
                    Units <SortIcon field="totalUnits" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap text-center cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('alertScore')}
                  >
                    Alerts <SortIcon field="alertScore" />
                  </th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {currentData.map((client) => (
                  <tr
                    key={client.id}
                    onDoubleClick={() => navigate(`/clients/${client.id}`)}
                    title="Double click to view portfolio"
                    className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="py-0.5 px-1.5 text-gray-900 font-semibold truncate max-w-[150px]">
                      {client.name}
                    </td>
                    <td className="py-0.5 px-1.5 text-gray-600 truncate">{client.pan}</td>
                    <td className="py-0.5 px-1.5 text-gray-600 truncate max-w-[100px]">
                      {client.familyHead || "-"}
                    </td>
                    <td className="py-0.5 px-1.5 text-blue-700 font-semibold truncate max-w-[100px]">
                      {client.rm?.name}
                    </td>
                    <td className="py-0.5 px-1.5 text-gray-900 text-right font-medium">
                      ₹{client.totalAum.toLocaleString('en-IN')}
                    </td>
                    <td className="py-0.5 px-1.5 text-gray-600 text-right">
                      ₹{client.equityAum.toLocaleString('en-IN')}
                    </td>
                    <td className="py-0.5 px-1.5 text-gray-600 text-right">
                      ₹{client.debtAum.toLocaleString('en-IN')}
                    </td>
                    <td className="py-0.5 px-1.5 text-gray-600 text-right">
                      ₹{client.hybridAum?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="py-0.5 px-1.5 text-gray-600 text-right">
                      {client.totalUnits
                        ? client.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 3 })
                        : "-"}
                    </td>
                    <td className="py-0.5 px-1.5 text-center">
                      {client.notifications && client.notifications.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {Array.from(new Set(client.notifications.map((n: any) => n.type.replace('_ALERT', '')))).map((type: any, i) => (
                            <span 
                              key={i} 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/clients/${client.id}`);
                              }}
                              className={`font-bold px-1 py-0.5 rounded text-[9px] border cursor-pointer hover:opacity-80 transition-opacity ${
                                type === 'Q4' ? 'bg-red-100 text-red-800 border-red-200' :
                                type === 'Q3' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                'bg-purple-100 text-purple-800 border-purple-200'
                              }`}
                              title="Click to view client portfolio"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {currentData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-gray-500">
                      No clients found matching your criteria.
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
