import React, { useEffect, useState } from "react";
import { getResearchFunds } from "../api/data.api";
import { PieChart, Search } from "lucide-react";
import Pagination from "./Pagination";
import { useTableColumns } from "../hooks/useTableColumns";
import { ColumnManager } from "./ColumnManager";

const DEFAULT_COLUMNS = [
  { id: 'name', label: 'Fund Name', isVisible: true },
  { id: 'category', label: 'Category', isVisible: true },
  { id: 'aum', label: 'Fund AUM', isVisible: true },
  { id: 'quartile', label: 'Quartile', isVisible: true },
  { id: 'selectionPriority', label: 'Priority', isVisible: true },
  { id: 'globalRank', label: 'Global Rank', isVisible: true },
];

export default function ResearchDataView() {
  const [funds, setFunds] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const { columns, toggleVisibility, moveColumn, reorderColumn } = useTableColumns('research_data', DEFAULT_COLUMNS);
  const visibleCols = columns.filter(c => c.isVisible);

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

  const currentData = funds;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const renderCell = (fund: any, colId: string) => {
    switch (colId) {
      case 'name': return <td key={colId} className="py-0.5 px-1.5 font-bold text-gray-900 truncate max-w-[300px]" title={fund.name}>{fund.name}</td>;
      case 'category': return <td key={colId} className="py-0.5 px-1.5 text-gray-600 truncate max-w-[200px]" title={fund.category}>{fund.category}</td>;
      case 'aum': return <td key={colId} className="py-0.5 px-1.5 text-gray-900 text-right font-medium">{fund.aum ? `₹${fund.aum.toLocaleString('en-IN')}` : "-"}</td>;
      case 'quartile': {
        let qColor = "bg-gray-100 text-gray-800 border-gray-200";
        if (fund.quartile?.includes("Q1") || fund.quartile?.includes("TOP")) {
          qColor = "bg-green-100 text-green-800 border-green-200";
        } else if (fund.quartile?.includes("Q4") || fund.quartile?.includes("BOTTOM")) {
          qColor = "bg-red-100 text-red-800 border-red-200";
        } else if (fund.quartile?.includes("Q2")) {
          qColor = "bg-blue-100 text-blue-800 border-blue-200";
        } else if (fund.quartile?.includes("Q3")) {
          qColor = "bg-orange-100 text-orange-800 border-orange-200";
        }
        const badge = fund.quartile?.replace("-TOP QUARTILE", "")
                                    .replace("-UPPER MID QUARTILE", "")
                                    .replace("-LOWER MID QUARTILE", "")
                                    .replace("-BOTTOM QUARTILE", "") || "UNMAPPED";
        return (
          <td key={colId} className="py-0.5 px-1.5 text-center">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${qColor}`}>
              {badge}
            </span>
          </td>
        );
      }
      case 'selectionPriority': return (
        <td key={colId} className="py-0.5 px-1.5 text-center">
          {fund.selectionPriority ? (
            <span className="bg-gray-100 text-gray-800 border border-gray-200 font-bold px-1.5 py-0.5 rounded text-[9px]">
              {fund.selectionPriority}
            </span>
          ) : "-"}
        </td>
      );
      case 'globalRank': return (
        <td key={colId} className="py-0.5 px-1.5 text-center">
          {fund.globalRank ? (
            <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 font-bold px-1.5 py-0.5 rounded text-[9px]">
              #{fund.globalRank}
            </span>
          ) : "-"}
        </td>
      );
      default: return <td key={colId}></td>;
    }
  };

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <PieChart className="text-purple-600" /> Research & Analytics
        </h2>

        <div className="flex items-center gap-4">
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
          <ColumnManager columns={columns} onToggle={toggleVisibility} onMove={moveColumn} onReorder={reorderColumn} />
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
                  {visibleCols.map((col) => (
                    <th 
                      key={col.id}
                      className={`bg-gray-100 py-1 px-1.5 font-bold text-gray-700 text-[11px] uppercase whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors ${col.id === 'aum' ? 'text-right' : ['quartile', 'selectionPriority', 'globalRank'].includes(col.id) ? 'text-center' : ''}`}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label} <SortIcon field={col.id} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[11px] bg-white divide-y divide-gray-100">
                {currentData.map((fund) => (
                  <tr
                    key={fund.id}
                    className="hover:bg-purple-50 transition-colors"
                  >
                    {visibleCols.map(col => renderCell(fund, col.id))}
                  </tr>
                ))}
                {currentData.length === 0 && (
                  <tr>
                    <td
                      colSpan={visibleCols.length}
                      className="text-center py-6 text-gray-500"
                    >
                      No funds match your search.
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
