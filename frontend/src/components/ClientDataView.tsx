import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getClients } from "../api/data.api";
import { Users, Search } from "lucide-react";
import Pagination from "./Pagination";

export default function ClientDataView() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const navigate = useNavigate();

  useEffect(() => {
    getClients()
      .then((res) => {
        setClients(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.rm?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const currentData = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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
            placeholder="Search clients or RMs..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-10">Loading clients...</p>
      ) : (
        <div className="flex flex-col">
          <div className="overflow-auto h-[calc(100vh-280px)]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-100 border-y border-gray-200">
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    Client Name
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    PAN
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    Family Head
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    Relationship Manager
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-right">
                    Total AUM
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-right">
                    Equity AUM
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-right">
                    Debt AUM
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-right">
                    Hybrid AUM
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-right">
                    Units
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((client) => (
                  <tr
                    key={client.id}
                    onDoubleClick={() => navigate(`/clients/${client.id}`)}
                    title="Double click to view portfolio"
                    className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {client.name}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{client.pan}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {client.familyHead || "-"}
                    </td>
                    <td className="py-3 px-4 text-blue-600 font-medium">
                      {client.rm?.name}
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-right font-medium">
                      ₹{client.totalAum.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-right">
                      ₹{client.equityAum.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-right">
                      ₹{client.debtAum.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-right">
                      ₹{client.hybridAum?.toLocaleString() || 0}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-right">
                      {client.totalUnits
                        ? client.totalUnits.toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-500">
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredClients.length}
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
