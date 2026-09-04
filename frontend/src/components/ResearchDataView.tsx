import React, { useEffect, useState } from "react";
import { getResearchFunds } from "../api/data.api";
import { PieChart, Search } from "lucide-react";
import Pagination from "./Pagination";

export default function ResearchDataView() {
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getResearchFunds()
      .then((res) => {
        setFunds(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredFunds = funds.filter(
    (f) =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.category?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredFunds.length / itemsPerPage);
  const currentData = filteredFunds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-10">
          Loading research funds...
        </p>
      ) : (
        <div className="flex flex-col">
          <div className="overflow-auto h-[calc(100vh-280px)]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-100 border-y border-gray-200">
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    Fund Name
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    Category
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-right">
                    Fund AUM
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-center">
                    Quartile
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-center">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((fund) => {
                  let quartileColor = "bg-gray-100 text-gray-800";
                  if (
                    fund.quartile?.includes("Q1") ||
                    fund.quartile?.includes("TOP")
                  )
                    quartileColor = "bg-green-100 text-green-800";
                  if (
                    fund.quartile?.includes("Q4") ||
                    fund.quartile?.includes("BOTTOM")
                  )
                    quartileColor = "bg-red-100 text-red-800";
                  if (fund.quartile?.includes("Q2"))
                    quartileColor = "bg-blue-100 text-blue-800";
                  if (fund.quartile?.includes("Q3"))
                    quartileColor = "bg-yellow-100 text-yellow-800";

                  return (
                    <tr
                      key={fund.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td
                        className="py-3 px-4 text-gray-800 font-medium max-w-md truncate"
                        title={fund.name}
                      >
                        {fund.name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {fund.category || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-700 text-right font-medium">
                        {fund.aum ? "₹" + fund.aum.toLocaleString() : "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={
                            "px-2 py-1 rounded-full text-xs font-semibold " +
                            quartileColor
                          }
                        >
                          {fund.quartile || "Unrated"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {fund.selectionPriority || "-"}
                      </td>
                    </tr>
                  );
                })}
                {filteredFunds.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      No funds found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredFunds.length}
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
