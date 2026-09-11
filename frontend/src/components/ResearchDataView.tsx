import React, { useEffect, useState } from "react";
import { getResearchFunds } from "../api/data.api";
import { PieChart, Search } from "lucide-react";
import Pagination from "./Pagination";

export default function ResearchDataView() {
  const [funds, setFunds] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const loadData = () => {
    setLoading(true);
    getResearchFunds(currentPage, itemsPerPage, search, sortField, sortDir)
      .then((res) => {
        setFunds(res.data.data || res.data);
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
  const currentData = funds;

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
    return <span className="ml-1 text-purple-600 font-bold">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <PieChart className="text-purple-600" /> Research Data & Quartiles
        </h2>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search funds or categories..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none w-72 text-sm"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          <div className="overflow-auto h-[calc(100vh-280px)] border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-100 border-y border-gray-200">
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Fund Name <SortIcon field="name" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    Category <SortIcon field="category" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap text-right cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('aum')}
                  >
                    Fund AUM <SortIcon field="aum" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap text-center cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('quartile')}
                  >
                    Quartile <SortIcon field="quartile" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap text-center cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('selectionPriority')}
                  >
                    Priority <SortIcon field="selectionPriority" />
                  </th>
                  <th 
                    className="bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap text-center cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('globalRank')}
                  >
                    Global Rank <SortIcon field="globalRank" />
                  </th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {currentData.map((fund) => {
                  let quartileColor = "bg-gray-100 text-gray-800 border-gray-200";
                  if (fund.quartile?.includes("Q1") || fund.quartile?.includes("TOP"))
                    quartileColor = "bg-green-100 text-green-800 border-green-200";
                  if (fund.quartile?.includes("Q4") || fund.quartile?.includes("BOTTOM"))
                    quartileColor = "bg-red-100 text-red-800 border-red-200";
                  if (fund.quartile?.includes("Q2"))
                    quartileColor = "bg-blue-100 text-blue-800 border-blue-200";
                  if (fund.quartile?.includes("Q3"))
                    quartileColor = "bg-orange-100 text-orange-800 border-orange-200";

                  let badge = fund.quartile?.replace("-TOP QUARTILE", "")
                                           .replace("-UPPER MID QUARTILE", "")
                                           .replace("-LOWER MID QUARTILE", "")
                                           .replace("-BOTTOM QUARTILE", "") || "Unrated";

                  return (
                    <tr
                      key={fund.id}
                      className="border-b border-gray-100 hover:bg-purple-50 transition-colors"
                    >
                      <td
                        className="py-0.5 px-1.5 text-gray-900 font-semibold max-w-[300px] truncate"
                        title={fund.name}
                      >
                        {fund.name}
                      </td>
                      <td className="py-0.5 px-1.5 text-gray-600 truncate max-w-[150px]">
                        {fund.category || "-"}
                      </td>
                      <td className="py-0.5 px-1.5 text-gray-700 text-right font-medium">
                        {fund.aum ? "₹" + fund.aum.toLocaleString('en-IN') : "-"}
                      </td>
                      <td className="py-0.5 px-1.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${quartileColor}`}>
                          {badge}
                        </span>
                      </td>
                      <td className="py-0.5 px-1.5 text-center font-bold text-gray-700">
                        {fund.selectionPriority || "-"}
                      </td>
                      <td className="py-0.5 px-1.5 text-center font-bold text-gray-700">
                        {fund.globalRank || "-"}
                      </td>
                    </tr>
                  );
                })}
                {currentData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      No funds found matching your criteria.
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
